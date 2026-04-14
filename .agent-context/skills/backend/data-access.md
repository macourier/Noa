# Database Patterns & Query Optimization

**Tier:** EXPERT | **Source:** awesome-copilot (schema design) + antigravity (N+1 patterns) + minimax (Django ORM)

## Part 1: Schema Design (3NF Normalization)

### The Problem: Data Redundancy

 **Denormalized (redundant):**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  customer_name VARCHAR(255),      -- Redundant: can look up from customers table
  customer_email VARCHAR(255),     -- Redundant
  customer_tier VARCHAR(50),       -- Redundant
  amount DECIMAL(10,2),
  created_at TIMESTAMP
);
```

Problem: Update customer name -> must update in `orders` table too (data inconsistency risk).

###  **3NF (Normalized):**

```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  tier VARCHAR(50),
  created_at TIMESTAMP
);

CREATE TABLE orders (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id),
  amount DECIMAL(10,2),
  created_at TIMESTAMP
);

-- To get order with customer name:
SELECT o.id, o.amount, c.name
FROM orders o
JOIN customers c ON o.customer_id = c.id;
```

**Benefits:**
- Single source of truth (customer name in one place)
- Updates atomic (change name, not duplicated)
- Consistent joins

### When to Break 3NF (Denormalization)

Denormalize **only if** profiling shows JOIN is bottleneck:

```sql
-- ONLY if "SELECT ... JOIN customers" is slow:
ALTER TABLE orders ADD COLUMN customer_name VARCHAR(255);

-- Keep redundancy in sync with trigger:
CREATE TRIGGER sync_customer_name
AFTER UPDATE ON customers
FOR EACH ROW
UPDATE orders SET customer_name = NEW.name WHERE customer_id = NEW.id;
```

---

## Part 2: Indexes (FK + Query Optimization)

### Rule: Always Index Foreign Keys

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  customer_id UUID NOT NULL REFERENCES customers(id),
  created_at TIMESTAMP,
  
  -- Foreign key queries need fast lookup
  INDEX idx_customer_id (customer_id),
  -- Query by date also common
  INDEX idx_created_at (created_at)
);
```

Without index on `customer_id`, query `SELECT * FROM orders WHERE customer_id = ?` scans entire table (O(n)).

With index, it's O(log n) via B-tree lookup.

### Composite Indexes (When Queries Filter by Multiple Columns)

```sql
-- If queries often filter by (customer_id, created_at > date):
INDEX idx_customer_date (customer_id, created_at DESC);

-- Good for: SELECT * FROM orders WHERE customer_id = ? AND created_at > ?
-- Bad for: SELECT * FROM orders WHERE created_at > ? (first column must match)
```

---

## Part 3: Query Patterns (Anti-Patterns)

### Anti-Pattern #1: N+1 Query Problem

 **WRONG:**
```javascript
const customers = await db.query('SELECT * FROM customers');
for (const customer of customers) {
  customer.orders = await db.query(
    'SELECT * FROM orders WHERE customer_id = $1',
    [customer.id]  // <- Executes once per customer (N+1 queries!)
  );
}
```

**Cost:** 1 query (customers) + N queries (orders per customer) = **N+1 total**. If 100 customers, 101 queries.

 **CORRECT (JOIN):**
```javascript
const results = await db.query(`
  SELECT 
    c.id as customer_id,
    c.name,
    o.id as order_id,
    o.amount
  FROM customers c
  LEFT JOIN orders o ON c.id = o.customer_id
`);

// Post-process to group
const customersWithOrders = {};
for (const row of results) {
  if (!customersWithOrders[row.customer_id]) {
    customersWithOrders[row.customer_id] = {
      id: row.customer_id,
      name: row.name,
      orders: []
    };
  }
  if (row.order_id) {
    customersWithOrders[row.customer_id].orders.push({ id: row.order_id, amount: row.amount });
  }
}
```

**Cost:** 1 JOIN query (fast).

### Anti-Pattern #2: SELECT * (Load Unnecessary Columns)

 **WRONG:**
```javascript
const customer = await db.one('SELECT * FROM customers WHERE id = $1', [id]);
console.log(customer.name);  // But loaded email, phone, address too
```

 **CORRECT (Project columns):**
```javascript
const customer = await db.one(
  'SELECT id, name, email FROM customers WHERE id = $1',
  [id]  // Only load what's needed
);
```

---

## Part 4: Safe Zero-Downtime Migrations

### The Problem: Data Migrations Block Requests

```sql
ALTER TABLE customers ADD COLUMN phone VARCHAR(20);
-- ^ Blocks all INSERT/UPDATE on customers table during migration (can be seconds~minutes for large tables)
```

### Strategy: Backward-Compatible Migrations

**Step 1: Add column (no default = already nullable):**
```sql
ALTER TABLE customers ADD COLUMN phone VARCHAR(20);
```

**Step 2: Backfill data (in batches to avoid lock):**
```javascript
// Run offline / in background job
const BATCH_SIZE = 10000;
let offset = 0;
while (true) {
  const updated = await db.query(`
    UPDATE customers 
    SET phone = ''
    WHERE id IN (
      SELECT id FROM customers 
      WHERE phone IS NULL
      LIMIT $1
    )
  `, [BATCH_SIZE]);
  if (updated.rowCount === 0) break;
  offset += BATCH_SIZE;
  await sleep(1000);  // Rate limit to avoid overwhelming DB
}
```

**Step 3: Code deployment (app handles both old + new):**
```javascript
// Service layer reads/writes phone
if (newCustomer.phone) {
  await customerRepo.update(customerId, { phone: newCustomer.phone });
}
```

Old code still works (ignores phone), new code uses it.

**Step 4: After migration successful, remove the column (or rename old):**
```sql
-- Keep old column renamed for rollback safety
ALTER TABLE customers RENAME COLUMN phone_old TO phone_deprecated;
```

---

## Checklist

- [ ] All tables in 3NF
- [ ] Foreign keys indexed
- [ ] JOIN queries avoid N+1 (load related data in one query)
- [ ] SELECT projects specific columns (not *)
- [ ] Indexes match WHERE + ORDER BY + JOIN ON patterns
- [ ] Migrations backward-compatible + batched
- [ ] Query performance profiled (EXPLAIN ANALYZE)
- Watch for N+1 and hidden coupling.