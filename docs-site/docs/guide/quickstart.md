# Quickstart

Get from zero to your first successful STK Push in under 60 seconds.

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Mac/Windows) or Docker Engine + Docker Compose plugin (Linux)
- Git
- A terminal

That's it. No Safaricom account. No Daraja registration. No `.env` file editing.

---

## Step 1: Clone and start

```bash
git clone https://github.com/paul-murithi/simpesa.git
cd simpesa
docker compose up -d
```

This starts five services on your machine:

| Service | URL | Purpose |
|---|---|---|
| Dashboard | http://localhost:35173 | Setup wizard + transaction monitor |
| Ingestion API | http://localhost:33000 | STK Push endpoint |
| PostgreSQL | (internal) | Transaction database |
| Redis | (internal) | Job queue |
| Worker | (internal) | Transaction processor |

Wait about 10-15 seconds for all services to report healthy. Check with:

```bash
docker compose ps
```

All five services should show `running` or `healthy`.

---

## Step 2: Run the setup wizard

Open [http://localhost:35173](http://localhost:35173) in your browser.

If this is your first run, the dashboard redirects you to the **Appliance Setup Wizard**. You'll see two fields:

1.  **ShortCode** -- Enter `174379` (the standard Daraja test ShortCode) or any number you want to simulate.
2.  **CallbackURL** -- Enter the URL where Sim-Pesa will POST the final transaction result. If you have a local server on port 8080, use `http://host.docker.internal:8080/callback`.

Click **Initialize**. The wizard:
- Registers your merchant in the database
- Seeds a default test user: phone `254700000000`, PIN `1234`, balance `10,000 KES`
- Redirects you to the transaction monitor

You are now ready to receive STK Push requests.

---

## Step 3: Fire your first STK Push

To interact with the API, you need an OAuth token.

### Option A: Via Dashboard (easiest)
If you initiate a request directly from the **Initiate STK Push** form in the dashboard, the token is automatically refreshed and attached to the request header for you. You don't need to worry about manual authentication.

### Option B: Via curl
If you want to test from your own application or terminal, copy the **Bearer Token** from the top navigation bar of the dashboard at [http://localhost:35173](http://localhost:35173).

Alternatively, fire a request to the simulated auth service:

```bash
curl -X POST http://localhost:33000/oauth/v1/generate \
-H "Content-Type: application/json" \
-d '{
  "short_code": "174379",
  "passkey": "pass_key123"
}'
```

Once you have your token, trigger the STK Push:

```bash
curl -X POST http://localhost:33000/stkpush/v1/processrequest \
-H "Authorization: Bearer <your-token>" \
-H "Content-Type: application/json" \
-d '{
  "short_code": "174379",
  "phone_number": "254700000000",
  "amount": 10,
  "external_reference": "FIRST_TEST"
}' \
-w "\nStatus: %{http_code}\nTime: %{time_total}s\n"
```

You'll get a response in under 100ms:

```json
{
  "MerchantRequestID": "550e8400-e29b-41d4-a716-446655440000",
  "CheckoutRequestID": "678e8400-e29b-41d4-a716-446655440123",
  "ResponseCode": "0",
  "ResponseDescription": "Success. Request accepted for processing"
}
```

---

## Step 4: Approve the payment

Switch back to [http://localhost:35173](http://localhost:35173). You'll see:
1.  The transaction appear in the feed with status **PROCESSING**.
2.  The **Virtual Smartphone** panel showing an STK Push prompt (unless **Auto-Approve PIN** is toggled on in the top bar).

In the Virtual Smartphone:
- Type the PIN: `1234`.
- Click **Approve**.

> **Pro Tip:** Toggle **Auto-Approve PIN** in the dashboard to skip manual entry during load testing or rapid development.

The transaction moves to **SUCCESS**. Your `CallBackURL` receives a Daraja-compatible JSON webhook.

---

## Step 5: Check the webhook payload

### Success Callback
If you have a server listening on your callback URL, it receives:

```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "550e8400-e29b-41d4-a716-446655440000",
      "CheckoutRequestID": "678e8400-e29b-41d4-a716-446655440123",
      "ResultCode": 0,
      "ResultDesc": "The service request is processed successfully.",
      "CallbackMetadata": {
        "Item": [
          { "Name": "Amount", "Value": 10 },
          { "Name": "MpesaReceiptNumber", "Value": "N/A" },
          { "Name": "PhoneNumber", "Value": 254700000000 }
        ]
      }
    }
  }
}
```

### Error Callback (e.g., Insufficient Funds)
If the transaction fails (e.g., balance too low or wrong PIN), the payload follows the same Daraja structure:

```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "550e8400-e29b-41d4-a716-446655440000",
      "CheckoutRequestID": "678e8400-e29b-41d4-a716-446655440123",
      "ResultCode": 1,
      "ResultDesc": "The balance is insufficient for the transaction."
    }
  }
}
```

This is exactly what the real Daraja API sends. Your application's callback handler needs zero modification.

---

## Useful commands

```bash
# Stream logs from API and worker
docker compose logs -f api worker

# Restart a single service
docker compose restart worker

# Check all service health
docker compose ps

# Stop all services (data is preserved)
docker compose down

# Full reset -- deletes all data, triggers wizard on next run
docker compose down -v
```

## Next steps

- [Testing error scenarios ->](/guide/error-simulation) -- simulate error codes 1037, 9999, insufficient funds
- [Architecture ->](/guide/architecture) -- how the five services fit together
- [API reference ->](/api/index) -- full endpoint documentation
- [Configuration ->](/guide/configuration) -- environment variables and advanced setup
