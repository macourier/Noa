# Blueprint: GitLab CI/CD Pipeline

> Same principles as GitHub Actions, adapted for GitLab's pipeline model.

## Tech Stack

| Layer | Tool |
|-------|------|
| CI/CD | GitLab CI/CD |
| Config | `.gitlab-ci.yml` |
| Runners | Shared runners or dedicated (Docker executor) |
| Registry | GitLab Container Registry |
| Caching | GitLab CI cache (per-branch, per-job) |

## Pipeline Architecture

```yaml
stages:
  - validate    # Lint + type check
  - test        # Unit + integration tests
  - security    # Dependency audit + SAST
  - build       # Compile, bundle, containerize
  - judge       # LLM-as-a-Judge checklist gate
  - deploy      # Staging → Production
```

## Pipeline Template (`.gitlab-ci.yml`)

```yaml
default:
  image: node:22-alpine
  cache:
    key:
      files: [package-lock.json]
    paths: [node_modules/]
    policy: pull-push

stages:
  - validate
  - test
  - security
  - build
  - judge
  - deploy

# ─── VALIDATE ───────────────────────────────────────────
lint:
  stage: validate
  script:
    - npm ci --prefer-offline
    - npm run lint
    - npm run type-check
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'
    - if: '$CI_COMMIT_BRANCH == "main"'

# ─── TEST ───────────────────────────────────────────────
test:unit:
  stage: test
  script:
    - npm ci --prefer-offline
    - npm run test -- --coverage
  coverage: '/All files\s*\|\s*(\d+\.?\d*)\s*\|/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
    paths: [coverage/]
    expire_in: 7 days

test:integration:
  stage: test
  services:
    - postgres:16-alpine
  variables:
    POSTGRES_DB: test_db
    POSTGRES_USER: test_user
    POSTGRES_PASSWORD: test_pass
    DATABASE_URL: "postgresql://test_user:test_pass@postgres:5432/test_db"
  script:
    - npm ci --prefer-offline
    - npm run test:integration

# ─── SECURITY ───────────────────────────────────────────
audit:
  stage: security
  script:
    - npm audit --audit-level=high
  allow_failure: false

sast:
  stage: security
  # GitLab's built-in SAST template
include:
  - template: Security/SAST.gitlab-ci.yml

# ─── BUILD ──────────────────────────────────────────────
build:
  stage: build
  script:
    - npm ci --prefer-offline
    - npm run build
  artifacts:
    paths: [dist/]
    expire_in: 1 day
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'

# ─── LLM JUDGE ──────────────────────────────────────────
llm:judge:
  stage: judge
  image: node:22-alpine
  variables:
    OPENAI_API_KEY: $OPENAI_API_KEY
    ANTHROPIC_API_KEY: $ANTHROPIC_API_KEY
    GEMINI_API_KEY: $GEMINI_API_KEY
    # CI_MERGE_REQUEST_DIFF_BASE_SHA and CI_COMMIT_SHA are set automatically
    # by GitLab for merge request pipelines — no manual configuration needed.
  before_script:
    - git fetch --unshallow || true  # Ensure full history for git diff
  script:
    - node scripts/llm-judge.mjs
  artifacts:
    when: always
    paths:
      - .agent-context/state/llm-judge-report.json
    expire_in: 7 days
  rules:
    - if: '$CI_PIPELINE_SOURCE == "merge_request_event"'

# ─── DEPLOY ─────────────────────────────────────────────
deploy:staging:
  stage: deploy
  environment:
    name: staging
    url: https://staging.example.com
  script:
    - echo "Deploy to staging"
    # Add your deployment commands
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'

deploy:production:
  stage: deploy
  environment:
    name: production
    url: https://example.com
  script:
    - echo "Deploy to production"
    # Add your deployment commands
  rules:
    - if: '$CI_COMMIT_BRANCH == "main"'
      when: manual  # Require manual approval
  needs: [deploy:staging]
```

## Key Differences from GitHub Actions

| Concern | GitHub Actions | GitLab CI |
|---------|---------------|-----------|
| Config file | `.github/workflows/*.yml` | `.gitlab-ci.yml` (single file) |
| Jobs linkage | `needs:` | `stages:` (sequential) + `needs:` (DAG) |
| Secrets | GitHub Secrets | CI/CD Variables (masked + protected) |
| Caching | `actions/cache` | Built-in `cache:` directive |
| Services | Docker Compose / service containers | `services:` directive |
| Environments | Environment protection rules | Environment + `when: manual` |
| Includes | Reusable workflows | `include:` with `template:` |

## Security Rules

1. **Protected variables** — mark secrets as Protected + Masked
2. **Protected branches** — only deploy from protected branches
3. **Include GitLab SAST/DAST** templates for automated scanning
4. **Limit runner access** — use tags to route jobs to appropriate runners
5. **Artifact expiration** — set `expire_in` on all artifacts
6. **Limit LLM input scope** — send only merge diff + checklist context

## Scaffolding Checklist

- [ ] Create `.gitlab-ci.yml` with validate, test, security, build, deploy stages
- [ ] Configure CI/CD variables for secrets (masked + protected)
- [ ] Set up caching for package manager lockfile
- [ ] Add coverage reporting with Cobertura format
- [ ] Configure environments (staging, production) with manual approval
- [ ] Include SAST template for security scanning
- [ ] Set up merge request pipelines with `rules:`
- [ ] Configure branch protection rules
- [ ] Add `timeout` to long-running jobs
- [ ] Use `needs:` for DAG optimization where possible
- [ ] Add `llm:judge` stage that enforces `pr-checklist.md`

## LLM Judge Annotation Contract

For MR annotations and dashboards, parse either:

- Log line: `JSON_REPORT: { ... }`
- Artifact: `.agent-context/state/llm-judge-report.json`

Severity values are normalized by the judge to: `critical`, `high`, `medium`, `low`.
