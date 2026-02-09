# Sim-Pesa: Local-First M-Pesa API Simulator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)

> **A production-grade, containerized M-Pesa Daraja API simulator that runs entirely on localhost—because your development shouldn't depend on Safaricom's uptime.**

##  The Problem

If you've ever integrated with M-Pesa's Daraja API, you know the pain:

- **Error 1037 (DS Timeout)** halting your integration for days
- **Error 1001 (Subscriber Locked)** disrupting your testing flow  
- **Error 9999 (General Error)** appearing at the worst possible moments
- Sandbox downtime derailing product launches

Sim-Pesa eliminates these frustrations by providing a **hermetic, zero-latency environment** that runs entirely on your machine.

##  Features

###  Local Appliance Architecture
- **100% Offline**: No internet required after initial Docker image pull
- **Zero Configuration**: First-run wizard handles all setup
- **State Persistence**: Your merchants, users, and transactions survive restarts
- **Instant Response**: Sub-100ms API acknowledgments

###  Production-Grade Integrity
- **ACID Compliance**: PostgreSQL with row-level locking prevents race conditions
- **Transactional State Machine**: Rigorous PENDING → PROCESSING → SUCCESS/FAILED lifecycle
- **Idempotent Operations**: Duplicate requests handled safely with `ON CONFLICT` logic
- **Atomic Balance Updates**: No double-spending, no lost updates

###  Developer Experience
- **Virtual Smartphone UI**: Manually approve/reject STK Push requests with PIN entry
- **Auto-Approve Mode**: Stress-test your integration with automated approvals
- **Real-time Dashboard**: Monitor all transactions as they flow through the system
- **Structured Logging**: Every request correlated by `TransactionID` for deep debugging

###  Full M-Pesa Simulation
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

##  Architecture

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

| Service | Technology | Port | Purpose |
|---------|-----------|------|---------|
| **Ingestion API** | Node.js + Express | 8080 | Receives STK Push requests |
| **Worker Pool** | Node.js + BullMQ | - | Processes payments asynchronously |
| **Database** | PostgreSQL 16 | 5432 | Persistent storage |
| **Cache/Queue** | Redis 7 | 6379 | Message broker |
| **Dashboard** | React + Vite | 3000 | Visual interface |

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

##  Simulated Error Codes

Test your error handling logic with realistic scenarios:

| Code | Description | How to Trigger |
|------|-------------|----------------|
| `0` | Success | Normal flow with correct PIN |
| `1` | Insufficient Funds | Set user balance < transaction amount |
| `1032` | Cancelled by User | Click "Cancel" on Virtual Smartphone |
| `2001` | Invalid PIN | Enter wrong PIN in Virtual Smartphone |
| `1037` | DS Timeout | Enable "Simulate Timeout" in dashboard |

##  Development

### Project Structure
```
sim-pesa/
├── api/                 # Ingestion API service
│   ├── src/
│   │   ├── routes/     # Express endpoints
│   │   ├── services/   # Business logic
│   │   └── types/      # TypeScript definitions
│   └── Dockerfile
├── worker/              # Asynchronous processor
│   ├── src/
│   │   ├── jobs/       # BullMQ job handlers
│   │   ├── db/         # Database layer
│   │   └── webhooks/   # Callback dispatcher
│   └── Dockerfile
├── dashboard/           # React frontend
│   ├── src/
│   │   ├── components/ # UI components
│   │   └── pages/      # Routes
│   └── Dockerfile
├── db/                  # PostgreSQL migrations
│   └── init/           # Schema initialization
└── docker-compose.yml   # Orchestration config
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

##  Monitoring & Debugging

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

##  Current Status

**Week 5 of 16** - Infrastructure & Foundation Phase

✅ Completed:
- Docker Compose orchestration
- PostgreSQL schema with migrations
- Basic API ingestion endpoint
- Structured logging with Pino

🔄 In Progress:
- TransactionID correlation across services
- First-run wizard UI design

📅 Upcoming:
- State machine implementation (Week 5)
- Row-level locking for concurrency (Week 6)
- BullMQ integration (Week 9)
- Virtual Smartphone UI (Week 14)

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

*Making M-Pesa integration testing deterministic, one transaction at a time.*
