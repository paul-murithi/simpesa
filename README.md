# Sim-Pesa: Local-First M-Pesa API Simulator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

> **A production-grade, containerized M-Pesa Daraja API simulator that runs entirely on localhost—because your development shouldn't depend on Safaricom's uptime.**

## The Problem

If you've ever integrated with M-Pesa's Daraja API, you know the pain:

- **Error 1037 (DS Timeout)** halting your integration for days
- **Error 1001 (Subscriber Locked)** disrupting your testing flow
- **Error 9999 (General Error)** appearing at the worst possible moments
- Sandbox downtime derailing product launches

Sim-Pesa eliminates these frustrations by providing a **hermetic, zero-latency environment** that runs entirely on your machine.

## Features

### Local Appliance Architecture

- **100% Offline**: No internet required after initial Docker image pull
- **Zero Configuration**: First-run wizard handles all setup
- **State Persistence**: Your merchants, users, and transactions survive restarts
- **Instant Response**: Sub-100ms API acknowledgments

### Production-Grade Integrity

- **ACID Compliance**: PostgreSQL with row-level locking prevents race conditions
- **Transactional State Machine**: Rigorous PENDING → PROCESSING → SUCCESS/FAILED lifecycle
- **Idempotent Operations**: Duplicate requests handled safely with `ON CONFLICT` logic
- **Atomic Balance Updates**: No double-spending, no lost updates

### Developer Experience

- **Virtual Smartphone UI**: Manually approve/reject STK Push requests with PIN entry
- **Auto-Approve Mode**: Stress-test your integration with automated approvals
- **Real-time Dashboard**: Monitor all transactions as they flow through the system
- **Structured Logging**: Every request correlated by `TransactionID` for deep debugging

### Full M-Pesa Simulation

- STK Push (Lipa na M-Pesa Online)
- Transaction status queries
- Webhook callbacks with exponential backoff retry
- Configurable error scenarios (insufficient funds, wrong PIN, cancelled transactions)

## 🏁 Quick Start

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) (v20.10+)
- [Docker Compose](https://docs.docker.com/compose/install/) (v2.0+)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/paul-murithi/simpesa.git
   cd simpesa
   ```

2. **Start the appliance**

   ```bash
   docker compose up -d
   ```

3. **Access the dashboard**

   Open [http://localhost:3000](http://localhost:3000) in your browser

4. **Complete first-run setup**

   The onboarding wizard will guide you through:
   - Registering your first merchant (ShortCode)
   - Setting your callback URL
   - Creating a test user with 10,000 KES balance

5. **Make your first STK Push**

   ```bash
   curl -X POST http://localhost:8080/stkpush/v1/processrequest \
     -H "Authorization: Bearer simulated-token" \
     -H "Content-Type: application/json" \
     -d '{
       "BusinessShortCode": "174379",
       "Amount": 100,
       "PhoneNumber": "254700000000",
       "AccountReference": "TestOrder123",
       "TransactionDesc": "Payment for goods"
     }'
   ```

6. **Approve the transaction**

   Go to the Virtual Smartphone in the dashboard and enter PIN: `1234`

## Architecture

Sim-Pesa uses a multi-container architecture orchestrated by Docker Compose:

```
┌─────────────────────────────────────────────────────────┐
│                    Your Application                      │
│              (sends STK Push requests)                   │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   Ingestion API       │  ← Fast HTTP endpoint
         │   (Node.js/TypeScript)│     Returns 200 OK instantly
         └──────────┬────────────┘
                    │ Enqueues job
                    ▼
         ┌───────────────────────┐
         │   Redis + BullMQ      │  ← Asynchronous queue
         │   (Job Management)    │     Ensures delivery
         └──────────┬────────────┘
                    │ Worker picks up job
                    ▼
         ┌───────────────────────┐
         │   Worker Pool         │  ← Transactional logic
         │   (Node.js/TypeScript)│     Row-level locking
         └──────────┬────────────┘
                    │ Updates state
                    ▼
         ┌───────────────────────┐
         │   PostgreSQL 16       │  ← Source of truth
         │   (Persistent DB)     │     ACID compliance
         └───────────────────────┘
                    ▲
                    │ Real-time updates
         ┌──────────┴────────────┐
         │   Simulation UI       │  ← Virtual Smartphone
         │   (React + Tailwind)  │     Transaction monitoring
         └───────────────────────┘
```

### Core Services

| Service           | Technology        | Port | Purpose                           |
| ----------------- | ----------------- | ---- | --------------------------------- |
| **Ingestion API** | Node.js + Express | 8080 | Receives STK Push requests        |
| **Worker Pool**   | Node.js + BullMQ  | -    | Processes payments asynchronously |
| **Database**      | PostgreSQL 16     | 5432 | Persistent storage                |
| **Cache/Queue**   | Redis 7           | 6379 | Message broker                    |
| **Dashboard**     | React + Vite      | 3000 | Visual interface                  |

## 🗄️ Database Schema

### Merchants Table

Stores business entities (Paybills/Till numbers)

```sql
- id (UUID, primary key)
- short_code (VARCHAR, unique) -- e.g., "174379"
- passkey (TEXT) -- For STK password generation
- callback_url (TEXT) -- Where to send webhooks
- balance (NUMERIC) -- Merchant's simulated funds
- created_at (TIMESTAMP)
```

### Users Table

Simulated M-Pesa subscribers

```sql
- phone_number (VARCHAR, primary key) -- e.g., "254712345678"
- pin (VARCHAR) -- 4-digit PIN for approval
- balance (NUMERIC, CHECK >= 0) -- User's wallet
- status (VARCHAR) -- ACTIVE/BLOCKED
```

### Transactions Table

Immutable audit log

```sql
- request_id (UUID, primary key)
- checkout_id (VARCHAR, unique) -- Daraja CheckoutRequestID
- short_code (VARCHAR, foreign key)
- msisdn (VARCHAR, foreign key)
- amount (NUMERIC)
- status (VARCHAR) -- PENDING/PROCESSING/SUCCESS/FAILED
- result_code (INTEGER) -- 0=Success, 1=Insufficient funds, etc.
- metadata (JSONB) -- Full request/response for debugging
```

## Simulated Error Codes

Test your error handling logic with realistic scenarios:

| Code   | Description        | How to Trigger                         |
| ------ | ------------------ | -------------------------------------- |
| `0`    | Success            | Normal flow with correct PIN           |
| `1`    | Insufficient Funds | Set user balance < transaction amount  |
| `1032` | Cancelled by User  | Click "Cancel" on Virtual Smartphone   |
| `2001` | Invalid PIN        | Enter wrong PIN in Virtual Smartphone  |
| `1037` | DS Timeout         | Enable "Simulate Timeout" in dashboard |

## Development

### Project Structure

```
├── apps
│   ├── api
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── controllers
│   │   │   │   └── StkPush.controller.ts
│   │   │   ├── index.ts
│   │   │   ├── lib
│   │   │   │   └── redisClient.ts
│   │   │   ├── middleware
│   │   │   │   ├── auth.ts
│   │   │   │   ├── errorHandler.ts
│   │   │   │   ├── timestamp.middleware.ts
│   │   │   │   └── transaction.validation.ts
│   │   │   ├── routes
│   │   │   │   ├── stkpush.ts
│   │   │   │   └── test.ts
│   │   │   ├── server.ts
│   │   │   ├── services
│   │   │   │   └── stkPush.service.ts
│   │   │   └── utils
│   │   │       └── transaction.utils.ts
│   │   ├── tsconfig.json
│   │   └── tsconfig.tsbuildinfo
│   ├── ui
│   │   ├── Dockerfile
│   │   ├── eslint.config.js
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── public
│   │   │   └── vite.svg
│   │   ├── src
│   │   │   ├── App.css
│   │   │   ├── App.tsx
│   │   │   ├── assets
│   │   │   │   └── react.svg
│   │   │   ├── components
│   │   │   ├── index.css
│   │   │   └── main.tsx
│   │   ├── tsconfig.app.json
│   │   ├── tsconfig.json
│   │   ├── tsconfig.node.json
│   │   ├── vite.config.js
│   │   └── vite.config.ts
│   └── worker
│       ├── Dockerfile
│       ├── package.json
│       ├── src
│       │   ├── config
│       │   │   └── redis.ts
│       │   ├── index.ts
│       │   ├── processors
│       │   │   ├── transaction.processor.ts
│       │   │   └── webhook.processor.ts
│       │   ├── services
│       │   │   ├── balance.service.ts
│       │   │   ├── transaction.service.ts
│       │   │   └── webhook.service.ts
│       │   └── worker
│       │       ├── transaction.worker.ts
│       │       └── webhook.worker.ts
│       ├── tsconfig.json
│       └── tsconfig.tsbuildinfo
├── docker-compose.dev.yml
├── docker-compose.yml
├── docs
│   ├── api.md
│   ├── architecture.md
│   └── roadmap.md
├── package.json
├── package-lock.json
├── packages
│   ├── db
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── client.ts
│   │   │   ├── index.ts
│   │   │   ├── migration-runner.ts
│   │   │   ├── migrations
│   │   │   │   ├── 001_create_merchants.sql
│   │   │   │   ├── 002_create_users.sql
│   │   │   │   ├── 003_create_transactions.sql
│   │   │   │   └── 004_create_transactions.sql
│   │   │   ├── queries
│   │   │   │   ├── balances.sql
│   │   │   │   ├── merchants.sql
│   │   │   │   ├── transactions.sql
│   │   │   │   └── users.sql
│   │   │   ├── query-loader.ts
│   │   │   ├── repositories
│   │   │   │   └── transaction.repository.ts
│   │   │   ├── schema_migrations.sql
│   │   │   └── types
│   │   │       ├── merchant.queries.ts
│   │   │       ├── transaction.queries.ts
│   │   │       └── user.queries.ts
│   │   ├── tsconfig.json
│   │   └── tsconfig.tsbuildinfo
│   ├── queue
│   │   ├── package.json
│   │   ├── src
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── tsconfig.tsbuildinfo
│   ├── test
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── api
│   │   │   │   ├── ingestion-api-flow.test.ts
│   │   │   │   ├── ingestion-api-route.test.ts
│   │   │   │   ├── ingestion-api-server.test.ts
│   │   │   │   ├── ingestion-api-setup.test.ts
│   │   │   │   └── ingestion-middleware.test.ts
│   │   │   ├── db
│   │   │   │   └── seed-helper.ts
│   │   │   ├── factories
│   │   │   │   ├── merchant.factory.ts
│   │   │   │   ├── transaction.factory.ts
│   │   │   │   └── user.factory.ts
│   │   │   ├── index.ts
│   │   │   ├── queue
│   │   │   │   └── queue.test.ts
│   │   │   ├── setup.ts
│   │   │   ├── utils
│   │   │   │   └── errors.test.ts
│   │   │   └── worker
│   │   │       └── transaction-worker-flow.test.ts
│   │   └── tsconfig.json
│   ├── types
│   │   ├── package.json
│   │   ├── src
│   │   │   ├── base-types.ts
│   │   │   └── index.ts
│   │   ├── tsconfig.json
│   │   └── tsconfig.tsbuildinfo
│   └── utils
│       ├── package.json
│       ├── src
│       │   ├── errors.ts
│       │   ├── index.ts
│       │   ├── logger.ts
│       │   └── payload-builder.ts
│       ├── tsconfig.json
│       └── tsconfig.tsbuildinfo
├── README.md
├── scripts
│   ├── seed-dev-data.sql
│   └── wait-for-db.sh
├── tsconfig.base.json
├── tsconfig.json
├── tsconfig.tsbuildinfo
└── vitest.config.ts
```

### Running in Development Mode

```bash
# View logs from all services
docker compose logs -f

# View logs from specific service
docker compose logs -f api

# Rebuild after code changes
docker compose up -d --build

# Access PostgreSQL shell
docker compose exec db psql -U simpesa

# Access Redis CLI
docker compose exec redis redis-cli
```

### Resetting the Appliance

```bash
# Stop and remove all data (triggers first-run wizard)
docker compose down -v

# Start fresh
docker compose up -d
```

## Monitoring & Debugging

### Structured Logging

Every log entry includes:

- `transactionId`: Unique identifier for request correlation
- `timestamp`: ISO 8601 formatted
- `level`: info/warn/error
- `service`: api/worker/webhook
- `message`: Human-readable description

Example log output:

```json
{
  "transactionId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
  "timestamp": "2026-02-09T14:23:45.123Z",
  "level": "info",
  "service": "worker",
  "message": "Balance deducted successfully",
  "metadata": {
    "userId": "254712345678",
    "amount": 500,
    "newBalance": 9500
  }
}
```

### Transaction Lifecycle Visualization

```
API Request → Queue → Worker → Database → Webhook
    │           │        │          │         │
    └─ 200 OK   └─ Job   └─ Lock    └─ Commit └─ Retry if failed
       <100ms     saved    acquired    changes    (exponential backoff)
```

## Current Status

**Week 11 of 16** - Asynchronous Queuing and Webhooks Phase

Completed:

- Docker Compose orchestration
- PostgreSQL schema with migrations
- Basic API ingestion endpoint
- Structured logging with Pino
- TransactionID correlation across services
- State machine implementation
- Row-level locking for concurrency
- Atomic idempotency with PostgreSQL ON CONFLICT
- Integration testing (80%+ code coverage)
- Redis and BullMQ integration
- Worker-based async job processing

In Progress:

- Webhook dispatcher with callback delivery
- Exponential backoff retry strategy for failed deliveries

Upcoming:

- Security mocking (token validation) - Week 12
- React Dashboard and transaction monitoring - Week 13
- Virtual Smartphone PIN entry UI - Week 14
- Onboarding wizard and first-run flow - Week 15
- Final polish and documentation - Week 16

See the [full 16-week roadmap](ROADMAP.md) for detailed milestones.

## 🤝 Contributing

This is a side-project built by a university student learning production-grade system design. Contributions, bug reports, and feature requests are welcome!

### Development Principles

1. **Integrity First**: Every balance update must be atomic
2. **Appliance Philosophy**: Zero manual configuration required
3. **Pragmatic Visibility**: Structured logs over complex tracing
4. **Simulation Empowerment**: Challenge developers to break the system

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on the code of conduct and development workflow.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by the frustrations of integrating with Daraja sandbox downtime
- Built with insights from the East African developer community
- Special thanks to the creators of BullMQ, PostgreSQL, and Docker

## 📞 Support & Feedback

- **Issues**: [GitHub Issues](https://github.com/paulmurithi/simpesa/issues)
- **Discussions**: [GitHub Discussions](https://github.com/paulmurithi/simpesa/discussions)
- **Email**: murithikirerapaul@gmail.com

---

**Powered by Paulos Network Meru, Kenya**

_Making M-Pesa integration testing deterministic, one transaction at a time._
