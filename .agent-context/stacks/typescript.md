# TypeScript Stack Profile — The "Galak" Standard

> TypeScript is not JavaScript with optional types.
> It is a contract system. Use it like one.

## Compiler Configuration (Non-Negotiable)

### tsconfig.json Strict Settings
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "moduleResolution": "bundler",
    "module": "ESNext",
    "target": "ES2022",
    "skipLibCheck": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Rule:** `"strict": true` is mandatory. If a project has `"strict": false`, fix it before writing any new code.

---

## The `any` Ban (Zero Tolerance)

### Rule: `any` is BANNED. No exceptions.

```typescript
// ❌ INSTANT REJECTION
function processData(data: any) { ... }
const result = response.json() as any;
// @ts-ignore
// @ts-expect-error — only allowed with a comment explaining WHY and a linked issue

// ✅ REQUIRED: Use `unknown` with type narrowing
function processData(data: unknown) {
  const parsed = DataSchema.parse(data);  // Zod validates and narrows
  // `parsed` is now fully typed
}

// ✅ REQUIRED: Use generics when the type varies
function getFirstItem<T>(items: T[]): T | undefined {
  return items[0];
}
```

### What to Use Instead of `any`
| Situation | Instead of `any`, Use |
|-----------|----------------------|
| Unknown external data | `unknown` + Zod parsing |
| Generic container | `T` (generic type parameter) |
| Object with unknown keys | `Record<string, unknown>` |
| Function argument you'll refine | `unknown` + type guard |
| Library with bad types | Write a `.d.ts` override or `unknown` wrapper |
| Event handlers | The specific event type (`MouseEvent`, `ChangeEvent<HTMLInputElement>`) |

---

## Zod at Boundaries (Mandatory)

### Rule: ALL External Data MUST Pass Through Zod

```typescript
// ❌ BANNED: Trusting external data
app.post('/users', async (req, res) => {
  const { name, email, age } = req.body;  // Could be anything!
  await userService.create({ name, email, age });
});

// ✅ REQUIRED: Validate with Zod at the boundary
import { z } from 'zod';

const CreateUserSchema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().toLowerCase(),
  age: z.number().int().min(13).max(150),
});

type CreateUserDto = z.infer<typeof CreateUserSchema>;

app.post('/users', async (req, res) => {
  const parsed = CreateUserSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }
  // `parsed.data` is fully typed and validated
  await userService.create(parsed.data);
});
```

### Where Zod is MANDATORY
- API request bodies (POST, PUT, PATCH)
- Query parameters and path parameters
- WebSocket incoming messages
- Queue/event payloads from external systems
- Environment variables at startup
- Third-party API responses (trust but verify)
- File upload metadata

### Zod Best Practices
```typescript
// ✅ Reuse schemas — define once, use everywhere
// src/modules/user/user.schema.ts
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['user', 'admin', 'moderator']),
  createdAt: z.coerce.date(),
});

export const CreateUserSchema = UserSchema.omit({ id: true, createdAt: true });
export const UpdateUserSchema = CreateUserSchema.partial();

// Types derived from schemas — single source of truth
export type User = z.infer<typeof UserSchema>;
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
```

---

## API Documentation (Mandatory)

### Rule: No API Endpoint Exists Without Documentation

Every API endpoint MUST have corresponding documentation. When creating or modifying an endpoint, you MUST simultaneously update the API documentation.

### Preferred Approach: OpenAPI (Swagger)

```typescript
// Option 1: Code-first with decorators (NestJS)
@ApiOperation({ summary: 'Create a new user' })
@ApiBody({ type: CreateUserDto })
@ApiResponse({ status: 201, description: 'User created', type: UserResponseDto })
@ApiResponse({ status: 400, description: 'Validation error' })
@ApiResponse({ status: 409, description: 'Email already exists' })
@Post()
async createUser(@Body() dto: CreateUserDto): Promise<UserResponseDto> { ... }

// Option 2: Schema-first with Zod + zod-to-openapi
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
extendZodWithOpenApi(z);

const CreateUserSchema = z.object({
  name: z.string().min(1).openapi({ example: 'John Doe' }),
  email: z.string().email().openapi({ example: 'john@example.com' }),
}).openapi('CreateUserRequest');
```

### Documentation Checklist (Per Endpoint)
- [ ] HTTP method and path
- [ ] Request body schema (with examples)
- [ ] Query/path parameter descriptions
- [ ] All possible response codes with schemas
- [ ] Authentication requirements
- [ ] Rate limiting information (if applicable)

### Documentation Must Stay in Sync
```
❌ BANNED:
// Endpoint accepts `role` field but docs don't mention it
// Endpoint returns 422 but docs only show 400

✅ REQUIRED:
// When you change an endpoint → update the schema/docs in the SAME commit
// Use code-first tools so docs are generated from the actual types
```

---

## Import Style

### Path Aliases (Required)
```typescript
// ❌ BANNED: Deep relative imports
import { UserService } from '../../../modules/user/user.service';
import { AppError } from '../../../../shared/errors/app-error';

// ✅ REQUIRED: Path aliases
import { UserService } from '@/modules/user/user.service';
import { AppError } from '@/shared/errors/app-error';
```

### Import Order (Enforced by ESLint)
```typescript
// 1. Node built-ins
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

// 2. External packages
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';

// 3. Internal modules (path aliases)
import { UserService } from '@/modules/user/user.service';
import { AppError } from '@/shared/errors/app-error';

// 4. Relative imports (same module only)
import { CreateUserDto } from './user.dto';
import { UserRepository } from './user.repository';
```

---

## Async Patterns

### Rule: Prefer async/await Over Raw Promises
```typescript
// ❌ BANNED: Promise chain hell
function getUser(id: string) {
  return userRepo.findById(id)
    .then(user => {
      if (!user) throw new NotFoundError('User', id);
      return orderRepo.findByUserId(user.id);
    })
    .then(orders => ({ ...user, orders }))
    .catch(err => { throw err; });
}

// ✅ REQUIRED: Clean async/await
async function getUser(id: string): Promise<UserWithOrders> {
  const user = await userRepo.findById(id);
  if (!user) throw new NotFoundError('User', id);

  const orders = await orderRepo.findByUserId(user.id);
  return { ...user, orders };
}
```

### Parallel Execution
```typescript
// ❌ SLOW: Sequential when operations are independent
const user = await getUser(id);
const orders = await getOrders(id);
const preferences = await getPreferences(id);

// ✅ FAST: Parallel independent operations
const [user, orders, preferences] = await Promise.all([
  getUser(id),
  getOrders(id),
  getPreferences(id),
]);
```

---

## Enum and Union Types

### Prefer `as const` Unions Over Enums
```typescript
// ⚠️ ACCEPTABLE but verbose:
enum OrderStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
}

// ✅ PREFERRED: const assertion + union type
const ORDER_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered'] as const;
type OrderStatus = (typeof ORDER_STATUSES)[number];
// OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered'

// Works perfectly with Zod:
const OrderStatusSchema = z.enum(ORDER_STATUSES);
```

---

## Preferred Libraries (V1.0 — 2025)

| Need | Library | Why |
|------|---------|-----|
| Runtime | Bun / Node 20+ | ESM native, fast, batteries-included |
| Validation | `zod` | 0 deps, type inference, composable |
| ORM | `prisma` or `drizzle-orm` | Type-safe queries, migration support |
| HTTP framework | `hono` / `fastify` / Next.js | Lightweight, modern, tree-shakeable |
| Testing | `vitest` | Vite-native, Jest-compatible API, fast |
| Linting | `eslint` + `@typescript-eslint` | Community standard |
| Formatting | `prettier` | Community standard |
| Date | `date-fns` or `Temporal` (when stable) | Tree-shakeable, immutable |
| HTTP client | `ky` / `ofetch` / built-in `fetch` | Lightweight, modern |
| Password | `bcrypt` / `argon2` | Proven, secure |
| Logger | `pino` | Fastest JSON logger for Node.js |
| Env | `@t3-oss/env-core` + Zod | Type-safe env validation |

---

## Banned Patterns

| Pattern | Why | Alternative |
|---------|-----|-------------|
| `any` type | Defeats TypeScript's purpose | `unknown` + narrowing |
| `// @ts-ignore` | Hides real type errors | Fix the type or `@ts-expect-error` with comment |
| `var` keyword | Function scoping bugs | `const` (default) or `let` |
| `==` loose equality | Type coercion surprises | `===` always |
| `console.log` in production | Not structured, not configurable | Use `pino` or structured logger |
| `new Date()` without timezone | Timezone bugs | Explicit UTC or use date-fns |
| Default exports | Naming inconsistency across imports | Named exports only |
| Barrel re-exports (`index.ts`) | Circular dependency magnets | Direct imports or module public API only |
| `moment.js` | Deprecated, massive bundle | `date-fns` or `dayjs` |
| `class` with inheritance (deep chains) | Fragile hierarchies | Composition + interfaces |
