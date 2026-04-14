# Security

Tier: EXPERT

Security review is a release gate. Critical vulnerabilities must halt feature rollout until resolved.

## Security Halt Policy

Immediately block release when any of the following are present:
- Hardcoded credentials or tokens.
- Injection vulnerabilities (SQL/command/template).
- Authentication or authorization bypass.
- Unvalidated external input entering privileged paths.

## Boundary Safeguards

- Validate external input at transport boundary.
- Enforce parameterized queries.
- Limit privilege scope for runtime credentials.
- Keep secrets in approved secret stores.

## Review Expectations

- Threat model relevant attack surfaces.
- Verify dependency vulnerability posture.
- Confirm error messages do not leak sensitive internals.
- Confirm audit logs exist for security-sensitive actions.

## Review Checklist

- [ ] No critical vulnerability remains open.
- [ ] Input and output boundaries are validated.
- [ ] Secret handling follows policy.
- [ ] Least-privilege access is enforced.