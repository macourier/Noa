# Init Flow

Tier: ADVANCE

Initialization commands must be deterministic, reversible where possible, and explicit about filesystem mutations.

## Design Principles

- Predictable output for identical input flags.
- Safe defaults when users omit options.
- Preflight summary before any file write.

## Required Init Sequence

1. Validate prerequisites (runtime, permissions, existing files).
2. Resolve stack/profile/blueprint selection.
3. Print write plan summary.
4. Apply scaffold atomically.
5. Emit machine-readable onboarding report.

## Write Safety

- Refuse to overwrite existing files without explicit flag.
- Use idempotent initialization where feasible.
- Keep generated files grouped by feature intent, not random dump.

## Anti-Patterns

- Hidden writes without disclosure.
- Interactive-only flow with no non-interactive equivalent.
- Ambiguous defaults that vary by environment.

## Review Checklist

- [ ] Preflight checks are explicit and actionable.
- [ ] Generated file set is deterministic.
- [ ] Dry-run preview exists for init planning.
- [ ] Exit codes distinguish validation vs runtime failures.