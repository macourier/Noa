# Security Audit Checklist — OWASP-Aligned

> Run this on any code that handles authentication, authorization,
> user input, or external data. When in doubt, run it anyway.

## Instructions for Agent

Evaluate every item below against the current code. For each finding, rate severity:
- 🔴 **CRITICAL** — Exploitable now, must fix before deploy
- 🟠 **HIGH** — Likely exploitable, fix in this PR
- 🟡 **MEDIUM** — Potential risk, fix before production
- 🟢 **LOW** — Minor, fix when convenient

Output format:
```
## SECURITY AUDIT RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 CRITICAL: [finding title]
   Location: [file:line]
   Risk: [what an attacker could do]
   Fix: [specific remediation]

VERDICT: X findings (🔴 N critical, 🟠 N high, 🟡 N medium, 🟢 N low)
```

---

## A1: Injection (SQL, NoSQL, OS, LDAP)

- [ ] No string concatenation in SQL queries → use parameterized queries
- [ ] No string interpolation in OS commands → use argument arrays
- [ ] No raw user input in regex → escape or use validated patterns
- [ ] ORM/query builder used correctly (no raw queries with user input)
- [ ] No `eval()`, `new Function()`, or `exec()` with user-controlled input

## A2: Broken Authentication

- [ ] Passwords hashed with bcrypt (cost ≥ 12) or argon2
- [ ] No MD5, SHA1, or SHA256 for password hashing
- [ ] Rate limiting on login endpoints (max 5 per minute per IP)
- [ ] Session tokens are cryptographically random (≥ 256 bits)
- [ ] JWT tokens have reasonable expiration (≤ 15 min for access, ≤ 7 days refresh)
- [ ] Refresh token rotation implemented (invalidate old token on use)
- [ ] Password reset tokens are single-use and time-limited (≤ 1 hour)

## A3: Sensitive Data Exposure

- [ ] No secrets in source code (API keys, passwords, tokens)
- [ ] No secrets in git history (check with `git log -p | grep -i secret`)
- [ ] Sensitive fields excluded from API responses (password, tokens, internal IDs)
- [ ] Sensitive fields excluded from logs (passwords, tokens, PII)
- [ ] HTTPS enforced (HSTS header present)
- [ ] Sensitive cookies have `Secure`, `HttpOnly`, `SameSite` flags

## A4: Broken Access Control

- [ ] Authorization enforced server-side (not just client-side UI hiding)
- [ ] Resource ownership verified (user can only access their own data)
- [ ] Default deny — if no rule grants access, deny
- [ ] Admin endpoints require admin role verification
- [ ] No direct object reference without access check (IDOR prevention)
- [ ] CORS configured with specific origins (not `*`)
- [ ] File upload paths don't allow directory traversal

## A5: Security Misconfiguration

- [ ] Debug mode disabled in production (no stack traces to client)
- [ ] Default credentials changed
- [ ] Unnecessary features/endpoints disabled
- [ ] Security headers present:
  - `Strict-Transport-Security`
  - `Content-Security-Policy`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy`
- [ ] Error responses don't reveal framework/version info

## A6: XSS (Cross-Site Scripting)

- [ ] No `innerHTML`, `dangerouslySetInnerHTML`, or `v-html` with user data
- [ ] Output encoding applied when rendering user input
- [ ] Content-Security-Policy header restricts inline scripts
- [ ] URL parameters validated before rendering

## A7: Insecure Dependencies

- [ ] No known vulnerabilities in dependencies (`npm audit` clean)
- [ ] Dependencies are actively maintained (check pulse)
- [ ] Lock files committed and up-to-date
- [ ] No unnecessary dependencies (check efficiency-vs-hype.md)

## A8: Logging & Monitoring

- [ ] Authentication failures logged with IP and timestamp
- [ ] Authorization failures logged with userId and resource
- [ ] Critical operations logged (data deletion, role changes, exports)
- [ ] Logs do NOT contain passwords, tokens, or full credit card numbers
- [ ] Log injection prevented (sanitize user input before logging)

## A9: Rate Limiting

- [ ] Auth endpoints rate-limited
- [ ] API endpoints have reasonable rate limits
- [ ] File upload size limits configured
- [ ] Pagination limits enforced (prevent requesting 1M records)

## A10: Mass Assignment

- [ ] Input DTOs explicitly whitelist allowed fields
- [ ] No `Object.assign(entity, req.body)` without field filtering
- [ ] Admin-only fields (role, permissions) can't be set by regular users
- [ ] Database updates use explicit field sets, not spread operators on raw input
