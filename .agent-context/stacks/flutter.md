# Flutter Stack

Use this stack for cross-platform mobile applications built with Flutter.

## Core Guidance

- Keep presentation widgets small and move state orchestration into dedicated controllers or services.
- Separate platform channels, navigation, and business rules from widget composition.
- Validate API payloads at the boundary and avoid spreading transport concerns into UI code.
- Optimize build and release flows early because mobile packaging regressions are costly.

## Recommended Pairings

- `mobile-app` blueprint for the starter architecture.
- `frontend` skill domain for interface composition and interaction design.
- `fullstack` skill domain when the product includes backend coordination.
