# Component Architecture and State Management

**Tier:** EXPERT | **Source:** awesome-copilot (smart/dumb) + minimax (design systems) + antigravity (React patterns)

## Purpose

UI architecture decides how state, behavior, and presentation are split. Good structure reduces re-render churn, keeps component boundaries stable, and makes features easier to test.

## Part 1: Smart and Dumb Separation

A smart component owns data flow, side effects, and orchestration. A dumb component renders input and emits events.

```javascript
function PaymentFormContainer() {
  const [amount, setAmount] = useState('');
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState(null);

  const handleSubmit = async (submittedAmount) => {
    setStatus('loading');
    try {
      const response = await fetch('/api/payments', {
        method: 'POST',
        body: JSON.stringify({ amount: submittedAmount })
      });

      if (!response.ok) {
        throw new Error('Payment request failed');
      }

      setStatus('success');
    } catch (caughtError) {
      setErrorMessage(caughtError.message);
      setStatus('error');
    }
  };

  return (
    <PaymentFormView
      amount={amount}
      isLoading={status === 'loading'}
      errorMessage={errorMessage}
      onAmountChange={setAmount}
      onSubmit={handleSubmit}
    />
  );
}
```

```javascript
function PaymentFormView({ amount, isLoading, errorMessage, onAmountChange, onSubmit }) {
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSubmit(amount); }}>
      <input
        value={amount}
        onChange={(event) => onAmountChange(event.target.value)}
        disabled={isLoading}
      />
      <button disabled={isLoading}>
        {isLoading ? 'Processing' : 'Pay'}
      </button>
      {errorMessage ? <p>{errorMessage}</p> : null}
    </form>
  );
}
```

## Part 2: State Ownership Rules

Use the smallest useful state scope.

- Local component state: form fields, toggles, ephemeral UI state.
- Shared UI state: theme, sidebar state, modal visibility.
- Server state: remote data, caching, invalidation, refetching.
- Derived state: compute from existing data instead of duplicating it.

Recommended mapping:
- `useState` for local state.
- `Zustand` or context for global UI state.
- `TanStack Query` for server state.
- Avoid context for high-frequency server data when query caching is the better fit.

## Part 3: Composition and Contracts

A component contract should define what it accepts, what it renders, and what events it emits.

```javascript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}
```

Keep public component APIs stable. If the component grows many optional props, split it into smaller feature-specific components instead of adding more flags.

## Part 4: Anti-Patterns

- Prop drilling across many levels.
- Global context for everything.
- Mixing network calls into presentational views.
- Repeating derived values in both state and render.
- Reaching into another feature's internals instead of using the feature public API.

## Part 5: Design System Integration

Design tokens should drive spacing, color, and sizing. Avoid one-off values unless the design system explicitly allows them.

```javascript
const buttonStyles = {
  primary: 'bg-primary text-on-primary',
  secondary: 'bg-surface text-primary',
  danger: 'bg-danger text-on-danger'
};
```

## Review Checklist

- [ ] Smart and dumb layers are separated.
- [ ] State ownership is minimal and deliberate.
- [ ] Server state uses a cache-aware tool.
- [ ] Component contracts are explicit and stable.
- [ ] Feature boundaries are respected.
- [ ] Design tokens are used consistently.
- [ ] Prop drilling does not replace composition or shared state.
