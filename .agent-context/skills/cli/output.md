# Machine-Readable Output

Tier: ADVANCE

CLI output must support both human readability and automation reliability.

## Output Contract

- Human mode: concise narrative and actionable next steps.
- JSON mode: deterministic schema, stable field names, and clear status.

## JSON Schema Guidelines

- Include `version`, `timestamp`, `status`, and `summary`.
- Include `artifacts` list for produced files.
- Include `errors` array with machine-readable codes.
- Avoid embedding plain stack traces in public payloads.

## Exit Code Conventions

- `0`: success
- `1`: validation or runtime failure
- `2`: policy/gate failure

## Determinism Rules

- Stable key ordering where practical.
- No random IDs unless explicitly requested.
- Timestamps in ISO 8601 format.

## Review Checklist

- [ ] JSON output passes schema validation.
- [ ] Exit codes match documented behavior.
- [ ] Error payload includes code and remediation hint.
- [ ] Human output remains concise and useful.