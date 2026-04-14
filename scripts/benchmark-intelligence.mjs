#!/usr/bin/env node

/**
 * benchmark-intelligence.mjs
 *
 * Competitive intelligence cadence validator.
 * Ensures benchmark watchlist coverage and review freshness.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_FILE_PATH = fileURLToPath(import.meta.url);
const SCRIPT_DIR = dirname(SCRIPT_FILE_PATH);
const REPOSITORY_ROOT = resolve(SCRIPT_DIR, '..');
const WATCHLIST_PATH = join(REPOSITORY_ROOT, '.agent-context', 'state', 'benchmark-watchlist.json');
const REVIEW_SLA_DAYS = 14;
const REQUIRED_BENCHMARK_REPOSITORIES = new Set([
  'sickn33/antigravity-awesome-skills',
  'github/awesome-copilot',
  'MiniMax-AI/skills',
]);

function parseDateOrNull(rawDateValue) {
  if (typeof rawDateValue !== 'string') {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(rawDateValue)) {
    return null;
  }

  const parsedDate = new Date(`${rawDateValue}T00:00:00.000Z`);
  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
}

function calculateAgeInDays(referenceDate, targetDate) {
  const ageInMilliseconds = referenceDate.getTime() - targetDate.getTime();
  return Math.floor(ageInMilliseconds / (1000 * 60 * 60 * 24));
}

function loadWatchlistConfiguration() {
  if (!existsSync(WATCHLIST_PATH)) {
    return { repositories: [] };
  }

  return JSON.parse(readFileSync(WATCHLIST_PATH, 'utf8'));
}

function runIntelligenceValidation() {
  const watchlistConfiguration = loadWatchlistConfiguration();
  const watchlistEntries = Array.isArray(watchlistConfiguration.repositories)
    ? watchlistConfiguration.repositories
    : [];
  const validationResults = [];
  const currentDate = new Date();

  const trackedRepositoryNames = new Set();
  for (const watchlistEntry of watchlistEntries) {
    trackedRepositoryNames.add(watchlistEntry.repository);
  }

  for (const requiredRepositoryName of REQUIRED_BENCHMARK_REPOSITORIES) {
    const hasRequiredRepository = trackedRepositoryNames.has(requiredRepositoryName);
    validationResults.push({
      checkName: 'required-benchmark-repository',
      repository: requiredRepositoryName,
      passed: hasRequiredRepository,
      details: hasRequiredRepository
        ? `${requiredRepositoryName} is present in watchlist`
        : `${requiredRepositoryName} is missing from watchlist`,
    });
  }

  const watchlistReport = watchlistEntries.map((watchlistEntry) => {
    const repositoryName = watchlistEntry.repository;
    const repositoryOwner = watchlistEntry.owner;
    const lastReviewedDate = parseDateOrNull(watchlistEntry.lastReviewedAt);

    const hasOwner = typeof repositoryOwner === 'string' && repositoryOwner.trim().length > 0;
    validationResults.push({
      checkName: 'watchlist-owner-defined',
      repository: repositoryName,
      passed: hasOwner,
      details: hasOwner ? `Owner ${repositoryOwner} is defined` : 'Owner is missing',
    });

    if (!lastReviewedDate) {
      validationResults.push({
        checkName: 'review-date-format',
        repository: repositoryName,
        passed: false,
        details: `Invalid or missing lastReviewedAt: ${String(watchlistEntry.lastReviewedAt)}`,
      });

      return {
        repository: repositoryName,
        owner: repositoryOwner,
        lastReviewedAt: watchlistEntry.lastReviewedAt,
        ageInDays: null,
        stale: true,
      };
    }

    const reviewAgeInDays = calculateAgeInDays(currentDate, lastReviewedDate);
    const reviewWithinSla = reviewAgeInDays <= REVIEW_SLA_DAYS;

    validationResults.push({
      checkName: 'review-sla-compliance',
      repository: repositoryName,
      passed: reviewWithinSla,
      details: `ageInDays=${reviewAgeInDays} slaDays=${REVIEW_SLA_DAYS}`,
    });

    return {
      repository: repositoryName,
      owner: repositoryOwner,
      lastReviewedAt: watchlistEntry.lastReviewedAt,
      ageInDays: reviewAgeInDays,
      stale: !reviewWithinSla,
    };
  });

  const failedCheckCount = validationResults.filter((validationResult) => !validationResult.passed).length;
  const intelligenceReport = {
    generatedAt: new Date().toISOString(),
    reportName: 'benchmark-intelligence',
    passed: failedCheckCount === 0,
    failureCount: failedCheckCount,
    reviewSlaDays: REVIEW_SLA_DAYS,
    watchlist: watchlistReport,
    results: validationResults,
  };

  console.log(JSON.stringify(intelligenceReport, null, 2));
  process.exit(intelligenceReport.passed ? 0 : 1);
}

runIntelligenceValidation();
