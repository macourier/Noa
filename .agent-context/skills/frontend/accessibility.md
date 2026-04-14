# Accessibility and Inclusive Interaction

**Tier:** EXPERT | **Source:** awesome-copilot (WCAG) + minimax (motion and dark mode) + antigravity (UX patterns)

## Purpose

Accessibility is a production requirement. Inclusive interaction reduces support burden, improves usability, and prevents last-minute retrofit work.

## Part 1: Semantic Structure

Use native HTML elements first. They provide keyboard support, roles, and state semantics without extra work.

```javascript
<nav>
  <button aria-expanded={isOpen} aria-controls="menu-panel">Menu</button>
  <ul id="menu-panel" hidden={!isOpen}>
    <li><a href="/">Home</a></li>
    <li><a href="/about">About</a></li>
  </ul>
</nav>
```

Avoid replacing native controls with generic containers unless there is a specific reason.

## Part 2: Keyboard Support

Every interactive control must be reachable and operable by keyboard.

- Tab order should follow the visual order.
- Enter and Space should activate buttons and custom controls.
- Focus should never get trapped unless a modal or dialog deliberately manages it.
- Skip links should exist on content-heavy pages.

```javascript
<div
  role="button"
  tabIndex={0}
  onClick={handleDelete}
  onKeyDown={(event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      handleDelete();
    }
  }}
>
  Delete
</div>
```

## Part 3: Contrast and Text Scaling

- Normal text contrast should meet WCAG AA minimums.
- Large text may use the relaxed large-text ratio, but still needs clear contrast.
- Layouts should survive zoom and text scaling without truncation.
- Avoid fixed-height containers that clip longer translated content.

## Part 4: Screen Reader Support

Use accessible names and state descriptions.

```javascript
<button aria-label="Close menu" onClick={handleClose}>
  X
</button>
```

If content updates dynamically, use live regions only when needed and keep them concise.

## Part 5: Motion and Reduced Motion

Animations should respect reduced-motion settings. Motion must support understanding, not create distraction.

```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const menuVariants = {
  open: {
    opacity: 1,
    transition: prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }
  }
};
```

## Part 6: Forms and Error Messaging

- Every input needs a visible label.
- Error messages should describe the problem and how to fix it.
- Validation should be announced in a way screen readers can reach.
- Do not rely on color alone to communicate state.

## Part 7: Testing Approach

Test accessibility with a mix of manual and automated checks.

- Automated scans for contrast, labels, and roles.
- Keyboard-only navigation passes for critical flows.
- Screen-reader spot checks for key screens.
- Motion tests for reduced-motion behavior.

## Review Checklist

- [ ] Semantic elements are used first.
- [ ] Keyboard operation is complete.
- [ ] Contrast and zoom behavior are acceptable.
- [ ] Accessible names exist for icon-only controls.
- [ ] Reduced-motion behavior is implemented.
- [ ] Form labels and errors are clear.
- [ ] Critical flows are tested with keyboard and screen readers.
