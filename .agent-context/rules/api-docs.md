# API Documentation — The "Invisible API" Rule

> An undocumented API is an unusable API.
> If it's not in the spec, it doesn't exist.

## The Zero-Doc Death Penalty

Every API endpoint MUST have machine-readable documentation that covers:
1. HTTP method + path
2. Request body schema with field descriptions and examples
3. All response codes with typed schemas
4. Authentication requirements
5. Rate limiting (if applicable)

```
BANNED: An endpoint without a defined Request/Response schema.
BANNED: Using generic `object` or `any` in documentation types.
BANNED: "See code for details" as documentation.
BANNED: Swagger UI with auto-generated summaries only (no descriptions, no examples).

REQUIRED: Every field MUST have a `description` and an `example` value.
REQUIRED: Every error response MUST be documented (400, 401, 403, 404, 409, 500).
REQUIRED: Documentation MUST be updated in the SAME commit as the endpoint change.
```

---

## Human Writing Standard (Mandatory)

This applies to documentation, release notes, onboarding text, review summaries, and agent-facing explanations.
API docs and README updates are included in this scope.

### Style Baseline
1. Write for native English speakers.
2. Target an 8th-grade reading level.
3. Use clear, direct, plain language.
4. Keep sentence rhythm natural with short and medium sentences.
5. Sound confident, practical, and conversational.
6. State the main point first, then supporting detail.

### Required Behavior
1. Explain decisions the way a competent coworker would explain them out loud.
2. Cut unnecessary words and remove filler.
3. Use concrete verbs and everyday phrasing.
4. Rewrite and reorder content when flow is weak.
5. Keep explanations short by default; expand only when complexity requires it.

### Non-Negotiables
1. No emoji in formal artifacts.
2. Avoid AI cliches and buzzwords: delve, leverage, robust, utilize, seamless.
3. Avoid inflated, academic, or performative language.
4. Avoid padding, hedging, and redundant phrasing.

### Critical Controls
1. Any claim about quality, performance, or reliability must include a measurable source and timestamp.
2. Expand acronyms on first use, then use terms consistently.
3. Separate facts from assumptions explicitly.
4. End major explanations with a clear next action.

### Final Check
Read the text out loud before shipping. If it sounds robotic, rewrite it.

---

## Documentation Format: OpenAPI 3.1 (Non-Negotiable)

All APIs produce an OpenAPI 3.1 specification. Not 3.0, not proprietary formats, not "we'll add Swagger later."

### Why OpenAPI
- Machine-readable: clients, tests, and mocks can be generated from the spec
- Full JSON Schema Draft 2020-12 compatibility (3.1+ only)
- Vendor-neutral: works with Scalar, Swagger UI, Redoc, Postman, Stoplight
- Version-controllable: the spec is a file you can diff and review

---

## Tooling by Framework

### NestJS
Use `@nestjs/swagger` with Scalar UI (not default Swagger UI — Scalar is faster and more readable).

```typescript
// main.ts — Setup
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { apiReference } from '@scalar/nestjs-api-reference';

const config = new DocumentBuilder()
  .setTitle('Service Name')
  .setDescription('Brief service purpose')
  .setVersion('1.0')
  .addBearerAuth()
  .build();

const document = SwaggerModule.createDocument(app, config);

// Scalar UI at /docs
app.use('/docs', apiReference({ spec: { content: document } }));

// Raw spec at /api-json
SwaggerModule.setup('api', app, document);
```

Every controller method requires these decorators at minimum:
```typescript
@ApiOperation({ summary: 'Create a user account' })
@ApiBody({ type: CreateUserDto, description: 'User registration data' })
@ApiResponse({ status: 201, type: UserResponseDto, description: 'User created successfully' })
@ApiResponse({ status: 400, description: 'Validation error — invalid input fields' })
@ApiResponse({ status: 409, description: 'Conflict — email already registered' })
@Post()
```

Every DTO property requires `@ApiProperty`:
```typescript
export class CreateUserDto {
  @ApiProperty({
    description: 'User email address, must be unique across the system',
    example: 'jane.doe@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'Display name shown in the UI',
    example: 'Jane Doe',
    minLength: 1,
    maxLength: 100,
  })
  name: string;
}
```

### Next.js (App Router)
Use `zod-to-openapi` or `next-swagger-doc` to generate OpenAPI from Zod schemas.

```typescript
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const CreateUserSchema = z.object({
  email: z.string().email().openapi({
    description: 'User email address, must be unique',
    example: 'jane.doe@example.com',
  }),
  name: z.string().min(1).max(100).openapi({
    description: 'Display name shown in the UI',
    example: 'Jane Doe',
  }),
}).openapi('CreateUserRequest');
```

Expose the spec at `/api/docs` or `/api/openapi.json`.

### Other Frameworks (Express, Fastify, Hono)
Use `swagger-jsdoc` + TSDoc comments, or `@asteasolutions/zod-to-openapi`.
The output MUST be a valid OpenAPI 3.1 JSON/YAML file served at a known endpoint.

---

## Response Documentation Standard

Every endpoint MUST document these response scenarios:

| Status | When | Schema Required |
|--------|------|----------------|
| `200` | Successful retrieval or update | Yes — typed response body |
| `201` | Successful creation | Yes — the created resource |
| `204` | Successful deletion | No body |
| `400` | Validation error | Yes — field-level error details |
| `401` | Missing or invalid authentication | Fixed message, no details |
| `403` | Authenticated but insufficient permissions | Fixed message |
| `404` | Resource not found | Fixed message |
| `409` | Conflict (duplicate resource) | Description of conflict |
| `429` | Rate limit exceeded | Retry-After header |
| `500` | Internal error | `{ traceId }` only — NO stack traces |

### Error Response Schema (Standardized)
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid",
    "details": [
      { "field": "email", "message": "Invalid email format" }
    ],
    "traceId": "req-abc-123"
  }
}
```

This schema MUST be documented in OpenAPI as a reusable component (`#/components/schemas/ErrorResponse`).

---

## Documentation Sync Rule

```
Endpoint changed + docs NOT updated = PR REJECTED.

The spec is a contract. If the contract is wrong, consumers will break.
"I'll update the docs later" means "the docs will never be updated."
```

### Enforcement
1. API docs live next to the code (same module, same directory)
2. Docs update in the SAME commit as the endpoint change
3. CI can validate the spec: `openapi-generator validate -i openapi.json`
4. Generated clients (if any) must be regenerated after spec changes

---

## The Documentation Quality Test

Open your API docs URL (`/docs`). For a randomly chosen endpoint, verify:

1. Can a developer who has never seen the codebase call this endpoint correctly? (Must be YES)
2. Are all required fields clearly marked? (Must be YES)
3. Does every field have a realistic example value? (Must be YES)
4. Are all error responses documented with their conditions? (Must be YES)
5. Can you copy the example request and it works? (Must be YES)

If any answer is "no", the documentation is incomplete.
