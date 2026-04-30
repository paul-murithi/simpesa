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

**Transaction Flow:**

1. **Request:** Client sends an STK Push request to the API.
2. **Queue:** API records a `PENDING` transaction and enqueues a job in BullMQ.
3. **Wait:** Worker picks up the job, moves it to `PROCESSING`, and waits for a PIN signal.
4. **Interact:** Developer uses the UI to enter a PIN or cancel the request.
5. **Finalize:** Worker receives the signal, updates the DB (`SUCCESS`/`FAILED`), and enqueues a webhook.
6. **Callback:** Webhook processor delivers the results to the merchant's configured URL.

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

1. **Clone the repository**

   ```bash
   git clone https://github.com/paul-murithi/simpesa.git
   cd simpesa
   ```

2. Start the services:
   ```bash
   docker compose up -d
   ```
3. The system will be ready once the DB migrations complete automatically.

### Services & Ports

| Service        | External Port | Description                |
| :------------- | :------------ | :------------------------- |
| **API**        | `3000`        | Ingestion & Auth endpoints |
| **UI**         | `5173`        | Dashboard & Virtual Phone  |
| **PostgreSQL** | `5432`        | Main database              |
| **Redis**      | `6379`        | Queue & Signaling          |

## 5. First Run (Onboarding Flow)

When you first launch Sim-Pesa, you need to register a Merchant to obtain credentials.

1. Navigate to `http://localhost:5173/` (or use the API).
2. Register your merchant `short_code` and `callback_url`.
3. The system comes pre-seeded with a default test user (if `seed-dev-data.sql` is applied) or you can manage users via the DB.

## 6. How to Simulate a Payment

### Step 1: Trigger STK Push

Send a POST request to `http://localhost:3000/stkpush/v1/processrequest`.
(Requires an Authorization token from `/oauth/v1/generate`).

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
3. Use the **Virtual Smartphone** component to enter the PIN (Default: `1234` for test users).
4. Click **Submit**.

**Pro Tip: Auto-Approve PIN**
In the Dashboard UI, you can toggle the **Auto-Approve** feature. When enabled, the system will automatically submit the default PIN (`1234`) for any incoming STK Push request, allowing for hands-free end-to-end testing of your integration.

### Step 3: Webhook Delivery

The system will automatically transition the transaction to `SUCCESS` and POST a callback to your `CallBackURL`.

## 7. Testing Callbacks Locally

Sim-Pesa includes a built-in endpoint to inspect webhook payloads without setting up an external tunnel (like Ngrok).

1. Set your `CallBackURL` to `http://api:3000/callback` when registering a merchant or making a request.
2. Watch the logs of the `api` container:
   ```bash
   docker compose logs -f api
   ```
3. You will see the full JSON payload printed in the console whenever a transaction completes.

## 8. API Reference (Partial)

_Full documentation in [API.md](./docs/api.md)_

- `POST /oauth/v1/generate`: Get Auth Token.
- `POST /stkpush/v1/processrequest`: Initiate STK Push.
- `GET /api/transactions`: List recent transactions.

## 8. Transaction Lifecycle

Transactions transition through the following states:

1. **PENDING:** Initial state after ingestion.
2. **PROCESSING:** Worker has picked up the job and is waiting for user interaction.
3. **SUCCESS:** PIN verified and balance updated.
4. **FAILED:** Transaction declined, timeout, or insufficient funds.
5. **CANCELLED:** Manually cancelled by the user in the UI.

## 9. Webhook System

The webhook system mimics Daraja's JSON structure:

- **Success:** Contains `CallbackMetadata` with `Amount` and `PhoneNumber`.
- **Failure:** Contains `ResultCode` and `ResultDesc`.

**Retry Logic:**

- Retries up to **5 times**.
- Uses **exponential backoff** starting at 2 seconds.

## 10. Development Notes

- **Concurrency:** Uses Redis-based locking to prevent duplicate processing of the same `checkout_id`.
- **Event Signaling:** API and Worker communicate via Redis channels (`pin:<checkout_id>`) to handle the asynchronous nature of user approval.

## 11. Troubleshooting

- **Port 5432/6379 Busy:** Ensure no local Postgres or Redis instances are running.
- **Worker Not Processing:** Check Redis connection logs in `docker compose logs worker`.
- **Database Not Initialized:** Check `docker compose logs db` for migration errors.

## 12. Project Structure

- `apps/api`: Express-based ingestion server.
- `apps/worker`: BullMQ background processor.
- `apps/ui`: React dashboard and simulation interface.
- `packages/db`: Database schema, migrations, and repositories.
- `packages/queue`: Shared BullMQ queue configurations.
- `packages/utils`: Common utilities and logger.

## 13. License

No license specified.
