# Frontend Performance Engineering

Tier: EXPERT

Performance work should be evidence-driven. Start with baseline metrics, optimize where bottlenecks are proven, then verify that user-facing indicators improved.

## Core Metrics

Track Core Web Vitals in CI and release checks:
- LCP target: less than 2.5s on reference environments.
- INP target: less than 200ms.
- CLS target: less than 0.1.

Also track bundle size and script execution time for key routes.

## Render Efficiency

Common controls:
- Keep expensive computation outside render path with memoization.
- Use stable callbacks for memoized child components.
- Split large component trees by feature boundary.

```javascript
const visibleRows = useMemo(() => {
	return allRows.filter((row) => row.isVisible);
}, [allRows]);

const handleRowOpen = useCallback((rowId) => {
	openRowDetails(rowId);
}, [openRowDetails]);
```

## Network and Caching Strategy

- Treat server state separately from UI state.
- Use query caching with explicit stale policies.
- Avoid duplicate API calls by keying requests consistently.

For route transitions, prefetch data for likely next navigation paths.

## Bundle Governance

Use route and component-level code splitting:
- Lazy-load non-critical routes.
- Defer optional heavy modules until needed.
- Audit bundle growth at each release.

Set a budget and fail CI on unapproved bundle-size regressions.

## Diagnostics Workflow

1. Capture baseline profile and web-vitals report.
2. Apply one optimization change.
3. Re-profile and compare deltas.
4. Keep only changes with measurable improvement.

## Review Checklist

- [ ] Core metrics targets are monitored and reported.
- [ ] Render-heavy paths are profiled with tooling evidence.
- [ ] Data fetching uses cache and deduplication strategy.
- [ ] Bundle-size budget is defined and enforced.
- [ ] Performance regressions are blocked until reviewed.