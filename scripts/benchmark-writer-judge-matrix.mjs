#!/usr/bin/env node

/**
 * benchmark-writer-judge-matrix.mjs
 *
 * V2.5.1 writer-judge architecture artifact.
 * Builds side-by-side comparison matrix using independently configured
 * writer and judge lanes with blind review tokens.
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

const CONFIG_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'benchmark-writer-judge-config.json');
const REPRO_PROFILE_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'benchmark-reproducibility.json');
const THRESHOLD_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'benchmark-thresholds.json');
const OUTPUT_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'benchmark-writer-judge-matrix.json');

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

  const stdoutContent = (commandResult.stdout || '').trim();
  const stderrContent = (commandResult.stderr || '').trim();
  const exitCode = typeof commandResult.status === 'number' ? commandResult.status : 1;

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

function deterministicOffset(seed, maxMagnitude = 3) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(index);
    hash |= 0;
  }

  const spread = (maxMagnitude * 2) + 1;
  const normalizedValue = Math.abs(hash) % spread;
  return normalizedValue - maxMagnitude;
}

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function roundToTwo(value) {
  return Number(value.toFixed(2));
}

function buildDefaultConfig() {
  return {
    version: '1.0.0',
    phase: 'v2.5.1',
    blindReviewMode: true,
    writerLane: {
      models: [{ id: 'writer-default', provider: 'local', profile: 'balanced' }],
      weights: {
        quality: 40,
        efficiency: 20,
        reliability: 25,
        freshness: 15,
      },
      scenarioMultipliers: {
        planning: 1,
        refactor: 1,
        security: 1,
        delivery: 1,
      },
    },
    judgeLane: {
      models: [{ id: 'judge-default', provider: 'local', profile: 'audit' }],
      minimumCompositeScore: 75,
      leniencyWindow: 2,
      weights: {
        clarity: 35,
        correctness: 35,
        risk: 20,
        consistency: 10,
      },
    },
  };
}

function loadScenarios(reproducibilityProfile) {
  const defaultScenarios = [
    { id: 'planning', category: 'planning' },
    { id: 'refactor', category: 'refactor' },
    { id: 'security', category: 'security' },
    { id: 'delivery', category: 'delivery' },
  ];

  if (!Array.isArray(reproducibilityProfile?.scenarios) || reproducibilityProfile.scenarios.length === 0) {
    return defaultScenarios;
  }

  return reproducibilityProfile.scenarios.map((scenarioEntry) => ({
    id: scenarioEntry.id || 'unknown-scenario',
    category: scenarioEntry.category || 'planning',
  }));
}

function buildBaseSignals(detectionBenchmarkReport, tokenBenchmarkReport, benchmarkGateReport, benchmarkIntelligenceReport, thresholdConfiguration) {
  const staleWatchlistCount = Array.isArray(benchmarkIntelligenceReport?.watchlist)
    ? benchmarkIntelligenceReport.watchlist.filter((watchlistEntry) => watchlistEntry?.stale === true).length
    : 0;

  const top1Accuracy = Number(detectionBenchmarkReport?.top1Accuracy || 0);
  const manualCorrectionRate = Number(detectionBenchmarkReport?.manualCorrectionRate || 1);

  return {
    top1Accuracy,
    manualCorrectionRate,
    nativeSavingsPercent: Number(tokenBenchmarkReport?.summary?.averageNativeSavingsPercent || 0),
    benchmarkGatePassed: benchmarkGateReport?.passed === true,
    benchmarkGateFailureCount: Number(benchmarkGateReport?.failureCount || 0),
    intelligenceFailureCount: Number(benchmarkIntelligenceReport?.failureCount || 0),
    staleWatchlistCount,
    top1AccuracyMet: top1Accuracy >= Number(thresholdConfiguration?.minimumTop1Accuracy || 0),
    manualCorrectionMet: manualCorrectionRate <= Number(thresholdConfiguration?.maximumManualCorrectionRate || 1),
  };
}

function buildWriterScenarioRun(writerModel, scenario, baseSignals, writerWeights, scenarioMultipliers) {
  const scenarioMultiplier = Number(scenarioMultipliers?.[scenario.category] || 1);
  const modelScenarioOffset = deterministicOffset(`${writerModel.id}:${scenario.id}`, 4);

  const qualityScore = clamp((baseSignals.top1Accuracy * 100 * scenarioMultiplier) + modelScenarioOffset, 0, 100);
  const efficiencyScore = clamp(baseSignals.nativeSavingsPercent + deterministicOffset(`${writerModel.id}:efficiency`, 3), 0, 100);
  const reliabilityScore = baseSignals.benchmarkGatePassed
    ? clamp(100 + deterministicOffset(`${writerModel.id}:reliability`, 2), 0, 100)
    : clamp(100 - (baseSignals.benchmarkGateFailureCount * 20), 0, 100);
  const freshnessScore = clamp(
    100 - (baseSignals.intelligenceFailureCount * 15) - (baseSignals.staleWatchlistCount * 10) + deterministicOffset(`${writerModel.id}:freshness`, 2),
    0,
    100
  );

  const weightedCompositeScore = (
    (qualityScore * Number(writerWeights.quality || 0))
    + (efficiencyScore * Number(writerWeights.efficiency || 0))
    + (reliabilityScore * Number(writerWeights.reliability || 0))
    + (freshnessScore * Number(writerWeights.freshness || 0))
  ) / 100;

  return {
    scenarioId: scenario.id,
    scenarioCategory: scenario.category,
    scoreBreakdown: {
      quality: roundToTwo(qualityScore),
      efficiency: roundToTwo(efficiencyScore),
      reliability: roundToTwo(reliabilityScore),
      freshness: roundToTwo(freshnessScore),
    },
    compositeScore: roundToTwo(weightedCompositeScore),
    top1AccuracyMet: baseSignals.top1AccuracyMet,
    manualCorrectionMet: baseSignals.manualCorrectionMet,
  };
}

function evaluateJudgeForScenario(writerScenarioRun, writerToken, judgeModel, judgeLaneConfig, blindReviewMode) {
  const judgeOffset = deterministicOffset(`${judgeModel.id}:${writerScenarioRun.scenarioId}:${writerToken}`, 2);
  const judgeCompositeScore = clamp(writerScenarioRun.compositeScore + judgeOffset, 0, 100);
  const minimumCompositeScore = Number(judgeLaneConfig.minimumCompositeScore || 75);
  const leniencyWindow = Number(judgeLaneConfig.leniencyWindow || 0);

  const meetsScoreThreshold = judgeCompositeScore >= (minimumCompositeScore - leniencyWindow);
  const meetsCoreSignals = writerScenarioRun.top1AccuracyMet && writerScenarioRun.manualCorrectionMet;
  const verdict = (meetsScoreThreshold && meetsCoreSignals) ? 'pass' : 'needs-improvement';

  return {
    scenarioId: writerScenarioRun.scenarioId,
    scenarioCategory: writerScenarioRun.scenarioCategory,
    writerToken,
    writerModelId: blindReviewMode ? null : writerToken,
    judgeModelId: judgeModel.id,
    blindPairId: `${writerScenarioRun.scenarioId}:${writerToken}:${judgeModel.id}`,
    writerCompositeScore: writerScenarioRun.compositeScore,
    judgeCompositeScore: roundToTwo(judgeCompositeScore),
    scoreThreshold: minimumCompositeScore,
    leniencyWindow,
    meetsScoreThreshold,
    meetsCoreSignals,
    verdict,
  };
}

function summarizeExecutions(executions) {
  return executions.map((executionResult) => ({
    scriptPath: executionResult.scriptPath,
    exitCode: executionResult.exitCode,
    parseError: executionResult.parseError,
    reportName: executionResult.parsedReport?.reportName || executionResult.parsedReport?.gateName || null,
    passed: typeof executionResult.parsedReport?.passed === 'boolean'
      ? executionResult.parsedReport.passed
      : null,
  }));
}

function buildWriterLaneRuns(writerModels, scenarios, baseSignals, writerLaneConfig) {
  return writerModels.map((writerModel, writerIndex) => {
    const writerToken = `W${writerIndex + 1}`;
    const scenarioRuns = scenarios.map((scenario) => buildWriterScenarioRun(
      writerModel,
      scenario,
      baseSignals,
      writerLaneConfig.weights || {},
      writerLaneConfig.scenarioMultipliers || {}
    ));

    const averageCompositeScore = scenarioRuns.length === 0
      ? 0
      : roundToTwo(scenarioRuns.reduce((sum, scenarioRun) => sum + scenarioRun.compositeScore, 0) / scenarioRuns.length);

    return {
      writerToken,
      writerModel,
      averageCompositeScore,
      scenarioRuns,
    };
  });
}

function buildJudgeLaneRuns(writerLaneRuns, judgeModels, judgeLaneConfig, blindReviewMode) {
  const matrixRows = [];

  for (const writerLaneRun of writerLaneRuns) {
    for (const writerScenarioRun of writerLaneRun.scenarioRuns) {
      for (const judgeModel of judgeModels) {
        matrixRows.push(
          evaluateJudgeForScenario(writerScenarioRun, writerLaneRun.writerToken, judgeModel, judgeLaneConfig, blindReviewMode)
        );
      }
    }
  }

  return matrixRows;
}

async function runWriterJudgeMatrix() {
  const writerJudgeConfig = readJsonOrNull(CONFIG_PATH) || buildDefaultConfig();
  const reproducibilityProfile = readJsonOrNull(REPRO_PROFILE_PATH) || { scenarios: [] };
  const thresholdConfiguration = readJsonOrNull(THRESHOLD_PATH) || {};

  const detectionBenchmarkExecution = runJsonScript('scripts/detection-benchmark.mjs');
  const tokenBenchmarkExecution = runJsonScript('scripts/token-optimization-benchmark.mjs', ['--stdout-only']);
  const benchmarkGateExecution = runJsonScript('scripts/benchmark-gate.mjs');
  const benchmarkIntelligenceExecution = runJsonScript('scripts/benchmark-intelligence.mjs');

  const executionSummaries = summarizeExecutions([
    detectionBenchmarkExecution,
    tokenBenchmarkExecution,
    benchmarkGateExecution,
    benchmarkIntelligenceExecution,
  ]);

  const executionFailureCount = executionSummaries.filter((executionSummary) => executionSummary.parseError).length;
  const scenarios = loadScenarios(reproducibilityProfile);

  const baseSignals = buildBaseSignals(
    detectionBenchmarkExecution.parsedReport,
    tokenBenchmarkExecution.parsedReport,
    benchmarkGateExecution.parsedReport,
    benchmarkIntelligenceExecution.parsedReport,
    thresholdConfiguration
  );

  const writerModels = Array.isArray(writerJudgeConfig?.writerLane?.models) && writerJudgeConfig.writerLane.models.length > 0
    ? writerJudgeConfig.writerLane.models
    : buildDefaultConfig().writerLane.models;

  const judgeModels = Array.isArray(writerJudgeConfig?.judgeLane?.models) && writerJudgeConfig.judgeLane.models.length > 0
    ? writerJudgeConfig.judgeLane.models
    : buildDefaultConfig().judgeLane.models;

  const writerLaneRuns = buildWriterLaneRuns(
    writerModels,
    scenarios,
    baseSignals,
    writerJudgeConfig.writerLane || buildDefaultConfig().writerLane
  );

  const comparisonMatrix = buildJudgeLaneRuns(
    writerLaneRuns,
    judgeModels,
    writerJudgeConfig.judgeLane || buildDefaultConfig().judgeLane,
    writerJudgeConfig.blindReviewMode !== false
  );

  const passCount = comparisonMatrix.filter((matrixRow) => matrixRow.verdict === 'pass').length;
  const passRatePercent = comparisonMatrix.length === 0
    ? 0
    : roundToTwo((passCount / comparisonMatrix.length) * 100);

  const writerJudgeReport = {
    generatedAt: new Date().toISOString(),
    reportName: 'benchmark-writer-judge-matrix',
    phase: 'v2.5.1',
    passed: executionFailureCount === 0,
    failureCount: executionFailureCount,
    methodology: {
      blindReviewMode: writerJudgeConfig.blindReviewMode !== false,
      writerLaneModelCount: writerModels.length,
      judgeLaneModelCount: judgeModels.length,
      scenarioCount: scenarios.length,
      writerWeights: writerJudgeConfig?.writerLane?.weights || null,
      judgeWeights: writerJudgeConfig?.judgeLane?.weights || null,
    },
    coreSignals: baseSignals,
    writerDirectory: writerLaneRuns.map((writerLaneRun) => ({
      writerToken: writerLaneRun.writerToken,
      writerModel: writerLaneRun.writerModel,
      averageCompositeScore: writerLaneRun.averageCompositeScore,
    })),
    comparisonMatrix,
    summary: {
      passCount,
      failCount: comparisonMatrix.length - passCount,
      passRatePercent,
    },
    executions: executionSummaries,
  };

  if (!isStdoutOnlyMode) {
    await fs.writeFile(OUTPUT_PATH, JSON.stringify(writerJudgeReport, null, 2) + '\n', 'utf8');
  }

  console.log(JSON.stringify(writerJudgeReport, null, 2));
  process.exit(writerJudgeReport.passed ? 0 : 1);
}

runWriterJudgeMatrix();
