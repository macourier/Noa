# Provenance Attestation

Tier: EXPERT

Provenance attestation links shipped artifacts to source commits, policy gates, and maintainer intent so releases remain auditable.

## Attestation Requirements

Every release artifact should be traceable to:

- Source commit SHA.
- Versioned changelog entry.
- Gate evidence (release gate, benchmark, security checks).
- Maintainer identity and release timestamp.

## Artifact Chain

Maintain a simple provenance chain:

1. Build artifact from tagged commit.
2. Generate SBOM and integrity digest.
3. Attach gate output artifacts.
4. Publish with immutable version metadata.

If any step is missing, release should be blocked until evidence is complete.

## Tamper-Resistance Controls

- Avoid manual artifact replacement outside CI path.
- Keep checksums in release notes or signed metadata.
- Enforce immutable package versions after publish.
- Store audit artifacts with retention policy.

## Operational Review

At weekly cadence, review provenance quality:

- Are all recent releases traceable end to end?
- Were any gates bypassed or manually overridden?
- Are SBOM and compatibility manifests synchronized?

## Review Checklist

- [ ] Source commit and version metadata are linked.
- [ ] SBOM and checksum artifacts are attached.
- [ ] Gate evidence is complete and timestamped.
- [ ] No unsigned or out-of-band artifact replacement occurred.
