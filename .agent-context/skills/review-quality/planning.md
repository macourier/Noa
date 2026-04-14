# Planning

Tier: EXPERT

Planning quality determines implementation quality. Non-trivial work should start with a scoped, testable plan.

## Planning Standard

- Define objective, scope, and non-goals.
- Identify architecture boundaries affected.
- Document risk, rollback, and validation strategy.
- Break work into reviewable increments.

## Required Plan Artifacts

- Implementation steps with expected output.
- File impact map.
- Test strategy and acceptance criteria.
- Migration notes if behavior changes.

## Scope Control

- Avoid unrelated refactors in feature commits.
- Split high-risk work into isolated checkpoints.
- Preserve public API compatibility unless explicitly versioned.

## Evidence Discipline

- Attach command output for validation and test evidence.
- Keep assumption logs explicit so reviewers can challenge unknowns early.
- Ensure rollback path is documented before implementation starts.

## Review Checklist

- [ ] Plan includes explicit success criteria.
- [ ] Risks and mitigations are documented.
- [ ] Validation commands are defined.
- [ ] Scope remains aligned with original objective.