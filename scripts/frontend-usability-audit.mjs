#!/usr/bin/env node

/**
 * frontend-usability-audit.mjs
 *
 * Governance-level audit for V1.7 frontend execution assets.
 * This repository does not host a frontend runtime app, so the audit validates
 * required execution artifacts and quality gates documentation.
 */

import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPOSITORY_ROOT = resolve(__dirname, '..');

const REQUIRED_FILES = [
  'docs/roadmap.md',
  'docs/v1.7-issue-breakdown.md',
  'docs/v1.7-execution-playbook.md',
  '.agent-context/review-checklists/frontend-usability.md',
];

const REQUIRED_ROADMAP_SNIPPETS = [
  'V1.7',
  'Frontend Product Experience',
  'Release status: Completed',
  'Delivered Scope',
];

const REQUIRED_CHECKLIST_SNIPPETS = [
  'Responsiveness',
  'Accessibility',
  'Performance',
  'Documentation and Release Evidence',
];

function assertFileExists(relativeFilePath, failures) {
  const absoluteFilePath = resolve(REPOSITORY_ROOT, relativeFilePath);
  if (!existsSync(absoluteFilePath)) {
    failures.push(`Missing required file: ${relativeFilePath}`);
  }
}

function assertContains(contentLabel, filePath, fileContent, snippets, failures) {
  for (const snippetText of snippets) {
    if (!fileContent.includes(snippetText)) {
      failures.push(`${contentLabel} missing snippet "${snippetText}" in ${filePath}`);
    }
  }
}

function runAudit() {
  const failures = [];

  for (const requiredFilePath of REQUIRED_FILES) {
    assertFileExists(requiredFilePath, failures);
  }

  const roadmapPath = 'docs/roadmap.md';
  const checklistPath = '.agent-context/review-checklists/frontend-usability.md';

  if (existsSync(resolve(REPOSITORY_ROOT, roadmapPath))) {
    const roadmapContent = readFileSync(resolve(REPOSITORY_ROOT, roadmapPath), 'utf8');
    assertContains('Roadmap', roadmapPath, roadmapContent, REQUIRED_ROADMAP_SNIPPETS, failures);
  }

  if (existsSync(resolve(REPOSITORY_ROOT, checklistPath))) {
    const checklistContent = readFileSync(resolve(REPOSITORY_ROOT, checklistPath), 'utf8');
    assertContains('Checklist', checklistPath, checklistContent, REQUIRED_CHECKLIST_SNIPPETS, failures);
  }

  const reportPayload = {
    generatedAt: new Date().toISOString(),
    auditName: 'frontend-usability-audit',
    passed: failures.length === 0,
    failureCount: failures.length,
    failures,
  };

  console.log(JSON.stringify(reportPayload, null, 2));
  process.exit(reportPayload.passed ? 0 : 1);
}

runAudit();
