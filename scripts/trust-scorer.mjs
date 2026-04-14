import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateEvidenceBundle } from './validate-evidence-bundle.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..');
const TRUST_TIER_SCHEMA_PATH = path.join(REPO_ROOT, '.agent-context', 'marketplace', 'trust-tiers.json');

/**
 * Calculates a 0-100 trust score for a given marketplace artifact directory
 * based on the 4 dimensions defined in trust-tiers.json.
 */
export async function calculateTrustScore(artifactDir) {
   let schemaData;
   try {
       schemaData = JSON.parse(await fs.readFile(TRUST_TIER_SCHEMA_PATH, 'utf8'));
   } catch (err) {
       throw new Error(`Failed to read trust-tiers.json: ${err.message}`);
   }

   const scorecard = schemaData.scorecard;
   const dimensions = {
       documentation: { max: scorecard.dimensions.documentation.weight, score: 0, details: [] },
       tests: { max: scorecard.dimensions.tests.weight, score: 0, details: [] },
       evidence: { max: scorecard.dimensions.evidence.weight, score: 0, details: [] },
       maintenance: { max: scorecard.dimensions.maintenance.weight, score: 0, details: [] }
   };

   // 1. Documentation
   try {
       const readmeContent = await fs.readFile(path.join(artifactDir, 'README.md'), 'utf8');
       const readmeLines = readmeContent.split('\n');
       if (readmeLines.length >= 10) dimensions.documentation.score += 10; else dimensions.documentation.details.push('README too short');
       if (readmeContent.toLowerCase().includes('example') || readmeContent.toLowerCase().includes('usage')) dimensions.documentation.score += 15; else dimensions.documentation.details.push('No examples found');
   } catch (err) {
       dimensions.documentation.details.push('Missing README.md');
   }
   // Cap doc score
   dimensions.documentation.score = Math.min(dimensions.documentation.score, dimensions.documentation.max);

   // 2. Tests
   let hasTestDir = false;
   try {
       const stats = await fs.stat(path.join(artifactDir, 'tests'));
       if (stats.isDirectory()) { hasTestDir = true; dimensions.tests.score += 10; }
   } catch (err) {}
   
   if (!hasTestDir) {
       dimensions.tests.details.push('No tests/ directory');
   } else {
       dimensions.tests.score += 15; // Placeholder for test execution/coverage in a real CI system
   }
   dimensions.tests.score = Math.min(dimensions.tests.score, dimensions.tests.max);

   // 3. Evidence
   const evidenceCheck = await validateEvidenceBundle(artifactDir);
   if (evidenceCheck.passed) {
       dimensions.evidence.score = dimensions.evidence.max;
   } else {
       dimensions.evidence.details.push(evidenceCheck.error);
   }

   // 4. Maintenance
   try {
       await fs.stat(path.join(artifactDir, 'CHANGELOG.md'));
       dimensions.maintenance.score += 15;
   } catch (err) {
       dimensions.maintenance.details.push('Missing CHANGELOG.md');
   }

   try {
       const pkgData = JSON.parse(await fs.readFile(path.join(artifactDir, 'package.json'), 'utf8'));
       if (pkgData.version && pkgData.author) dimensions.maintenance.score += 10;
   } catch (err) {
        // If package.json is missing, it might not be a Node package, so we don't penalize completely,
        // but we deduct slightly.
   }
   dimensions.maintenance.score = Math.min(dimensions.maintenance.score, dimensions.maintenance.max);

   const totalScore = dimensions.documentation.score + 
                      dimensions.tests.score + 
                      dimensions.evidence.score + 
                      dimensions.maintenance.score;

   // Determine tier
   let assignedTier = 'experimental';
   for (const [tierName, def] of Object.entries(schemaData.tiers)) {
       if (tierName !== 'experimental' && totalScore >= def.minimumScore) {
           // verified and community. Verified wins if >= 85
           if (assignedTier === 'community' && tierName === 'verified') assignedTier = 'verified';
           if (assignedTier === 'experimental') assignedTier = tierName;
       }
   }

   return {
       tier: assignedTier,
       score: totalScore,
       dimensions
   };
}

if (process.argv[1] && process.argv[1] === new URL(import.meta.url).pathname || process.argv[1] === import.meta.filename) {
    const targetDir = process.argv[2];
    if (!targetDir) {
        console.error('Usage: node trust-scorer.mjs <target-directory>');
        process.exit(1);
    }
    
    calculateTrustScore(path.resolve(targetDir))
        .then(result => {
             console.log(JSON.stringify(result, null, 2));
        })
        .catch(err => {
             console.error(JSON.stringify({ error: err.message }, null, 2));
             process.exit(1);
        });
}
