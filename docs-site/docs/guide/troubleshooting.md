# Troubleshooting

Resolve common issues encountered when running Sim-Pesa locally.

## Containers failing to start

**Symptoms**: `docker compose up` exits with an error or services show `restarting` in `docker compose ps`.

- **Port Conflict**: Ports 33000 (API) or 35173 (Dashboard) are already in use.
  - **Fix**: While these ports are uncommon, they might be in use by specialized software. You can change them in `docker-compose.yml`. See [Changing Ports](/guide/configuration#changing-ports).
- **Cannot connect to Postgres or Redis**: These services are intentionally **not exposed** to your host machine. They are only accessible by other Sim-Pesa services within the Docker network. If you must access them from the host, see [Configuration -> Internal Services](/guide/configuration#internal-services-postgres-redis).
- **Docker Engine not running**: Ensure Docker Desktop or the Docker daemon is active.
- **Insufficient Permissions**: On Linux, you may need `sudo` for `docker compose` if your user isn't in the `docker` group.

## Callback not received

**Symptoms**: Transaction shows `SUCCESS` in the dashboard, but your application never receives the webhook.

- **Unreachable URL**: If your application is running on your host machine, `localhost:8080` will not work inside the Docker container.
  - **Fix**: Use `http://host.docker.internal:8080/callback`.
- **Wrong Protocol**: Ensure you aren't using `https` locally unless you have set up a reverse proxy with SSL.
- **Check Logs**: Inspect the worker logs for delivery errors and retry attempts:
  ```bash
  docker compose logs -f worker
  ```

## "Merchant does not exist" Error

**Symptoms**: API returns a 404 error when triggering an STK Push.

- **Fix**: You must complete the **Appliance Setup Wizard** on first run. Open [http://localhost:35173](http://localhost:35173) and follow the prompts to register your ShortCode (e.g., `174379`).

## Duplicate transaction rejected

**Symptoms**: API returns a 409 Conflict error.

- **Fingerprint Lock**: Sim-Pesa prevents identical requests (same phone, amount, and reference) for 60 seconds.
  - **Fix**: Wait 60 seconds or change the `external_reference` in your request.

## Resetting everything

**Symptoms**: Corrupted database state or forgotten configuration.

- **Fix**: Perform a full wipe and restart. This deletes all transactions, users, and merchant data.
  ```bash
  docker compose down -v
  docker compose up -d
  ```
