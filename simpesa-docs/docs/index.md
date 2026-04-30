---
title: Welcome to Sim-Pesa
sidebar_position: 1
slug: /
---

# Sim-Pesa

Sim-Pesa is a production-grade, local-first M-Pesa API simulator. It provides a robust environment for testing STK Push (Lipa na M-Pesa Online) integrations without the instability or costs associated with the Safaricom Daraja sandbox.

## 1. Overview
Sim-Pesa simulates the entire lifecycle of an STK Push transaction. It includes an ingestion API that mimics Daraja's endpoints, a background worker for asynchronous processing, and a React-based dashboard for real-time monitoring and manual PIN approval.

**Key Features:**
- **Local-first:** Run the entire stack on your machine via Docker.
- **Queue-based Architecture:** Uses BullMQ (Redis) for reliable transaction and webhook processing.
- **Virtual Smartphone UI:** A dedicated interface to simulate user interaction (PIN entry/cancellation).
- **Webhook Callbacks:** Reliable callback system with exponential backoff retries.
- **Persistence:** PostgreSQL storage for merchants, users, and transaction history.

## 2. Architecture Overview
Sim-Pesa follows a microservices-inspired architecture:

- **API (Ingestion):** Handles incoming STK Push requests, authentication, and transaction initiation.
- **Worker:** Processes business logic (balance checks, state transitions) and waits for user interaction via Redis Pub/Sub.
- **PostgreSQL:** Stores persistent data for merchants, users, and transactions.
- **Redis:** Serves as the message broker for BullMQ and handles real-time signaling between the API and Worker.
- **React Dashboard:** Provides a "God-view" of all transactions and a virtual smartphone interface for simulation.

## 3. Tech Stack
- **Backend:** Node.js, Express, TypeScript
- **Task Queue:** BullMQ, Redis
- **Database:** PostgreSQL
- **Frontend:** React, TypeScript, Vite
- **Infrastructure:** Docker, Docker Compose

## 4. Getting Started

### Prerequisites
- Docker
- Docker Compose

### Installation & Run
1. Clone the repository.
2. Start the services:
   ```bash
   docker compose up -d
   ```
3. The system will be ready once the DB migrations complete automatically.

## 5. First Run (Onboarding Flow)
When you first launch Sim-Pesa, you need to register a Merchant to obtain credentials.

1. Navigate to `http://localhost:5173/onboarding` (or use the API).
2. Register your merchant `short_code` and `callback_url`.
3. The system comes pre-seeded with a default test user (if `seed-dev-data.sql` is applied) or you can manage users via the DB.

## 6. How to Simulate a Payment

### Step 1: Trigger STK Push
Send a POST request to `http://localhost:3000/stkpush/v1/processrequest`.

**Request Example:**
```json
{
  "BusinessShortCode": "174379",
  "Password": "...",
  "Timestamp": "20231010123456",
  "TransactionType": "CustomerPayBillOnline",
  "Amount": 100,
  "PartyA": "254700000000",
  "PartyB": "174379",
  "PhoneNumber": "254700000000",
  "CallBackURL": "https://your-api.com/callback",
  "AccountReference": "Order-123",
  "TransactionDesc": "Payment for services"
}
```

### Step 2: Approve via UI
1. Open the Dashboard at `http://localhost:5173`.
2. Locate the "PENDING" transaction in the list.
3. Use the **Virtual Smartphone** component to enter the PIN (Default: `1234`).
4. Click **Submit**.

**Pro Tip: Auto-Approve PIN**
In the Dashboard UI, you can toggle the **Auto-Approve** feature. When enabled, the system will automatically submit the default PIN (`1234`) for any incoming STK Push request.

## 7. Troubleshooting
- **Port 5432/6379 Busy:** Ensure no local Postgres or Redis instances are running.
- **Worker Not Processing:** Check Redis connection logs in `docker compose logs worker`.
- **Database Not Initialized:** Check `docker compose logs db` for migration errors.
