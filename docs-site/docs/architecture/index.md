# System Architecture

Sim-Pesa is designed as a distributed, event-driven system to accurately simulate the asynchronous nature of mobile money payments.

## 1. System Components

### 1.1 Ingestion API (Express)
The gateway for all external requests. It mimics the Daraja API surface.
- **Responsibility:** Request validation, auth token issuance, initial transaction recording, and task enqueuing.
- **Statelessness:** The API does not process business logic; it merely offloads tasks to the queue.

### 1.2 Background Worker (BullMQ)
The engine of the simulator.
- **Responsibility:** Manages the transaction state machine, performs balance updates, and handles webhook dispatches.
- **Concurrency:** Uses row-level locking (`SELECT ... FOR UPDATE`) in PostgreSQL to ensure data consistency during balance updates.

### 1.3 Signaling Layer (Redis)
Since the worker needs to wait for user interaction (PIN entry), it uses Redis Pub/Sub for low-latency signaling.
- **Flow:**
  1. Worker subscribes to `pin:<checkout_id>`.
  2. UI sends PIN via API.
  3. API publishes the result to the Redis channel.
  4. Worker receives the signal and resumes processing.

### 1.4 Persistent Storage (PostgreSQL)
- **Merchants:** Registered entities with `short_code` and `callback_url`.
- **Users:** Simulated customers with `phone_number`, `pin`, and `balance`.
- **Transactions:** Audit log and state tracker for every request.
- **Webhooks:** Tracks every dispatch attempt for observability.

## 2. Event Flow: STK Push Lifecycle

The following sequence describes a successful STK Push:

1.  **Initiation:** `POST /stkpush/v1/processrequest`
    - API generates a `checkout_id`.
    - API saves transaction as `PENDING`.
    - API enqueues `stk-push-request` job.
    - API returns acknowledgement to client.
2.  **Pickup:** Worker picks up the job.
    - Worker transitions status to `PROCESSING`.
    - Worker validates that the merchant and user exist.
    - Worker locks the user row to ensure balance integrity.
    - Worker enters a wait state (`waitForPin`) for 15 minutes (default).
3.  **Simulation:** User interaction via Dashboard.
    - User sees the transaction on the "Virtual Phone".
    - User enters the PIN and submits.
    - UI calls `POST /stkpush/pin/:checkout_id`.
    - API validates PIN against the DB and publishes `CORRECT` to Redis.
4.  **Completion:** Worker receives `CORRECT`.
    - Worker deducts the amount from the User's balance.
    - Worker updates transaction status to `SUCCESS`.
    - Worker enqueues a `send-webhook` job.
5.  **Notification:** Webhook Worker picks up the job.
    - Worker POSTs the callback payload to the Merchant's `callback_url`.
    - If it fails, BullMQ retries with exponential backoff.

## 3. Data Consistency Approach

- **Idempotency:** The API uses a Redis-based lock on the combination of `BusinessShortCode`, `Amount`, and `PhoneNumber` to prevent accidental duplicate submissions within a short window.
- **Transactional Integrity:** All balance updates and status transitions are wrapped in PostgreSQL transactions.
- **Queue Reliability:** BullMQ ensures that jobs are not lost even if a worker crashes. Jobs are moved to "failed" and can be retried.

## 4. Webhook Retry Strategy

- **Attempts:** 5
- **Backoff:** Exponential (`delay * 2 ^ (attempt - 1)`)
- **Initial Delay:** 2000ms
- **Failure Visibility:** Failed webhooks are logged in the `webhook_attempts` table for debugging.
