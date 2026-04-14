# Blueprint: ASP.NET Minimal API (.NET 10)

> Minimal APIs are not "simple APIs". They're production-ready APIs with less ceremony.
> Controller bloat is not a feature.

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| Runtime | .NET 10 LTS | Latest LTS (Nov 2025) |
| Language | C# 14 | Records, primary constructors, required members |
| API Style | Minimal APIs with `MapGroup` | Less boilerplate, same power |
| Validation | FluentValidation | Fluent, testable, powerful |
| ORM | EF Core 10 | Mature, LINQ-to-SQL, migrations |
| Auth | ASP.NET Identity + Passkeys | Built-in, modern auth |
| API Docs | Swashbuckle / NSwag + Scalar | OpenAPI 3.1 generation |
| Testing | xUnit + NSubstitute + Verify | Community standard |
| Logging | Serilog + OpenTelemetry | Structured, correlated |
| Cloud | .NET Aspire (optional) | Service orchestration, dev containers |

## Project Structure

```
MyApp.sln
├── src/
│   ├── MyApp.Api/                      # Presentation layer
│   │   ├── Program.cs                  # Entry point + DI + middleware
│   │   ├── Endpoints/                  # Minimal API endpoint groups
│   │   │   ├── UserEndpoints.cs
│   │   │   └── OrderEndpoints.cs
│   │   ├── Filters/                    # Endpoint filters (auth, validation)
│   │   ├── Models/                     # Request/response DTOs
│   │   │   ├── Requests/
│   │   │   └── Responses/
│   │   ├── appsettings.json
│   │   └── MyApp.Api.csproj
│   │
│   ├── MyApp.Application/             # Business logic layer
│   │   ├── Services/
│   │   │   ├── IUserService.cs
│   │   │   └── UserService.cs
│   │   ├── Validators/
│   │   │   └── CreateUserValidator.cs
│   │   ├── Mappings/                   # Entity ↔ DTO mapping
│   │   └── MyApp.Application.csproj
│   │
│   ├── MyApp.Domain/                   # Core domain (zero dependencies)
│   │   ├── Entities/
│   │   │   ├── User.cs
│   │   │   └── Order.cs
│   │   ├── ValueObjects/
│   │   ├── Enums/
│   │   ├── Errors/
│   │   │   └── DomainErrors.cs
│   │   └── MyApp.Domain.csproj
│   │
│   └── MyApp.Infrastructure/          # Data access + external services
│       ├── Persistence/
│       │   ├── AppDbContext.cs
│       │   ├── Configurations/         # EF Core entity configs
│       │   │   └── UserConfiguration.cs
│       │   ├── Repositories/
│       │   │   └── UserRepository.cs
│       │   └── Migrations/
│       ├── Services/                   # External service adapters
│       └── MyApp.Infrastructure.csproj
│
├── tests/
│   ├── MyApp.UnitTests/
│   ├── MyApp.IntegrationTests/
│   └── MyApp.ArchitectureTests/        # Enforce layer boundaries
│
├── Directory.Build.props               # Central package versions
├── .editorconfig
└── Dockerfile
```

## Key Patterns

### Endpoint Groups with MapGroup

```csharp
// Endpoints/UserEndpoints.cs
public static class UserEndpoints
{
    public static RouteGroupBuilder MapUserEndpoints(this IEndpointRouteBuilder app)
    {
        var group = app.MapGroup("/api/users")
            .WithTags("Users")
            .RequireAuthorization();

        group.MapGet("/", GetAllUsers)
            .WithName("GetAllUsers")
            .WithSummary("Get all users with pagination")
            .Produces<PagedResponse<UserResponse>>(200);

        group.MapGet("/{id:guid}", GetUserById)
            .WithName("GetUserById")
            .Produces<UserResponse>(200)
            .ProducesProblem(404);

        group.MapPost("/", CreateUser)
            .WithName("CreateUser")
            .Produces<UserResponse>(201)
            .ProducesValidationProblem();

        return group;
    }

    private static async Task<IResult> GetUserById(
        Guid id,
        IUserService userService,
        CancellationToken ct)
    {
        var user = await userService.GetByIdAsync(id, ct);
        return user is not null
            ? TypedResults.Ok(user.ToResponse())
            : TypedResults.Problem(statusCode: 404, title: "User not found");
    }

    private static async Task<IResult> CreateUser(
        CreateUserRequest request,
        IValidator<CreateUserRequest> validator,
        IUserService userService,
        CancellationToken ct)
    {
        var validation = await validator.ValidateAsync(request, ct);
        if (!validation.IsValid)
            return TypedResults.ValidationProblem(validation.ToDictionary());

        var user = await userService.CreateAsync(request, ct);
        return TypedResults.Created($"/api/users/{user.Id}", user.ToResponse());
    }
}
```

### Program.cs (Clean Composition Root)

```csharp
var builder = WebApplication.CreateBuilder(args);

// Service registration (extension methods from each layer)
builder.Services.AddApplicationServices();
builder.Services.AddInfrastructureServices(builder.Configuration);
builder.Services.AddApiServices();

// OpenTelemetry
builder.Services.AddOpenTelemetry()
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation()
        .AddEntityFrameworkCoreInstrumentation()
        .AddOtlpExporter())
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddOtlpExporter());

var app = builder.Build();

// Middleware pipeline
app.UseExceptionHandler();
app.UseAuthentication();
app.UseAuthorization();

// Map endpoints
app.MapUserEndpoints();
app.MapOrderEndpoints();
app.MapHealthChecks("/health");

// Scalar API docs
app.MapScalarApiReference();

app.Run();
```

### Domain Entity (Record-Based)

```csharp
// Domain/Entities/User.cs
public sealed class User
{
    public required Guid Id { get; init; }
    public required string Email { get; init; }
    public required string DisplayName { get; set; }
    public DateTimeOffset CreatedAt { get; init; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? DeletedAt { get; private set; }

    public void SoftDelete() => DeletedAt = DateTimeOffset.UtcNow;
}
```

### FluentValidation

```csharp
// Application/Validators/CreateUserValidator.cs
public sealed class CreateUserValidator : AbstractValidator<CreateUserRequest>
{
    public CreateUserValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(256);

        RuleFor(x => x.DisplayName)
            .NotEmpty()
            .MinimumLength(1)
            .MaximumLength(100);
    }
}
```

## .NET Aspire (Optional, for Multi-Service)

For projects with multiple services, databases, and caches:

```csharp
// AppHost/Program.cs
var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("db")
    .AddDatabase("myapp");

var redis = builder.AddRedis("cache");

builder.AddProject<Projects.MyApp_Api>("api")
    .WithReference(postgres)
    .WithReference(redis);

builder.Build().Run();
```

## Scaffolding Checklist

- [ ] Create solution with 4 projects (Api, Application, Domain, Infrastructure)
- [ ] Configure `Directory.Build.props` for shared package versions
- [ ] Set up `Program.cs` with clean service registration
- [ ] Create endpoint groups using `MapGroup` pattern
- [ ] Configure EF Core with typed `DbContext` and entity configurations
- [ ] Add FluentValidation with automatic registration
- [ ] Set up Serilog with structured logging
- [ ] Configure OpenTelemetry tracing and metrics
- [ ] Add Scalar or Swagger for OpenAPI documentation
- [ ] Create health check endpoint (`/health`)
- [ ] Set up xUnit test projects with NSubstitute
- [ ] Add architecture tests (enforce layer boundaries)
- [ ] Create `Dockerfile` (multi-stage build)
- [ ] Enable nullable reference types project-wide
