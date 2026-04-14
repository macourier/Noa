# Error Handling & Recovery

**Tier:** ADVANCE | **Source:** awesome-copilot (typed errors) + antigravity (recovery patterns) + minimax (error boundary)

## Rule: Never Swallow Errors

 **WRONG:**
```javascript
try {
  const payment = await processPayment();
} catch (err) {
  console.log('oops');  // <- Error lost, no recovery
}
```

 **CORRECT:**
```javascript
try {
  const payment = await processPayment();
} catch (err) {
  if (err instanceof PaymentDeclinedError) {
    // KNOWN: Card declined, user can try again with different card
    throw err;
  } else if (err instanceof NetworkTimeoutError) {
    // MAYBE TEMPORARY: Retry with exponential backoff
    return await retryWithBackoff(() => processPayment());
  } else {
    // UNKNOWN: Log + alert ops team
    logger.error({ err, context: { customerId, amount } });
    throw new InternalServerError('Payment processing failed');
  }
}
```

---

## Typed Error Codes

Instead of generic "Error", use specific, typed errors:

### Node.js + Custom Error Classes

```javascript
class ApplicationError extends Error {
  constructor(code, message, statusCode = 500, details = {}) {
    super(message);
    this.code = code;  // Machine-readable
    this.statusCode = statusCode;  // HTTP status
    this.details = details;
  }
}

class PaymentDeclinedError extends ApplicationError {
  constructor(reason) {
    super('PAYMENT_DECLINED', `Card declined: ${reason}`, 402, { reason });
  }
}

// Usage in service:
if (customer.balance < amount) {
  throw new PaymentDeclinedError('Insufficient funds');
}

// Transport layer catches and responds:
app.post('/payments/charge', async (req, res) => {
  try {
    const result = await paymentService.charge(req.body);
    res.json(result);
  } catch (err) {
    if (err instanceof ApplicationError) {
      res.status(err.statusCode).json({
        error: err.code,
        message: err.message,
        details: err.details
      });
    } else {
      res.status(500).json({ error: 'INTERNAL_SERVER_ERROR' });
    }
  }
});
```

---

## Correlation IDs (Debug Multi-Service Requests)

When requests span multiple services, trace them with correlation IDs:

```javascript
// Transport layer: Generate or receive correlation ID
app.use((req, res, next) => {
  req.correlationId = req.headers['x-correlation-id'] || generateUUID();
  res.setHeader('x-correlation-id', req.correlationId);
  next();
});

// Service layer: Attach to all logs
logger.info({
  message: 'Processing payment',
  correlationId: req.correlationId,
  customerId,
  amount
});

// Logs across all services will have same correlationId
```

---

## Retry Strategy

```javascript
async function retryWithBackoff(fn, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      if (!(err instanceof NetworkTimeoutError)) throw err;
      
      const delay = Math.pow(2, attempt - 1) * 1000;  // 1s, 2s, 4s
      await sleep(delay);
    }
  }
}
```

---

## Checklist

- [ ] All caught errors are typed (not generic `Error`)
- [ ] All errors have machine-readable code
- [ ] Production errors logged with context (correlationId, userId)
- [ ] Retry logic only for transient failures (timeouts, 5xx)
- [ ] User-level errors have helpful messages (no SQL/stack traces)
- [ ] Critical errors alert ops (Slack, PagerDuty)
- Keep retry and rollback behavior explicit.