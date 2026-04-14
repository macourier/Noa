#!/usr/bin/env node

/**
 * token-optimization-benchmark.mjs
 *
 * Measures token-estimate reduction between baseline commands and
 * native optimized command variants. If RTK is installed, it also
 * compares RTK command output in the same scenarios.
 */

import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(SCRIPT_FILE_PATH);
const REPOSITORY_ROOT = resolve(SCRIPT_DIR, '..');
const REPORT_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'token-optimization-benchmark.json');
const LOCAL_RTK_BINARY_PATH = join(REPOSITORY_ROOT, '.benchmarks', 'tools', 'rtk', 'rtk.exe');
const TOKEN_ESTIMATE_DIVISOR = 4;
const ARGUMENT_FLAGS = new Set(process.argv.slice(2));
const isStdoutOnlyMode = ARGUMENT_FLAGS.has('--stdout-only');

const BENCHMARK_SCENARIOS = [
  {
    scenarioId: 'git-show',
    scenarioName: 'Latest commit detail review',
    baselineCommand: { command: 'git', args: ['show', 'HEAD', '--stat', '--patch', '--no-color'] },
    nativeOptimizedCommand: { command: 'git', args: ['show', 'HEAD', '--stat', '--no-color'] },
    rtkCommand: { command: 'rtk', args: ['git', 'show', 'HEAD', '--stat', '--patch', '--no-color'] },
  },
  {
    scenarioId: 'git-log',
    scenarioName: 'Commit history review',
    baselineCommand: { command: 'git', args: ['log', '-n', '50'] },
    nativeOptimizedCommand: { command: 'git', args: ['log', '--oneline', '-n', '50'] },
    rtkCommand: { command: 'rtk', args: ['git', 'log', '-n', '50'] },
  },
  {
    scenarioId: 'search-token',
    scenarioName: 'Search result scan',
    baselineCommand: { command: 'git', args: ['grep', '-n', 'token'] },
    nativeOptimizedCommand: { command: 'git', args: ['grep', '-n', 'token', 'README.md', 'docs'] },
    rtkCommand: { command: 'rtk', args: ['git', 'grep', '-n', 'token'] },
  },
];

function estimateTokenCount(outputText) {
  if (!outputText || outputText.length === 0) {
    return 0;
  }

  return Math.ceil(outputText.length / TOKEN_ESTIMATE_DIVISOR);
}

function formatCommandLine(commandDefinition) {
  return [commandDefinition.command, ...commandDefinition.args].join(' ');
}

function executeCommand(commandDefinition) {
  const commandResult = spawnSync(commandDefinition.command, commandDefinition.args, {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 20,
  });

  const standardOutput = commandResult.stdout || '';
  const standardError = commandResult.stderr || '';
  const combinedOutput = `${standardOutput}${standardError}`;
  const normalizedOutput = combinedOutput.trimEnd();

  const outputLineCount = normalizedOutput.length === 0
    ? 0
    : normalizedOutput.split(/\r?\n/u).length;

  return {
    command: formatCommandLine(commandDefinition),
    exitCode: typeof commandResult.status === 'number' ? commandResult.status : 1,
    outputChars: normalizedOutput.length,
    outputLines: outputLineCount,
    estimatedTokens: estimateTokenCount(normalizedOutput),
  };
}

function resolveRtkBinaryPath() {
  const configuredRtkBinaryPath = process.env.RTK_BINARY_PATH;

  if (configuredRtkBinaryPath && existsSync(configuredRtkBinaryPath)) {
    return {
      executablePath: configuredRtkBinaryPath,
      source: 'env',
    };
  }

  if (existsSync(LOCAL_RTK_BINARY_PATH)) {
    return {
      executablePath: LOCAL_RTK_BINARY_PATH,
      source: 'local-tools',
    };
  }

  return {
    executablePath: 'rtk',
    source: 'system-path',
  };
}

function detectRtkAvailability() {
  const rtkBinary = resolveRtkBinaryPath();

  const versionResult = spawnSync(rtkBinary.executablePath, ['--version'], {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024,
  });

  if (versionResult.error || versionResult.status !== 0) {
    return {
      isAvailable: false,
      version: null,
      source: rtkBinary.source,
      executablePath: rtkBinary.executablePath,
      reason: versionResult.error
        ? versionResult.error.message
        : (versionResult.stderr || versionResult.stdout || 'RTK command unavailable').trim(),
    };
  }

  const versionMatch = (versionResult.stdout || '').match(/\d+\.\d+\.\d+/u);
  return {
    isAvailable: true,
    version: versionMatch ? versionMatch[0] : null,
    source: rtkBinary.source,
    executablePath: rtkBinary.executablePath,
    reason: null,
  };
}

function buildRtkCommand(commandDefinition, rtkAvailability) {
  return {
    command: rtkAvailability.executablePath || commandDefinition.command,
    args: commandDefinition.args,
  };
}

function computeSavingsSummary(baselineTokens, optimizedTokens) {
  if (baselineTokens <= 0) {
    return {
      tokenDelta: 0,
      savingsPercent: 0,
    };
  }

  const tokenDelta = baselineTokens - optimizedTokens;
  const savingsPercent = Number(((tokenDelta / baselineTokens) * 100).toFixed(2));

  return {
    tokenDelta,
    savingsPercent,
  };
}

function calculateAverageSavings(benchmarkRows, savingsKeyName) {
  const availableSavings = benchmarkRows
    .map((benchmarkRow) => benchmarkRow[savingsKeyName]?.savingsPercent)
    .filter((savingsPercent) => typeof savingsPercent === 'number');

  if (availableSavings.length === 0) {
    return null;
  }

  const totalSavings = availableSavings.reduce((runningTotal, savingsPercent) => runningTotal + savingsPercent, 0);
  return Number((totalSavings / availableSavings.length).toFixed(2));
}

async function runTokenOptimizationBenchmark() {
  const rtkAvailability = detectRtkAvailability();
  const scenarioResults = [];

  for (const benchmarkScenario of BENCHMARK_SCENARIOS) {
    const baselineRun = executeCommand(benchmarkScenario.baselineCommand);
    const nativeOptimizedRun = executeCommand(benchmarkScenario.nativeOptimizedCommand);
    const nativeSavings = computeSavingsSummary(
      baselineRun.estimatedTokens,
      nativeOptimizedRun.estimatedTokens
    );

    let rtkRun = null;
    let rtkSavings = null;

    if (rtkAvailability.isAvailable) {
      rtkRun = executeCommand(buildRtkCommand(benchmarkScenario.rtkCommand, rtkAvailability));
      if (rtkRun.exitCode === 0) {
        rtkSavings = computeSavingsSummary(baselineRun.estimatedTokens, rtkRun.estimatedTokens);
      }
    }

    scenarioResults.push({
      scenarioId: benchmarkScenario.scenarioId,
      scenarioName: benchmarkScenario.scenarioName,
      baseline: baselineRun,
      nativeOptimized: nativeOptimizedRun,
      nativeSavings,
      rtk: rtkRun,
      rtkSavings,
    });
  }

  const benchmarkReport = {
    generatedAt: new Date().toISOString(),
    reportName: 'token-optimization-benchmark',
    methodology: {
      tokenEstimate: `estimated_tokens = ceil(output_chars / ${TOKEN_ESTIMATE_DIVISOR})`,
      scope: 'command-output estimate only; model-specific tokenization differs by provider',
      repositoryRoot: REPOSITORY_ROOT,
    },
    environment: {
      nodeVersion: process.version,
      platform: process.platform,
      rtk: rtkAvailability,
    },
    scenarios: scenarioResults,
    summary: {
      scenarioCount: scenarioResults.length,
      averageNativeSavingsPercent: calculateAverageSavings(scenarioResults, 'nativeSavings'),
      averageRtkSavingsPercent: calculateAverageSavings(scenarioResults, 'rtkSavings'),
    },
    artifact: {
      path: REPORT_PATH,
      writeMode: isStdoutOnlyMode ? 'stdout-only' : 'stdout-and-file',
    },
  };

  if (!isStdoutOnlyMode) {
    await fs.mkdir(dirname(REPORT_PATH), { recursive: true });
    await fs.writeFile(REPORT_PATH, JSON.stringify(benchmarkReport, null, 2) + '\n', 'utf8');
  }

  return benchmarkReport;
}

runTokenOptimizationBenchmark()
  .then((benchmarkReport) => {
    console.log(JSON.stringify(benchmarkReport, null, 2));
  })
  .catch((benchmarkError) => {
    const errorMessage = benchmarkError instanceof Error ? benchmarkError.message : String(benchmarkError);
    console.error(`Token benchmark failed: ${errorMessage}`);
    process.exit(1);
  });
