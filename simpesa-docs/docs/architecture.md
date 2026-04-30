---
title: System Architecture
sidebar_position: 3
---

# System Architecture

Sim-Pesa is designed as a distributed, event-driven system to accurately simulate the asynchronous nature of mobile money payments.

## 1. System Components

### 1.1 Ingestion API (Express)
The gateway for all external requests. It mimics the Daraja API surface.
- **Responsibility:** Request validation, auth token issuance, and task enqueuing.

### 1.2 Background Worker (BullMQ)
The engine of the simulator.
- **Responsibility:** Manages the transaction state machine and handles webhook dispatches.

### 1.3 Signaling Layer (Redis)
Uses Redis Pub/Sub for low-latency signaling between the API and Worker.
- **Flow:**
  1. Worker subscribes to `pin:<checkout_id>`.
  2. UI sends PIN via API.
  3. API publishes result to Redis channel.
  4. Worker resumes processing.

## 2. Event Flow: STK Push Lifecycle

1.  **Initiation:** Client calls `/stkpush/v1/processrequest`.
2.  **Pickup:** Worker picks up the job and waits for PIN.
3.  **Simulation:** User enters PIN via Dashboard UI.
4.  **Completion:** Worker updates DB and enqueues webhook.
5.  **Notification:** Webhook Worker POSTs results to Merchant URL.

## 3. Resilience

- **Idempotency:** Redis-based lock prevents duplicate submissions.
- **Transactional Integrity:** Uses PostgreSQL transactions for balance updates.
- **Queue Reliability:** BullMQ ensures no jobs are lost.
