# Ruby on Rails Engineering Standards

> Rails provides "Convention over Configuration," but convention does not mean "put all your business logic in ActiveRecord callbacks."

## Core Tenets
1. **Skinny Models, Skinny Controllers, Fat Services:** The default Rails MVC is insufficient for complex domains. Extract business logic into Service Objects (Interactors).
2. **Death to N+1 Queries:** The `bullet` gem is mandatory in development and test environments. Any N+1 query is a blocker.
3. **No Hidden Magic:** Avoid deeply nested or complex ActiveRecord callbacks (`before_save`, `after_commit`). They obscure the flow of data. If an action has side effects, orchestrate it in a Service Object.
4. **Strong Parameters Only:** Never trust user input. Always permit explicit parameters in the controller layer before passing data down.

## Architecture & Layering (The Service Object Pattern)
Default Rails couples the HTTP request cycle tightly to the Database via the Model. We break this.

### 1. Controllers (Transport Layer)
- **Role:** Handle HTTP requests, parse parameters (Strong Params), authenticate/authorize the user, call the Service Object, and return the HTTP response/JSON.
- **BANNED:** Calling `Model.create()`, `Model.update()`, or writing any business calculations in the controller.
- **ALLOWED:** `MyService.call(params)`

### 2. Service Objects (Application Layer)
- **Role:** The orchestrator. Located in `app/services/`.
- **Structure:** Usually plain Ruby objects (POROs) with a single public `call` method.
- **Responsibility:** Executes the business transaction, handling database operations, sending emails, or enqueuing background jobs.

### 3. Models (Domain & Persistence Layer)
- **Role:** ActiveRecord models should only contain associations (`belongs_to`, `has_many`), scopes, and simple data validations (e.g., `validates :email, presence: true`).
- **BANNED:** Complex business logic, sending emails, API calls to third parties.

## Ecosystem & Dependencies (March 2026)
- **API Mode:** Use `rails new my_api --api` for backend-only projects.
- **Background Jobs:** `sidekiq` is the standard. Default `ActiveJob` should map to a Sidekiq backend (powered by Redis).
- **Authentication/Authorization:** `devise` (if needed, though often overkill for raw APIs; consider `jwt` + custom auth) and `pundit` (mandatory for authorization). Avoid `cancancan`.
- **Testing:** `rspec-rails` and `factory_bot_rails`. Default `minitest` and `fixtures` are explicitly banned for Agentic-Senior-Core projects.
- **Linting:** `rubocop` is mandatory. The build must fail if RuboCop fails.

## Anti-Patterns (Zero Tolerance)

### 1. The Fat Model Callback Hell
```ruby
# ❌ BANNED: The model side-effect
class User < ApplicationRecord
  after_create :send_welcome_email

  def send_welcome_email
    UserMailer.welcome(self).deliver_now
  end
end

# ✅ REQUIRED: The Service Object Orchestrator
class Users::CreateService
  def self.call(params)
    user = User.new(params)
    if user.save
      UserMailer.welcome(user).deliver_later
    end
    user
  end
end
```

### 2. N+1 Queries in Responses
```ruby
# ❌ BANNED: Will execute 101 queries for 100 posts
def index
  @posts = Post.all
  render json: @posts.map { |p| { title: p.title, author: p.author.name } }
end

# ✅ REQUIRED: Eager loading
def index
  @posts = Post.includes(:author).all
  # ...
end
```

### 3. Logic in Views/Serializers
If using ActiveModelSerializers, Jbuilder, or Blueprinter, never perform database queries or heavy calculations in the serialization phase.

## Background Jobs (Sidekiq)
- **Rule:** Any operation taking longer than 300ms (e.g., sending an email, generating a PDF, calling an external API) **MUST** be pushed to a background job (`.deliver_later` or `MyWorker.perform_async`).
- **Rule:** Background job parameters must be simple types (strings, integers, IDs). **NEVER** pass an ActiveRecord object directly to a Sidekiq worker (it might be stale when the job runs). Pass the `user_id` instead.
