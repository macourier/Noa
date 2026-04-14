# Fullstack Engineering Skills

Default tier: `advance`

This domain connects frontend and backend implementation into a single feature-delivery workflow. The guidance combines architecture patterns from awesome-copilot, operational checklists from MiniMax, and practical delivery patterns from antigravity.

## Topics
- [Feature Slicing](feature-slicing.md) - Organize UI, service, repository, and tests around one business capability
- [Contracts](contracts.md) - Keep API schemas, DTOs, and frontend types synchronized
- [End-to-End](end-to-end.md) - Release readiness by verified user journeys and operational gates
- [Release Coordination](release-coordination.md) - Multi-service rollout ordering, rollback thresholds, and evidence handoff

## Operating Model
- Use `advance` for normal feature development.
- Escalate to `expert` when a feature crosses multiple bounded contexts or service boundaries.

## Above-Line Additions
- Contract drift detection in CI before merge.
- Backward-compatibility checks for API changes.
- Release evidence bundle for end-to-end readiness.

## Usage Example

```bash
agentic-senior-core init --preset fullstack-product
node ./scripts/quality-trend-report.mjs
```