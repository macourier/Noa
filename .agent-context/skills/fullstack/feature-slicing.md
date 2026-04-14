# Feature Slicing

Tier: ADVANCE

Feature slicing organizes implementation around business capabilities instead of technical file types. A single feature owns its UI, service orchestration, persistence adapters, and tests.

## Why It Matters

- Improves ownership: one team can ship and maintain a feature end to end.
- Reduces coupling: changes stay local to one capability.
- Speeds delivery: less coordination across unrelated folders.

## Recommended Layout

```text
src/
	features/
		checkout/
			ui/
			service/
			repository/
			contracts/
			tests/
			index.ts
		orders/
			ui/
			service/
			repository/
			contracts/
			tests/
			index.ts
```

## Module Boundary Rules

- Expose only through `index.ts` as the feature public API.
- Do not import private files across feature folders.
- Keep shared utilities in a neutral shared module; avoid feature-to-feature deep imports.

## Anti-Patterns

Bad:
- `src/components`, `src/services`, `src/repositories` global buckets for all features.
- Shared folder becoming a dumping ground for feature-specific code.
- One feature mutating another feature's database entities directly.

Good:
- Feature package exposes explicit use-cases and UI entrypoints.
- Cross-feature communication uses contracts and events.
- Shared module limited to stateless primitives and infrastructure adapters.

## Integration Workflow

1. Define capability and boundary (example: checkout).
2. Define public API for the feature module.
3. Implement UI and service logic inside the feature.
4. Add repository and contract definitions.
5. Add unit/integration/end-to-end tests within the feature.

## Review Checklist

- [ ] Feature can be understood without reading unrelated modules.
- [ ] No deep import across feature boundaries.
- [ ] Public API is explicit and stable.
- [ ] Tests live with the feature and cover core behavior.