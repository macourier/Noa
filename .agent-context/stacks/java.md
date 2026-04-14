# Java Stack Profile — Enterprise Without the Bloat

> Java can be clean. It just needs discipline.
> Stop writing 200-line classes for a 10-line operation.

## Language Version: Java 25+ (LTS)

Java 25 is the latest LTS release (September 2025, supported until 2033). Use modern Java features aggressively. Do not write pre-Java 21 style code.

### Records Over POJOs
```java
// BANNED: 80-line POJO with getters, setters, equals, hashCode
public class UserDto {
    private String name;
    private String email;
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    // ... 60 more lines of boilerplate
}

// REQUIRED: Record (immutable, auto-generates equals/hashCode/toString)
public record UserDto(String name, String email) {}
```

### Sealed Classes for Domain Variants
```java
// Model fixed set of states or outcomes
public sealed interface PaymentResult
    permits PaymentResult.Success, PaymentResult.Failed, PaymentResult.Pending {

    record Success(String transactionId, BigDecimal amount) implements PaymentResult {}
    record Failed(String reason, String errorCode) implements PaymentResult {}
    record Pending(String retryAfter) implements PaymentResult {}
}
```

### Pattern Matching
```java
// Use switch expressions with pattern matching (Java 21)
return switch (result) {
    case Success s -> ResponseEntity.ok(s);
    case Failed f -> ResponseEntity.badRequest().body(f.reason());
    case Pending p -> ResponseEntity.accepted().body(p);
};
```

---

## Validation at Boundaries: Jakarta Bean Validation

```java
public record CreateUserRequest(
    @NotBlank @Size(max = 100) String name,
    @NotBlank @Email String email,
    @Min(13) @Max(150) int age
) {}

@PostMapping("/users")
public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
    // request is validated by the framework before reaching this method
    return ResponseEntity.status(201).body(userService.create(request));
}
```

---

## Project Structure (Spring Boot 4)

```
project-name/
├── src/main/java/com/example/project/
│   ├── Application.java                    # Entry point
│   │
│   ├── modules/
│   │   ├── user/
│   │   │   ├── UserController.java         # Transport (REST)
│   │   │   ├── UserService.java            # Business logic
│   │   │   ├── UserRepository.java         # Data access (Spring Data)
│   │   │   ├── dto/
│   │   │   │   ├── CreateUserRequest.java  # Input validation (record)
│   │   │   │   └── UserResponse.java       # Output (record)
│   │   │   ├── entity/
│   │   │   │   └── UserEntity.java         # JPA entity
│   │   │   └── exception/
│   │   │       └── UserNotFoundException.java
│   │   └── order/
│   │       └── ...
│   │
│   └── shared/
│       ├── config/                          # Configuration classes
│       ├── exception/
│       │   └── GlobalExceptionHandler.java  # @ControllerAdvice
│       ├── security/                        # Security config
│       └── util/                            # Cross-cutting utilities
│
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/                        # Flyway migrations
│
└── src/test/java/com/example/project/
    └── modules/user/
        └── UserServiceTest.java
```

---

## Preferred Libraries

| Need | Library | Why |
|------|---------|-----|
| Framework | Spring Boot 4.x (Spring Framework 7) | Industry standard, virtual threads native support |
| Validation | Jakarta Bean Validation | Built into Spring Boot |
| ORM | Spring Data JPA / Hibernate | Standard, powerful |
| Migration | Flyway | SQL-based, version controlled |
| Mapping | MapStruct | Compile-time, type-safe DTO mapping |
| Testing | JUnit 5 + Mockito + Testcontainers | Standard stack |
| HTTP client | Spring RestClient / WebClient | RestClient (sync, new in Boot 4), WebClient (reactive) |
| Logging | SLF4J + Logback (or Log4j2) | Standard, structured JSON output |
| Build | Gradle (Kotlin DSL) or Maven | Gradle preferred for modern projects |
| API docs | springdoc-openapi | Auto-generates OpenAPI from code |

---

## Banned Patterns

| Pattern | Why | Alternative |
|---------|-----|-------------|
| Raw `String` for IDs | No type safety | `UUID` or typed ID wrapper |
| `null` returns | NullPointerException bait | `Optional<T>` for query results |
| Checked Exception abuse | Forces catch-or-throw chains | Unchecked `RuntimeException` subclasses |
| Field injection (`@Autowired`) | Hidden deps, untestable | Constructor injection |
| `System.out.println` | Not structured, not configurable | SLF4J logger |
| Deep class hierarchies | Fragile, hard to reason | Composition + interfaces |
| God services (500+ lines) | Violates SRP | Split into focused services |
| `@Transactional` on controller | Layer leak | Only on service methods |
