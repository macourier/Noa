# Workflow: Debug

## Steps
1. **Reproduce** — Confirm the bug exists
2. **Isolate** — Find the minimal reproduction
3. **Diagnose** — Read code, trace execution, check logs
4. **Fix** — Minimal change to resolve
5. **Verify** — Ensure fix works and no regression
6. **Document** — Add to `episodes.md` if notable

## Tools
- `search_files` — Find relevant code
- `read_file` — Understand implementation
- `execute_command` — Run tests, check logs

## Anti-patterns
- Don't fix symptoms — find root cause
- Don't add complexity — simplify
- Don't skip verification — always test
