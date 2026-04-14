# Distribution Skill Pack

Default tier: `expert`

## Purpose
Protect package installation and release distribution with transactional safety.

## In Scope
- Package validation
- Backup and rollback
- Compatibility checks
- Forbidden-file detection
- Publish hygiene and provenance
- Dependency audit evidence and attestations

## Must-Have Checks
- Preflight validation before installation or publish
- Backup point before mutating user state
- Automatic rollback on failure
- Compatibility manifest present
- Evidence bundle attached to release
- Weekly governance report generated and reviewed before maintainers publish

## Evidence
- Install validation report
- Rollback verification log
- Publish dry-run output
- Integrity and provenance manifest
- Governance weekly report with trust-tier and gate posture summary

## Fallback
- If automated rollback cannot be guaranteed, the operation must stop before mutation.