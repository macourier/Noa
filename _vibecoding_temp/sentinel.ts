#!/usr/bin/env node
/**
 * Sentinel — Self-healing test watcher
 *
 * Spawns vitest --watch, parses failures in real-time,
 * displays structured colored report, re-runs on file save.
 *
 * Usage: npm run heal
 */

import { spawn } from "child_process";

const FATAL = Symbol("fatal");
const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const GRAY = "\x1b[90m";
const BOLD = "\x1b[1m";

interface TestFailure {
  file: string;
  name: string;
  error: string;
}

function parseFailures(raw: string): TestFailure[] {
  const failures: TestFailure[] = [];
  const lines = raw.split("\n");
  let currentFile = "";
  let currentError = "";
  let capturing = false;

  for (const line of lines) {
    if (line.includes("FAIL")) {
      const match = line.match(/FAIL\s+(.+)/);
      if (match) currentFile = match[1].trim();
    }
    if (line.includes("×") || line.includes("✕") || line.includes("✗")) {
      const match = line.match(/[×✕✗]\s+(.+)/);
      if (match) {
        capturing = true;
        currentError = "";
      }
    }
    if (capturing) {
      currentError += line + "\n";
      if (line.includes("Expected") || line.includes("Received") || line.includes("at ")) {
        failures.push({
          file: currentFile,
          name: "test",
          error: currentError.trim(),
        });
        capturing = false;
      }
    }
  }

  return failures;
}

function report(failures: TestFailure[]): void {
  if (failures.length === 0) {
    console.log(`\n${GREEN}${BOLD}✅ All tests passed${RESET}\n`);
    return;
  }

  console.log(`\n${RED}${BOLD}❌ ${failures.length} test(s) failed:${RESET}\n`);
  for (const f of failures) {
    console.log(`  ${RED}●${RESET} ${CYAN}${f.file}${RESET}`);
    console.log(`    ${GRAY}${f.error.split("\n")[0]}${RESET}`);
    console.log();
  }
}

console.log(`${CYAN}${BOLD}🛡️  Sentinel — Self-healing test watcher${RESET}`);
console.log(`${GRAY}Watching for changes... (Ctrl+C to stop)\n${RESET}`);

const proc = spawn("npx", ["vitest", "--watch"], {
  shell: true,
  stdio: ["inherit", "pipe", "pipe"],
});

let buffer = "";

proc.stdout?.on("data", (data: Buffer) => {
  const text = data.toString();
  process.stdout.write(text);
  buffer += text;

  if (text.includes("Tests") || text.includes("Test Files")) {
    const failures = parseFailures(buffer);
    report(failures);
    buffer = "";
  }
});

proc.stderr?.on("data", (data: Buffer) => {
  const text = data.toString();
  if (text.includes("Fatal") || text.includes("Error:")) {
    console.log(`${RED}${BOLD}💥 Fatal error:${RESET} ${text.trim()}`);
  }
});

proc.on("close", (code) => {
  console.log(`\n${YELLOW}Sentinel stopped (code: ${code})${RESET}`);
});
