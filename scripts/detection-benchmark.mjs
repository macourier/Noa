#!/usr/bin/env node

/**
 * detection-benchmark.mjs
 *
 * Lightweight benchmark for stack detection heuristics used by the CLI.
 * Publishes top-1 accuracy and manual-correction-rate proxy.
 */

const BLUEPRINT_RECOMMENDATIONS = {
  'typescript.md': 'api-nextjs.md',
  'python.md': 'fastapi-service.md',
  'java.md': 'spring-boot-api.md',
  'php.md': 'laravel-api.md',
  'go.md': 'go-service.md',
  'csharp.md': 'aspnet-api.md',
};

const AMBIGUITY_THRESHOLD = 0.08;

const BENCHMARK_FIXTURES = [
  { fixtureName: 'typescript-basic', markers: ['package.json', 'tsconfig.json'], expectedStack: 'typescript.md' },
  { fixtureName: 'typescript-next', markers: ['package.json', 'tsconfig.json', 'next.config.js'], expectedStack: 'typescript.md' },
  { fixtureName: 'python-poetry', markers: ['pyproject.toml'], expectedStack: 'python.md' },
  { fixtureName: 'python-requirements', markers: ['requirements.txt'], expectedStack: 'python.md' },
  { fixtureName: 'java-maven', markers: ['pom.xml'], expectedStack: 'java.md' },
  { fixtureName: 'java-gradle', markers: ['build.gradle'], expectedStack: 'java.md' },
  { fixtureName: 'php-composer', markers: ['composer.json'], expectedStack: 'php.md' },
  { fixtureName: 'go-module', markers: ['go.mod'], expectedStack: 'go.md' },
  { fixtureName: 'dotnet-solution', markers: ['app.sln'], expectedStack: 'csharp.md' },
  { fixtureName: 'rust-cargo', markers: ['Cargo.toml'], expectedStack: 'rust.md' },
  { fixtureName: 'ruby-gemfile', markers: ['Gemfile'], expectedStack: 'ruby.md' },
  { fixtureName: 'mixed-ts-python', markers: ['package.json', 'tsconfig.json', 'pyproject.toml'], expectedStack: 'typescript.md' },
];

function detectProjectFromMarkers(markers) {
  const markerNames = new Set(markers);
  const candidates = [];

  if (markerNames.has('package.json') || markerNames.has('tsconfig.json') || markerNames.has('next.config.js') || markerNames.has('next.config.mjs')) {
    let confidenceScore = 0.7;
    if (markerNames.has('package.json')) confidenceScore += 0.12;
    if (markerNames.has('tsconfig.json')) confidenceScore += 0.12;
    if (markerNames.has('next.config.js') || markerNames.has('next.config.mjs')) confidenceScore += 0.05;
    candidates.push({ stackFileName: 'typescript.md', confidenceScore: Math.min(confidenceScore, 0.97) });
  }

  if (markerNames.has('pyproject.toml') || markerNames.has('requirements.txt')) {
    candidates.push({
      stackFileName: 'python.md',
      confidenceScore: markerNames.has('pyproject.toml') ? 0.96 : 0.78,
    });
  }

  if (markerNames.has('pom.xml') || markerNames.has('build.gradle') || markerNames.has('build.gradle.kts')) {
    candidates.push({
      stackFileName: 'java.md',
      confidenceScore: markerNames.has('pom.xml') ? 0.95 : 0.84,
    });
  }

  if (markerNames.has('composer.json')) candidates.push({ stackFileName: 'php.md', confidenceScore: 0.95 });
  if (markerNames.has('go.mod')) candidates.push({ stackFileName: 'go.md', confidenceScore: 0.96 });
  if (markerNames.has('Cargo.toml')) candidates.push({ stackFileName: 'rust.md', confidenceScore: 0.96 });
  if (markerNames.has('Gemfile')) candidates.push({ stackFileName: 'ruby.md', confidenceScore: 0.95 });

  const hasDotNetMarker = Array.from(markerNames).some((markerName) => markerName.endsWith('.sln') || markerName.endsWith('.csproj'));
  if (hasDotNetMarker) {
    candidates.push({ stackFileName: 'csharp.md', confidenceScore: 0.95 });
  }

  if (candidates.length === 0) {
    return {
      recommendedStack: null,
      recommendedBlueprint: null,
      confidenceScore: 0,
      confidenceGap: 0,
      needsManualCorrection: true,
    };
  }

  candidates.sort((leftCandidate, rightCandidate) => rightCandidate.confidenceScore - leftCandidate.confidenceScore);
  const strongestCandidate = candidates[0];
  const secondStrongestCandidate = candidates[1];
  const confidenceGap = secondStrongestCandidate
    ? Number((strongestCandidate.confidenceScore - secondStrongestCandidate.confidenceScore).toFixed(2))
    : Number(strongestCandidate.confidenceScore.toFixed(2));

  return {
    recommendedStack: strongestCandidate.stackFileName,
    recommendedBlueprint: BLUEPRINT_RECOMMENDATIONS[strongestCandidate.stackFileName] || null,
    confidenceScore: strongestCandidate.confidenceScore,
    confidenceGap,
    needsManualCorrection: confidenceGap < AMBIGUITY_THRESHOLD,
  };
}

function runBenchmark() {
  let passingFixtureCount = 0;
  let manualCorrectionCount = 0;

  const fixtureResults = BENCHMARK_FIXTURES.map((benchmarkFixture) => {
    const detectionResult = detectProjectFromMarkers(benchmarkFixture.markers);
    const isCorrect = detectionResult.recommendedStack === benchmarkFixture.expectedStack;

    if (isCorrect) {
      passingFixtureCount += 1;
    }

    if (detectionResult.needsManualCorrection) {
      manualCorrectionCount += 1;
    }

    return {
      fixtureName: benchmarkFixture.fixtureName,
      expectedStack: benchmarkFixture.expectedStack,
      detectedStack: detectionResult.recommendedStack,
      confidenceGap: detectionResult.confidenceGap,
      needsManualCorrection: detectionResult.needsManualCorrection,
      isCorrect,
    };
  });

  const totalFixtureCount = BENCHMARK_FIXTURES.length;
  const top1Accuracy = Number((passingFixtureCount / totalFixtureCount).toFixed(4));
  const manualCorrectionRate = Number((manualCorrectionCount / totalFixtureCount).toFixed(4));

  return {
    generatedAt: new Date().toISOString(),
    fixtureCount: totalFixtureCount,
    top1Accuracy,
    manualCorrectionRate,
    fixtures: fixtureResults,
  };
}

const benchmarkResult = runBenchmark();
console.log(JSON.stringify(benchmarkResult, null, 2));
