#!/usr/bin/env node
// @ts-check

/**
 * scripts/llm-judge.mjs
 *
 * LLM-as-a-Judge CI gate — enforces pr-checklist.md on every pull request.
 *
 * Reads the git diff of the current PR, loads the PR checklist, sends both
 * to the first available LLM provider, and exits 1 when CRITICAL findings
 * exist (security gaps, N+1 queries, swallowed errors, hardcoded secrets,
 * layer boundary violations, SQL injection risks).
 *
 * Supported providers (auto-selected by first available env key):
 *   OPENAI_API_KEY    → gpt-4o-mini  (override with LLM_JUDGE_MODEL)
 *   ANTHROPIC_API_KEY → claude-3-5-haiku-latest
 *   GEMINI_API_KEY    → gemini-2.0-flash
 *
 * Usage:
 *   node scripts/llm-judge.mjs            — auto-detect diff, call LLM
 *   node scripts/llm-judge.mjs --dry-run  — print prompt, skip LLM call
 *
 * Environment variables:
 *   OPENAI_API_KEY         OpenAI secret key
 *   ANTHROPIC_API_KEY      Anthropic secret key
 *   GEMINI_API_KEY         Google Gemini API key
 *   LLM_JUDGE_MODEL        Override model name for the selected provider
 *   LLM_MAX_DIFF_CHARS     Max characters of diff to send (default: 12000)
 *   PR_DIFF                Inject diff directly (bypasses git commands)
 *   GITHUB_BASE_SHA        Base commit SHA for GitHub Actions PR diffs
 *   GITHUB_HEAD_SHA        Head commit SHA for GitHub Actions PR diffs
 *   CI_MERGE_REQUEST_DIFF_BASE_SHA  Base SHA for GitLab MR diffs
 *   CI_COMMIT_SHA          Head SHA for GitLab MR diffs
 *
 * Zero external dependencies — uses Node.js built-ins only (Node 18+).
 */

import { execSync } from 'node:child_process';
import { readFileSync, existsSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const REPOSITORY_ROOT = resolve(__dirname, '..');
const PR_CHECKLIST_PATH = resolve(REPOSITORY_ROOT, '.agent-context/review-checklists/pr-checklist.md');
const DEFAULT_MACHINE_REPORT_PATH = resolve(REPOSITORY_ROOT, '.agent-context/state/llm-judge-report.json');
const MAX_DIFF_CHARS = parseInt(process.env.LLM_MAX_DIFF_CHARS ?? '12000', 10);
const IS_DRY_RUN = process.argv.includes('--dry-run');
const SHOULD_EMIT_MACHINE_REPORT = process.env.LLM_JUDGE_EMIT_JSON !== 'false';
const MACHINE_REPORT_PATH = process.env.LLM_JUDGE_OUTPUT_PATH || DEFAULT_MACHINE_REPORT_PATH;

/** @type {string[]} Source code file extensions to include in the diff */
const SOURCE_CODE_EXTENSIONS = ['*.ts', '*.tsx', '*.js', '*.mjs', '*.cjs', '*.py', '*.go', '*.java', '*.cs', '*.rb', '*.php'];

/** @type {Record<string, string>} */
const SEVERITY_NORMALIZATION_TABLE = {
  critical: 'critical',
  blocker: 'critical',
  severe: 'critical',
  high: 'high',
  major: 'high',
  medium: 'medium',
  moderate: 'medium',
  low: 'low',
  minor: 'low',
  info: 'low',
  informational: 'low',
};

/**
 * @typedef {{
 *   rule: string,
 *   problem: string,
 *   severity: string,
 * }} Violation
 */

/**
 * @typedef {{
 *   generatedAt: string,
 *   schemaVersion: string,
 *   profile: string,
 *   provider: string,
 *   ciProvider: string,
 *   blockingSeverities: string[],
 *   failDecision: boolean,
 *   malformedVerdict: boolean,
 *   providerError: boolean,
 *   dryRun: boolean,
 *   summary: {
 *     totalViolations: number,
 *     blockingViolations: number,
 *   },
 *   violations: Violation[],
 * }} MachineReportPayload
 */

function detectCiProvider() {
  if (process.env.GITHUB_ACTIONS === 'true') {
    return 'github';
  }

  if (process.env.GITLAB_CI === 'true') {
    return 'gitlab';
  }

  return 'local';
}

/**
 * @param {string | undefined} rawSeverityValue
 * @returns {string}
 */
function normalizeSeverity(rawSeverityValue) {
  const normalizedSeverityKey = String(rawSeverityValue || '').trim().toLowerCase();
  return SEVERITY_NORMALIZATION_TABLE[normalizedSeverityKey] || 'low';
}

/**
 * @param {MachineReportPayload} machineReportPayload
 * @returns {string}
 */
function formatMachineReadableLine(machineReportPayload) {
  return `JSON_REPORT: ${JSON.stringify(machineReportPayload)}`;
}

/**
 * @param {MachineReportPayload} machineReportPayload
 */
function emitMachineReadableReport(machineReportPayload) {
  if (!SHOULD_EMIT_MACHINE_REPORT) {
    return;
  }

  writeFileSync(MACHINE_REPORT_PATH, `${JSON.stringify(machineReportPayload, null, 2)}\n`, 'utf-8');
  console.log(formatMachineReadableLine(machineReportPayload));
  console.log(`📎  Machine report saved: ${MACHINE_REPORT_PATH}`);
}

// ─── GIT DIFF COLLECTION ──────────────────────────────────────────────────────

/**
 * Collects the pull request diff from the best available source:
 * 1. PR_DIFF env var (direct injection — highest priority)
 * 2. GitHub Actions env vars (GITHUB_BASE_SHA / GITHUB_HEAD_SHA)
 * 3. GitLab CI env vars (CI_MERGE_REQUEST_DIFF_BASE_SHA / CI_COMMIT_SHA)
 * 4. Local fallback: HEAD~1..HEAD
 *
 * @returns {string} The raw git diff output
 */
function collectPullRequestDiff() {
  if (process.env.PR_DIFF) {
    console.log('  Source: PR_DIFF env variable');
    return process.env.PR_DIFF;
  }

  const execOptions = {
    cwd: REPOSITORY_ROOT,
    encoding: /** @type {'utf-8'} */ ('utf-8'),
    maxBuffer: 1024 * 1024 * 8, // 8 MB
  };

  // GitHub Actions: PR event injects base/head SHAs
  const githubBaseSha = process.env.GITHUB_BASE_SHA;
  const githubHeadSha = process.env.GITHUB_HEAD_SHA ?? 'HEAD';
  if (githubBaseSha) {
    console.log(`  Source: GitHub Actions diff (${githubBaseSha.slice(0, 8)}...${githubHeadSha.slice(0, 8)})`);
    return execSync(`git diff "${githubBaseSha}...${githubHeadSha}"`, execOptions);
  }

  // GitLab CI: merge request event provides base + head SHAs
  const gitlabBaseSha = process.env.CI_MERGE_REQUEST_DIFF_BASE_SHA;
  const gitlabHeadSha = process.env.CI_COMMIT_SHA ?? 'HEAD';
  if (gitlabBaseSha) {
    console.log(`  Source: GitLab CI diff (${gitlabBaseSha.slice(0, 8)}...${gitlabHeadSha.slice(0, 8)})`);
    return execSync(`git diff "${gitlabBaseSha}...${gitlabHeadSha}"`, execOptions);
  }

  // Local / fallback: last commit diff
  console.log('  Source: local HEAD~1..HEAD fallback');
  try {
    return execSync('git diff HEAD~1 HEAD', execOptions);
  } catch (err) {
    try {
      // Initial commit has no parent — diff against empty tree
      const emptyTreeSha = '4b825dc642cb6eb9a060e54bf8d69288fbee4904';
      return execSync(`git diff "${emptyTreeSha}" HEAD`, execOptions);
    } catch (e2) {
      console.warn('  ⚠️   Unable to execute git diff. Defaulting to empty diff.');
      return '';
    }
  }
}

// ─── CHECKLIST & THRESHOLDS LOADING ───────────────────────────────────────────

/**
 * Loads and returns the PR checklist markdown content.
 *
 * @returns {string} The checklist file contents
 */
function loadPrChecklist() {
  if (!existsSync(PR_CHECKLIST_PATH)) {
    throw new Error(`PR checklist not found at: ${PR_CHECKLIST_PATH}`);
  }
  return readFileSync(PR_CHECKLIST_PATH, 'utf-8');
}

/**
 * Loads the LLM judge thresholds.
 *
 * @returns {any} The thresholds object
 */
function loadThresholds() {
  const thresholdsPath = resolve(REPOSITORY_ROOT, '.agent-context/policies/llm-judge-threshold.json');
  if (!existsSync(thresholdsPath)) {
    return {
      selectedProfile: 'balanced',
      profileThresholds: {
        balanced: { blockingSeverities: ['critical', 'high'], failOnMalformedResponse: true, failOnProviderError: false }
      }
    };
  }
  return JSON.parse(readFileSync(thresholdsPath, 'utf-8'));
}

// ─── PROMPT CONSTRUCTION ─────────────────────────────────────────────────────

/**
 * Returns the system-level instruction for the LLM judge role.
 *
 * @returns {string}
 */
function buildSystemPrompt() {
  return `You are a Senior Software Architect performing an automated code review for a CI/CD pipeline.

Your job: evaluate a git diff against the provided PR checklist and identify violations.
You must categorize each violation with a severity level: critical, high, medium, or low.

## Severity classification:
- critical: Security vulnerabilities (hardcoded secrets, SQL/command injection, missing auth checks, CORS), unvalidated external inputs.
- high: N+1 database queries, swallowed errors (empty catch blocks without re-throw/recovery), layer boundary violations.
- medium: TypeScript \`any\` type used without justification, missing test coverage, bad architectural patterns.
- low: Style preferences, minor naming nitpicks, documentation suggestions, performance micro-optimizations.

## Mandatory output format:
You MUST output your findings in EXACTLY this structure:

\`\`\`
## PR REVIEW RESULTS
━━━━━━━━━━━━━━━━━━━

✅ [Section Name] — Passes
❌ [Section Name] — FAILS
   📌 Rule: [rule file and section]
   ❌ Problem: [exact description of the issue found in the diff]
   ⚠️ Severity: [critical | high | medium | low]
   ✅ Fix: [specific actionable fix]

\`\`\`

Rules:
- Then at the absolute LAST line of your response, output a JSON array of the failed checks. Each object should have 'rule', 'problem', 'severity'. If there are no failures, output an empty array [].
- Make sure the JSON array is perfectly valid JSON on a single line starting with \`JSON_VERDICT: \`. For example:
JSON_VERDICT: [{"rule": "Security", "problem": "Hardcoded secret", "severity": "critical"}]
- If the diff is empty, contains only documentation changes, or has no source code changes, output JSON_VERDICT: [] immediately.`;
}

/**
 * Builds the user message combining the checklist and the (possibly truncated) diff.
 *
 * @param {string} prChecklistContent
 * @param {string} diffContent
 * @returns {string}
 */
function buildUserMessage(prChecklistContent, diffContent) {
  const truncatedDiff =
    diffContent.length > MAX_DIFF_CHARS
      ? `${diffContent.slice(0, MAX_DIFF_CHARS)}\n\n[DIFF TRUNCATED — ${(diffContent.length - MAX_DIFF_CHARS).toLocaleString()} additional characters omitted to stay within token limits]`
      : diffContent;

  return `## PR Checklist Reference

${prChecklistContent}

---

## Git Diff to Review

\`\`\`diff
${truncatedDiff.trim() || '(empty diff — no source code changes detected)'}
\`\`\`

Review the diff against the checklist. Report your findings in the required format, ending with VERDICT: PASS ✅ or VERDICT: FAIL ❌.`;
}

// ─── LLM PROVIDER IMPLEMENTATIONS ────────────────────────────────────────────

/**
 * Calls the OpenAI Chat Completions API.
 *
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @returns {Promise<string>}
 */
async function callOpenAiProvider(systemPrompt, userMessage) {
  const selectedModel = process.env.LLM_JUDGE_MODEL ?? 'gpt-4o-mini';
  const apiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: selectedModel,
      max_tokens: 2048,
      temperature: 0,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    }),
  });

  if (!apiResponse.ok) {
    const errorBody = await apiResponse.text();
    throw new Error(`OpenAI API returned ${apiResponse.status}: ${errorBody}`);
  }

  /** @type {{ choices: Array<{ message: { content: string } }> }} */
  const responsePayload = await apiResponse.json();
  return responsePayload.choices[0].message.content;
}

/**
 * Calls the Anthropic Messages API.
 *
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @returns {Promise<string>}
 */
async function callAnthropicProvider(systemPrompt, userMessage) {
  const selectedModel = process.env.LLM_JUDGE_MODEL ?? 'claude-3-5-haiku-latest';
  const apiResponse = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY ?? '',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: selectedModel,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!apiResponse.ok) {
    const errorBody = await apiResponse.text();
    throw new Error(`Anthropic API returned ${apiResponse.status}: ${errorBody}`);
  }

  /** @type {{ content: Array<{ text: string }> }} */
  const responsePayload = await apiResponse.json();
  return responsePayload.content[0].text;
}

/**
 * Calls the Google Gemini generateContent API.
 *
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @returns {Promise<string>}
 */
async function callGeminiProvider(systemPrompt, userMessage) {
  const selectedModel = process.env.LLM_JUDGE_MODEL ?? 'gemini-2.0-flash';
  const apiKey = process.env.GEMINI_API_KEY ?? '';
  const endpointUrl = `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`;

  const apiResponse = await fetch(endpointUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 2048 },
    }),
  });

  if (!apiResponse.ok) {
    const errorBody = await apiResponse.text();
    throw new Error(`Gemini API returned ${apiResponse.status}: ${errorBody}`);
  }

  /** @type {{ candidates: Array<{ content: { parts: Array<{ text: string }> } }> }} */
  const responsePayload = await apiResponse.json();
  return responsePayload.candidates[0].content.parts[0].text;
}

// ─── PROVIDER AUTO-SELECTION ──────────────────────────────────────────────────

/**
 * @typedef {{ providerName: string, invokeProvider: (sys: string, usr: string) => Promise<string> }} SelectedProvider
 */

/**
 * Returns the first available LLM provider based on environment keys.
 * Priority: OpenAI → Anthropic → Gemini.
 *
 * @returns {SelectedProvider | null}
 */
function selectAvailableProvider() {
  if (process.env.OPENAI_API_KEY) {
    return { providerName: 'OpenAI (gpt-4o-mini)', invokeProvider: callOpenAiProvider };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return { providerName: 'Anthropic (claude-3-5-haiku-latest)', invokeProvider: callAnthropicProvider };
  }
  if (process.env.GEMINI_API_KEY) {
    return { providerName: 'Google Gemini (gemini-2.0-flash)', invokeProvider: callGeminiProvider };
  }
  return null;
}

// ─── VERDICT PARSING ─────────────────────────────────────────────────────────

/**
 * Extracts and parses the JSON verdict from the LLM response.
 *
 * @param {string} llmResponseText
 * @param {boolean} failOnMalformedResponse
 * @returns {Array<{ rule: string, problem: string, severity: string }>}
 */
function extractVerdict(llmResponseText, failOnMalformedResponse) {
  const match = llmResponseText.match(/JSON_VERDICT:\s*(\[.*\])/i);
  if (!match) {
    console.warn('⚠️  LLM response did not include a valid JSON_VERDICT line.');
    if (failOnMalformedResponse) {
      console.error('❌  Failing pipeline because malformed responses are not allowed by the profile.');
      process.exit(1);
    }
    return [];
  }
  try {
    return JSON.parse(match[1]);
  } catch (err) {
    const parseError = /** @type {Error} */ (err);
    console.error('⚠️  Failed to parse JSON_VERDICT:', parseError.message);
    if (failOnMalformedResponse) {
      process.exit(1);
    }
    return [];
  }
}

/**
 * @param {Array<{ rule?: string, problem?: string, severity?: string }>} violations
 * @returns {Violation[]}
 */
function normalizeViolations(violations) {
  return violations.map((violationItem) => ({
    rule: String(violationItem.rule || 'Unknown Rule'),
    problem: String(violationItem.problem || 'No problem description provided.'),
    severity: normalizeSeverity(violationItem.severity),
  }));
}

/**
 * @param {{
 *   provider: string,
 *   selectedProfile: string,
 *   blockingSeverities: string[],
 *   finalViolations: Violation[],
 *   blockingFound: Violation[],
 *   isDryRun: boolean,
 *   malformedVerdict: boolean,
 *   providerError: boolean,
 * }} payloadInput
 * @returns {MachineReportPayload}
 */
function buildMachineReportPayload({
  provider,
  selectedProfile,
  blockingSeverities,
  finalViolations,
  blockingFound,
  isDryRun,
  malformedVerdict,
  providerError,
}) {
  return {
    generatedAt: new Date().toISOString(),
    schemaVersion: '1.0',
    profile: selectedProfile,
    provider,
    ciProvider: detectCiProvider(),
    blockingSeverities,
    failDecision: blockingFound.length > 0 || malformedVerdict || providerError,
    malformedVerdict,
    providerError,
    dryRun: isDryRun,
    summary: {
      totalViolations: finalViolations.length,
      blockingViolations: blockingFound.length,
    },
    violations: finalViolations,
  };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('🔍  LLM Judge — Automated Code Review Gate');
  console.log('════════════════════════════════════════════');
  console.log('');

  // ── Step 1: Load checklist and thresholds ──────────────
  const prChecklistContent = loadPrChecklist();
  const thresholdsObj = loadThresholds();
  const selectedProfile = thresholdsObj.selectedProfile || 'balanced';
  const profileConfig = thresholdsObj.profileThresholds[selectedProfile] || {};
  const blockingSeverities = profileConfig.blockingSeverities || ['critical', 'high'];
  const failOnMalformedResponse = profileConfig.failOnMalformedResponse !== false;
  const failOnProviderError = profileConfig.failOnProviderError || false;

  console.log(`✅  PR checklist loaded (${prChecklistContent.length} chars)`);
  console.log(`✅  Threshold profile loaded: ${selectedProfile} (blocking: ${blockingSeverities.join(', ')})`);

  // ── Step 2: Collect diff ────────────────────────────────
  const rawDiff = collectPullRequestDiff();
  console.log(`✅  Git diff collected (${rawDiff.length} chars${rawDiff.length > MAX_DIFF_CHARS ? ` — will truncate to ${MAX_DIFF_CHARS}` : ''})`);

  // ── Step 3: Build prompt ────────────────────────────────
  const systemPrompt = buildSystemPrompt();
  const userMessage = buildUserMessage(prChecklistContent, rawDiff);

  // ── Step 4: Dry run mode ────────────────────────────────
  if (IS_DRY_RUN) {
    console.log('');
    console.log('── DRY RUN MODE ──────────────────────────────────────────');
    console.log('[SYSTEM PROMPT PREVIEW]');
    console.log(systemPrompt.slice(0, 400) + '...');
    console.log('');
    console.log('[USER MESSAGE PREVIEW]');
    console.log(userMessage.slice(0, 400) + '...');
    console.log('─────────────────────────────────────────────────────────');
    console.log('');
    const dryRunReportPayload = buildMachineReportPayload({
      provider: 'dry-run',
      selectedProfile,
      blockingSeverities,
      finalViolations: [],
      blockingFound: [],
      isDryRun: true,
      malformedVerdict: false,
      providerError: false,
    });
    emitMachineReadableReport(dryRunReportPayload);
    console.log('VERDICT: JSON_VERDICT: []  (dry run — no LLM call made)');
    process.exit(0);
  }

  // ── Step 5: Select provider ─────────────────────────────
  const selectedProvider = selectAvailableProvider();
  if (!selectedProvider) {
    console.warn('');
    console.warn('⚠️   No LLM API key detected.');
    console.warn('    Set OPENAI_API_KEY, ANTHROPIC_API_KEY, or GEMINI_API_KEY');
    console.warn('    to enable automated code review.');
    console.warn('');
    console.warn('⏭️   Skipping LLM review — pipeline continues (PASS).');
    const skippedReportPayload = buildMachineReportPayload({
      provider: 'none',
      selectedProfile,
      blockingSeverities,
      finalViolations: [],
      blockingFound: [],
      isDryRun: false,
      malformedVerdict: false,
      providerError: false,
    });
    emitMachineReadableReport(skippedReportPayload);
    process.exit(0);
  }

  console.log(`✅  Provider selected: ${selectedProvider.providerName}`);
  if (process.env.LLM_JUDGE_MODEL) {
    console.log(`    Model override: ${process.env.LLM_JUDGE_MODEL}`);
  }
  console.log('');
  console.log('⏳  Sending diff to LLM for review...');
  console.log('');

  // ── Step 6: Call LLM ────────────────────────────────────
  let llmReviewText;
  try {
    llmReviewText = await selectedProvider.invokeProvider(systemPrompt, userMessage);
  } catch (providerCallError) {
    console.warn(`⚠️   LLM call failed: ${/** @type {Error} */ (providerCallError).message}`);
    const providerErrorReportPayload = buildMachineReportPayload({
      provider: selectedProvider.providerName,
      selectedProfile,
      blockingSeverities,
      finalViolations: [],
      blockingFound: [],
      isDryRun: false,
      malformedVerdict: false,
      providerError: Boolean(failOnProviderError),
    });
    emitMachineReadableReport(providerErrorReportPayload);
    if (failOnProviderError) {
      console.error('❌  Failing pipeline because provider errors are not allowed by the profile.');
      process.exit(1);
    }
    console.warn('    Skipping LLM review — pipeline continues (PASS).');
    process.exit(0);
  }

  // ── Step 7: Print report ────────────────────────────────
  console.log('── LLM Review Report ─────────────────────────────────────');
  console.log('');
  console.log(llmReviewText);
  console.log('');
  console.log('──────────────────────────────────────────────────────────');
  console.log('');

  // ── Step 8: Enforce verdict ─────────────────────────────
  const rawVerdictViolations = extractVerdict(llmReviewText, failOnMalformedResponse);
  const finalViolations = normalizeViolations(rawVerdictViolations);
  const hasMalformedVerdict = !/JSON_VERDICT:\s*\[/i.test(llmReviewText);

  const blockingFound = finalViolations.filter(v => blockingSeverities.includes(v.severity.toLowerCase()));
  const machineReportPayload = buildMachineReportPayload({
    provider: selectedProvider.providerName,
    selectedProfile,
    blockingSeverities,
    finalViolations,
    blockingFound,
    isDryRun: false,
    malformedVerdict: hasMalformedVerdict,
    providerError: false,
  });
  emitMachineReadableReport(machineReportPayload);

  if (blockingFound.length > 0) {
    console.error(`❌  LLM Judge: ${blockingFound.length} blocking violations found (severities: ${blockingSeverities.join(', ')}). Pipeline FAILED.`);
    console.error('    Fix the issues listed above before merging.');
    process.exit(1);
  }

  console.log('✅  LLM Judge: No blocking violations. Pipeline PASSED.');
  process.exit(0);
}

main().catch((unexpectedError) => {
  console.error('❌  Unexpected error in llm-judge:', unexpectedError);
  process.exit(1);
});
