# Contributing

Contribute to Sim-Pesa by improving the simulator, adding new Daraja endpoints, or refining the documentation. This guide covers the technical architecture and development workflow.

## Technical Stack

- **API/Worker**: Node.js + TypeScript
- **Database**: PostgreSQL 16
- **Queue**: Redis + BullMQ
- **Dashboard**: React + Vanilla CSS
- **Orchestration**: Docker Compose

## Development Workflow

### 1. Prerequisites
- Node.js 20+
- Docker & Docker Compose
- npm

### 2. Setup
```bash
git clone https://github.com/paul-murithi/simpesa.git
cd simpesa
npm install
docker compose up -d
```

### 3. Database Migrations
Sim-Pesa uses a custom migration runner in `packages/db`.
```bash
# Apply migrations
npm run db:migrate

# Seed development data
npm run db:seed

# Rollback last migration
npm run db:rollback
```

## Internal Architecture

### Error Handling
Custom error classes are located in `packages/utils/src/errors.ts`. Always use these for consistent API responses:
- `DomainError`: Business logic violations.
- `ValidationError`: Zod parsing failures.
- `NotFoundError`: Missing DB resources.
- `ConflictError`: Idempotency lock hits.

### Real-time Signaling
The worker waits for user interaction via Redis Pub/Sub:
- **Channel**: `pin:<checkout_id>`
- **Signals**: `CORRECT`, `WRONG_PIN`, `CANCELLED`, `TIMEOUT`.

### Webhook Dispatcher
Located in `apps/worker/src/services/webhook.service.ts`. It handles:
- Exponential backoff (5 retries).
- Atomic delivery status updates.
- Result logging to PostgreSQL.

## Local Testing

### Inspecting Redis signals
Monitor signals in real-time during a transaction:
```bash
docker exec -it simpesa-redis redis-cli psubscribe "pin:*"
```

### Mocking Webhooks
The API includes a built-in callback logger for testing. Set your `callback_url` to:
`http://host.docker.internal:3000/callback`
