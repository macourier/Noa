#!/usr/bin/env node

/**
 * quality-trend-report.mjs
 *
 * Generates a machine-readable quality trend artifact that summarizes
 * governance gate pass rates, rejection categories, rollback frequency,
 * and token-efficiency signals.
 */

import { existsSync, readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(SCRIPT_FILE_PATH);
const REPOSITORY_ROOT = resolve(SCRIPT_DIR, '..');
const REPORT_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'quality-trend-report.json');
const TOKEN_BENCHMARK_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'token-optimization-benchmark.json');
const ARGUMENT_FLAGS = new Set(process.argv.slice(2));
const isStdoutOnlyMode = ARGUMENT_FLAGS.has('--stdout-only');
const MAX_SNAPSHOT_HISTORY = 30;
const ROLLBACK_WINDOW_DAYS = 30;

function runJsonScript(scriptRelativePath) {
  const absoluteScriptPath = join(REPOSITORY_ROOT, scriptRelativePath);
  const commandResult = spawnSync('node', [absoluteScriptPath], {
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
    const parsedReport = JSON.parse(standardOutput);
    return {
      scriptPath: scriptRelativePath,
      exitCode,
      parsedReport,
      parseError: null,
      stderr: standardError,
    };
  } catch (jsonParseError) {
    const errorMessage = jsonParseError instanceof Error ? jsonParseError.message : String(jsonParseError);
    return {
      scriptPath: scriptRelativePath,
      exitCode,
      parsedReport: null,
      parseError: errorMessage,
      stderr: standardError,
    };
  }
}

function readJsonFileOrNull(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function summarizeGateExecution(gateExecutionResults) {
  const gateSummaries = gateExecutionResults.map((gateExecutionResult) => {
    const gateReport = gateExecutionResult.parsedReport;
    return {
      scriptPath: gateExecutionResult.scriptPath,
      gateName: gateReport?.gateName || gateReport?.reportName || gateExecutionResult.scriptPath,
      exitCode: gateExecutionResult.exitCode,
      passed: typeof gateReport?.passed === 'boolean' ? gateReport.passed : false,
      parseError: gateExecutionResult.parseError,
      failureCount: typeof gateReport?.failureCount === 'number' ? gateReport.failureCount : null,
      generatedAt: gateReport?.generatedAt || null,
    };
  });

  const availableGateCount = gateSummaries.length;
  const passedGateCount = gateSummaries.filter((gateSummary) => gateSummary.passed).length;
  const gatePassRatePercent = availableGateCount === 0
    ? 0
    : Number(((passedGateCount / availableGateCount) * 100).toFixed(2));

  return {
    gateSummaries,
    availableGateCount,
    passedGateCount,
    gatePassRatePercent,
  };
}

function collectRejectionCategories(gateExecutionResults) {
  const rejectionCategoryMap = new Map();

  for (const gateExecutionResult of gateExecutionResults) {
    const gateReport = gateExecutionResult.parsedReport;
    const gateName = gateReport?.gateName || gateReport?.reportName || gateExecutionResult.scriptPath;
    const gateResults = Array.isArray(gateReport?.results) ? gateReport.results : [];

    for (const checkResult of gateResults) {
      if (checkResult?.passed === true) {
        continue;
      }

      const checkName = typeof checkResult?.checkName === 'string' ? checkResult.checkName : 'unknown-check';
      const existingCategory = rejectionCategoryMap.get(checkName) || {
        checkName,
        count: 0,
        gates: new Set(),
      };

      existingCategory.count += 1;
      existingCategory.gates.add(gateName);
      rejectionCategoryMap.set(checkName, existingCategory);
    }
  }

  return Array.from(rejectionCategoryMap.values())
    .map((rejectionCategory) => ({
      checkName: rejectionCategory.checkName,
      count: rejectionCategory.count,
      gates: Array.from(rejectionCategory.gates),
    }))
    .sort((firstCategory, secondCategory) => secondCategory.count - firstCategory.count);
}

function calculateRollbackFrequencySnapshot() {
  const gitLogResult = spawnSync('git', ['log', `--since=${ROLLBACK_WINDOW_DAYS}.days`, '--pretty=format:%s'], {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });

  if (gitLogResult.status !== 0) {
    return {
      windowDays: ROLLBACK_WINDOW_DAYS,
      commitCount: 0,
      rollbackCommitCount: 0,
      rollbackFrequencyPercent: null,
      source: 'git-log',
      error: (gitLogResult.stderr || 'Failed to read git log').trim(),
    };
  }

  const commitSubjects = (gitLogResult.stdout || '')
    .split(/\r?\n/u)
    .map((subjectLine) => subjectLine.trim())
    .filter((subjectLine) => subjectLine.length > 0);

  const rollbackCommitCount = commitSubjects.filter((subjectLine) => /rollback/i.test(subjectLine)).length;
  const commitCount = commitSubjects.length;
  const rollbackFrequencyPercent = commitCount === 0
    ? 0
    : Number(((rollbackCommitCount / commitCount) * 100).toFixed(2));

  return {
    windowDays: ROLLBACK_WINDOW_DAYS,
    commitCount,
    rollbackCommitCount,
    rollbackFrequencyPercent,
    source: 'git-log',
    error: null,
  };
}

function summarizeTokenBenchmark() {
  const tokenBenchmarkReport = readJsonFileOrNull(TOKEN_BENCHMARK_PATH);
  if (!tokenBenchmarkReport) {
    return {
      isAvailable: false,
      generatedAt: null,
      averageNativeSavingsPercent: null,
      averageRtkSavingsPercent: null,
      scenarioCount: 0,
    };
  }

  return {
    isAvailable: true,
    generatedAt: tokenBenchmarkReport.generatedAt || null,
    averageNativeSavingsPercent: tokenBenchmarkReport.summary?.averageNativeSavingsPercent ?? null,
    averageRtkSavingsPercent: tokenBenchmarkReport.summary?.averageRtkSavingsPercent ?? null,
    scenarioCount: Array.isArray(tokenBenchmarkReport.scenarios) ? tokenBenchmarkReport.scenarios.length : 0,
  };
}

function loadPreviousTrendHistory() {
  const previousReport = readJsonFileOrNull(REPORT_PATH);
  if (!previousReport || !Array.isArray(previousReport.history)) {
    return [];
  }

  return previousReport.history;
}

function buildHistoryEntry(currentSnapshot) {
  return {
    generatedAt: currentSnapshot.generatedAt,
    gatePassRatePercent: currentSnapshot.governanceHealth.gatePassRatePercent,
    passedGateCount: currentSnapshot.governanceHealth.passedGateCount,
    availableGateCount: currentSnapshot.governanceHealth.availableGateCount,
    rollbackFrequencyPercent: currentSnapshot.rollbackSignals.rollbackFrequencyPercent,
    averageNativeSavingsPercent: currentSnapshot.tokenEfficiency.averageNativeSavingsPercent,
    averageRtkSavingsPercent: currentSnapshot.tokenEfficiency.averageRtkSavingsPercent,
    rejectionCategoryCount: currentSnapshot.rejectionCategories.length,
  };
}

function mergeHistory(previousHistoryEntries, currentHistoryEntry) {
  const mergedHistoryEntries = [...previousHistoryEntries, currentHistoryEntry];
  if (mergedHistoryEntries.length <= MAX_SNAPSHOT_HISTORY) {
    return mergedHistoryEntries;
  }

  return mergedHistoryEntries.slice(mergedHistoryEntries.length - MAX_SNAPSHOT_HISTORY);
}

async function runQualityTrendReport() {
  const releaseGateExecution = runJsonScript('scripts/release-gate.mjs');
  const benchmarkGateExecution = runJsonScript('scripts/benchmark-gate.mjs');
  const benchmarkIntelligenceExecution = runJsonScript('scripts/benchmark-intelligence.mjs');
  const gateExecutionResults = [releaseGateExecution, benchmarkGateExecution, benchmarkIntelligenceExecution];

  const governanceHealth = summarizeGateExecution(gateExecutionResults);
  const rejectionCategories = collectRejectionCategories(gateExecutionResults);
  const rollbackSignals = calculateRollbackFrequencySnapshot();
  const tokenEfficiency = summarizeTokenBenchmark();

  const qualityTrendSnapshot = {
    generatedAt: new Date().toISOString(),
    reportName: 'quality-trend-report',
    methodology: {
      gateSources: gateExecutionResults.map((gateExecutionResult) => gateExecutionResult.scriptPath),
      rollbackSource: 'git log commit subjects within 30-day window',
      tokenSource: '.agent-context/state/token-optimization-benchmark.json',
    },
    governanceHealth,
    rejectionCategories,
    rollbackSignals,
    tokenEfficiency,
    artifact: {
      path: REPORT_PATH,
      writeMode: isStdoutOnlyMode ? 'stdout-only' : 'stdout-and-file',
    },
  };

  const previousHistoryEntries = loadPreviousTrendHistory();
  const currentHistoryEntry = buildHistoryEntry(qualityTrendSnapshot);
  const history = mergeHistory(previousHistoryEntries, currentHistoryEntry);
  const qualityTrendReport = {
    ...qualityTrendSnapshot,
    history,
  };

  if (!isStdoutOnlyMode) {
    await fs.mkdir(dirname(REPORT_PATH), { recursive: true });
    await fs.writeFile(REPORT_PATH, JSON.stringify(qualityTrendReport, null, 2) + '\n', 'utf8');
  }

  return qualityTrendReport;
}

runQualityTrendReport()
  .then((qualityTrendReport) => {
    console.log(JSON.stringify(qualityTrendReport, null, 2));
  })
  .catch((qualityTrendError) => {
    const errorMessage = qualityTrendError instanceof Error ? qualityTrendError.message : String(qualityTrendError);
    console.error(`Quality trend report failed: ${errorMessage}`);
    process.exit(1);
  });