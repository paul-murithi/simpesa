---
title: API Reference
sidebar_position: 2
---

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
  "Amount": 100,
  "PartyA": "254700000000",
  "PhoneNumber": "254700000000",
  "CallBackURL": "https://your-api.com/callback"
}
```

---

## 3. Webhook Format

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

## 4. Result Codes

| Code | Description |
| :--- | :--- |
| **0** | The service request is processed successfully. |
| **1** | Insufficient Funds |
| **1032** | Request cancelled by user |
| **1037** | DS Timeout |
| **2001** | Invalid PIN |
