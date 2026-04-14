# Blueprint: Laravel API

> PHP backend API service using Laravel 13, PHP 8.3+, Form Requests, Eloquent, and Scribe for docs.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Laravel 13 |
| Validation | Form Requests |
| ORM | Eloquent |
| Migration | Laravel Migrations |
| Testing | Pest PHP |
| Static analysis | PHPStan (level 8) |
| Formatting | Laravel Pint |
| API docs | Scribe |

## Laravel 13 Upgrade Guardrails

- Target `laravel/framework:^13.0` with PHP 8.3+.
- Use `PreventRequestForgery` when explicitly disabling or excluding CSRF middleware in tests and routes.
- Keep `upsert` calls explicit with a non-empty `uniqueBy` value for MySQL and MariaDB paths.
- Decide cache object strategy up front: primitive payloads, or explicit `serializable_classes` allow-list.
- For existing Laravel 12 projects, keep framework-12-compatible middleware and APIs until upgrade is done; treat this blueprint as target-state guidance.

---

## Project Structure

```
project-name/
├── app/
│   ├── Modules/
│   │   └── User/
│   │       ├── Controllers/
│   │       │   └── UserController.php
│   │       ├── Services/
│   │       │   └── UserService.php
│   │       ├── Repositories/
│   │       │   └── UserRepository.php
│   │       ├── Requests/
│   │       │   ├── StoreUserRequest.php
│   │       │   └── UpdateUserRequest.php
│   │       ├── Resources/
│   │       │   └── UserResource.php
│   │       ├── Models/
│   │       │   └── User.php
│   │       ├── Policies/
│   │       │   └── UserPolicy.php
│   │       └── Exceptions/
│   │           └── UserNotFoundException.php
│   │
│   ├── Shared/
│   │   ├── Exceptions/
│   │   │   └── Handler.php
│   │   └── Traits/
│   │       └── ApiResponse.php
│   │
│   └── Providers/
│
├── database/
│   ├── factories/
│   │   └── UserFactory.php
│   ├── migrations/
│   └── seeders/
│
├── routes/
│   └── api.php
│
├── tests/
│   ├── Feature/
│   │   └── User/
│   │       └── UserEndpointTest.php
│   └── Unit/
│       └── User/
│           └── UserServiceTest.php
│
├── phpstan.neon
├── .env.example
├── composer.json
└── Dockerfile
```

---

## File Patterns

### Controller — Thin Transport Layer
```php
<?php

declare(strict_types=1);

namespace App\Modules\User\Controllers;

use App\Modules\User\Requests\StoreUserRequest;
use App\Modules\User\Resources\UserResource;
use App\Modules\User\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\Response;

final class UserController
{
    public function __construct(
        private readonly UserService $userService,
    ) {}

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->userService->create($request->validated());

        return (new UserResource($user))
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function index(): AnonymousResourceCollection
    {
        return UserResource::collection(
            $this->userService->listPaginated()
        );
    }
}
```

### Form Request — Boundary Validation
```php
<?php

declare(strict_types=1);

namespace App\Modules\User\Requests;

use Illuminate\Foundation\Http\FormRequest;

final class StoreUserRequest extends FormRequest
{
    /** @return array<string, array<int, string>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }
}
```

### Service — Business Logic
```php
<?php

declare(strict_types=1);

namespace App\Modules\User\Services;

use App\Modules\User\Models\User;
use App\Modules\User\Repositories\UserRepository;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

final class UserService
{
    public function __construct(
        private readonly UserRepository $userRepository,
    ) {}

    /** @param array{name: string, email: string, password: string} $data */
    public function create(array $data): User
    {
        $data['password'] = Hash::make($data['password']);
        $user = $this->userRepository->create($data);

        Log::info('User created', ['user_id' => $user->id, 'email' => $user->email]);

        return $user;
    }

    public function listPaginated(int $perPage = 15): LengthAwarePaginator
    {
        return $this->userRepository->paginate($perPage);
    }
}
```

### API Resource — Response Transformer
```php
<?php

declare(strict_types=1);

namespace App\Modules\User\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Modules\User\Models\User */
final class UserResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'created_at' => $this->created_at?->toISOString(),
        ];
        // NEVER expose: password, remember_token, email_verified_at (unless needed)
    }
}
```

---

## Scaffolding Checklist

- [ ] Create Laravel project: `composer create-project laravel/laravel:^13.0`
- [ ] Confirm core dependencies: `laravel/framework:^13.0`, `laravel/tinker:^3.0`, `phpunit/phpunit:^12.0`, `pestphp/pest:^4.0`
- [ ] Optional AI workflow: install `laravel/boost:^2.0` and run `php artisan boost:install`
- [ ] Set up modular structure under `app/Modules/`
- [ ] Create shared error handler with consistent JSON responses
- [ ] Create shared `ApiResponse` trait for standard response format
- [ ] Install and configure PHPStan level 8
- [ ] Install and configure Laravel Pint
- [ ] Install Pest PHP for testing
- [ ] Install Scribe for API documentation
- [ ] Create first module following the pattern above
- [ ] Create `.env.example` with all required variables
- [ ] Run `php artisan test`, `./vendor/bin/phpstan`, `./vendor/bin/pint` — zero errors
