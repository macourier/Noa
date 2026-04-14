# Responsive Delivery

Tier: ADVANCE

Responsive delivery is not just resizing components. It defines how information hierarchy, interaction ergonomics, and loading behavior adapt across screen classes.

## Breakpoint Contract

Define a small set of supported breakpoints and explicitly map each critical screen to layout behavior:

- Mobile baseline for primary one-handed flows.
- Tablet landscape/portrait handling for mixed navigation density.
- Desktop behavior for dense data views and power-user shortcuts.

## Hierarchy and Readability

- Keep primary value proposition and main action in first viewport.
- Promote one primary CTA and one secondary CTA at most on conversion screens.
- Prevent layout shift when optional content loads asynchronously.
- Keep typography scaling consistent with design tokens.

## Interaction Ergonomics

- Maintain touch target minimum sizes for mobile.
- Preserve keyboard navigability on desktop and tablet keyboard scenarios.
- Avoid hover-only critical interactions.
- Ensure sticky bars and bottom sheets do not hide required form controls.

## Validation Workflow

1. Capture screenshots for each breakpoint from the same scenario.
2. Execute keyboard and pointer flow checks on critical journeys.
3. Verify loading, empty, and error states for each breakpoint class.
4. Attach responsive evidence to release artifact bundle.

## Review Checklist

- [ ] Breakpoint behavior is documented per critical screen.
- [ ] Primary CTA remains clear on all supported viewports.
- [ ] Touch and keyboard interactions are both functional.
- [ ] Loading and error states preserve layout stability.
