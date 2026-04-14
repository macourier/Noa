# React Native Stack

Use this stack for cross-platform mobile applications built with React Native.

## Core Guidance

- Keep the app shell thin and delegate data fetching to dedicated service modules.
- Treat navigation, device integration, and UI composition as separate concerns.
- Prefer typed API contracts and isolate platform-specific code behind adapters.
- Keep release gating strict because mobile packaging failures are expensive to recover from.

## Recommended Pairings

- `mobile-app` blueprint for the starter architecture.
- `frontend` skill domain for UI composition, accessibility, and motion guidance.
- `fullstack` skill domain when the app depends on backend contract orchestration.
