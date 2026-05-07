# Configuration

Sim-Pesa is designed to work with zero configuration changes on first run. All defaults are set in the Docker environment. For advanced setups, you can override any variable by editing the `environment` section of the relevant service in `docker-compose.yml`.

## Environment variables

### API Service (`api`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Port the Ingestion API listens on inside the container |
| `DATABASE_URL` | `postgres://...` | PostgreSQL connection string |
| `REDIS_URL` | `redis://redis:6379` | Redis connection string |
| `LOG_LEVEL` | `info` | Logging verbosity: `debug`, `info`, `warn`, `error` |

### Worker Service (`worker`)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgres://...` | PostgreSQL connection string |
| `REDIS_URL` | `redis://redis:6379` | Redis connection string |
| `WEBHOOK_TIMEOUT_MS` | `5000` | Milliseconds before a webhook delivery attempt times out |
| `WEBHOOK_MAX_RETRIES` | `5` | Maximum retry attempts for failed webhook delivery |
| `PIN_TIMEOUT_MS` | `60000` | Milliseconds to wait for a user PIN before timing out (Error 1037) |

### Dashboard Service (`ui`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | API URL the dashboard connects to from your browser |

---

## Changing ports

To run the API on a different port (e.g., `5000`), update the `ports` section of the `api` service in `docker-compose.yml`:

```yaml
api:
  ports:
    - "5000:3000"  # Maps host port 5000 to container port 3000
```

Then update `VITE_API_URL` in the dashboard service (if it's not using the proxy) to match:

```yaml
ui:
  environment:
    VITE_API_URL: http://localhost:5000
```

---

## Using a public CallbackURL

If you're testing webhooks against a public endpoint (e.g., a staging server or an ngrok tunnel), set the `callback_url` in your STK Push request to that public URL.

Sim-Pesa's worker will attempt to POST to that URL directly. Ensure your local machine has internet access and no firewall is blocking outgoing requests from Docker.

---

## Resetting to defaults

To wipe all transaction data, user balances, and merchant registrations, use the `-v` flag to remove volumes:

```bash
# Stop and remove all containers and volumes
docker compose down -v

# Start fresh -- the setup wizard runs again
docker compose up -d
```
