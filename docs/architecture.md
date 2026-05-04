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

### 1.3 Signaling & Idempotency Layer (Redis)
Sim-Pesa leverages Redis for both real-time communication and request protection.
- **Signaling:** Since the worker needs to wait for user interaction (PIN entry), it uses Redis Pub/Sub for low-latency signaling. The worker subscribes to `pin:<checkout_id>` and waits for a signal (CORRECT, CANCELLED, etc.) from the UI via the API.
- **Fingerprinting (Idempotency):** To prevent duplicate transaction requests, the API generates a SHA-256 hash (fingerprint) of the request parameters. It uses Redis `SET NX` with a 60-second TTL to ensure exactly-once ingestion of identical requests.

### 1.4 Persistent Storage (PostgreSQL)
- **Merchants:** Registered entities with `short_code` and `callback_url`.
- **Users:** Simulated customers with `phone_number`, `pin`, and `balance`.
- **Transactions:** Audit log and state tracker for every request.
- **Webhooks:** Tracks every dispatch attempt for observability.

## 2. Event Flow: 2-Phase STK Push Lifecycle

Sim-Pesa uses a robust 2-phase approach to ensure data consistency and mimic real-world asynchronous flows:

1.  **Ingestion:** API receives the request, generates a fingerprint, and if unique, records a `PENDING` transaction and enqueues a job.
2.  **Phase 1 (Validation & Locking):**
    - Worker picks up the job and starts a DB transaction.
    - Locks User and Merchant rows (`SELECT ... FOR UPDATE`).
    - Validates balance and transitions status to `PROCESSING`.
    - Commits the DB transaction and enters a wait state.
3.  **Simulation:** User enters PIN or cancels in the Dashboard. API publishes the signal to Redis.
4.  **Phase 2 (Finalization):**
    - Worker receives the signal and starts a *second* DB transaction.
    - If `CORRECT`: Debits User, Credits Merchant, and updates status to `SUCCESS`.
    - If `FAILED/CANCEL/TIMEOUT`: Updates status to terminal failure state.
    - Commits the DB transaction and enqueues a webhook job.
5.  **Notification:** Webhook Worker delivers the callback with exponential backoff.

## 3. Data Consistency Approach

- **Transactional Integrity:** All balance updates and status transitions are wrapped in PostgreSQL transactions (see 2-Phase flow above).
- **Queue Reliability:** BullMQ ensures that jobs are not lost even if a worker crashes. Jobs are moved to "failed" and can be retried.

## 4. Webhook Retry Strategy

- **Attempts:** 5
- **Backoff:** Exponential (`delay * 2 ^ (attempt - 1)`)
- **Initial Delay:** 2000ms
- **Failure Visibility:** Failed webhooks are logged in the `webhook_attempts` table for debugging.
