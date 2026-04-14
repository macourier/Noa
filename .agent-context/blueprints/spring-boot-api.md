# Blueprint: Spring Boot API

> Java backend API service using Spring Boot 4.x, Java 25+, Spring Data JPA, and Flyway.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Spring Boot 4.x (Spring Framework 7) |
| Language | Java 25+ (LTS) |
| Validation | Jakarta Bean Validation |
| ORM | Spring Data JPA (Hibernate) |
| Migration | Flyway |
| Testing | JUnit 5 + Mockito + Testcontainers |
| DTO mapping | MapStruct |
| Logging | SLF4J + Logback (JSON) |
| API docs | springdoc-openapi (Swagger/Scalar) |
| Build | Gradle (Kotlin DSL) |

---

## Project Structure

```
project-name/
├── src/main/java/com/example/project/
│   ├── Application.java
│   │
│   ├── modules/
│   │   └── user/
│   │       ├── UserController.java
│   │       ├── UserService.java
│   │       ├── UserRepository.java
│   │       ├── UserMapper.java              # MapStruct
│   │       ├── dto/
│   │       │   ├── CreateUserRequest.java   # record + validation
│   │       │   └── UserResponse.java        # record
│   │       ├── entity/
│   │       │   └── UserEntity.java          # JPA entity
│   │       └── exception/
│   │           └── UserNotFoundException.java
│   │
│   └── shared/
│       ├── config/
│       │   ├── SecurityConfig.java
│       │   └── OpenApiConfig.java
│       ├── exception/
│       │   ├── AppException.java
│       │   ├── ErrorCode.java               # Enum
│       │   ├── ErrorResponse.java           # record
│       │   └── GlobalExceptionHandler.java  # @ControllerAdvice
│       └── util/
│           └── LogContext.java
│
├── src/main/resources/
│   ├── application.yml
│   ├── application-dev.yml
│   └── db/migration/
│       └── V1__create_users_table.sql
│
├── src/test/java/com/example/project/
│   └── modules/user/
│       ├── UserServiceTest.java            # Unit
│       └── UserControllerIT.java           # Integration
│
├── build.gradle.kts
├── settings.gradle.kts
├── Dockerfile
└── .env.example
```

---

## File Patterns

### Controller — Thin Transport
```java
@RestController
@RequestMapping("/api/v1/users")
@Tag(name = "Users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Create a user account")
    @ApiResponse(responseCode = "201", description = "User created")
    @ApiResponse(responseCode = "400", description = "Validation error")
    @ApiResponse(responseCode = "409", description = "Email already exists")
    public UserResponse create(@Valid @RequestBody CreateUserRequest request) {
        return userService.create(request);
    }

    @GetMapping
    @Operation(summary = "List users with pagination")
    public Page<UserResponse> list(Pageable pageable) {
        return userService.list(pageable);
    }
}
```

### DTOs — Records with Validation
```java
public record CreateUserRequest(
    @NotBlank @Size(max = 100)
    @Schema(description = "Display name", example = "Jane Doe")
    String name,

    @NotBlank @Email
    @Schema(description = "Unique email address", example = "jane@example.com")
    String email,

    @NotBlank @Size(min = 8)
    String password
) {}

public record UserResponse(
    UUID id,
    String name,
    String email,
    Instant createdAt
) {}
```

### Service — Business Logic
```java
@Service
@Transactional
public class UserService {
    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, UserMapper userMapper,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
    }

    public UserResponse create(CreateUserRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new AppException(ErrorCode.USER_ALREADY_EXISTS,
                "Email already registered: " + request.email());
        }

        UserEntity entity = userMapper.toEntity(request);
        entity.setPassword(passwordEncoder.encode(request.password()));

        UserEntity saved = userRepository.save(entity);
        log.info("User created: id={}, email={}", saved.getId(), saved.getEmail());

        return userMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<UserResponse> list(Pageable pageable) {
        return userRepository.findAll(pageable).map(userMapper::toResponse);
    }
}
```

### Global Error Handler
```java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(AppException.class)
    public ResponseEntity<ErrorResponse> handleAppException(AppException ex) {
        return ResponseEntity
            .status(ex.getHttpStatus())
            .body(new ErrorResponse(ex.getCode().name(), ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        var details = ex.getFieldErrors().stream()
            .map(e -> new ErrorResponse.FieldError(e.getField(), e.getDefaultMessage()))
            .toList();
        return ResponseEntity.badRequest()
            .body(new ErrorResponse("VALIDATION_ERROR", "Invalid input", details));
    }
}

public record ErrorResponse(
    String code,
    String message,
    List<FieldError> details
) {
    public ErrorResponse(String code, String message) {
        this(code, message, List.of());
    }

    public record FieldError(String field, String message) {}
}
```

---

## Scaffolding Checklist

- [ ] Initialize with Spring Initializr (Web, JPA, Validation, Security, Flyway)
- [ ] Set up modular structure under `modules/`
- [ ] Configure `application.yml` with profiles (dev, staging, prod)
- [ ] Create `GlobalExceptionHandler` with `@ControllerAdvice`
- [ ] Create `AppException` + `ErrorCode` enum
- [ ] Set up Flyway with initial migration
- [ ] Configure springdoc-openapi for API docs
- [ ] Create first module following the pattern
- [ ] Set up MapStruct for DTO mapping
- [ ] Create unit + integration tests
- [ ] Run `./gradlew test` — zero failures
