# Release Operations Checklist (V1.8)

Use this checklist before promoting any release tag or package publish operation.

## 1) Versioning and Changelog Integrity
- `package.json` version is valid semantic version (`x.y.z`).
- `CHANGELOG.md` has a matching release header for the package version.
- `docs/roadmap.md` reflects release status and scope for the current milestone.

## 2) Quality Gates and Test Evidence
- `npm run validate` passes with zero failures.
- `npm run test` passes on the full suite.
- Frontend governance gate (`npm run audit:frontend-usability`) passes.
- Release governance gate (`npm run gate:release`) passes.

## 3) Supply Chain and Compliance Evidence
- SBOM is generated with `npm run sbom:generate`.
- CI uploads SBOM artifact for retention and audit traceability.
- CI uploads release-gate report artifact for each run.

## 4) Security and Override Governance
- `.agent-override.md` entries have valid `Owner` and `Expiry` metadata.
- No expired overrides remain active.
- Any temporary exception has explicit rollback owner and date.

## 5) Publish Readiness
- Release notes summarize scope, risks, and rollback steps.
- Required GitHub workflows are green on target commit.
- Tag and publish command are executed only after all checks pass.
