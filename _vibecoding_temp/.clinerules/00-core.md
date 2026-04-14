# Core — Principles

## Pre-validation (mandatory)
Before any file edit:
1. Read the target file and relevant imports
2. Check dependencies (`search_files` if impact uncertain)
3. Confirm the change is bounded

## Reflected Efficiency
- Goal: complete task correctly in minimal back-and-forth **without sacrificing reflection**
- Prefer `replace_in_file` with multiple SEARCH/REPLACE blocks over N separate calls
- If scope exceeds initial request → signal and reclassify (see `01-dispatch.md`)
- When an architecture choice or trade-off arises → briefly explain options and recommend
- Iteration is a blessing: ask for intermediate validation if uncertain about the approach

## Pre-validation before editing
Before modifying an existing file:
1. Read the file via `read_file`
2. Identify imports and dependencies
3. Verify no other file is impacted (otherwise → MEDIUM/HIGH)

## Writing Rules
- Local language for responses and comments
- Code in English (variables, functions, commits)
- Get to the point, but **explain choices** when useful (trade-offs, rejected alternatives, identified risks)

## Anti-patterns
- Never create a file without reading neighboring files
- Never assume file contents — always read them
- Never modify auto-generated files (ex: `package-lock.json`)