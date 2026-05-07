# API Reference

Sim-Pesa provides a set of endpoints for authentication, transaction initiation, and system management.

## 1. Authentication

### Generate Token
Exchange your `short_code` and `passkey` for a JWT token.

- **Method:** `POST`
- **Path:** `/oauth/v1/generate`
- **Body:**
```json
{
  "short_code": "174379",
  "passkey": "bfb279f..."
}
```
- **Response:**
```json
{
  "token": "eyJhbG..."
}
```

---

## 2. STK Push (Simulator)

### Process Request
Initiates an STK Push transaction.

- **Method:** `POST`
- **Path:** `/stkpush/v1/processrequest`
- **Headers:** `Authorization: Bearer <token>`
- **Body:**
```json
{
  "short_code": "174379",
  "phone_number": "254700000000",
  "amount": 100,
  "external_reference": "Order-123",
  "callback_url": "http://host.docker.internal:8080/callback"
}
```
- **Response (200 OK):**
```json
{
  "MerchantRequestID": "550e8400-e29b-41d4-a716-446655440000",
  "CheckoutRequestID": "678e8400-e29b-41d4-a716-446655440123",
  "ResponseCode": "0",
  "ResponseDescription": "Success. Request accepted for processing"
}
```

### Resume with PIN (Internal/UI)
Used by the Dashboard to simulate PIN entry.

- **Method:** `POST`
- **Path:** `/stkpush/pin/:checkout_id`
- **Body:**
```json
{
  "pin": "1234"
}
```

### Cancel Transaction (Internal/UI)
Used by the Dashboard to simulate user cancellation.

- **Method:** `POST`
- **Path:** `/stkpush/cancel/:checkout_id`

---

## 3. Onboarding

### Register Merchant
Register a new merchant in the system.

- **Method:** `POST`
- **Path:** `/api/v1/onboarding/register`
- **Body:**
```json
{
  "short_code": "174379",
  "callback_url": "http://host.docker.internal:8080/callback"
}
```

---

## 4. Transactions

### List Transactions
Get a list of all transactions.

- **Method:** `GET`
- **Path:** `/api/transactions`
- **Response:**
```json
[
  {
    "checkout_id": "678e8400-e29b-41d4-a716-446655440123",
    "external_reference": "Order-123",
    "short_code": "174379",
    "phone_number": "254700000000",
    "amount": "100.00",
    "status": "SUCCESS",
    "created_at": "2026-05-07T12:34:56.789Z",
    "metadata": { ... },
    "merchant_balance": "10000.00",
    "user_balance": "9900.00",
    "user_status": "ACTIVE"
  }
]
```

---

## 5. Webhook Format

Sim-Pesa sends a POST request to your `CallBackURL` when a transaction completes.

### Success Payload
```json
{
  "Body": {
    "stkCallback": {
      "MerchantRequestID": "...",
      "CheckoutRequestID": "...",
      "ResultCode": 0,
      "ResultDesc": "The service was accepted successfully",
      "CallbackMetadata": {
        "Item": [
          { "Name": "Amount", "Value": 100 },
          { "Name": "MpesaReceiptNumber", "Value": "N/A" },
          { "Name": "PhoneNumber", "Value": 254700000000 }
        ]
      }
    }
  }
}
```

---

## 6. Result Codes

Sim-Pesa uses a set of numeric result codes in the webhook callbacks to indicate the status of a transaction. These codes align with standard M-Pesa response codes.

| Code | Description |
| :--- | :--- |
| **0** | The service request is processed successfully. |
| **1** | Insufficient Funds |
| **1032** | Request cancelled by user |
| **1037** | DS Timeout (System Timeout) |
| **2001** | Invalid PIN (The initiator information is invalid) |
| **15** | Duplicate Detected |
| **17** | Internal Failure |
| **9999** | Request processing failed. Please try again later. |

## 7. Testing Callbacks Locally

Sim-Pesa includes a built-in endpoint to inspect webhook payloads without setting up an external tunnel (like Ngrok).

1. Set your `CallBackURL` to `http://api:3000/callback` when making a request.
2. Watch the logs of the `api` container:
   ```bash
   docker compose logs -f api
   ```
3. You will see the full JSON payload printed in the console whenever a transaction completes.
