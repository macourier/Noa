import { readFileSync, statSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT_DIR = process.cwd();

// Directories to aggressively scan before NPM publish
const SCAN_DIRECTORIES = [
  'lib',
  'bin',
  'scripts',
  '.agent-context'
];

const FORBIDDEN_PATTERNS = [
  {
    name: 'Hardcoded API Key',
    regex: /api_?key\s*[:=]\s*['"][a-zA-Z0-9_\-]{16,}['"]/i,
    suggestion: 'API Keys must be provided via environment variables (process.env) or config files, never hardcoded.'
  },
  {
    name: 'Hardcoded Password',
    regex: /password\s*[:=]\s*['"][^'"]+['"]/i,
    suggestion: 'Passwords must be injected via secret managers or environment variables.'
  },
  {
    name: 'Absolute Local Desktop Path',
    regex: /file:\/\/\/?([c-zC-Z]:|\/Users\/|\/home\/)/,
    suggestion: 'Do not commit local absolute file paths (e.g. file:///C:/Users). Use relative paths or process.cwd().'
  },
  {
    name: 'Stray Breakpoint (debugger)',
    regex: /\bdebugger\s*;?/,
    suggestion: 'Remove debug breakpoints before publishing to production.'
  }
];

function scanFile(filePath) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const violations = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    for (const pattern of FORBIDDEN_PATTERNS) {
      if (pattern.regex.test(line)) {
        violations.push({
          line: i + 1,
          content: line.trim().substring(0, 80), // truncate long lines
          rule: pattern.name,
          suggestion: pattern.suggestion
        });
      }
    }
  }

  return violations;
}

function walkDirectory(dir, filePaths = []) {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        walkDirectory(fullPath, filePaths);
      } else if (entry.isFile()) {
        // Only scan source/docs, exclude markdown as it contains example anti-patterns
        if (/\.(js|mjs|cjs|ts|json|yml|yaml)$/i.test(entry.name) && entry.name !== 'forbidden-content-check.mjs') {
          filePaths.push(fullPath);
        }
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Error reading ${dir}: ${err.message}`);
    }
  }
  return filePaths;
}

async function runCheck() {
  console.log('Scanning for forbidden content (Publish Gate)...\n');

  let totalViolations = 0;
  const filesScanned = [];

  for (const dirName of SCAN_DIRECTORIES) {
    const targetDir = join(ROOT_DIR, dirName);
    const files = walkDirectory(targetDir);

    for (const file of files) {
      filesScanned.push(file);
      const violations = scanFile(file);

      if (violations.length > 0) {
        const relPath = relative(ROOT_DIR, file);
        console.error(`\n❌ FORBIDDEN CONTENT DETECTED IN: ${relPath}`);

        for (const v of violations) {
          console.error(`   Line ${v.line}: [${v.rule}]`);
          console.error(`   > ${v.content}`);
          console.error(`   Action required: ${v.suggestion}`);
          totalViolations++;
        }
      }
    }
  }

  console.log(`\nScanned ${filesScanned.length} files across ${SCAN_DIRECTORIES.length} source directories.`);

  if (totalViolations > 0) {
    console.error(`\n✖ PUBLISH ABORTED: Found ${totalViolations} forbidden content violation(s).`);
    process.exit(1);
  } else {
    console.log('✔ Clean. No forbidden content detected.');
    process.exit(0);
  }
}

runCheck();
