# PHP Stack Profile — Modern PHP, Not Legacy PHP

> PHP 8.x is a different language from PHP 5.
> If your AI writes PHP without type declarations, reject it immediately.

## Language Version: PHP 8.3+ (Laravel 13 Baseline, 8.5 Recommended)

Laravel 13 requires PHP 8.3+. Use PHP 8.5 when your runtime supports it, but avoid forcing 8.5-only syntax in shared packages unless project constraints explicitly require it.

### Strict Types Everywhere
```php
<?php
// REQUIRED: First line of EVERY PHP file
declare(strict_types=1);
```

### Typed Properties, Parameters, and Returns
```php
// BANNED: Untyped PHP
function getUser($id) {
    $user = $this->db->find($id);
    return $user;
}

// REQUIRED: Full type declarations
function getUser(int $id): ?User {
    return $this->userRepository->find($id);
}
```

### Enums (PHP 8.1+)
```php
// BANNED: Magic strings
$status = 'pending';

// REQUIRED: Backed enums
enum OrderStatus: string {
    case Pending = 'pending';
    case Confirmed = 'confirmed';
    case Shipped = 'shipped';
    case Delivered = 'delivered';
}
```

### Readonly Properties and Classes (PHP 8.2+)
```php
// Readonly for DTOs and value objects
readonly class CreateUserDto {
    public function __construct(
        public string $name,
        public string $email,
        public int $age,
    ) {}
}
```

### Optional on PHP 8.5+: Pipe Operator
```php
// Use when your project runtime is locked to PHP 8.5+
$result = $input
    |> 'trim'
    |> 'strtolower'
    |> fn($s) => str_replace(' ', '-', $s);
```

---

## Validation at Boundaries: Laravel Form Requests

```php
// BANNED: Validating in controller body
public function store(Request $request) {
    $data = $request->all();  // Raw, unvalidated!
    User::create($data);      // Mass assignment vulnerability!
}

// REQUIRED: Form Request class
class StoreUserRequest extends FormRequest {
    public function rules(): array {
        return [
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'unique:users'],
            'age' => ['required', 'integer', 'min:13', 'max:150'],
        ];
    }
}

public function store(StoreUserRequest $request): JsonResponse {
    $user = $this->userService->create($request->validated());
    return response()->json($user, 201);
}
```

---

## Project Structure (Laravel)

```
project-name/
├── app/
│   ├── Modules/                        # Feature-based grouping
│   │   ├── User/
│   │   │   ├── Controllers/
│   │   │   │   └── UserController.php  # Transport
│   │   │   ├── Services/
│   │   │   │   └── UserService.php     # Business logic
│   │   │   ├── Repositories/
│   │   │   │   └── UserRepository.php  # Data access
│   │   │   ├── Requests/
│   │   │   │   └── StoreUserRequest.php
│   │   │   ├── Resources/
│   │   │   │   └── UserResource.php    # API response transformer
│   │   │   ├── Models/
│   │   │   │   └── User.php            # Eloquent model
│   │   │   └── Policies/
│   │   │       └── UserPolicy.php      # Authorization
│   │   └── Order/
│   │       └── ...
│   │
│   ├── Shared/
│   │   ├── Exceptions/
│   │   │   └── Handler.php
│   │   └── Middleware/
│
├── database/migrations/
├── routes/api.php
├── tests/
│   ├── Feature/
│   └── Unit/
├── phpstan.neon                         # Static analysis config
└── composer.json
```

---

## Standards

### PSR Compliance
- **PSR-4:** Autoloading (Composer handles this)
- **PSR-12:** Coding style (use PHP-CS-Fixer or Pint)

### Static Analysis: PHPStan Level 8+
```neon
# phpstan.neon
parameters:
    level: 8
    paths:
        - app
```

---

## Preferred Libraries

| Need | Library | Why |
|------|---------|-----|
| Framework | Laravel 13 | Most productive PHP framework with AI SDK, JSON:API resources, and stronger security defaults |
| Validation | Laravel Form Requests | Built-in, declarative |
| ORM | Eloquent | Convention over configuration |
| Testing | PHPUnit / Pest | Pest preferred for readability |
| Static analysis | PHPStan (level 8+) | Catch type errors at build time |
| Formatting | Laravel Pint | Zero-config PSR-12 formatter |
| API resources | Laravel API Resources | Clean response transformation |
| Auth | Laravel Sanctum / Passport | Token-based auth |
| Queue | Laravel Queues | Built-in, multiple drivers |
| API docs | Scribe or L5-Swagger | Auto-generated OpenAPI |

---

## Laravel 13 Guardrails

- Use `PreventRequestForgery` for explicit CSRF middleware references (old aliases still exist but are deprecated).
- Ensure `upsert(..., uniqueBy: ...)` always passes a non-empty `uniqueBy` value.
- Prefer first-party JSON:API resources when you need JSON:API-compliant responses.
- If caching objects, configure `cache.serializable_classes` allow-list explicitly.
- For AI-assisted Laravel projects, use `laravel/boost` `^2.0` and run `php artisan boost:install`.
- Laravel 12 projects are still supported: keep `VerifyCsrfToken` and avoid 13-only API assumptions until framework upgrade is complete.

---

## Banned Patterns

| Pattern | Why | Alternative |
|---------|-----|-------------|
| Missing `declare(strict_types=1)` | Loose type coercion | Always declare |
| `$request->all()` in `create()` | Mass assignment vulnerability | `$request->validated()` |
| Raw SQL with concatenation | SQL injection | Eloquent or query builder with bindings |
| `dd()` / `dump()` in production | Debug leak | Structured logging |
| God controllers (500+ lines) | Violates SRP | Thin controllers, fat services |
| Business logic in models | Model becomes unmaintainable | Service layer |
| `try { } catch (\Exception $e) { }` | Swallows everything | Specific exception types |
| Dynamic properties (deprecated 8.2) | Runtime errors | Declared typed properties |
