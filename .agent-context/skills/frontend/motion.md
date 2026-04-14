# Motion Design and Implementation

Tier: EXPERT

Motion is part of product behavior. It should clarify state changes, guide focus, and provide feedback without reducing accessibility or performance.

## Motion Intent Model

Use motion only for one of these intents:
- Transition intent: communicate screen or state transition.
- Feedback intent: confirm user action success/failure.
- Focus intent: direct attention to newly relevant content.

If a transition has no intent, remove it.

## Timing and Consistency

Adopt a small timing scale and reuse it across the product:
- Fast: 120ms for micro-feedback.
- Standard: 200ms to 260ms for component transitions.
- Slow: 320ms to 420ms for route transitions.

Avoid mixing unrelated easing curves in one flow.

## Performance-Safe Animation Rules

Prefer animating properties that do not trigger expensive layout and paint work:
- Preferred: transform, opacity.
- Avoid for frequent animation: top, left, width, height, box-shadow blur radius.

Use CSS containment and selective `will-change` only for elements that actually animate.

## Reduced Motion Compliance

Always implement reduced-motion fallback:

```css
.panel {
	transition: transform 220ms ease, opacity 220ms ease;
}

@media (prefers-reduced-motion: reduce) {
	.panel {
		transition: none;
	}
}
```

## Interaction Patterns

Recommended patterns:
- Enter/exit fade + translate for dialogs.
- Staggered list reveal for scannability on load.
- Subtle press/hover feedback for actionable controls.

Avoid these patterns:
- Continuous decorative motion on primary content.
- Multiple competing animations in one viewport.
- Looping movement that can distract reading flow.

## Review Checklist

- [ ] Every animation has explicit product intent.
- [ ] Timing scale is consistent across components.
- [ ] Heavy layout-triggering properties are avoided.
- [ ] Reduced-motion mode is implemented and tested.
- [ ] Motion does not block keyboard or screen-reader flow.