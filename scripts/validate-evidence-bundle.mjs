import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Validates the structure and content of an evidence bundle for an artifact.
 * Target artifact directory must be provided as an argument.
 */
export async function validateEvidenceBundle(artifactPath) {
  const evidenceDirPath = path.join(artifactPath, '.evidence');
  
  try {
    const stats = await fs.stat(evidenceDirPath);
    if (!stats.isDirectory()) {
       return { passed: false, error: '.evidence is not a directory' };
    }
  } catch (err) {
    return { passed: false, error: 'Missing .evidence directory' };
  }

  const requiredFiles = [
    'compatibility-manifest.json',
    'test-report.json',
    'sbom-excerpt.json'
  ];

  for (const fileName of requiredFiles) {
    try {
       await fs.stat(path.join(evidenceDirPath, fileName));
    } catch {
       return { passed: false, error: `Missing required evidence file: ${fileName}` };
    }
  }

  // Validate compatibility manifest structure
  try {
     const manifestData = JSON.parse(await fs.readFile(path.join(evidenceDirPath, 'compatibility-manifest.json'), 'utf8'));
     if (!manifestData.ides || !Array.isArray(manifestData.ides)) {
        return { passed: false, error: 'compatibility-manifest.json is missing the "ides" array' };
     }
  } catch (err) {
     return { passed: false, error: `Invalid compatibility-manifest.json: ${err.message}` };
  }

  // Validate test report structure
  try {
     const testReportData = JSON.parse(await fs.readFile(path.join(evidenceDirPath, 'test-report.json'), 'utf8'));
     if (typeof testReportData.passed !== 'boolean' || typeof testReportData.total !== 'number') {
        return { passed: false, error: 'test-report.json must contain boolean "passed" and numeric "total"' };
     }
  } catch (err) {
     return { passed: false, error: `Invalid test-report.json: ${err.message}` };
  }

  return { passed: true, error: null };
}

// Allow CLI usage
if (process.argv[1] && process.argv[1] === new URL(import.meta.url).pathname || process.argv[1] === import.meta.filename) {
    const targetDir = process.argv[2];
    if (!targetDir) {
        console.error('Usage: node validate-evidence-bundle.mjs <target-directory>');
        process.exit(1);
    }
    
    validateEvidenceBundle(path.resolve(targetDir))
        .then(result => {
             if (result.passed) {
                 console.log('[OK] Evidence bundle is valid.');
                 process.exit(0);
             } else {
                 console.error(`[FAIL] Evidence bundle validation failed: ${result.error}`);
                 process.exit(1);
             }
        })
        .catch(console.error);
}
