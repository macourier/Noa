# Workflow: Code Review

## Checklist
- [ ] Correctness — Does it do what's intended?
- [ ] Edge cases — Are boundary conditions handled?
- [ ] Error handling — Are failures graceful?
- [ ] Security — No secrets, no injection, proper auth?
- [ ] Performance — No N+1, no unnecessary re-renders?
- [ ] Types — No `any`, proper generics?
- [ ] Tests — Adequate coverage?
- [ ] Naming — Clear, consistent, no abbreviations?
- [ ] Documentation — JSDoc on exports?

## Severity Levels
- 🔴 **Block** — Must fix before merge
- 🟡 **Suggest** — Should fix, not blocking
- 🟢 **Nit** — Style preference, optional
