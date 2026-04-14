# Input Validation & Parameterized Queries

**Tier:** ADVANCE | **Source:** awesome-copilot (boundaries) + antigravity (security halt) + minimax (validation patterns)

## Why Validation at Boundaries Matters

Rule: **All external input is untrusted.** Validate at API entry point before touching business logic or database.

Common vulnerabilities when skipped:
- SQL injection: Unparameterized queries with user input
- Type confusion: String input treated as number
- Business logic bypass: Missing eligibility checks
- Data corruption: Invalid state transitions

**SECURITY HALT:** If you find unvalidated input directly in database queries, stop feature development. Fix first.

---

## Layer 1: HTTP Request Validation

Validate shape, type, required fields **before** touching service layer.

### Node.js + Zod (Type-Safe)

```javascript
import { z } from 'zod';

const chargeSchema = z.object({
  amount: z.number().min(50).max(100000),
  customerId: z.string().uuid(),
  cardToken: z.string().min(10).max(1000),
});

app.post('/payments/charge', async (req, res) => {
  // Validate shape + types
  const parsed = chargeSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: 'Invalid request',
      details: parsed.error.errors
    });
  }

  // Now safe to pass to service
  const result = await paymentService.charge(parsed.data);
  res.json(result);
});
```

### Python + Pydantic

```python
from pydantic import BaseModel, Field

class ChargeRequest(BaseModel):
    amount: float = Field(..., ge=50, le=100000)
    customer_id: str = Field(..., min_length=36, max_length=36)
    card_token: str = Field(..., min_length=10, max_length=1000)

@app.post("/payments/charge")
async def charge_payment(req: ChargeRequest):
    result = await payment_service.charge(req.dict())
    return result
```

---

## Layer 2: SQL Query Parameterization

###  WRONG (SQL Injection)

```javascript
const customerId = req.body.customerId;
const query = `SELECT * FROM customers WHERE id = '${customerId}'`;
// Input: '; DROP TABLE customers; --'
```

###  CORRECT (Parameterized)

```javascript
await db.one(
  'SELECT * FROM customers WHERE id = $1',
  [customerId]  // Parameterized
);
```

---

## Layer 3: Business Logic Validation

```javascript
async charge({ amount, customerId, cardToken }) {
  // Already validated: amount in range, customerId is UUID

  // Now validate business rules
  const customer = await customerRepo.findById(customerId);
  if (!customer) throw new NotFoundError('Customer');
  if (customer.status !== 'active') throw new BusinessError('Account suspended');
  if (customer.dailyLimit && customer.dailySpent + amount > customer.dailyLimit) {
    throw new BusinessError('Daily limit exceeded');
  }

  // Safe to proceed
}
```

---

## Checklist

- [ ] All route handlers validate request shape (Zod/Pydantic)
- [ ] All database queries use parameterized statements
- [ ] All external API responses validated before use
- [ ] Business rules checked in Service layer
- [ ] Error messages safe (no SQL leaked to client)
- [ ] Tests cover invalid inputs
- Keep validation deterministic and testable.