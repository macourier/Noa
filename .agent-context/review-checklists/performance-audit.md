# Performance Audit Checklist

> Run this on any code path that handles data, queries, or network requests.
> Performance problems are architectural — they don't fix themselves.

## Instructions for Agent

Evaluate every item below. For each finding, rate impact:
- **CRITICAL** — Will cause outage or severe degradation under normal load
- **HIGH** — Will degrade at scale, fix before production traffic
- **MEDIUM** — Wasted resources, fix in this sprint
- **LOW** — Optimization opportunity, track for later

---

## Database & Queries

- [ ] **No N+1 queries** — No database queries inside loops. Use eager loading or joins.
- [ ] **No unbounded queries** — Every list query has LIMIT / pagination
- [ ] **No `SELECT *`** — Only select columns that are actually needed
- [ ] **Indexes exist for frequently queried columns** — WHERE, JOIN, ORDER BY columns
- [ ] **Composite indexes match query patterns** — Column order matters
- [ ] **No unnecessary COUNT(*)** — Use EXISTS for existence checks
- [ ] **Bulk operations used** — insertAll/updateAll instead of loops for batch work
- [ ] **Connection pool configured** — Not creating new connections per request
- [ ] **Query execution time logged** — Slow query detection enabled (> 200ms threshold)

## I/O & Network

- [ ] **No synchronous I/O in async context** — No blocking calls in event-loop code
- [ ] **HTTP requests have timeouts** — Connect (5s) and read (30s) timeouts configured
- [ ] **Parallel requests when independent** — Use Promise.all / asyncio.gather
- [ ] **Retry with backoff** — Network calls retry with exponential backoff + jitter
- [ ] **Response streaming for large data** — Don't buffer entire response in memory
- [ ] **File uploads size-limited** — Max upload size configured at server level

## Caching

- [ ] **Cache has invalidation strategy** — If cache exists, invalidation is documented
- [ ] **TTL is reasonable** — Not too long (stale data), not too short (no benefit)
- [ ] **Cache stampede prevented** — Locking or staggered TTL for popular keys
- [ ] **Cache key includes relevant context** — User ID, locale, version where needed
- [ ] **No caching of user-specific data in shared cache** — Privacy and correctness

## Memory

- [ ] **No unbounded in-memory collections** — Arrays/lists don't grow without limit
- [ ] **Streaming for large datasets** — Cursor/stream instead of loading all into memory
- [ ] **No memory leaks** — Event listeners cleaned up, intervals cleared, no circular refs
- [ ] **Resource cleanup** — File handles, DB connections, HTTP clients properly closed

## Frontend Performance (If Applicable)

- [ ] **No unnecessary re-renders** — Memoization where component receives same props
- [ ] **Images optimized** — Proper format (WebP), lazy loading, responsive sizes
- [ ] **Bundle size checked** — No 500KB library for a 5-function use case
- [ ] **API calls deduplicated** — Same data not fetched multiple times in same render
- [ ] **Pagination/virtualization for long lists** — Not rendering 10,000 DOM nodes

## General

- [ ] **No premature optimization** — Changes based on evidence, not assumptions
- [ ] **Hot paths identified** — Critical user-facing paths are optimized first
- [ ] **Compression enabled** — gzip/brotli for HTTP responses
- [ ] **Rate limiting configured** — API endpoints have request limits
