# C# / .NET Stack Profile — Modern C#, Minimal Ceremony

> C# has evolved massively. Use the modern features.
> If your code looks like it's from 2015, it's wrong.

## Language Version: C# 14+ / .NET 10 LTS

.NET 10 is the latest LTS release (November 2025, 3 years support). C# 14 ships with .NET 10. Use modern features: records, primary constructors, extension members, nullable reference types.

### Nullable Reference Types (Mandatory)
```xml
<!-- In .csproj — ALWAYS enabled -->
<PropertyGroup>
    <Nullable>enable</Nullable>
    <TreatWarningsAsErrors>true</TreatWarningsAsErrors>
</PropertyGroup>
```

### Records for DTOs and Value Objects
```csharp
// BANNED: Mutable class with manual properties
public class UserDto {
    public string Name { get; set; }
    public string Email { get; set; }
}

// REQUIRED: Immutable record
public record CreateUserRequest(string Name, string Email, int Age);
public record UserResponse(Guid Id, string Name, string Email, DateTime CreatedAt);
```

### Primary Constructors (C# 12+)
```csharp
// Clean dependency injection
public class UserService(IUserRepository userRepository, ILogger<UserService> logger)
{
    public async Task<UserResponse> CreateAsync(CreateUserRequest request)
    {
        logger.LogInformation("Creating user {Email}", request.Email);
        var user = await userRepository.CreateAsync(request);
        return user.ToResponse();
    }
}
```

---

## Validation at Boundaries

### Minimal API with FluentValidation
```csharp
public class CreateUserValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Age).InclusiveBetween(13, 150);
    }
}

app.MapPost("/users", async (CreateUserRequest request, IValidator<CreateUserRequest> validator,
    UserService userService) =>
{
    var validation = await validator.ValidateAsync(request);
    if (!validation.IsValid)
        return Results.ValidationProblem(validation.ToDictionary());

    var user = await userService.CreateAsync(request);
    return Results.Created($"/users/{user.Id}", user);
});
```

---

## Project Structure

```
ProjectName/
├── src/
│   ├── ProjectName.Api/                    # Presentation/Transport layer
│   │   ├── Program.cs                      # Entry point + DI setup
│   │   ├── Endpoints/
│   │   │   ├── UserEndpoints.cs            # Minimal API route definitions
│   │   │   └── OrderEndpoints.cs
│   │   ├── Middleware/
│   │   │   └── ExceptionMiddleware.cs
│   │   └── appsettings.json
│   │
│   ├── ProjectName.Application/            # Business logic layer
│   │   ├── Users/
│   │   │   ├── UserService.cs
│   │   │   ├── CreateUserRequest.cs        # DTOs / records
│   │   │   └── UserResponse.cs
│   │   └── Common/
│   │       ├── AppError.cs
│   │       └── IUnitOfWork.cs
│   │
│   ├── ProjectName.Domain/                 # Domain entities (no dependencies)
│   │   ├── Entities/
│   │   │   └── User.cs
│   │   └── Interfaces/
│   │       └── IUserRepository.cs          # Repository contracts
│   │
│   └── ProjectName.Infrastructure/         # Data access, external services
│       ├── Persistence/
│       │   ├── AppDbContext.cs              # EF Core DbContext
│       │   └── UserRepository.cs           # Repository implementation
│       ├── Migrations/
│       └── DependencyInjection.cs          # Extension methods for DI
│
└── tests/
    ├── ProjectName.UnitTests/
    └── ProjectName.IntegrationTests/
```

---

## Preferred Libraries

| Need | Library | Why |
|------|---------|-----|
| Framework | ASP.NET Core 10 Minimal APIs | LTS, lightweight, OpenAPI 3.1, passkey auth |
| ORM | EF Core 10 | LINQ, migrations, vector search, JSON types |
| Validation | FluentValidation | Expressive, testable, separates concerns |
| Testing | xUnit + NSubstitute + Testcontainers | Industry standard for .NET |
| Logging | Serilog + structured sinks | Best structured logging for .NET |
| API docs | Swashbuckle / NSwag | OpenAPI auto-generation |
| Mapping | Mapster or manual extension methods | Mapster faster than AutoMapper |
| HTTP client | `IHttpClientFactory` | Pooled, resilient, built-in |
| Configuration | Options pattern + `IOptions<T>` | Type-safe, validated config |
| Auth | ASP.NET Core Identity / JWT / Passkeys | Built-in passkey support in .NET 10 |
| Cloud-native | .NET Aspire | Orchestration, observability, service defaults |

---

## Banned Patterns

| Pattern | Why | Alternative |
|---------|-----|-------------|
| `Nullable` disabled | NRE everywhere | Always `<Nullable>enable</Nullable>` |
| `dynamic` type | No compile-time safety | Generics or strong types |
| Service Locator | Hidden dependencies | Constructor injection |
| `async void` | Unhandled exceptions crash the app | `async Task` always |
| `string.Format` for SQL | SQL injection | EF Core LINQ or parameterized |
| AutoMapper overuse | Magic mapping hides bugs | Manual mapping or Mapster |
| Throw in constructor | Breaks DI container | Factory methods or validation |
| `static` classes for services | Untestable, no DI | Interface + DI registration |
| Controllers with business logic | Layer leak | Thin controllers, services layer |
