# Core Concepts

Sim-Pesa is a stateful simulator that enforces transactional integrity and predictable failure modes. Understanding these concepts is essential for building reliable M-Pesa integrations.

## Transaction States

Every transaction follows a strict, one-way state machine. No transaction can revert to a previous state once a transition is committed.

- **PENDING**: Request accepted by the API and stored in the queue.
- **PROCESSING**: Worker has locked the database rows and is waiting for user PIN approval.
- **SUCCESS**: Terminal state. Balances updated and webhook dispatched.
- **FAILED**: Terminal state. Logic error (insufficient funds) or system failure occurred.
- **CANCELLED**: Terminal state. Explicit user cancellation via the Virtual Smartphone.

## 2-Phase Processing

To prevent double-spending and ensure ACID compliance, Sim-Pesa processes every payment in two distinct phases:

### Phase 1: Validation & Locking
The worker acquires a `SELECT ... FOR UPDATE` lock on both the User and Merchant rows. It validates that the user exists, is active, and has sufficient balance. If valid, the transaction status moves to `PROCESSING`.

### Phase 2: Atomic Finalization
Upon receiving a PIN approval signal, the worker re-acquires the locks, performs the balance deduction and credit, and updates the transaction status to `SUCCESS`. This entire operation is wrapped in a single database transaction.

## Redis Fingerprinting

Sim-Pesa protects against duplicate request bursts using a short-term idempotency lock.
When a request arrives, the API generates a SHA-256 hash of the `phone_number`, `short_code`, `amount`, and `external_reference`. This hash is stored in Redis with a **60-second TTL**.
Any identical request sent within this window is rejected immediately with a `409 Conflict`.

## The Async Pipeline

The system uses **BullMQ** (Redis-backed) to decouple request ingestion from processing:
- **Transaction Queue**: Manages the core payment lifecycle.
- **Webhook Queue**: Manages callback delivery with a dedicated retry loop.

This architecture ensures that the Ingestion API can acknowledge requests in < 100ms, even if the database or callback server is under heavy load.

## Real-time Signaling

The React Dashboard and Background Worker communicate via **Redis Pub/Sub**.
When you interact with the Virtual Smartphone, the Dashboard sends an event to the API, which publishes a signal to a unique Redis channel (`pin:<checkout_id>`). The Worker, which is blocked waiting on that channel, receives the signal and completes the transaction sequence.
