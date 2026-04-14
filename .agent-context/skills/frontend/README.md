# Frontend Engineering Skills

The frontend domain covers component architecture, state management, performance optimization, accessibility, motion design, and visual polish. Content consolidated from **minimax-ai/skills** (design focus), **awesome-copilot** (architectural patterns), and **antigravity-awesome-skills** (React patterns), with production-grade automation and enforcement.

## Topics
- [UI Architecture](ui-architecture.md) - Smart/Dumb components, state management, composition patterns
- [Accessibility](accessibility.md) - WCAG compliance, keyboard navigation, semantic HTML, color contrast
- [Motion](motion.md) - Animation patterns, performance, CSS containment
- [Performance](performance.md) - Memoization, code splitting, bundle gates, profiling
- [Responsive Delivery](responsive-delivery.md) - Breakpoint behavior, content hierarchy, and interaction ergonomics
- [Conversion Clarity](conversion-clarity.md) - First-viewport messaging, CTA placement, and friction removal

## What Makes Ours Different

- Smart/Dumb Architecture (awesome-copilot) + animation system patterns (minimax) + React patterns (antigravity)
- Anti-Slop Enforcer (ABOVE LINE) - Detect forbidden visual patterns and style drift
- Accessibility Auditor (ABOVE LINE) - Detect contrast failures, ARIA issues, and keyboard navigation gaps
- Performance Budget Enforcer (ABOVE LINE) - Bundle size gates and LCP/FID/CLS thresholds

## Recommended Reading Order

1. `ui-architecture.md` - Mental models first (EXPERT)
2. `accessibility.md` - Compliance baseline (EXPERT)
3. `motion.md` - Design patterns and optimization (EXPERT)
4. `performance.md` - Profiling and gates (EXPERT)
5. `responsive-delivery.md` - Mobile and desktop behavior contracts (ADVANCE)
6. `conversion-clarity.md` - UX narrative and action path quality (ADVANCE)

## Coverage vs 3 Repos

| Aspect | antigravity | awesome-copilot | MiniMax | Ours |
|--------|-------------|-----------------|---------|------|
| Component Patterns | Medium | High | Medium | High + quality gates |
| Animation Patterns | Low | Low | High | High + performance rules |
| Accessibility | Medium | High | Medium | High + automated audits |
| Automation | None | None | None | Anti-slop, accessibility, and performance tooling |

## Default Tier Behavior
- Use `advance` for typical web apps (1500+ employees)
- Escalate to `expert` when component library, state complexity, or accessibility/performance tuning is critical

## Usage Example

Use frontend guidance in onboarding and release checkpoints:

```bash
agentic-senior-core init --preset frontend-web
node ./scripts/frontend-usability-audit.mjs
```