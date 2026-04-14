# Workflow: Feature Development

## Steps
1. **Classify** — LOW/MEDIUM/HIGH risk (see `01-dispatch.md`)
2. **Explore** — Read relevant files, understand current state
3. **Plan** — List impacted files and changes (for MEDIUM+)
4. **Implement** — One-shot with `replace_in_file`
5. **Verify** — Run lint, type-check, tests
6. **Document** — Update memory-bank if significant
7. **Deliver** — `attempt_completion`

## Checklist
- [ ] Task classified
- [ ] Files read and understood
- [ ] Changes implemented
- [ ] Lint passes
- [ ] Type-check passes
- [ ] Tests pass
- [ ] Memory bank updated (if needed)
