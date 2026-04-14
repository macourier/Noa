# Frontend Usability Checklist — V1.7 Gate

Run this checklist before claiming frontend work is production-ready.

## 1. Visual System
- [ ] Typography scale is consistent and tokenized.
- [ ] Color usage follows design tokens and avoids ad-hoc values.
- [ ] Spacing and layout rhythm is coherent across pages.

## 2. Responsiveness
- [ ] Core pages are usable at mobile, tablet, and desktop breakpoints.
- [ ] Navigation remains accessible and understandable on small screens.
- [ ] No content overlap, clipped text, or horizontal scroll regressions.

## 3. Accessibility
- [ ] Keyboard-only navigation covers all critical user paths.
- [ ] Primary text and actionable controls meet WCAG AA contrast.
- [ ] Reduced-motion mode is respected for non-essential animations.

## 4. Interaction Quality
- [ ] Motion is meaningful, not decorative noise.
- [ ] Loading, empty, and error states are explicitly designed.
- [ ] CTA hierarchy is clear and supports user intent.

## 5. Performance and Stability
- [ ] Lighthouse mobile performance target is met on core pages.
- [ ] No severe layout shift during load and transition.
- [ ] Visual regression checks cover protected pages.

## 6. Documentation and Release Evidence
- [ ] Frontend architecture decision is documented.
- [ ] Visual baseline update process is documented.
- [ ] Release note includes usability and responsiveness evidence.
