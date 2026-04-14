# Workflow: Refactor

## Steps
1. **Classify** — Refactoring is always MEDIUM+ risk
2. **Map impact** — Find all usages of code to refactor
3. **Plan** — Define before/after state clearly
4. **Implement** — Small, verifiable steps
5. **Verify** — Run full test suite after each step
6. **Clean up** — Remove dead code, update imports

## Rules
- Never refactor and add features simultaneously
- Keep tests green at every step
- Update types first, then implementations
- One file/module per commit
