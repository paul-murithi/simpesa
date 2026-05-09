# Configuration

Sim-Pesa is designed to work with zero configuration changes on first run. All defaults are set in the Docker environment. For advanced setups, you can override any variable by editing the `environment` section of the relevant service in `docker-compose.yml`.

## Environment variables

### API Service (`api`)

| Variable | Default | Description |
|---|---|---|
| `API_PORT` | `3000` | Port the Ingestion API listens on inside the container |
| `API_HOST_PORT` | `33000` | Port exposed on your host machine for the API |
| `DATABASE_URL` | `postgresql://simpesa:simpesa@db:5432/simpesa` | PostgreSQL connection string |
| `REDIS_HOST` | `redis` | Redis hostname |
| `REDIS_PORT` | `6379` | Redis port |
| `CORS_ORIGINS` | `http://localhost:35173,http://127.0.0.1:35173` | Allowed origins for CORS |

### Worker Service (`worker`)

| Variable | Default | Description |
|---|---|---|
| `DATABASE_URL` | `postgresql://simpesa:simpesa@db:5432/simpesa` | PostgreSQL connection string |
| `REDIS_HOST` | `redis` | Redis hostname |
| `REDIS_PORT` | `6379` | Redis port |
| `PROCESSING_VISIBILITY_DELAY_MS` | `5000` | Delay before a transaction becomes visible for processing |
| `PIN_TIMEOUT_MS` | `60000` | Milliseconds to wait for a user PIN before timing out (Error 1037) |

### Dashboard Service (`ui`)

| Variable | Default | Description |
|---|---|---|
| `UI_HOST_PORT` | `35173` | Port exposed on your host machine for the Dashboard |
| `VITE_API_BASE_URL` | `http://localhost:33000` | API URL the dashboard connects to from your browser |

---

## Changing ports

To run the API on a different host port (e.g., `5000`), update `API_HOST_PORT` in your `.env` file:

```bash
API_HOST_PORT=5000
```

Alternatively, you can update the `ports` section of the `api` service in `docker-compose.yml`:

```yaml
api:
  ports:
    - "5000:${API_PORT:-3000}"  # Maps host port 5000 to internal port
```

Then update `VITE_API_BASE_URL` in the dashboard service (if it's not using the proxy) to match:

```yaml
ui:
  environment:
    VITE_API_BASE_URL: http://localhost:5000
```

## Internal Services (Postgres & Redis)

By default, Sim-Pesa does **not** expose PostgreSQL (5432) or Redis (6379) to your host machine. This is an intentional design choice to ensure Sim-Pesa can coexist with any local databases you might already be running.

If you absolutely need to access the internal database from your host (e.g., via TablePlus or psql), you can manually add the port mapping back to `docker-compose.yml`:

```yaml
db:
  ports:
    - "5432:5432"
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
