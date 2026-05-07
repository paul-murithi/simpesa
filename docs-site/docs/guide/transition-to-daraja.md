# Transition to Daraja

Moving from Sim-Pesa to Safaricom's production Daraja API is designed to be seamless. Because Sim-Pesa mimics Daraja's asynchronous callback model, your core business logic remains unchanged.

## What Stays the Same

- **The Callback Payload**: The JSON structure of the webhook is identical. Your callback handler will work without modification.
- **Asynchronous Flow**: The process of receiving a `CheckoutRequestID` and waiting for a webhook is preserved.
- **Result Codes**: Sim-Pesa uses the real Daraja result codes (`0`, `1`, `1032`, `1037`, etc.).

## What Changes

### 1. Base URLs
Update your API base URLs from `localhost` to Safaricom's endpoints:
- **Sandbox**: `https://sandbox.safaricom.co.ke`
- **Production**: `https://api.safaricom.co.ke`

### 2. Payload Field Names
Sim-Pesa uses a simplified JSON schema for local testing. Daraja requires specific CamelCase field names.

| Sim-Pesa Field | Daraja Equivalent |
|---|---|
| `short_code` | `BusinessShortCode` |
| `phone_number` | `PhoneNumber` / `PartyA` |
| `amount` | `Amount` |
| `external_reference` | `AccountReference` |
| `callback_url` | `CallBackURL` |

### 3. Authentication
Sim-Pesa uses a simplified Bearer token. Daraja requires a full OAuth2 flow using a `Consumer Key` and `Consumer Secret` to generate a `Password` (Base64 encoded string of `ShortCode + PassKey + Timestamp`).

### 4. Callback URL Accessibility
While Sim-Pesa can reach `http://host.docker.internal`, Daraja requires a publicly accessible **HTTPS** endpoint with a valid SSL certificate.

## Pre-Production Checklist

1.  **Switch Endpoints**: Update all API URLs to the Daraja Sandbox.
2.  **Update Field Names**: Map your internal models to Daraja's required field names (e.g., `BusinessShortCode`).
3.  **Implement Passkey Logic**: Ensure your code correctly generates the M-Pesa `Password` and `Timestamp`.
4.  **Verify Webhook Security**: Implement IP whitelisting or signature verification for incoming Daraja callbacks.

::: tip
Always perform a full test cycle in the official Daraja Sandbox after transitioning from Sim-Pesa. Sim-Pesa ensures your logic is sound, but the Sandbox ensures your credentials and network configuration are correct.
:::
