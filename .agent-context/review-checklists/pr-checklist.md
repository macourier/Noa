# PR Checklist — The Quality Gate

> Run this before declaring any task "done."
> If ANY item fails, the task is NOT complete.

## Instructions for Agent

When asked to review code using this checklist, evaluate EVERY item below.
For each failed item, provide a Reasoning Chain (see `.cursorrules` → Reasoning Clause).
Output format:

```
## PR REVIEW RESULTS
━━━━━━━━━━━━━━━━━━━

PASS [Item]
FAIL [Item]
   Rule: [rule file + section]
   Problem: [specific issue found]
   Fix: [what to change]

VERDICT: PASS / FAIL (X/Y items passed)
```

---

## The Checklist

### 1. Naming (→ rules/naming-conv.md)
- [ ] All variables are descriptive nouns (no `data`, `temp`, `val`, `x`)
- [ ] All functions start with a verb (no `userData()`, `orderLogic()`)
- [ ] All booleans use `is/has/can/should` prefix
- [ ] Constants use SCREAMING_SNAKE_CASE with unit suffix
- [ ] No single-letter variables (except `i` in classic for-loops)
- [ ] File names follow the project's chosen convention consistently

### 2. Architecture (→ rules/architecture.md)
- [ ] No layer leaks (controllers don't query DB, services don't return HTTP responses)
- [ ] Feature-based file organization (not technical grouping)
- [ ] Dependencies flow inward (transport → service → repository)
- [ ] Module boundaries respected (no reaching into another module's internals)
- [ ] Domain layer has zero external dependencies

### 3. Type Safety (→ stacks/typescript.md)
- [ ] No `any` type anywhere (use `unknown` + narrowing)
- [ ] No `// @ts-ignore` (use `@ts-expect-error` with justification comment)
- [ ] All function return types are explicit
- [ ] Zod schemas validate ALL external input at boundaries
- [ ] Types derived from Zod schemas (single source of truth)

### 4. Error Handling (→ rules/error-handling.md)
- [ ] No empty catch blocks
- [ ] No `catch(e) { console.log(e) }` without re-throw or recovery
- [ ] Typed error classes used (not generic `new Error('...')`)
- [ ] Error responses don't leak internal details to clients
- [ ] Structured logging with context (traceId, userId, action)

### 5. Security (→ rules/security.md)
- [ ] All user input validated at boundaries (Zod/schema)
- [ ] No SQL/command string concatenation with user input
- [ ] No secrets hardcoded in source code
- [ ] Auth checked server-side (not client-side only)
- [ ] Error messages don't reveal internal system details
- [ ] CORS configured (not `*` in production)

### 6. Performance (→ rules/performance.md)
- [ ] No N+1 queries (no queries inside loops)
- [ ] All list queries have LIMIT/pagination
- [ ] No `SELECT *` (only needed columns)
- [ ] No synchronous I/O in async context
- [ ] Cache has documented invalidation strategy (if caching used)

### 7. Testing (→ rules/testing.md)
- [ ] Business logic has unit tests
- [ ] Test names follow `should [behavior] when [condition]`
- [ ] Tests follow AAA pattern (Arrange → Act → Assert)
- [ ] No implementation detail testing (test behavior, not structure)
- [ ] Test data uses factories (no copy-pasted objects)

### 8. Dependencies (→ rules/efficiency-vs-hype.md)
- [ ] No new dependencies added without justification
- [ ] No dependency that replaces < 20 lines of code
- [ ] New packages checked for maintenance health
- [ ] Bundle impact considered (frontend)

### 9. Git (→ rules/git-workflow.md)
- [ ] Commit messages follow Conventional Commits
- [ ] No `console.log` debugging statements
- [ ] No `// TODO` without a linked issue
- [ ] No commented-out code blocks
- [ ] `.env` not committed

### 10. Documentation
- [ ] Scope applied: This applies to documentation, release notes, onboarding text, review summaries, and agent-facing explanations
- [ ] API endpoints have OpenAPI/Swagger documentation
- [ ] Complex business logic has comments explaining WHY
- [ ] Public functions/methods have JSDoc/docstrings
- [ ] README updated if new setup steps required
- [ ] No emoji in formal documentation or review summaries
- [ ] Documentation uses plain English and avoids AI cliches
- [ ] Performance/quality claims include source and timestamp
- [ ] Acronyms are expanded on first use
- [ ] Facts and assumptions are explicitly separated
