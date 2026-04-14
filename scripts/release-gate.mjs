#!/usr/bin/env node

/**
 * release-gate.mjs
 *
 * Enterprise release gate for V1.8.
 * Produces machine-readable output for CI and fails fast on missing release evidence.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPOSITORY_ROOT = resolve(__dirname, '..');

const VERSION_PATTERN = /^\d+\.\d+\.\d+$/;
const NODE_MIN_PATTERN = /^\d+(\.\d+)?$/;
const SUPPORTED_COMPATIBILITY_PLATFORMS = new Set(['windows', 'linux', 'macos']);
const REQUIRED_SKILL_DOMAINS = [
  'backend',
  'frontend',
  'fullstack',
  'cli',
  'distribution',
  'review-quality',
];
const FRONTEND_PARITY_CHECKLIST_PATH = '.agent-context/review-checklists/frontend-skill-parity.md';
const FRONTEND_AUDIT_SCRIPT_PATH = 'scripts/frontend-usability-audit.mjs';
const REQUIRED_FRONTEND_PARITY_SNIPPETS = [
  'Architecture and Composition',
  'Interaction and Motion',
  'Accessibility and Responsiveness',
  'UX Narrative and Conversion Clarity',
  'Release Evidence',
];

function readText(relativeFilePath) {
  const absolutePath = resolve(REPOSITORY_ROOT, relativeFilePath);
  if (!existsSync(absolutePath)) {
    return '';
  }

  return readFileSync(absolutePath, 'utf8');
}

function pushResult(results, isPassed, checkName, details) {
  results.push({
    checkName,
    passed: isPassed,
    details,
  });
}

function validateCompatibilityManifestShape(parsedManifest, skillDomainName) {
  const validationErrors = [];

  if (!Array.isArray(parsedManifest.ides) || parsedManifest.ides.length === 0) {
    validationErrors.push(`Domain ${skillDomainName} must define non-empty ides[]`);
  }

  if (!Array.isArray(parsedManifest.platforms) || parsedManifest.platforms.length === 0) {
    validationErrors.push(`Domain ${skillDomainName} must define non-empty platforms[]`);
  } else {
    const unsupportedPlatformName = parsedManifest.platforms.find(
      (platformName) => !SUPPORTED_COMPATIBILITY_PLATFORMS.has(platformName)
    );

    if (unsupportedPlatformName) {
      validationErrors.push(`Domain ${skillDomainName} has unsupported platform: ${unsupportedPlatformName}`);
    }
  }

  if (typeof parsedManifest.nodeMin !== 'string' || !NODE_MIN_PATTERN.test(parsedManifest.nodeMin)) {
    validationErrors.push(`Domain ${skillDomainName} must define nodeMin as "18" or "18.0" style string`);
  }

  return validationErrors;
}

function runReleaseGate() {
  const results = [];
  const packageJsonPath = 'package.json';
  const changelogPath = 'CHANGELOG.md';
  const roadmapPath = 'docs/roadmap.md';

  const packageJsonContent = readText(packageJsonPath);
  if (!packageJsonContent) {
    pushResult(results, false, 'package-json-exists', `Missing ${packageJsonPath}`);
  }

  let packageManifest = null;
  if (packageJsonContent) {
    try {
      packageManifest = JSON.parse(packageJsonContent);
      pushResult(results, true, 'package-json-parse', 'package.json is valid JSON');
    } catch (packageParseError) {
      const parseMessage = packageParseError instanceof Error ? packageParseError.message : 'Unknown parse error';
      pushResult(results, false, 'package-json-parse', `Cannot parse package.json: ${parseMessage}`);
    }
  }

  const releaseVersion = packageManifest?.version;
  if (!releaseVersion || !VERSION_PATTERN.test(releaseVersion)) {
    pushResult(results, false, 'version-semver', `Invalid package version: ${String(releaseVersion)}`);
  } else {
    pushResult(results, true, 'version-semver', `Version ${releaseVersion} matches x.y.z format`);
  }

  const changelogContent = readText(changelogPath);
  if (!changelogContent) {
    pushResult(results, false, 'changelog-exists', `Missing ${changelogPath}`);
  } else if (!releaseVersion) {
    pushResult(results, false, 'changelog-version-entry', 'Cannot check changelog because version is invalid');
  } else if (!changelogContent.includes(`## ${releaseVersion} - `)) {
    pushResult(results, false, 'changelog-version-entry', `Missing release header for ${releaseVersion} in CHANGELOG.md`);
  } else {
    pushResult(results, true, 'changelog-version-entry', `Found release header for ${releaseVersion}`);
  }

  const roadmapContent = readText(roadmapPath);
  if (!roadmapContent) {
    pushResult(results, false, 'roadmap-exists', `Missing ${roadmapPath}`);
  } else if (!roadmapContent.includes('V1.8')) {
    pushResult(results, false, 'roadmap-v18', 'Roadmap does not mention V1.8 release track');
  } else {
    pushResult(results, true, 'roadmap-v18', 'Roadmap includes V1.8 release track');
  }

  const requiredEnterpriseFiles = [
    '.agent-context/review-checklists/release-operations.md',
    'docs/v1.8-operations-playbook.md',
    '.github/workflows/release-gate.yml',
    '.github/workflows/sbom-compliance.yml',
    '.github/workflows/governance-weekly-report.yml',
    'scripts/governance-weekly-report.mjs',
  ];

  for (const requiredEnterpriseFile of requiredEnterpriseFiles) {
    const absoluteRequiredPath = resolve(REPOSITORY_ROOT, requiredEnterpriseFile);
    if (!existsSync(absoluteRequiredPath)) {
      pushResult(results, false, 'required-enterprise-file', `Missing ${requiredEnterpriseFile}`);
      continue;
    }

    pushResult(results, true, 'required-enterprise-file', `${requiredEnterpriseFile} is present`);
  }

  let validatedCompatibilityManifestCount = 0;

  for (const skillDomainName of REQUIRED_SKILL_DOMAINS) {
    const compatibilityManifestPath = `.agent-context/skills/${skillDomainName}/compatibility-manifest.json`;
    const compatibilityManifestContent = readText(compatibilityManifestPath);

    if (!compatibilityManifestContent) {
      pushResult(results, false, 'compatibility-manifest', `Missing ${compatibilityManifestPath}`);
      continue;
    }

    let parsedCompatibilityManifest;
    try {
      parsedCompatibilityManifest = JSON.parse(compatibilityManifestContent);
    } catch (compatibilityManifestParseError) {
      const parseErrorMessage = compatibilityManifestParseError instanceof Error
        ? compatibilityManifestParseError.message
        : 'Unknown parse error';
      pushResult(results, false, 'compatibility-manifest', `Invalid JSON in ${compatibilityManifestPath}: ${parseErrorMessage}`);
      continue;
    }

    const compatibilityValidationErrors = validateCompatibilityManifestShape(
      parsedCompatibilityManifest,
      skillDomainName
    );

    if (compatibilityValidationErrors.length > 0) {
      pushResult(results, false, 'compatibility-manifest', compatibilityValidationErrors.join('; '));
      continue;
    }

    validatedCompatibilityManifestCount += 1;
    pushResult(results, true, 'compatibility-manifest', `${compatibilityManifestPath} is valid`);
  }

  if (validatedCompatibilityManifestCount === REQUIRED_SKILL_DOMAINS.length) {
    pushResult(
      results,
      true,
      'compatibility-manifest-coverage',
      `Validated ${validatedCompatibilityManifestCount}/${REQUIRED_SKILL_DOMAINS.length} required skill compatibility manifests`
    );
  } else {
    pushResult(
      results,
      false,
      'compatibility-manifest-coverage',
      `Validated ${validatedCompatibilityManifestCount}/${REQUIRED_SKILL_DOMAINS.length} required skill compatibility manifests`
    );
  }

  const frontendParityChecklistContent = readText(FRONTEND_PARITY_CHECKLIST_PATH);
  if (!frontendParityChecklistContent) {
    pushResult(results, false, 'frontend-parity-checklist-exists', `Missing ${FRONTEND_PARITY_CHECKLIST_PATH}`);
  } else {
    pushResult(results, true, 'frontend-parity-checklist-exists', `${FRONTEND_PARITY_CHECKLIST_PATH} is present`);

    const missingFrontendParitySnippets = REQUIRED_FRONTEND_PARITY_SNIPPETS.filter(
      (requiredSnippet) => !frontendParityChecklistContent.includes(requiredSnippet)
    );

    if (missingFrontendParitySnippets.length === 0) {
      pushResult(results, true, 'frontend-parity-checklist-coverage', 'Frontend parity checklist sections are complete');
    } else {
      pushResult(
        results,
        false,
        'frontend-parity-checklist-coverage',
        `Missing frontend parity checklist sections: ${missingFrontendParitySnippets.join(', ')}`
      );
    }
  }

  try {
    const frontendAuditRawOutput = execFileSync('node', [FRONTEND_AUDIT_SCRIPT_PATH], {
      cwd: REPOSITORY_ROOT,
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
    });
    const frontendAuditReport = JSON.parse(frontendAuditRawOutput);

    if (frontendAuditReport.passed === true) {
      pushResult(results, true, 'frontend-usability-audit', 'frontend-usability-audit report passed');
    } else {
      const failureDetails = Array.isArray(frontendAuditReport.failures)
        ? frontendAuditReport.failures.join('; ')
        : 'Unknown frontend audit failures';
      pushResult(results, false, 'frontend-usability-audit', `frontend-usability-audit reported failures: ${failureDetails}`);
    }
  } catch (frontendAuditError) {
    const frontendAuditErrorMessage = frontendAuditError instanceof Error
      ? frontendAuditError.message
      : 'Unknown frontend audit execution error';
    pushResult(results, false, 'frontend-usability-audit', `Failed to execute frontend usability audit: ${frontendAuditErrorMessage}`);
  }

  const failureCount = results.filter((checkResult) => !checkResult.passed).length;
  const releaseGateReport = {
    generatedAt: new Date().toISOString(),
    gateName: 'release-gate',
    passed: failureCount === 0,
    failureCount,
    results,
  };

  console.log(JSON.stringify(releaseGateReport, null, 2));
  process.exit(releaseGateReport.passed ? 0 : 1);
}

runReleaseGate();
