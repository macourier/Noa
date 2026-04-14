# Benchmarking

Tier: ADVANCE

Benchmarking should guide release decisions with measurable evidence rather than anecdotal impressions.

## Benchmark Inputs

- Baseline benchmark snapshot.
- Current candidate benchmark output.
- Threshold policy for acceptable deltas.

## Evaluation Rules

- Treat regressions above threshold as release blockers.
- Require owner assignment for all negative deltas.
- Re-run benchmark after remediation to verify recovery.

## Reporting Standard

- Include benchmark summary in release bundle.
- Keep machine-readable JSON output for automation.
- Track trend over time, not only single-run status.

## Review Checklist

- [ ] Baseline and current benchmark are comparable.
- [ ] Threshold policy is applied consistently.
- [ ] Regressions have owner and due date.
- [ ] Reports are archived for audit trail.