# Developer Guide

This guide provides technical details for developers working on the Sim-Pesa codebase.

## 1. Error Handling

Sim-Pesa uses a standardized error handling system located in `packages/utils/src/errors.ts`. 

### Custom Error Classes
- **BaseError**: The foundation for all custom errors. Includes `statusCode`, `isOperational` flag, and `developerHint`.
- **DomainError**: For business logic violations (e.g., Insufficient Funds).
- **ValidationError**: For invalid request payloads.
- **NotFoundError**: When a resource (user, merchant, transaction) is missing.
- **ConflictError**: Used for idempotency locks (duplicate transactions).
- **ExternalServiceError**: For failures in downstream systems (Redis, DB).

### Usage Example
```typescript
if (!user) {
  throw new NotFoundError("User not found", "Check if the phone number exists in the database.");
}
```

---

## 2. Database Management

Sim-Pesa uses a custom migration runner instead of a third-party ORM migration tool to keep dependencies minimal.

### Migration Commands
Run these from the project root:

- **Apply Migrations**: `npm run db:migrate`
- **Seed Dev Data**: `npm run db:seed`
- **Rollback Last**: `npm run db:rollback`

### How it Works
1.  **Schema Tracking**: The `schema_migrations` table tracks applied versions.
2.  **Versioning**: Migrations are files in `packages/db/src/migrations/` prefixed with a number (e.g., `001_initial.sql`).
3.  **Idempotency**: The runner handles "already exists" errors gracefully to prevent partial migration failures.

---

## 3. Real-time Signaling (Redis Pub/Sub)

The core "wait-for-pin" logic relies on Redis.

- **Channel Name**: `pin:<checkout_id>`
- **Signals**:
  - `CORRECT`: PIN matches the user's stored PIN.
  - `WRONG_PIN`: PIN is incorrect.
  - `CANCELLED`: User clicked cancel in the UI.
  - `TIMEOUT`: No signal received within `PIN_TIMEOUT_MS`.

---

## 4. Local Development Tips

### Inspecting Redis
You can monitor signals in real-time:
```bash
docker exec -it simpesa-redis redis-cli psubscribe "pin:*"
```

### Mocking Webhooks
Use the built-in callback logger by setting your `CallBackURL` to:
`http://api:3000/callback`
