#!/usr/bin/env node

/**
 * generate-sbom.mjs
 *
 * Minimal CycloneDX-compatible SBOM for governance CI evidence.
 */

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPOSITORY_ROOT = resolve(__dirname, '..');
const PACKAGE_JSON_PATH = resolve(REPOSITORY_ROOT, 'package.json');

function buildComponents(dependencyGroup, dependencies) {
  return Object.entries(dependencies || {}).map(([dependencyName, dependencyVersion]) => ({
    type: 'library',
    name: dependencyName,
    version: String(dependencyVersion).replace(/^[^\d]*/, ''),
    scope: dependencyGroup,
    purl: `pkg:npm/${dependencyName}@${String(dependencyVersion).replace(/^[^\d]*/, '')}`,
  }));
}

function generateSbom() {
  const packageManifest = JSON.parse(readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  const runtimeComponents = buildComponents('required', packageManifest.dependencies);
  const developmentComponents = buildComponents('optional', packageManifest.devDependencies);
  const allComponents = [...runtimeComponents, ...developmentComponents];

  const sbomPayload = {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    serialNumber: `urn:uuid:${randomUUID()}`,
    version: 1,
    metadata: {
      timestamp: new Date().toISOString(),
      component: {
        type: 'application',
        name: packageManifest.name,
        version: packageManifest.version,
      },
      tools: [
        {
          vendor: 'Agentic-Senior-Core',
          name: 'generate-sbom.mjs',
          version: packageManifest.version,
        },
      ],
    },
    components: allComponents,
  };

  console.log(JSON.stringify(sbomPayload, null, 2));
}

generateSbom();
