# End-to-End

Tier: ADVANCE

End-to-end validation is the final quality gate that confirms critical user behavior across UI, API, persistence, and integrations.

## Critical Paths First

Always cover:
- Authentication and session lifecycle.
- Primary revenue path (example: checkout, payment, order completion).
- Error recovery paths (timeouts, retries, invalid input).
- Role-based authorization boundaries.

## Test Strategy

- Unit tests: fast local confidence.
- Integration tests: service and repository behavior.
- End-to-end tests: user-visible workflows in realistic environment.

End-to-end tests should be selective and high signal. Avoid using them to test every internal branch.

## Release Evidence Bundle

For each release candidate, publish:
- End-to-end test report for critical journeys.
- Contract validation report.
- Benchmark delta report for performance-sensitive flows.
- Known risk summary and mitigation owner.

## Failure Policy

- Block release on failed critical journey tests.
- Block release when test environment is inconsistent with target runtime.
- Allow non-critical failures only with explicit risk acceptance and owner.

## Review Checklist

- [ ] Critical user journeys are covered.
- [ ] End-to-end tests run in CI on release candidate.
- [ ] Reports are archived as release artifacts.
- [ ] Failures are triaged with owner and deadline.