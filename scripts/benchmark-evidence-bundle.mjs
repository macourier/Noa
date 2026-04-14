#!/usr/bin/env node

/**
 * benchmark-evidence-bundle.mjs
 *
 * V2.5.1 reproducibility baseline artifact.
 * Aggregates benchmark inputs, rubric, command examples, and outputs
 * into a single machine-readable evidence bundle.
 */

import { existsSync, readFileSync } from 'node:fs';
import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(SCRIPT_FILE_PATH);
const REPOSITORY_ROOT = resolve(SCRIPT_DIR, '..');
const ARGUMENT_FLAGS = new Set(process.argv.slice(2));
const isStdoutOnlyMode = ARGUMENT_FLAGS.has('--stdout-only');

const REPRO_PROFILE_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'benchmark-reproducibility.json');
const BENCHMARK_THRESHOLD_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'benchmark-thresholds.json');
const BENCHMARK_WATCHLIST_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'benchmark-watchlist.json');
const OUTPUT_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'benchmark-evidence-bundle.json');

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

function runJsonScript(scriptRelativePath) {
  const absoluteScriptPath = join(REPOSITORY_ROOT, scriptRelativePath);
  const executionResult = spawnSync('node', [absoluteScriptPath], {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 10,
  });

  const stdoutContent = (executionResult.stdout || '').trim();
  const stderrContent = (executionResult.stderr || '').trim();
  const exitCode = typeof executionResult.status === 'number' ? executionResult.status : 1;

  if (!stdoutContent) {
    return {
      scriptPath: scriptRelativePath,
      exitCode,
      parsedReport: null,
      parseError: 'Script produced no stdout JSON payload',
      stderr: stderrContent,
    };
  }

  try {
    return {
      scriptPath: scriptRelativePath,
      exitCode,
      parsedReport: JSON.parse(stdoutContent),
      parseError: null,
      stderr: stderrContent,
    };
  } catch (jsonParseError) {
    const parseErrorMessage = jsonParseError instanceof Error ? jsonParseError.message : String(jsonParseError);
    return {
      scriptPath: scriptRelativePath,
      exitCode,
      parsedReport: null,
      parseError: parseErrorMessage,
      stderr: stderrContent,
    };
  }
}

function summarizeExecution(scriptExecutionResult) {
  return {
    scriptPath: scriptExecutionResult.scriptPath,
    exitCode: scriptExecutionResult.exitCode,
    parseError: scriptExecutionResult.parseError,
    stderr: scriptExecutionResult.stderr || null,
    reportName: scriptExecutionResult.parsedReport?.reportName || scriptExecutionResult.parsedReport?.gateName || null,
    passed: typeof scriptExecutionResult.parsedReport?.passed === 'boolean'
      ? scriptExecutionResult.parsedReport.passed
      : null,
  };
}

function buildRubricSummary(thresholdConfiguration, intelligenceReport) {
  return {
    benchmarkThresholds: {
      minimumTop1Accuracy: thresholdConfiguration?.minimumTop1Accuracy ?? null,
      maximumManualCorrectionRate: thresholdConfiguration?.maximumManualCorrectionRate ?? null,
      maximumTop1AccuracyDrop: thresholdConfiguration?.maximumTop1AccuracyDrop ?? null,
      maximumManualCorrectionIncrease: thresholdConfiguration?.maximumManualCorrectionIncrease ?? null,
    },
    intelligenceSlaDays: intelligenceReport?.reviewSlaDays ?? null,
  };
}

async function runBenchmarkEvidenceBundle() {
  const reproducibilityProfile = readJsonOrNull(REPRO_PROFILE_PATH);
  const thresholdConfiguration = readJsonOrNull(BENCHMARK_THRESHOLD_PATH);
  const watchlistConfiguration = readJsonOrNull(BENCHMARK_WATCHLIST_PATH);

  const detectionBenchmarkExecution = runJsonScript('scripts/detection-benchmark.mjs');
  const benchmarkGateExecution = runJsonScript('scripts/benchmark-gate.mjs');
  const benchmarkIntelligenceExecution = runJsonScript('scripts/benchmark-intelligence.mjs');

  const executionSummaries = [
    summarizeExecution(detectionBenchmarkExecution),
    summarizeExecution(benchmarkGateExecution),
    summarizeExecution(benchmarkIntelligenceExecution),
  ];

  const failureCount = executionSummaries.filter((executionSummary) => {
    if (executionSummary.parseError) {
      return true;
    }

    if (typeof executionSummary.passed === 'boolean') {
      return executionSummary.passed === false;
    }

    return executionSummary.exitCode !== 0;
  }).length;

  const evidenceBundleReport = {
    generatedAt: new Date().toISOString(),
    reportName: 'benchmark-evidence-bundle',
    phase: 'v2.5.1',
    passed: failureCount === 0,
    failureCount,
    methodology: {
      deterministicRuntime: reproducibilityProfile?.deterministicRuntime || null,
      scenarioCount: Array.isArray(reproducibilityProfile?.scenarios) ? reproducibilityProfile.scenarios.length : 0,
      commandCount: Array.isArray(reproducibilityProfile?.commandExamples) ? reproducibilityProfile.commandExamples.length : 0,
    },
    rerunInstructions: Array.isArray(reproducibilityProfile?.rerunInstructions)
      ? reproducibilityProfile.rerunInstructions
      : [],
    commandExamples: Array.isArray(reproducibilityProfile?.commandExamples)
      ? reproducibilityProfile.commandExamples
      : [],
    rawInputs: {
      scenarios: Array.isArray(reproducibilityProfile?.scenarios) ? reproducibilityProfile.scenarios : [],
      benchmarkThresholds: thresholdConfiguration,
      benchmarkWatchlist: Array.isArray(watchlistConfiguration?.repositories)
        ? watchlistConfiguration.repositories
        : [],
    },
    rubric: buildRubricSummary(thresholdConfiguration, benchmarkIntelligenceExecution.parsedReport),
    outputs: {
      detectionBenchmark: detectionBenchmarkExecution.parsedReport,
      benchmarkGate: benchmarkGateExecution.parsedReport,
      benchmarkIntelligence: benchmarkIntelligenceExecution.parsedReport,
    },
    executions: executionSummaries,
  };

  if (!isStdoutOnlyMode) {
    await fs.writeFile(OUTPUT_PATH, JSON.stringify(evidenceBundleReport, null, 2) + '\n', 'utf8');
  }

  console.log(JSON.stringify(evidenceBundleReport, null, 2));
  process.exit(evidenceBundleReport.passed ? 0 : 1);
}

runBenchmarkEvidenceBundle();
