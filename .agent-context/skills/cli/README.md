# CLI Engineering Skills

Default tier: `advance`

This domain covers command design, safe mutation workflows, and machine-readable output conventions for automation.

## Topics
- [Init Flow](init.md) - Deterministic project initialization with explicit write plans
- [Upgrade Flow](upgrade.md) - Safe upgrades with dry-run, rollback, and compatibility checks
- [Machine-Readable Output](output.md) - Stable JSON output and deterministic exit semantics
- [Safety and Telemetry](safety-telemetry.md) - Operational signal capture and release-facing CLI governance summaries

## Operating Model
- Use `advance` for normal command work.
- Escalate to `expert` when commands mutate user state or require migration safety.

## Above-Line Additions
- Mandatory dry-run support for mutating commands.
- Structured error payloads for CI/CD and bots.
- Explicit rollback plans for upgrade paths.
- Plug-and-play init presets for common stacks and blueprints.

## Installation and Entry Paths

Choose the path that fits your workflow:

- `agentic-senior-core launch` for a numbered interactive chooser.
- `npm install -g @fatidaprilian/agentic-senior-core` for a global command.
- `npm exec --yes @fatidaprilian/agentic-senior-core init` for a one-off run.
- `npx @fatidaprilian/agentic-senior-core init` for a package-managed local run.
- GitHub template for zero-install project bootstrap.

## Preset Starts

Use presets when you want fewer choices at the start:

- `frontend-web` - TypeScript + API Next.js + balanced profile.
- `backend-api` - Python + FastAPI + balanced profile.
- `fullstack-product` - TypeScript + API Next.js + balanced profile.
- `platform-governance` - Go + Go service + strict profile.
- `mobile-react-native` - React Native + mobile app + balanced profile.
- `mobile-flutter` - Flutter + mobile app + balanced profile.
- `observability-platform` - Go + observability + strict profile.
- `typescript-nestjs-service` - TypeScript + NestJS module blueprint + balanced profile.
- `java-enterprise-api` - Java + Spring Boot API + strict profile.
- `dotnet-enterprise-api` - C# + ASP.NET API + strict profile.
- `php-laravel-api` - PHP + Laravel API + balanced profile.
- `kubernetes-platform` - Go + Kubernetes manifests + strict profile.

Example:

```bash
agentic-senior-core init --preset frontend-web
agentic-senior-core init --preset backend-api --ci true
agentic-senior-core launch
```