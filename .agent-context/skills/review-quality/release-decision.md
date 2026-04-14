# Release Decisioning

Tier: EXPERT

Release decisioning converts technical signals into explicit ship, hold, or rollback recommendations with ownership.

## Decision Inputs

Use a standardized input set for every release review:

- Validation and test status.
- Release gate and forbidden-content status.
- Benchmark and quality trend posture.
- Security and architecture findings.
- Trust-tier posture for required skill domains.

## Decision Outcomes

Each review must conclude with one outcome:

- Ship: all mandatory gates pass and no unresolved critical findings.
- Hold: one or more blockers remain unresolved.
- Rollback: post-release signal confirms unacceptable risk or regression.

## Blocker Policy

A blocker record needs:

- Title and category.
- Owner and deadline.
- User impact statement.
- Mitigation and validation command.

No blocker should remain in implicit or undocumented state.

## Escalation Rules

Escalate to maintainers immediately when:

- Critical security issue is detected.
- Gate output becomes inconsistent across environments.
- Rollback readiness cannot be proven.

## Review Checklist

- [ ] Decision outcome is explicit (ship/hold/rollback).
- [ ] Blockers include owner and due date.
- [ ] Validation evidence is attached to decision log.
- [ ] Escalation happened for critical unresolved risks.
