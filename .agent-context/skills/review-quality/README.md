# Review Quality Skills

Default tier: `expert`

This domain formalizes review quality across planning discipline, security enforcement, and benchmark-driven decision making.

## Topics
- [Planning](planning.md) - Plan quality, scope control, and change strategy
- [Security](security.md) - Critical vulnerability policy and boundary safeguards
- [Benchmarking](benchmark.md) - Regression detection and evidence-based comparison
- [Release Decisioning](release-decision.md) - Explicit readiness verdicts, blocker ownership, and escalation logic

## Operating Model
- Use `expert` for standard review workflows.
- Escalate to `above` for release-critical or governance-sensitive changes.

## Above-Line Additions
- Security halt protocol for critical findings.
- Benchmark gate thresholds integrated in CI.
- Review evidence bundle for auditability.

## Usage Example

```bash
node ./scripts/governance-weekly-report.mjs
node ./scripts/release-gate.mjs
```