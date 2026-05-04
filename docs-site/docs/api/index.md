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
  "BusinessShortCode": "174379",
  "Password": "...",
  "Timestamp": "20231010123456",
  "TransactionType": "CustomerPayBillOnline",
  "Amount": 100,
  "PartyA": "254700000000",
  "PartyB": "174379",
  "PhoneNumber": "254700000000",
  "CallBackURL": "https://your-api.com/callback",
  "AccountReference": "Order-123",
  "TransactionDesc": "Payment for services"
}
```
- **Response (200 OK):**
```json
{
  "MerchantRequestID": "...",
  "CheckoutRequestID": "...",
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
  "shortCode": "174379",
  "callbackUrl": "https://your-api.com/callback"
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
    "request_id": "...",
    "checkout_id": "...",
    "amount": "100.00",
    "status": "SUCCESS",
    "created_at": "..."
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

For a full list of codes and their meanings, refer to the `packages/utils/src/map-result-code.ts` file.
