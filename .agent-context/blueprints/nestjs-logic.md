# Blueprint: NestJS Module (Clean Architecture)

> This blueprint defines how to scaffold a NestJS application or module.
> Every module follows strict layering. No shortcuts.

## Tech Stack
- **Runtime:** Node.js 20+ / Bun
- **Framework:** NestJS 10+
- **Validation:** Zod + nestjs-zod (or class-validator)
- **ORM:** Prisma (or Drizzle)
- **Documentation:** @nestjs/swagger (OpenAPI auto-generated)
- **Testing:** Vitest (or Jest)
- **Logger:** nestjs-pino

## Project Structure

```
project-name/
├── src/
│   ├── main.ts                         # Bootstrap + Swagger setup
│   ├── app.module.ts                   # Root module
│   │
│   ├── modules/                        # Feature modules
│   │   ├── user/
│   │   │   ├── user.module.ts          # Module registration
│   │   │   ├── user.controller.ts      # Transport layer (HTTP)
│   │   │   ├── user.service.ts         # Application layer (business logic)
│   │   │   ├── user.repository.ts      # Infrastructure layer (data access)
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts  # Input validation schemas
│   │   │   │   ├── update-user.dto.ts
│   │   │   │   └── user-response.dto.ts # Output serialization
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts      # Domain entity
│   │   │   ├── guards/
│   │   │   │   └── user-owner.guard.ts # Authorization guard
│   │   │   └── __tests__/
│   │   │       ├── user.controller.spec.ts
│   │   │       └── user.service.spec.ts
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── local.strategy.ts
│   │   │   └── guards/
│   │   │       └── jwt-auth.guard.ts
│   │   │
│   │   └── health/
│   │       ├── health.module.ts
│   │       └── health.controller.ts
│   │
│   ├── shared/                         # Cross-cutting concerns
│   │   ├── config/
│   │   │   ├── app.config.ts           # Zod-validated config
│   │   │   └── database.config.ts
│   │   ├── errors/
│   │   │   ├── app-error.ts            # Base error class
│   │   │   └── http-exception.filter.ts # Global exception filter
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts   # Request logging
│   │   │   └── transform.interceptor.ts # Response transformation
│   │   ├── pipes/
│   │   │   └── zod-validation.pipe.ts   # Zod validation pipe
│   │   ├── decorators/
│   │   │   └── current-user.decorator.ts
│   │   └── lib/
│   │       ├── prisma.service.ts        # Prisma client lifecycle
│   │       └── logger.module.ts         # Pino logger module
│   │
│   └── common/
│       └── types/
│           └── api-response.ts          # Standardized API response type
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── test/                               # E2E tests
│   └── app.e2e-spec.ts
│
├── .env.example
├── nest-cli.json
├── tsconfig.json                       # Strict mode!
├── tsconfig.build.json
├── vitest.config.ts
└── package.json
```

## Module Pattern (The Law)

```typescript
// src/modules/user/user.module.ts
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { UserRepository } from './user.repository';

@Module({
  controllers: [UserController],
  providers: [UserService, UserRepository],
  exports: [UserService],  // Only export the service — never the repository
})
export class UserModule {}
```

## Controller Pattern (Transport ONLY)

```typescript
// src/modules/user/user.controller.ts
import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from '@/shared/guards/jwt-auth.guard';

@ApiTags('Users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 409, description: 'Email already exists' })
  @Post()
  async create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    // Controller does: validate input (via pipe) → call service → return response
    // Controller does NOT: query database, check business rules, format data
    return this.userService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List users with pagination' })
  @Get()
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<UserResponseDto[]> {
    return this.userService.findAll({ page, limit });
  }
}
```

## Service Pattern (Business Logic)

```typescript
// src/modules/user/user.service.ts
import { Injectable, ConflictException } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { hash } from 'bcrypt';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(dto: CreateUserDto): Promise<UserResponseDto> {
    // Business rule: email must be unique
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Business rule: hash password before storage
    const hashedPassword = await hash(dto.password, 12);

    return this.userRepository.create({
      ...dto,
      password: hashedPassword,
    });
  }
}
```

## Repository Pattern (Data Access Only)

```typescript
// src/modules/user/user.repository.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/shared/lib/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findAll(params: { skip: number; take: number }): Promise<User[]> {
    return this.prisma.user.findMany({
      skip: params.skip,
      take: params.take,
      select: { id: true, email: true, name: true, createdAt: true },
      // NEVER select password
    });
  }
}
```

## Swagger Setup (Mandatory)

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger — auto-generates API documentation
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  await app.listen(3000);
}
bootstrap();
```

## Scaffolding Checklist

- [ ] Every module follows Controller → Service → Repository layering
- [ ] DTOs use Zod or class-validator for ALL input validation
- [ ] Swagger decorators on every controller method
- [ ] Global exception filter catches and formats all errors
- [ ] Repository NEVER exposes raw Prisma client outside its module
- [ ] Service is exported, Repository is NOT (module encapsulation)
- [ ] Tests exist for service logic (unit) and controller routes (integration)
- [ ] Environment variables validated with Zod at startup
- [ ] Health check endpoint exists at `/health`
