# Blueprint: Observability Stack (OpenTelemetry)

> If you can't see it, you can't fix it.
> Observability is not optional — it's infrastructure.

## Tech Stack

| Pillar | Standard | Why |
|--------|----------|-----|
| **Tracing** | OpenTelemetry SDK | Vendor-neutral, W3C Trace Context |
| **Metrics** | OpenTelemetry SDK | OTLP export, histogram/counter/gauge |
| **Logging** | Structured JSON + OTel correlation | traceId in every log line |
| **Collector** | OpenTelemetry Collector | Pipeline: receive → process → export |
| **Backend** | Jaeger / Tempo (traces), Prometheus / Mimir (metrics), Loki (logs) | Or cloud: Datadog, Grafana Cloud, New Relic |
| **Dashboards** | Grafana | Universal visualization |

## The Three Pillars

```
┌──────────────────────────────────────────────────────────┐
│                    Your Application                       │
│                                                          │
│  Traces: "What path did this request take?"              │
│  Metrics: "How is the system performing overall?"        │
│  Logs: "What exactly happened at this moment?"           │
│                                                          │
│  ── All connected by traceId / spanId ──                 │
└────────────────────┬─────────────────────────────────────┘
                     │ OTLP (gRPC/HTTP)
           ┌─────────▼──────────┐
           │  OTel Collector    │
           │  (receive/process/ │
           │   export)          │
           └────┬────┬────┬─────┘
                │    │    │
          ┌─────▼┐ ┌─▼──┐ ┌▼────┐
          │Jaeger│ │Prom│ │Loki │
          │Tempo │ │    │ │     │
          └──────┘ └────┘ └─────┘
                     │
              ┌──────▼──────┐
              │   Grafana    │
              │ (Dashboards) │
              └─────────────┘
```

## Instrumentation Standards

### Auto-Instrumentation First

Start with auto-instrumentation for common libraries (HTTP servers, DB clients, message brokers). Add manual instrumentation for business-critical paths.

```typescript
// Node.js: Initialize OpenTelemetry EARLY (before other imports)
import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({
    url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
  }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter(),
  }),
  instrumentations: [getNodeAutoInstrumentations()],
  serviceName: process.env.OTEL_SERVICE_NAME,
  serviceVersion: process.env.APP_VERSION,
});

sdk.start();
```

### Manual Spans for Business Logic

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('order-service');

async function processOrder(order: Order): Promise<void> {
  return tracer.startActiveSpan('processOrder', async (span) => {
    try {
      span.setAttribute('order.id', order.id);
      span.setAttribute('order.total', order.total);
      span.setAttribute('order.item_count', order.items.length);

      await validateInventory(order);
      await processPayment(order);
      await updateInventory(order);

      span.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: error.message });
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  });
}
```

### Metric Instruments

| Type | When | Example |
|------|------|---------|
| **Counter** | Monotonically increasing count | `http.requests.total` |
| **Histogram** | Distribution of values | `http.request.duration` |
| **Gauge** | Current snapshot value | `system.memory.usage` |
| **UpDownCounter** | Value that can go up and down | `queue.depth` |

### Structured Logging

```typescript
// REQUIRED: Include traceId and spanId in every log
logger.info('Order processed', {
  traceId: span.spanContext().traceId,
  spanId: span.spanContext().spanId,
  orderId: order.id,
  userId: order.userId,
  durationMs: Date.now() - startTime,
  itemCount: order.items.length,
});
```

## Naming Conventions (Semantic Conventions)

Follow OpenTelemetry semantic conventions:

```
Metrics:    {namespace}.{component}.{metric}
            http.server.request.duration
            db.client.operation.duration
            messaging.publish.duration

Spans:      {operation} {target}
            GET /api/users
            SELECT users
            PUBLISH order.created

Attributes: {namespace}.{attribute}
            http.request.method
            db.system
            service.name
            service.version
```

## Alerting Strategy

### Golden Signals (Monitor These)

| Signal | Metric | Alert When |
|--------|--------|------------|
| **Latency** | `http.server.request.duration` p99 | > 500ms for 5 min |
| **Traffic** | `http.server.request.total` rate | Sudden drop > 50% |
| **Errors** | `http.server.request.error_ratio` | > 1% for 5 min |
| **Saturation** | CPU, memory, connection pool | > 80% for 10 min |

### Alert Rules

1. **Page** (wake someone up): Service is DOWN, error rate > 5%, data loss risk
2. **Alert** (respond this shift): Latency degradation, resource saturation > 80%
3. **Inform** (check next business day): Slow queries, disk space trending

## Collector Configuration

```yaml
# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    timeout: 5s
    send_batch_size: 1024
  memory_limiter:
    limit_mib: 512
    spike_limit_mib: 128
  attributes:
    actions:
      - key: environment
        value: ${ENVIRONMENT}
        action: upsert

exporters:
  otlphttp/traces:
    endpoint: http://jaeger:4318
  prometheus:
    endpoint: 0.0.0.0:8889
  loki:
    endpoint: http://loki:3100/loki/api/v1/push

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [otlphttp/traces]
    metrics:
      receivers: [otlp]
      processors: [memory_limiter, batch]
      exporters: [prometheus]
    logs:
      receivers: [otlp]
      processors: [memory_limiter, batch, attributes]
      exporters: [loki]
```

## Scaffolding Checklist

- [ ] Install OpenTelemetry SDK for your language
- [ ] Configure auto-instrumentation for HTTP, DB, messaging
- [ ] Set `OTEL_SERVICE_NAME` and `OTEL_EXPORTER_OTLP_ENDPOINT` env vars
- [ ] Add manual spans to business-critical paths
- [ ] Ensure structured logs include `traceId` and `spanId`
- [ ] Deploy OpenTelemetry Collector with batch + memory limiter
- [ ] Configure exporters for traces, metrics, and logs
- [ ] Set up Grafana dashboards for golden signals
- [ ] Define alert rules for latency, errors, saturation
- [ ] Enable W3C Trace Context propagation across services
