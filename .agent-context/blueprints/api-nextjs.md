# Blueprint: Next.js API Project (App Router)

> This blueprint defines how to scaffold a Next.js API project from scratch.
> Follow this structure exactly. Do not deviate.

## Tech Stack
- **Runtime:** Node.js 20+ / Bun
- **Framework:** Next.js 14+ (App Router)
- **Validation:** Zod
- **ORM:** Prisma (or Drizzle)
- **Auth:** NextAuth.js v5 / Lucia Auth
- **Testing:** Vitest

## Project Structure

```
project-name/
├── src/
│   ├── app/                            # Next.js App Router
│   │   ├── api/                        # API routes
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts        # Auth handler
│   │   │   ├── users/
│   │   │   │   ├── route.ts            # GET /api/users, POST /api/users
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts        # GET/PUT/DELETE /api/users/:id
│   │   │   └── health/
│   │   │       └── route.ts            # GET /api/health
│   │   ├── layout.tsx                  # Root layout
│   │   └── page.tsx                    # Root page
│   │
│   ├── modules/                        # Feature modules (domain-driven)
│   │   ├── user/
│   │   │   ├── user.service.ts         # Business logic
│   │   │   ├── user.repository.ts      # Data access
│   │   │   ├── user.schema.ts          # Zod schemas + DTOs
│   │   │   ├── user.types.ts           # Type definitions
│   │   │   └── __tests__/
│   │   │       └── user.service.test.ts
│   │   └── order/
│   │       ├── order.service.ts
│   │       ├── order.repository.ts
│   │       ├── order.schema.ts
│   │       └── order.types.ts
│   │
│   ├── shared/                         # Cross-cutting concerns
│   │   ├── config/
│   │   │   └── env.ts                  # Zod-validated environment variables
│   │   ├── errors/
│   │   │   ├── app-error.ts            # Base error class
│   │   │   └── error-handler.ts        # Global error handler for API routes
│   │   ├── middleware/
│   │   │   ├── auth.ts                 # Auth middleware
│   │   │   └── validate.ts             # Request validation middleware
│   │   ├── lib/
│   │   │   ├── prisma.ts              # Prisma client singleton
│   │   │   └── logger.ts              # Pino logger setup
│   │   └── types/
│   │       └── api.ts                  # Shared API types (ApiResponse, etc.)
│   │
│   └── components/                     # UI components (if full-stack)
│       ├── ui/                         # Primitives
│       └── layout/                     # Layout components
│
├── prisma/
│   ├── schema.prisma                   # Database schema
│   └── migrations/                     # Database migrations
│
├── public/                             # Static assets
├── .env.example                        # Environment template
├── .eslintrc.json                      # ESLint config
├── .prettierrc                         # Prettier config
├── next.config.mjs                     # Next.js config
├── tsconfig.json                       # TypeScript config (strict!)
├── vitest.config.ts                    # Vitest config
└── package.json
```

## API Route Handler Pattern

```typescript
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { CreateUserSchema } from '@/modules/user/user.schema';
import { userService } from '@/modules/user/user.service';
import { handleApiError } from '@/shared/errors/error-handler';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Number(searchParams.get('page') ?? '1');
    const limit = Number(searchParams.get('limit') ?? '20');

    const users = await userService.findAll({ page, limit });
    return NextResponse.json({ data: users });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = CreateUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', details: parsed.error.flatten() } },
        { status: 400 },
      );
    }

    const user = await userService.create(parsed.data);
    return NextResponse.json({ data: user }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
```

## Environment Validation Pattern

```typescript
// src/shared/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
  PORT: z.coerce.number().default(3000),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
```

## Error Handler Pattern

```typescript
// src/shared/errors/error-handler.ts
import { NextResponse } from 'next/server';
import { AppError } from './app-error';
import { logger } from '@/shared/lib/logger';

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    logger.warn('Application error', {
      code: error.code,
      message: error.message,
      context: error.context,
    });

    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.statusCode },
    );
  }

  logger.error('Unhandled error', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  return NextResponse.json(
    { error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } },
    { status: 500 },
  );
}
```

## Scaffolding Checklist

When using this blueprint, verify:
- [ ] `tsconfig.json` has `"strict": true` and all recommended flags
- [ ] `.env.example` exists with ALL required variables (placeholder values only)
- [ ] Prisma client is a singleton (not re-created per request)
- [ ] All API routes use Zod validation at the boundary
- [ ] Error handler is used in every route (no unhandled errors)
- [ ] Logger is configured (not `console.log`)
- [ ] Path aliases (`@/`) are configured in tsconfig AND next.config
- [ ] API documentation is generated or maintained alongside routes
