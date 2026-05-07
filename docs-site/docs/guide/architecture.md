# Architecture

Sim-Pesa is a multi-container local appliance. Every component has a single responsibility, and the entire system communicates over an internal Docker bridge network -- nothing escapes to the internet unless you explicitly configure a public CallbackURL.

## Design principles

**Integrity over convenience** -- Every balance update is protected by a PostgreSQL row-level lock. Sim-Pesa will never produce a double-spend under concurrent load, even in tests. If your production system demands ACID compliance, the simulator must too.

**Appliance philosophy** -- The system behaves like a physical device. Plug it in, it works. Unplug it, nothing leaks. Docker named volumes preserve all state across restarts. A single `docker compose down -v` wipes everything and returns you to a clean slate.

**Correlated visibility** -- Every log entry -- from HTTP ingestion through queue processing to webhook dispatch -- carries the same `TransactionID`. You always know exactly what happened to any given payment.

**Determinism as a feature** -- The Daraja sandbox fails non-deterministically. Sim-Pesa's failures are always intentional. Error codes, timeouts, and edge cases are things you configure, not things that happen to you.

---

## Service map

```text
┌───────────────────────────────────────────────────────────────┐
│ Docker Bridge: simpesa_default                                │
│                                                               │
│    ┌──────────────────┐          ┌──────────────────────┐     │
│    │  Ingestion API   │──────────►   Redis / BullMQ     │     │
│    │  Node.js + TS    │          │  payment-tasks queue │     │
│    │      :3000       │          └──────────┬───────────┘     │
│    └──────────────────┘                     │                 │
│                                             ▼                 │
│                                  ┌──────────────────────┐     │
│                                  │     Worker Pool      │     │
│                                  │     Node.js + TS     │     │
│                                  └──────┬──────────┬─────┘     │
│                                         │          │          │
│                                         ▼          ▼          │
│                                  ┌────────────┐  ┌──────────────┐
│                                  │ PostgreSQL │  │   Webhook    │
│                                  │   :5432    │  │  Dispatcher  │
│                                  └────────────┘  └──────────────┘
│                                                               │
│    ┌──────────────────────────────────────────────────────┐   │
│    │             React Dashboard :5173                    │   │
│    │   (Virtual Smartphone + Transaction Monitor)         │   │
│    └──────────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────────────┘
```

### Ingestion API

The first touchpoint for any STK Push request. Designed to be fast -- its only jobs are to validate the payload, push a job onto the queue, and return a `ResponseCode: 0` acknowledgment to the caller within 100ms.

It also handles:
- Simulated OAuth2 Bearer token validation
- `BusinessShortCode` and `PhoneNumber` format validation
- `CheckoutRequestID` generation as a unique UUID
- Structured JSON logging with `TransactionID` correlation

The API does **not** write to the database directly. All database writes happen inside the worker. This separation ensures the API never blocks on I/O.

### Redis / BullMQ queue

The buffer between ingestion and processing. BullMQ provides:
- **At-Least-Once delivery** -- jobs are never silently dropped
- **Job retries** -- failed jobs are retried with configurable backoff
- **Concurrency control** -- worker pool size is configurable
- **Persistence** -- queue state survives Redis restarts via the `simpesa_redis_data` volume

The queue runs a single `payment-tasks` channel. Each job carries the full transaction payload and the generated `CheckoutRequestID`.

### Worker Pool (Dual-Phase Lock)

The core of Sim-Pesa's transactional logic. To handle the high human latency of manual PIN entry without holding database locks indefinitely, the worker implements a **Dual-Phase Lock Strategy**:

#### Phase 1: Lock & Validate
1. Dequeue job from BullMQ.
2. BEGIN transaction.
3. SELECT user FOR UPDATE.
4. Validate balance and account status.
5. Transition transaction status to `PROCESSING`.
6. COMMIT (Locks are released).

#### Await Signal
7. Notify dashboard via SSE -- STK prompt appears.
8. The worker waits for a Redis Pub/Sub signal (`CORRECT`, `WRONG_PIN`, `CANCELLED`, or `TIMEOUT`).

#### Phase 2: Finalize
9. On `CORRECT` signal: BEGIN transaction.
10. SELECT user & merchant FOR UPDATE (Re-acquire locks).
11. Perform balance transfer.
12. Update transaction status to `SUCCESS`.
13. COMMIT.

This strategy ensures that rows are only locked for a few milliseconds during validation and finalization, even if the developer takes 30 seconds to type their PIN.

### PostgreSQL

Single source of truth for all persistent state. Three primary tables:

**merchants** -- registered ShortCodes, their CallbackURLs, and current balances  
**users** -- simulated M-Pesa subscribers: phone number, PIN, balance, status  
**transactions** -- immutable audit log of every request, with full JSONB metadata for debugging

Schema migrations run automatically on first start. Subsequent starts detect the existing schema and skip migration.

---

## The event loop in full

The complete journey of a KES 250 payment from API call to webhook delivery:

1. [Your App] POST /stkpush/v1/processrequest
2. [API] Validate payload
3. [API] Generate CheckoutRequestID = "550e8400-e29b-41d4-a716-446655440000"
4. [API] Push job -> BullMQ payment-tasks queue
5. [API] Return 200 { ResponseCode: "0", ... } <- < 100ms
6. [Worker] Dequeue job
7. [Worker] Phase 1: Lock rows, validate balance, mark `PROCESSING`
8. [Worker] Commit Phase 1 (Locks released)
9. [Worker] Notify dashboard via SSE -> STK prompt appears
10. [Dashboard] Developer sees STK Push for KES 250
11. [Dashboard] Developer enters PIN: 1234 (ok)
12. [Dashboard] Sends approval signal via Redis Pub/Sub
13. [Worker] Phase 2: BEGIN; Re-lock rows; Perform balance transfer
14. [Worker] UPDATE transactions SET status = 'SUCCESS', result_code = 0;
15. [Worker] COMMIT;
16. [Worker] POST http://host.docker.internal:8080/callback
17. [Worker] If 5xx / timeout -> retry with exponential backoff (max 5 attempts)
18. [Your App] Receives Daraja-compatible webhook payload (ok)

---

## Transaction state machine

Every transaction follows a strict one-way state progression. No transaction ever moves backwards.

```text
Request received --> PENDING --> PROCESSING --> SUCCESS (result_code: 0)
                                     |
                                     |--> FAILED (result_code: 1 / 2001 / 1037)
                                     |
                                     |--> CANCELLED (result_code: 1032)
```

| State | Meaning |
|---|---|
| `PENDING` | Enqueued in BullMQ, not yet picked up by worker |
| `PROCESSING` | Validated, awaiting PIN approval signal |
| `SUCCESS` | Balances updated atomically, webhook dispatched |
| `FAILED` | Validation failed or timeout -- insufficient funds, wrong PIN, or DS Timeout |
| `CANCELLED` | Developer pressed "Cancel" on the Virtual Smartphone |

---

## Docker networking

Services reference each other by Docker service name -- no hardcoded IP addresses, no fragile port mappings in application code:

```yaml
# Worker service environment (from docker-compose.yml)
DATABASE_URL: postgres://simpesa:simpesa@db:5432/simpesa
REDIS_URL:    redis://redis:6379
API_URL:      http://api:3000
```

The Docker bridge network `simpesa_default` handles DNS resolution automatically. Service names (`api`, `worker`, `db`, `redis`, `ui`) are the hostnames.

**Host machine access:**

| Service | Host URL |
|---|---|
| Dashboard | http://localhost:5173 |
| Ingestion API | http://localhost:3000 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

**Important:** When your `CallBackURL` points to a server on your host machine, use `host.docker.internal` instead of `localhost`:
`"CallBackURL": "http://host.docker.internal:8080/callback"`

Using `localhost` inside a Docker container refers to the container itself, not your host.

## State persistence

Two named Docker volumes manage all persistent data:

| Volume | Contains |
|---|---|
| simpesa_db_data | PostgreSQL cluster: merchants, users, all transaction history |
| simpesa_redis_data | BullMQ queue state: pending, active, delayed, and failed jobs |

```bash
# Stop containers -- volumes survive, all data intact
docker compose down

# Full reset -- volumes deleted, wizard runs on next start
docker compose down -v
```

## Webhook retry behavior

If your `CallbackURL` returns a non-2xx response or the request times out, the worker retries using exponential backoff:
- Attempt 1: after 1s (delay = 2^0 × 1000ms)
- Attempt 2: after 2s (delay = 2^1 × 1000ms)
- Attempt 3: after 4s (delay = 2^2 × 1000ms)
- Attempt 4: after 8s (delay = 2^3 × 1000ms)
- Attempt 5: after 16s (delay = 2^4 × 1000ms)

After 5 failed attempts: transaction status -> `FAILED`, logged for inspection.

The dashboard shows webhook delivery status for every transaction: attempt count, last HTTP status code, and last error message.
