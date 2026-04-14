# Contracts

Tier: EXPERT

Contracts keep frontend expectations and backend behavior aligned through explicit schemas. A contract is not documentation only; it is an executable guardrail.

## Contract Sources

- API specification: OpenAPI 3.1 for HTTP boundaries.
- Runtime validation: Zod/Pydantic at service edges.
- Type generation: frontend types generated from server contract.

## Required Pipeline

1. Define or update schema in contract source.
2. Regenerate consumer types.
3. Run contract tests against provider and consumer.
4. Fail CI if drift is detected.

## Drift Prevention

Common drift scenarios:
- Backend renames field but frontend still expects old key.
- Enum expands or changes values without consumer handling.
- Response shape changes silently in minor release.

Control strategy:
- Pin contract artifact version.
- Require schema diff check in pull request.
- Block merge on unreviewed breaking changes.

## Breaking Change Policy

- Additive changes: allowed in minor version if backward-compatible.
- Behavioral changes: require release note and migration note.
- Breaking schema changes: major version bump with compatibility plan.

## Example Workflow

```text
contracts/openapi.yaml updated
-> generate frontend types
-> run provider contract tests
-> run consumer compatibility tests
-> publish artifact only if all checks pass
```

## Review Checklist

- [ ] Contract source is versioned and reviewed.
- [ ] Provider and consumer tests both pass.
- [ ] Breaking changes are tagged and documented.
- [ ] Migration path is included before release.