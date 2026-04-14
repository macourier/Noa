# Marketplace Acceptance Checklist

Use this checklist to evaluate marketplace artifact submissions. Every gate must be verified before assigning a trust tier.

## Tier Assignment Rule

- **Verified**: all 20 gates pass, composite score >= 85
- **Community**: gates 1-4 pass, composite score >= 50
- **Experimental**: gate 1 passes, composite score >= 0
- **Rejected**: gate 1 fails or forbidden content detected

## Documentation (25%)

- [ ] 1. README.md exists and contains at least 200 characters of non-boilerplate content
- [ ] 2. README includes a usage example or getting-started section
- [ ] 3. README includes an API or configuration reference
- [ ] 4. License declaration is present (LICENSE file or header)
- [ ] 5. No placeholder-only content (no files that are entirely TODO or stub)

## Tests (25%)

- [ ] 6. At least one test file exists in a recognized test directory
- [ ] 7. All tests pass without errors when executed
- [ ] 8. Core exported functions have corresponding test cases
- [ ] 9. No skipped or disabled tests in critical code paths
- [ ] 10. Test execution command is documented in README or package metadata

## Evidence (25%)

- [ ] 11. Evidence bundle directory exists at artifact root (e.g. `evidence/` or `.evidence/`)
- [ ] 12. Compatibility manifest is present declaring supported runtimes and IDE versions
- [ ] 13. Validation report from the most recent CI run is present
- [ ] 14. Dependency list or SBOM excerpt is present
- [ ] 15. Evidence files are current (updated within the tier's maxDaysSinceUpdate threshold)

## Maintenance (25%)

- [ ] 16. Last meaningful update is within the tier's maxDaysSinceUpdate threshold
- [ ] 17. CHANGELOG.md exists with at least one entry for the current major version
- [ ] 18. No known critical or high-severity vulnerabilities in direct dependencies
- [ ] 19. Version follows semantic versioning (MAJOR.MINOR.PATCH)
- [ ] 20. Owner or maintainer is declared in package metadata or README

## Security (Mandatory, All Tiers)

- [ ] Forbidden content scan passes (no hardcoded secrets, API keys, or private paths)
- [ ] No `eval()` or dynamic code execution in published assets
- [ ] No network calls to undeclared external endpoints

## Scoring Notes

Composite score is calculated as:

```
score = (doc_score * 0.25) + (test_score * 0.25) + (evidence_score * 0.25) + (maintenance_score * 0.25)
```

Each dimension score is: (gates_passed / total_gates_in_dimension) * 100

Tier thresholds are defined in `.agent-context/marketplace/trust-tiers.json`.
