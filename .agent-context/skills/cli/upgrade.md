# Upgrade Flow

Tier: ADVANCE

Upgrade commands must prioritize compatibility, transparency, and recovery.

## Required Controls

- Dry-run mode to preview changes.
- Compatibility checks before mutation.
- Backup or rollback path for critical files.

## Upgrade Sequence

1. Read current version and target version.
2. Evaluate compatibility matrix.
3. Produce migration plan (files to add/change/remove).
4. Execute with transactional mindset.
5. Emit post-upgrade report with changed artifacts.

## Failure Handling

- On partial failure, rollback modified artifacts or provide deterministic recovery instructions.
- Never leave silent half-upgraded state.
- Exit with explicit status code and structured error payload.

## Anti-Patterns

- In-place mutation without preview.
- Version bump without migration note.
- Breaking changes in minor release without contract guard.

## Review Checklist

- [ ] Dry-run output is complete and stable.
- [ ] Upgrade report captures all changed files.
- [ ] Rollback path is tested.
- [ ] Compatibility failures block mutation.