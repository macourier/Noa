#!/usr/bin/env node

/**
 * governance-weekly-report.mjs
 *
 * Aggregates weekly governance readiness signals for maintainers.
 * Produces a machine-readable report with trend, trust, and release posture.
 */

import { existsSync, readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { calculateTrustScore } from './trust-scorer.mjs';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(SCRIPT_FILE_PATH);
const REPOSITORY_ROOT = resolve(SCRIPT_DIR, '..');
const QUALITY_TREND_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'quality-trend-report.json');
const REPORT_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'weekly-governance-report.json');
const ARGUMENT_FLAGS = new Set(process.argv.slice(2));
const isStdoutOnlyMode = ARGUMENT_FLAGS.has('--stdout-only');
const WEEKLY_WINDOW_DAYS = 7;
const HISTORY_LIMIT = 26;
const REQUIRED_VERIFIED_DOMAINS = new Set(['cli', 'frontend', 'fullstack', 'distribution', 'review-quality']);

function readJsonOrNull(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function runJsonScript(scriptRelativePath, scriptArguments = []) {
  const absoluteScriptPath = join(REPOSITORY_ROOT, scriptRelativePath);
  const commandResult = spawnSync('node', [absoluteScriptPath, ...scriptArguments], {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10,
  });

  const standardOutput = (commandResult.stdout || '').trim();
  const standardError = (commandResult.stderr || '').trim();
  const exitCode = typeof commandResult.status === 'number' ? commandResult.status : 1;

  if (!standardOutput) {
    return {
      scriptPath: scriptRelativePath,
      exitCode,
      parsedReport: null,
      parseError: 'Script produced no stdout JSON payload',
      stderr: standardError,
    };
  }

  try {
    return {
      scriptPath: scriptRelativePath,
      exitCode,
      parsedReport: JSON.parse(standardOutput),
      parseError: null,
      stderr: standardError,
    };
  } catch (jsonParseError) {
    const parseErrorMessage = jsonParseError instanceof Error ? jsonParseError.message : String(jsonParseError);
    return {
      scriptPath: scriptRelativePath,
      exitCode,
      parsedReport: null,
      parseError: parseErrorMessage,
      stderr: standardError,
    };
  }
}

function loadQualityTrendReport() {
  const existingQualityTrend = readJsonOrNull(QUALITY_TREND_PATH);
  if (existingQualityTrend) {
    return {
      source: 'state-file',
      report: existingQualityTrend,
      freshness: existingQualityTrend.generatedAt || null,
    };
  }

  const generatedQualityTrend = runJsonScript('scripts/quality-trend-report.mjs', ['--stdout-only']);
  return {
    source: 'generated-stdout',
    report: generatedQualityTrend.parsedReport,
    freshness: generatedQualityTrend.parsedReport?.generatedAt || null,
    parseError: generatedQualityTrend.parseError,
    exitCode: generatedQualityTrend.exitCode,
  };
}

function collectCommitSignals(windowDays) {
  const commitLogResult = spawnSync('git', ['log', `--since=${windowDays}.days`, '--pretty=format:%s'], {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });

  if (commitLogResult.status !== 0) {
    return {
      windowDays,
      commitCount: 0,
      releaseCommitCount: 0,
      rollbackCommitCount: 0,
      releaseFrequencyPercent: null,
      rollbackFrequencyPercent: null,
      error: (commitLogResult.stderr || 'Failed to read git log').trim(),
    };
  }

  const commitSubjects = (commitLogResult.stdout || '')
    .split(/\r?\n/u)
    .map((subjectLine) => subjectLine.trim())
    .filter((subjectLine) => subjectLine.length > 0);

  const commitCount = commitSubjects.length;
  const releaseCommitCount = commitSubjects.filter((subjectLine) => /release|publish|chore\(release\)/i.test(subjectLine)).length;
  const rollbackCommitCount = commitSubjects.filter((subjectLine) => /rollback|revert/i.test(subjectLine)).length;

  return {
    windowDays,
    commitCount,
    releaseCommitCount,
    rollbackCommitCount,
    releaseFrequencyPercent: commitCount === 0 ? 0 : Number(((releaseCommitCount / commitCount) * 100).toFixed(2)),
    rollbackFrequencyPercent: commitCount === 0 ? 0 : Number(((rollbackCommitCount / commitCount) * 100).toFixed(2)),
    error: null,
  };
}

async function collectSkillTrustSignals() {
  const skillDirectoryPath = join(REPOSITORY_ROOT, '.agent-context', 'skills');
  const skillDirectoryEntries = await fs.readdir(skillDirectoryPath, { withFileTypes: true });
  const skillDomainNames = skillDirectoryEntries
    .filter((directoryEntry) => directoryEntry.isDirectory())
    .map((directoryEntry) => directoryEntry.name)
    .sort((leftDomainName, rightDomainName) => leftDomainName.localeCompare(rightDomainName));

  const trustRows = [];
  const tierCounts = {
    verified: 0,
    community: 0,
    experimental: 0,
  };

  for (const skillDomainName of skillDomainNames) {
    const trustResult = await calculateTrustScore(join(skillDirectoryPath, skillDomainName));

    if (typeof tierCounts[trustResult.tier] === 'number') {
      tierCounts[trustResult.tier] += 1;
    }

    trustRows.push({
      domain: skillDomainName,
      tier: trustResult.tier,
      score: trustResult.score,
    });
  }

  const requiredVerifiedDomainFailures = trustRows
    .filter((trustRow) => REQUIRED_VERIFIED_DOMAINS.has(trustRow.domain) && trustRow.tier !== 'verified')
    .map((trustRow) => trustRow.domain);

  return {
    domains: trustRows,
    tierCounts,
    requiredVerifiedDomains: Array.from(REQUIRED_VERIFIED_DOMAINS),
    requiredVerifiedDomainFailures,
    allRequiredVerified: requiredVerifiedDomainFailures.length === 0,
  };
}

function buildBlockers(qualityTrendReport, skillTrustSignals, commitSignals) {
  const blockers = [];

  const qualityGatePassRatePercent = qualityTrendReport?.governanceHealth?.gatePassRatePercent;
  if (typeof qualityGatePassRatePercent !== 'number' || qualityGatePassRatePercent < 100) {
    blockers.push('Governance gate pass rate is below 100%.');
  }

  if (!skillTrustSignals.allRequiredVerified) {
    blockers.push(
      `Required verified skill domains missing: ${skillTrustSignals.requiredVerifiedDomainFailures.join(', ')}`
    );
  }

  if (commitSignals.error) {
    blockers.push(`Commit signal extraction failed: ${commitSignals.error}`);
  }

  return blockers;
}

function buildHistoryEntry(weeklyReport) {
  return {
    generatedAt: weeklyReport.generatedAt,
    readinessStatus: weeklyReport.releaseReadiness.isReady ? 'ready' : 'blocked',
    blockerCount: weeklyReport.releaseReadiness.blockers.length,
    gatePassRatePercent: weeklyReport.qualitySignals.governanceHealth.gatePassRatePercent,
    verifiedSkillDomainCount: weeklyReport.skillTrust.tierCounts.verified,
    releaseFrequencyPercent: weeklyReport.commitSignals.releaseFrequencyPercent,
    rollbackFrequencyPercent: weeklyReport.commitSignals.rollbackFrequencyPercent,
  };
}

function mergeHistory(previousReport, currentHistoryEntry) {
  const existingHistory = Array.isArray(previousReport?.history) ? previousReport.history : [];
  const mergedHistory = [...existingHistory, currentHistoryEntry];

  if (mergedHistory.length <= HISTORY_LIMIT) {
    return mergedHistory;
  }

  return mergedHistory.slice(mergedHistory.length - HISTORY_LIMIT);
}

async function runWeeklyGovernanceReport() {
  const qualityTrendState = loadQualityTrendReport();
  const qualityTrendReport = qualityTrendState.report;

  const skillTrustSignals = await collectSkillTrustSignals();
  const commitSignals = collectCommitSignals(WEEKLY_WINDOW_DAYS);
  const blockers = buildBlockers(qualityTrendReport, skillTrustSignals, commitSignals);

  const weeklyReportSnapshot = {
    generatedAt: new Date().toISOString(),
    reportName: 'weekly-governance-report',
    methodology: {
      qualityTrendSource: qualityTrendState.source,
      qualityTrendGeneratedAt: qualityTrendState.freshness,
      commitWindowDays: WEEKLY_WINDOW_DAYS,
      requiredVerifiedDomains: Array.from(REQUIRED_VERIFIED_DOMAINS),
    },
    qualitySignals: {
      governanceHealth: {
        availableGateCount: qualityTrendReport?.governanceHealth?.availableGateCount ?? null,
        passedGateCount: qualityTrendReport?.governanceHealth?.passedGateCount ?? null,
        gatePassRatePercent: qualityTrendReport?.governanceHealth?.gatePassRatePercent ?? null,
      },
      rejectionCategories: Array.isArray(qualityTrendReport?.rejectionCategories)
        ? qualityTrendReport.rejectionCategories
        : [],
      tokenEfficiency: qualityTrendReport?.tokenEfficiency || null,
    },
    skillTrust: skillTrustSignals,
    commitSignals,
    releaseReadiness: {
      isReady: blockers.length === 0,
      blockers,
      summary: blockers.length === 0
        ? 'Weekly governance posture is ready for maintenance releases.'
        : 'Weekly governance posture is blocked by unresolved readiness signals.',
    },
    artifact: {
      path: REPORT_PATH,
      writeMode: isStdoutOnlyMode ? 'stdout-only' : 'stdout-and-file',
    },
  };

  const previousReport = readJsonOrNull(REPORT_PATH);
  const history = mergeHistory(previousReport, buildHistoryEntry(weeklyReportSnapshot));
  const weeklyReport = {
    ...weeklyReportSnapshot,
    history,
  };

  if (!isStdoutOnlyMode) {
    await fs.mkdir(dirname(REPORT_PATH), { recursive: true });
    await fs.writeFile(REPORT_PATH, JSON.stringify(weeklyReport, null, 2) + '\n', 'utf8');
  }

  return weeklyReport;
}

runWeeklyGovernanceReport()
  .then((weeklyReport) => {
    console.log(JSON.stringify(weeklyReport, null, 2));
  })
  .catch((reportError) => {
    const errorMessage = reportError instanceof Error ? reportError.message : String(reportError);
    console.error(`Weekly governance report failed: ${errorMessage}`);
    process.exit(1);
  });
