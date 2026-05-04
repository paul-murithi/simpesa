# Core Concepts

Sim-Pesa is designed with production-grade architectural patterns. Understanding these concepts will help you debug your integration and understand how the system behaves.

## 1. Transaction States
Every transaction in Sim-Pesa follows a strict state machine:

- **PENDING**: The request has been received by the API and enqueued.
- **PROCESSING**: The worker has picked up the job and is waiting for a PIN signal from the UI.
- **SUCCESS**: PIN was correct, and accounts were updated.
- **FAILED**: The transaction ended in an error (Wrong PIN, Insufficient Funds, etc.).
- **CANCELLED**: The user manually cancelled the request in the UI.

## 2. 2-Phase Processing
To ensure data integrity, Sim-Pesa uses a two-phase approach in the background:

- **Phase 1 (Validation)**: Locks the user's account and verifies they have enough balance. If successful, moves the transaction to `PROCESSING`.
- **Phase 2 (Finalization)**: After the user interacts with the UI, the worker locks the accounts again, performs the debit/credit, and moves the transaction to a terminal state (`SUCCESS`/`FAILED`).

## 3. Redis Fingerprinting (Rate Limiting)
Sim-Pesa implements a short-term lock to prevent duplicate transaction bursts. When an STK Push request arrives:
1.  **Hash Generation**: A SHA-256 fingerprint is generated from the `phone_number`, `short_code`, `amount`, and `external_reference`.
2.  **API Lock**: The API tries to store this in Redis with a **60-second TTL** using `SET NX`.
3.  **Result**: If you send the exact same request within 60 seconds, the API rejects it immediately with a `409 Conflict`.

This serves as a high-performance rate limiter at the edge. Strict data consistency and final idempotency are handled during Phase 1 and Phase 2 by the background worker using database row locking.

## 4. The Queue & Worker
Sim-Pesa uses **BullMQ** (backed by Redis) for all background processing.
- **Transaction Queue**: Handles the business logic and waits for PINs.
- **Webhook Queue**: Handles the delivery of callbacks to your application.

This ensures that even if your app is temporarily down, Sim-Pesa will keep trying to deliver the callback.

## 5. Reliable Webhooks
Webhooks are delivered with a robust retry mechanism:
- **Max Retries**: 5
- **Backoff**: Exponential (2s, 4s, 8s, 16s, 32s)
- **Logging**: Every attempt and response is stored in the database for your inspection.

## 6. Real-time Signaling
The API and Worker communicate via **Redis Pub/Sub**. When you click "Submit" on the virtual smartphone, the UI sends a signal to the API, which publishes it to a Redis channel. The Worker, which is listening on that channel, receives the signal and completes the transaction instantly.
