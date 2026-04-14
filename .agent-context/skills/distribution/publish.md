# Publish Hygiene

Tier: EXPERT

Publishing should be repeatable, auditable, and minimal in surface area.

## Pre-Publish Gates

- Validate package contents and metadata.
- Run tests and policy validators.
- Confirm version/changelog consistency.
- Generate SBOM and provenance artifacts.

## Package Surface Control

- Use explicit allow-list for publish files.
- Exclude internal scripts, test fixtures, and local configs.
- Verify CLI entry points and executable permissions.

## Ownership and Provenance

- Ensure publisher identity is controlled.
- Record commit SHA and release timestamp.
- Attach generated reports (gate, benchmark, SBOM) to release artifacts.

## Failure Policy

- Abort publish on failing quality gate.
- Abort publish on unresolved high-severity security findings.
- Abort publish on missing changelog entry.

## Review Checklist

- [ ] Package contents match expected release manifest.
- [ ] Quality and security gates passed.
- [ ] Version and changelog are aligned.
- [ ] Provenance artifacts are generated and stored.