#!/usr/bin/env node

/**
 * benchmark-gate.mjs
 *
 * Anti-regression gate for benchmark quality signals.
 * Fails when benchmark metrics drop below configured thresholds.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(SCRIPT_FILE_PATH);
const REPOSITORY_ROOT = resolve(SCRIPT_DIR, '..');
const BENCHMARK_THRESHOLD_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'benchmark-thresholds.json');
const DETECTION_BENCHMARK_PATH = join(REPOSITORY_ROOT, 'scripts', 'detection-benchmark.mjs');

function readThresholdConfiguration() {
  if (!existsSync(BENCHMARK_THRESHOLD_PATH)) {
    return {
      minimumTop1Accuracy: 0.9,
      maximumManualCorrectionRate: 0.12,
      maximumTop1AccuracyDrop: 0.02,
      maximumManualCorrectionIncrease: 0.03,
      previousReleaseBaseline: {
        top1Accuracy: 0.9167,
        manualCorrectionRate: 0.0833,
      },
    };
  }

  return JSON.parse(readFileSync(BENCHMARK_THRESHOLD_PATH, 'utf8'));
}

function runDetectionBenchmark() {
  const benchmarkRawOutput = execFileSync('node', [DETECTION_BENCHMARK_PATH], {
    cwd: REPOSITORY_ROOT,
    encoding: 'utf8',
  });

  return JSON.parse(benchmarkRawOutput);
}

function buildCheckResult(checkName, passed, details) {
  return {
    checkName,
    passed,
    details,
  };
}

function runBenchmarkGate() {
  const thresholdConfiguration = readThresholdConfiguration();
  const benchmarkResult = runDetectionBenchmark();
  const benchmarkChecks = [];

  const top1AccuracyPassed = benchmarkResult.top1Accuracy >= thresholdConfiguration.minimumTop1Accuracy;
  benchmarkChecks.push(
    buildCheckResult(
      'minimum-top1-accuracy',
      top1AccuracyPassed,
      `top1Accuracy=${benchmarkResult.top1Accuracy} minimum=${thresholdConfiguration.minimumTop1Accuracy}`,
    ),
  );

  const manualCorrectionPassed = benchmarkResult.manualCorrectionRate <= thresholdConfiguration.maximumManualCorrectionRate;
  benchmarkChecks.push(
    buildCheckResult(
      'maximum-manual-correction-rate',
      manualCorrectionPassed,
      `manualCorrectionRate=${benchmarkResult.manualCorrectionRate} maximum=${thresholdConfiguration.maximumManualCorrectionRate}`,
    ),
  );

  const previousReleaseBaseline = thresholdConfiguration.previousReleaseBaseline;
  if (previousReleaseBaseline && typeof previousReleaseBaseline === 'object') {
    const top1AccuracyDrop = Number((previousReleaseBaseline.top1Accuracy - benchmarkResult.top1Accuracy).toFixed(4));
    const manualCorrectionIncrease = Number((benchmarkResult.manualCorrectionRate - previousReleaseBaseline.manualCorrectionRate).toFixed(4));

    const top1AccuracyDropPassed = top1AccuracyDrop <= thresholdConfiguration.maximumTop1AccuracyDrop;
    benchmarkChecks.push(
      buildCheckResult(
        'maximum-top1-accuracy-drop',
        top1AccuracyDropPassed,
        `drop=${top1AccuracyDrop} maximum=${thresholdConfiguration.maximumTop1AccuracyDrop}`,
      ),
    );

    const manualCorrectionIncreasePassed = manualCorrectionIncrease <= thresholdConfiguration.maximumManualCorrectionIncrease;
    benchmarkChecks.push(
      buildCheckResult(
        'maximum-manual-correction-increase',
        manualCorrectionIncreasePassed,
        `increase=${manualCorrectionIncrease} maximum=${thresholdConfiguration.maximumManualCorrectionIncrease}`,
      ),
    );
  }

  const failedCheckCount = benchmarkChecks.filter((benchmarkCheck) => !benchmarkCheck.passed).length;
  const benchmarkGateReport = {
    generatedAt: new Date().toISOString(),
    gateName: 'benchmark-gate',
    passed: failedCheckCount === 0,
    failureCount: failedCheckCount,
    benchmarkResult: {
      fixtureCount: benchmarkResult.fixtureCount,
      top1Accuracy: benchmarkResult.top1Accuracy,
      manualCorrectionRate: benchmarkResult.manualCorrectionRate,
    },
    thresholds: thresholdConfiguration,
    results: benchmarkChecks,
  };

  console.log(JSON.stringify(benchmarkGateReport, null, 2));
  process.exit(benchmarkGateReport.passed ? 0 : 1);
}

runBenchmarkGate();
