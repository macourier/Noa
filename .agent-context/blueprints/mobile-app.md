# Mobile App Blueprint

This blueprint defines a production starter for mobile products that need strict separation between UI flow, device integration, offline behavior, and backend contracts.

## Reference Architecture

Use a three-layer mobile module boundary:

- Transport layer: navigation routes, deep links, push notification handlers, platform lifecycle hooks.
- Service layer: screen orchestration, input validation, business workflows, permission policy decisions.
- Repository layer: API clients, local persistence, cache synchronization, device adapter wrappers.

## Suggested Structure

```text
mobile/
	app/
		navigation/
		screens/
		feature-flags/
	features/
		checkout/
			ui/
			service/
			repository/
			contracts/
			tests/
			index.ts
		account/
			ui/
			service/
			repository/
			contracts/
			tests/
			index.ts
	shared/
		design-tokens/
		telemetry/
		error-boundaries/
		accessibility/
```

## State and Data Rules

- Keep transient UI state local to the screen component.
- Keep feature workflow state in service-level orchestrators.
- Keep remote and local synchronization logic in repository adapters.
- Enforce idempotent retry semantics for background sync and push-triggered refresh.

## Device and Platform Boundaries

- Wrap native modules behind explicit interfaces.
- Keep iOS/Android-specific behavior in adapter files, not in feature UI components.
- Centralize permission checks for camera, location, notifications, and storage.
- Define fallback behavior for denied permissions before QA sign-off.

## Offline and Failure Handling

- Define offline-first behavior per feature (read-only, queued writes, or blocked operations).
- Persist pending mutations with retry metadata.
- Show explicit user-facing recovery actions for network and permission failures.
- Log mobile crash context with feature name, operation, and user impact summary.

## Testing Baseline

- Unit tests: service decisions, validation, and adapter boundary behavior.
- Integration tests: repository sync logic with mocked device/network behavior.
- End-to-end tests: critical journeys (login, primary conversion flow, error recovery path).
- Accessibility checks: screen reader labels, focus order, and reduced-motion behavior.

## Release Governance

Before shipping each mobile release candidate:

- Verify signing and packaging pipeline integrity.
- Verify crash-free session and startup stability thresholds.
- Verify telemetry/analytics payload schema compatibility.
- Verify rollback strategy for binary release and remote config toggles.

## Recommended Stack Pairings

- React Native for teams that want JavaScript or TypeScript alignment and shared web hiring pool.
- Flutter for teams that want consistent rendering across platforms and widget-driven architecture.

## Blueprint Checklist

- [ ] Feature boundaries are modular and explicit.
- [ ] Device adapters are isolated from UI rendering code.
- [ ] Offline and permission failure behavior is documented.
- [ ] Critical mobile journeys are covered by automated tests.
- [ ] Release package and telemetry gates are enforced before ship.
