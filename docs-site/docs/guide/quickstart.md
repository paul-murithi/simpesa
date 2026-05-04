# Quickstart

Get your first successful M-Pesa STK Push simulation running in under 5 minutes.

## 1. Install & Run

Ensure you have [Docker](https://docs.docker.com/get-docker/) installed.

```bash
git clone https://github.com/paul-murithi/simpesa.git
cd simpesa
docker compose up -d
```

## 2. Get an Auth Token

Sim-Pesa uses a simplified authentication flow. You don't need complex OAuth credentials.

### Option A: Via Dashboard (Recommended)

1.  Open the Dashboard: `http://localhost:5173`
2.  Your auth token is displayed at the top. Click it to copy.

### Option B: Via API

Send a POST request with your `short_code` and `passkey` (The default seed uses `174379` and `bfb279f`...).

```bash
curl -X POST http://localhost:3000/oauth/v1/generate \
  -H "Content-Type: application/json" \
  -d '{
    "short_code": "174379",
    "passkey": "bfb279f..."
  }'
```

## 3. Trigger STK Push

You can trigger a request directly from the **Dashboard** using the "Initiate STK Push" form, or via curl:

```bash
curl -X POST http://localhost:3000/stkpush/v1/processrequest \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "short_code": "174379",
    "phone_number": "254700000000",
    "amount": 10,
    "external_reference": "Order_001"
  }'
```

## 4. Approve the Transaction

1.  Open the Dashboard: `http://localhost:5173`
2.  You should see a `PENDING` transaction.
3.  On the **Virtual Smartphone** (right side), enter PIN `1234`.
4.  Click **Submit**.

## 5. See the Callback

Sim-Pesa logs callbacks to the console of the `api` container.

```bash
docker compose logs -f api
```

You will see a JSON payload containing `ResultCode: 0` and transaction details.

**Congratulations!** You've just completed a full M-Pesa STK Push lifecycle locally.
