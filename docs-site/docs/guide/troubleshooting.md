# Troubleshooting

Common issues and how to fix them.

## 1. Callback not received?
- **Check the `api` container logs**: Sim-Pesa prints every outgoing callback attempt.
  ```bash
  docker compose logs -f api
  ```
- **Verify `CallBackURL`**: If you're testing from another container, use `http://api:3000/callback`. If testing from your host machine, ensure the URL is reachable from within the Docker network.
- **Check the Webhook Queue**: If the initial attempt fails, the job moves to a retry state. Check the `worker` logs.

## 2. Duplicate request blocked?
- Sim-Pesa blocks identical requests for 60 seconds to prevent double-charging.
- **Fix**: Change the `AccountReference` or `ExternalReference` in your request, or wait for 60 seconds.

## 3. Container not starting?
- **Port Conflict**: Ports 3000, 5173, 5432, or 6379 might be used by another service on your machine.
- **Fix**: Stop the conflicting services or change the port mappings in `docker-compose.yml`.
- **Database initialization**: On the first run, migrations might take a few seconds. Check `docker compose logs db`.

## 4. "Merchant does not exist"
- You must register a merchant before you can trigger an STK Push.
- **Fix**: Go to `http://localhost:5173/onboarding` and register your shortcode.

## 5. Redis connection errors
- If the API or Worker can't reach Redis, the system will fail.
- **Fix**: Ensure the `redis` container is healthy: `docker compose ps`.
- Restart the services: `docker compose restart`.
