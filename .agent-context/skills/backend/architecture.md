# Backend Architecture

**Tier:** EXPERT | **Source:** awesome-copilot (layering) + antigravity (microservices) + minimax (project structure)

## Overview

Backend architecture defines how code is organized, how concerns separate, and how services scale. Three critical decisions:
1. **Layered separation** - Transport (HTTP) vs Service (logic) vs Repository (data)
2. **Monolith or microservices** - When to split, when to keep together
3. **Dependency direction** - Which layers can import which

Wrong choices here create spaghetti code, circular dependencies, and costly rewrites. Right choices enable independent scaling, testing, and team autonomy.

---

## Part 1: Layered Architecture (Transport -> Service -> Repository)

### The Model

Clean architecture separates concerns into independent layers:

```
┌─────────────────────────────────┐
│  HTTP / Handlers / Middleware   │ <- TRANSPORT LAYER
├─────────────────────────────────┤
│  Business Logic / Orchestration │ <- SERVICE LAYER
├─────────────────────────────────┤
│  Data Access / Queries / Caching│ <- REPOSITORY LAYER
├─────────────────────────────────┤
│  External APIs / Databases      │ <- INFRASTRUCTURE
└─────────────────────────────────┘
```

**Dependency Rule:** Layer below can NEVER import layer above.
- Transport CAN import Service 
- Service CAN import Repository 
- Repository can NEVER import Service 
- Service can NEVER import Transport 

### TRANSPORT LAYER (HTTP Handlers, Middleware)

**Responsibility:** Parse HTTP requests, serialize responses, handle authentication, logging middleware.

**What goes here:**
- Request validation (type, format checks)
- Middleware (auth, CORS, rate limiting, logging)
- Route handlers (receive request -> call service -> return response)
- Response serialization (JSON, XML, protobuf)

**What does NOT go here:**
- Business logic (validation rules, calculations, state transitions)
- Database queries
- Feature flags, configuration decisions

**Example (Node.js + Express):**
```javascript
//  CORRECT: Transport layer
app.post('/payments/charge', 
  authenticate,                    // Middleware
  validateRequest(chargeSchema),   // Format check
  async (req, res) => {
    const result = await paymentService.charge({
      amount: req.body.amount,
      customerId: req.body.customerId,
      idempotencyKey: req.headers['idempotency-key']
    });
    res.json(result);
  }
);

// Service layer has business logic:
async function charge({ amount, customerId, idempotencyKey }) {
  // Check customer credit, calculate fees, call repository
  // NO HTTP HERE
}
```

**Anti-Pattern:** Business logic in handler

```javascript
//  WRONG: Business logic in transport
app.post('/payments/charge', async (req, res) => {
  const customer = await db.query('SELECT * FROM customers WHERE id = ?', customerId);
  if (customer.balance < amount) throw new Error('Insufficient funds');  // <- Logic?
  const fee = amount * 0.03 + 0.30;  // <- Math in handler?
  const charged = await db.query('UPDATE customers SET balance = balance - ?', amount + fee);
  // ...
});
```

### SERVICE LAYER (Business Logic, Orchestration)

**Responsibility:** Business rules, data transformations, orchestration across repositories, feature flags, error handling.

**What goes here:**
- Validation rules (customer eligibility, amount limits)
- Business calculations (fees, commissions, discounts)
- Orchestration (call repo A, then repo B, handle failure)
- Idempotency keys for distributed transactions
- Feature flags / circuit breakers

**What does NOT go here:**
- Database queries (use Repository)
- HTTP parsing, serialization (use Transport)
- External API calls directly (wrap in Repository-like abstraction)

**Example:**
```javascript
class PaymentService {
  constructor(customerRepo, paymentRepo, ledgerRepo) {
    this.customerRepo = customerRepo;
    this.paymentRepo = paymentRepo;
    this.ledgerRepo = ledgerRepo;
  }

  async charge({ amount, customerId, idempotencyKey }) {
    // Check idempotency first (prevent double-charge)
    const existing = await this.paymentRepo.findByIdempotencyKey(idempotencyKey);
    if (existing) return existing;  // Already charged

    // Business validation
    const customer = await this.customerRepo.findById(customerId);
    if (!customer) throw new NotFoundError('Customer not found');
    if (customer.status !== 'active') throw new BusinessError('Account inactive');
    if (amount < 50 || amount > 100000) throw new ValidationError('Amount out of range');

    // Calculate fees
    const fee = this._calculateFee(amount, customer.tier);
    const total = amount + fee;

    // Orchestrate transaction
    try {
      const payment = await this.paymentRepo.create({
        customerId,
        amount,
        fee,
        total,
        idempotencyKey,
        status: 'pending'
      });

      await this.ledgerRepo.debit({
        customerId,
        amount: total,
        reason: `Payment ${payment.id}`,
        paymentId: payment.id
      });

      await this.paymentRepo.update(payment.id, { status: 'completed' });
      return payment;
    } catch (err) {
      await this.paymentRepo.update(payment.id, { status: 'failed', error: err.message });
      throw err;
    }
  }

  _calculateFee(amount, tier) {
    const baseRate = { silver: 0.029, gold: 0.019, platinum: 0.009 }[tier];
    const flatFee = { silver: 0.50, gold: 0.30, platinum: 0 }[tier];
    return Math.round(amount * baseRate * 100) / 100 + flatFee;
  }
}
```

### REPOSITORY LAYER (Data Access, Queries)

**Responsibility:** Data retrieval, persistence, query optimization, caching, connection pooling.

**What goes here:**
- Database queries (SELECT, INSERT, UPDATE, DELETE)
- Prepared statements, parameterized queries
- Indexes, query optimization
- Batch operations
- Query caching (cache-aside, write-through)
- Connection pooling

**What does NOT go here:**
- Business logic (decisions based on data)
- HTTP handling
- External API calls (unless wrapping as data source)

**Example:**
```javascript
class PaymentRepository {
  constructor(db) {
    this.db = db;
  }

  async findByIdempotencyKey(key) {
    return this.db.one(
      'SELECT * FROM payments WHERE idempotency_key = $1',
      [key]  // Parameterized query 
    );
  }

  async create(payment) {
    return this.db.one(
      `INSERT INTO payments 
       (customer_id, amount, fee, total, idempotency_key, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [payment.customerId, payment.amount, payment.fee, payment.total, 
       payment.idempotencyKey, payment.status]
    );
  }

  async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;
    for (const [key, val] of Object.entries(updates)) {
      fields.push(`${key} = $${paramCount++}`);
      values.push(val);
    }
    values.push(id);
    return this.db.one(
      `UPDATE payments SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
  }
}
```

---

## Part 2: Monolith vs Microservices (Decision Framework)

### When to Stay Monolithic

**Keep monolith if:**
- Team < 30 people (communication overhead still low)
- Feature dependencies high (changing one feature requires touching multiple areas)
- Deployment frequency < weekly (update entire system at once is acceptable)
- Data strongly coupled (customers, orders, payments in one domain)
- Performance latency-sensitive < 100ms (in-process calls beat RPC)

**Monolith advantages:**
- Single deployment unit (easier to roll forward/back)
- ACID transactions easy (in same database)
- Debugging simpler (logs in one place, single memory space)
- Performance: in-memory function calls vs HTTP RPC

**Example: Monolithic e-commerce platform**
```
monolith/
├── transport/
│   ├── auth.js
│   ├── products.js
│   ├── orders.js
│   └── payments.js
├── services/
│   ├── authService.js
│   ├── productService.js
│   ├── orderService.js
│   └── paymentService.js
└── repositories/
    ├── userRepo.js
    ├── productRepo.js
    ├── orderRepo.js
    └── paymentRepo.js
```

All services run in same process, same database. Easy to refactor, deploy, test.

### When to Split to Microservices

**Split ONLY if:**
- Team > 30 people (need autonomy + independent deployments)
- Services truly independent (different databases, different deployment cadences)
- You can tolerate 100-500ms RPC latency between services
- Each service has independent scaling needs

**Microservices disadvantages:**
- Distributed transactions (eventual consistency or sagas)
- Debugging spans multiple services/logs (correlation IDs mandatory)
- RPC latency adds up (cascade failures likely)
- Ops complexity increases 10x (monitoring, health checks, circuit breakers)

**Trigger for splitting:** When layered architecture + teamwork alignment breaks down.

**NOT OK to split:**
- Customer service and Order service can't be truly independent (customers have orders)
- Payment and Order service tightly coupled (can't process payment independent of order state)

**OK to split:**
- User authentication (separate service, used by many)
- Notification service (email/SMS, independent of order flow)
- Analytics service (read-only, independent queries)

**Strangler Fig Pattern (low-risk migration):**

Start monolithic. When it's time to extract Payment service:
1. Keep monolith running
2. Create Payment microservice alongside
3. Route new Payment requests -> new service
4. Keep old requests going to monolith's PaymentService
5. Over months, migrate & retire old code
6. Remove dependency from monolith

```javascript
// Monolith, gradually being strangled:
async function charge(customerId, amount) {
  if (featureFlags.usePaymentMicroservice) {
    // Call remote service
    return await paymentMicroservice.charge({ customerId, amount });
  } else {
    // Old in-process service
    return await paymentService.charge({ customerId, amount });
  }
}
```

---

## Part 3: Dependency Management (ABOVE LINE)

### The Problem

As codebases grow, circular dependencies emerge:
- Service imports Repository 
- Repository imports utility in Service  (closes circle)
- Creates tight coupling, hard to test, risky refactors

### The Solution: Dependency Auditor

**Enforce dependency direction at build time** (ABOVE LINE improvement not in any benchmark repo).

**Check:**
1. Transport layer files import only Transport + Service
2. Service layer files import only Service + Repository
3. Repository layer files import only Repository (no Service)
4. No circular imports within layer

**Tool:**
```bash
npm run audit:dependencies  # Pre-commit gate
```

---

## Checklist: Did You Get Architecture Right?

Before shipping a new service, verify:

- [ ] **Layer separation:** Transport doesn't contain business logic
- [ ] **Dependency direction:** No circles (Service imports Repo only, not vice versa)
- [ ] **Repository abstraction:** No business logic in SQL queries
- [ ] **Service orchestration:** Complex flows live in Service, not Transport
- [ ] **Error handling:** Errors typed + recovery strategies clear
- [ ] **Idempotency:** Distributed transactions have idempotency keys
- [ ] **Feature-based:** Related code lives together, not scattered across service/util folders
- [ ] **Testing:** Unit tests mock Repository (test business logic), no DB
- [ ] **Documentation:** README explains layer separation for this service

---

## References

- [Awesome-Copilot Architecture](https://github.com/github/awesome-copilot)
- [Antigravity Microservices](https://github.com/sickn33/antigravity-awesome-skills)
- [MiniMax Fullstack Structure](https://github.com/MiniMax-AI/skills)