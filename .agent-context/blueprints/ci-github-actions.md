# Blueprint: GitHub Actions CI/CD Pipeline

> Automate everything. Trust nothing. Ship with confidence.

## Tech Stack

| Layer | Tool |
|-------|------|
| CI/CD | GitHub Actions |
| Runners | GitHub-hosted (ubuntu-latest) |
| Caching | actions/cache, setup-node cache |
| Security | OIDC for cloud auth, pinned action SHAs |
| Artifacts | actions/upload-artifact |

## Pipeline Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PR / Push Trigger                      │
├──────────┬──────────┬──────────┬──────────┬─────────────┬─────────────┤
│   Lint   │  Build   │   Test   │ Security │   Docs      │  LLM Judge  │
│ (ESLint/ │ (tsc /   │ (Vitest/ │ (Audit / │ (OpenAPI    │ (Checklist  │
│  ruff)   │  build)  │  pytest) │  Trivy)  │  validate)  │ enforcement)│
├──────────┴──────────┴──────────┴──────────┴─────────────┴─────────────┤
│              Gate: All jobs must pass                     │
├─────────────────────────────────────────────────────────┤
│              Deploy (on main only)                       │
│  Staging → Smoke Tests → Production (manual approval)   │
└─────────────────────────────────────────────────────────┘
```

## Required Workflows

### 1. CI Workflow (`ci.yml`)

Runs on every PR and push to main.

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  lint:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@<pin-sha>
      - uses: actions/setup-node@<pin-sha>
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check

  test:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@<pin-sha>
      - uses: actions/setup-node@<pin-sha>
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run test -- --coverage
      - uses: actions/upload-artifact@<pin-sha>
        with:
          name: coverage
          path: coverage/

  security:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@<pin-sha>
      - run: npm audit --audit-level=high
      # Add Trivy, CodeQL, or Snyk as needed

  build:
    needs: [lint, test, security]
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - uses: actions/checkout@<pin-sha>
      - uses: actions/setup-node@<pin-sha>
        with:
          node-version-file: '.nvmrc'
          cache: 'npm'
      - run: npm ci
      - run: npm run build
      - uses: actions/upload-artifact@<pin-sha>
        with:
          name: build
          path: dist/

  llm-judge:
    needs: [lint, test, security, build]
    runs-on: ubuntu-latest
    timeout-minutes: 12
    env:
      OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
      GITHUB_BASE_SHA: ${{ github.event.pull_request.base.sha }}
      GITHUB_HEAD_SHA: ${{ github.sha }}
    steps:
      - uses: actions/checkout@<pin-sha>
        with:
          fetch-depth: 0   # Full history required for accurate git diff
      - uses: actions/setup-node@<pin-sha>
        with:
          node-version: '22'
      - name: Run LLM Judge
        run: node scripts/llm-judge.mjs
      - name: Upload LLM Judge machine report
        if: always()
        uses: actions/upload-artifact@<pin-sha>
        with:
          name: llm-judge-report
          path: .agent-context/state/llm-judge-report.json
```

### 2. Deploy Workflow (`deploy.yml`)

Runs on push to main (after CI passes).

```yaml
name: Deploy

on:
  workflow_run:
    workflows: [CI]
    types: [completed]
    branches: [main]

permissions:
  id-token: write   # OIDC
  contents: read

jobs:
  deploy-staging:
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    runs-on: ubuntu-latest
    environment: staging
    steps:
      # Authenticate via OIDC — no static secrets
      # Deploy to staging
      # Run smoke tests against staging

  deploy-production:
    needs: deploy-staging
    runs-on: ubuntu-latest
    environment:
      name: production
      url: https://your-app.com
    steps:
      # Deploy to production
      # Run health checks
      # Notify team (Slack, Discord)
```

## Security Rules

1. **Pin actions to commit SHA** — not `@v3`, not `@latest`
2. **Use OIDC** for cloud provider auth — delete static credentials
3. **Minimal permissions** — set `permissions:` at workflow level, least privilege
4. **Never print secrets** — GitHub masks them in logs, but don't `echo` them
5. **Restrict self-hosted runners** — ephemeral containers only, never persistent VMs
6. **Require PR approval** for workflows from forks
7. **Minimize prompt scope** — send diff + checklist only, never full secret-bearing config

## LLM Judge Annotation Contract

The judge emits a machine-friendly payload line and artifact that can be consumed by annotation scripts:

- Log line: `JSON_REPORT: { ... }`
- Artifact file: `.agent-context/state/llm-judge-report.json`
- Normalized severity values: `critical`, `high`, `medium`, `low`
- Override artifact path (optional): `LLM_JUDGE_OUTPUT_PATH`

## Efficiency Rules

1. **Cache dependencies** — `actions/cache` or setup-action built-in cache
2. **Use concurrency** — cancel previous runs on the same branch
3. **Set timeouts** — prevent stuck jobs from burning minutes
4. **Matrix builds** for multi-platform/version testing
5. **Reusable workflows** — centralize common pipelines in a `.github` repo
6. **Skip unnecessary jobs** — use path filters for targeted CI

```yaml
# Example: Only run frontend tests when frontend code changes
on:
  push:
    paths:
      - 'src/frontend/**'
      - 'package.json'
```

## Scaffolding Checklist

When setting up GitHub Actions for a new project:

- [ ] Create `.github/workflows/ci.yml` with lint, test, build, security
- [ ] Create `.github/workflows/deploy.yml` with staging + production
- [ ] Pin ALL third-party actions to commit SHA
- [ ] Set `permissions: contents: read` at workflow level
- [ ] Configure `concurrency` to cancel in-progress runs
- [ ] Add `timeout-minutes` to every job
- [ ] Set up caching for package manager
- [ ] Configure environment protection rules for production
- [ ] Create `.nvmrc` or `.tool-versions` for runtime version
- [ ] Configure branch protection: require CI pass before merge
- [ ] Add `llm-judge` job that evaluates PR against `pr-checklist.md`
