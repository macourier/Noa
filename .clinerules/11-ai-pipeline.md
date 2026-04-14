# AI Pipeline — Architecture & Conventions (Template)

> 📋 **This is a template.** Adapt to your AI pipeline architecture.

## Pipeline Architecture
1. **Context gathering** → Retrieve relevant data
2. **Enrichment** → External research, validation
3. **Generation** → Streaming/non-streaming output
4. **Validation** → Guardrails, conformity analysis
5. **Storage** → Server validation + DB write + score update

## Provider Abstraction
- Define provider switching strategy (e.g., prod vs dev vs research)
- Document fallback chains (primary → secondary → degraded)
- Specify timeout and retry policies per operation type

## Key Modules
- `writer.ts` — Generation (streaming/non-streaming), robust JSON parsing
- `research.ts` — External research (with timeout, fallback to lighter model)
- `prompts.ts` — System prompts by section/type, context injection
- `guardrail.ts` — Conformity analysis, proscribed word detection
- `legal-safety.ts` — Legal/compliance safety checks (if applicable)
- `marketing-detector.ts` — Detect marketing prose vs technical content
- `coherence-checker.ts` — Cross-section/item coherence validation

## Patterns
- Safety timeout: `withTimeout()` for all long operations
- Retry: max 1 retry per operation, increased timeout (e.g., 180s)
- Degraded fallback: if external research fails, generate without it (flag `degraded: true`)
- Server validation before save: non-empty content, complete metadata, score 0-100
- Streaming: SSE chunks `type: chunk/complete/error`
- Robust parsing: handle malformed JSON from streaming responses

## Integration Checklist
- [ ] Provider abstraction configured
- [ ] Timeout policies set per operation
- [ ] Fallback chain tested
- [ ] Guardrails active and calibrated
- [ ] Streaming error recovery tested
- [ ] Server-side validation before persistence