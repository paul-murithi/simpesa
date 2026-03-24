# Sim-Pesa Project Roadmap

## 16-Week Implementation Plan

## Phase 1: Infrastructure and Foundation (January)

| Week   | Focus Area                                                                                  | Weekly KPI                                                         | Branching/Commit Strategy                      |
| :----- | :------------------------------------------------------------------------------------------ | :----------------------------------------------------------------- | :--------------------------------------------- |
| **W1** | **Docker Setup**: Configure `docker-compose.yml` for Node API, Postgres, and Redis.         | `docker-compose up` runs 100% locally with all containers healthy. | `main` - Initial commit with Docker structure. |
| **W2** | **DB Schema**: Implement migration scripts for Merchants, Users, and Transactions.          | Schema successfully applied and verified via `psql` shell.         | `feat/schema` - Squash merge to `main`.        |
| **W3** | **API Ingestion**: Build the basic Express/TypeScript STK Push endpoint (fast response).    | API returns 200 OK with mock CheckoutRequestID in <50ms.           | `feat/api-ingestion` - Small, focused commits. |
| **W4** | **Logging & Visibility**: Implement structured Pino logging with TransactionID correlation. | Every request produces a JSON log entry with a unique trace ID.    | `feat/logging` - Standardize commit messages.  |

---

## Phase 2: Transactional Logic and Locking (February)

| Week   | Focus Area                                                                                | Weekly KPI                                                          | Branching/Commit Strategy                        |
| :----- | :---------------------------------------------------------------------------------------- | :------------------------------------------------------------------ | :----------------------------------------------- |
| **W5** | **State Machine**: Implement the `PENDING → SUCCESS/FAILED` lifecycle logic.              | Transaction status updates correctly via direct DB calls.           | `feat/state-machine` - Use Conventional Commits. |
| **W6** | **Concurrency Control**: Implement `SELECT... FOR UPDATE` row-level locking.              | Pass a local "Race Condition" test with concurrent requests.        | `feat/concurrency-locking`                       |
| **W7** | **Atomic Idempotency**: Use PostgreSQL `ON CONFLICT` for idempotent transaction creation. | Zero duplicate transactions in the DB on duplicate ingestion calls. | `feat/idempotency`                               |
| **W8** | **Integration Testing**: Write unit/integration tests for the DB service layer.           | Code coverage of the integrity core exceeds 80%.                    | `test/integrity-core`                            |

---

## Phase 3: Asynchronous Queuing and Webhooks (March)

_Goal: Complete the event loop and enable external connectivity._

| Week    | Focus Area                                                                       | Weekly KPI                                                          | Branching/Commit Strategy  |
| :------ | :------------------------------------------------------------------------------- | :------------------------------------------------------------------ | :------------------------- |
| **W9**  | **Redis & BullMQ**: Integrate the job queue and move DB logic to the Worker.     | Job enqueued by API is picked up and processed by the Worker.       | `feat/bullmq-integration`  |
| **W10** | **Webhook Dispatcher**: Build the logic to send callbacks to the Merchant URL.   | Successfully send a JSON payload to a local mock server.            | `feat/webhook-dispatch`    |
| **W11** | **Resilience**: Implement exponential backoff for failed webhook deliveries.     | System retries a failed webhook 5 times before giving up.           | `feat/retry-logic`         |
| **W12** | **Security Mocking**: Implement basic token validation and signature simulation. | API rejects calls without a valid (simulated) Authorization header. | `feat/security-simulation` |

---

## Phase 4: UI/UX and Simulation Polish (April)

| Week    | Focus Area                                                                         | Weekly KPI                                                        | Branching/Commit Strategy   |
| :------ | :--------------------------------------------------------------------------------- | :---------------------------------------------------------------- | :-------------------------- |
| **W13** | **React Dashboard**: Build the transaction monitoring view and filters.            | Live feed shows real-time state changes from the database.        | `feat/ui-dashboard`         |
| **W14** | **Virtual Smartphone**: Implement the PIN entry UI and "Auto-Approve" toggle.      | Trigger terminal states (SUCCESS/FAILED) via the Dashboard UI.    | `feat/virtual-smartphone`   |
| **W15** | **Onboarding Wizard**: Build the "First Run" dynamic registration flow.            | New developer can register a merchant and get a seeded test user. | `feat/onboarding-wizard`    |
| **W16** | **Polish & Documentation**: Finalize the README, clean up code, and final testing. | Project is ready for public release and portfolio presentation.   | `main` - Final release tag. |
