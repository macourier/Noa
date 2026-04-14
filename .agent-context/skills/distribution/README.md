# Distribution Engineering Skills

Default tier: `expert`

This domain governs release packaging, compatibility policy, and rollback readiness.

## Topics
- [Publish Hygiene](publish.md) - Package integrity, provenance, and release evidence
- [Rollback](rollback.md) - Recovery-first release operations
- [Compatibility](compatibility.md) - Runtime/tooling support policy and guardrails
- [Provenance Attestation](provenance-attestation.md) - SBOM linkage, artifact identity, and maintainership traceability

## Operating Model
- Use `expert` as the default distribution tier.
- Block release if rollback and compatibility guarantees are not verified.

## Above-Line Additions
- Release gates tied to benchmark and compatibility checks.
- Supply-chain artifacts (SBOM/provenance) as first-class outputs.
- Explicit rollback drills before critical releases.

## Usage Example

```bash
npm run gate:release
npm run report:governance-weekly
```