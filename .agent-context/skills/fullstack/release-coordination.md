# Release Coordination

Tier: EXPERT

Release coordination in fullstack systems aligns UI rollout, API compatibility, data migration timing, and rollback readiness across teams.

## Coordination Matrix

Define a shared release matrix before merge:

- Frontend deployment window and feature-flag activation point.
- Backend deployment order and compatibility grace period.
- Data migration execution and rollback scope.
- Observability checks required for release acceptance.

## Rollout Sequencing

Use an order that preserves backward compatibility:

1. Deploy backend changes in compatibility mode.
2. Verify contract and benchmark gates.
3. Deploy frontend consuming new contract.
4. Enable feature flags progressively.
5. Remove compatibility shim in a later release.

## Blocker Handling

Track blocker categories with explicit owners:

- Contract mismatch blockers.
- Performance regression blockers.
- Accessibility or conversion regression blockers.
- Migration and rollback uncertainty blockers.

A release can proceed only when blocker list is empty or risk acceptance is approved and documented.

## Evidence Handoff

Release evidence bundle should include:

- End-to-end report for critical journeys.
- Contract validation and diff summary.
- Benchmark and quality-trend snapshot.
- Rollback drill or recovery playbook reference.

## Review Checklist

- [ ] Rollout sequence keeps consumer/provider compatibility.
- [ ] Blockers have owner and due date before release review.
- [ ] Feature flags are mapped to rollback strategy.
- [ ] Evidence bundle is attached to release decision.
