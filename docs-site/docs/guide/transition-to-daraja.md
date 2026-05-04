# Moving from Sim-Pesa to Daraja

Once you've built and tested your integration with Sim-Pesa, moving to the real Safaricom Daraja API is straightforward. Sim-Pesa is designed to be a **complement** to Daraja, not a replacement.

## What Stays the Same?
- **Request Payloads**: The JSON structure you send to `/stkpush/v1/processrequest` is identical.
- **Response Payloads**: The acknowledgment and callback JSON you receive from Sim-Pesa match Daraja's format.
- **Asynchronous Logic**: Your application's logic for handling the `CheckoutRequestID` and waiting for a webhook remains the same.

## What Changes?

### 1. Base URLs
Update your API base URLs from `localhost` to Safaricom's endpoints:
- **Sandbox**: `https://sandbox.safaricom.co.ke`
- **Production**: `https://api.safaricom.co.ke`

### 2. Credentials
Replace your Sim-Pesa `ConsumerKey` and `ConsumerSecret` with those provided in your Daraja Portal app.

### 3. Callback URL
Ensure your `CallBackURL` is a publicly accessible HTTPS endpoint. While Sim-Pesa works with `http://localhost`, Daraja requires a secure, internet-facing URL.

### 4. Shortcodes and Passkeys
Use the `BusinessShortCode` and `Lipa na M-Pesa Online Passkey` provided by Safaricom for your specific environment.

## What to Watch Out For

- **Timeouts**: Sim-Pesa's default timeout is 60 seconds. Daraja's timeout might vary slightly based on network conditions.
- **Error Codes**: While Sim-Pesa covers the most common `ResultCodes`, Daraja has a wider range of obscure error codes related to network failures or specific M-Pesa account states.
- **SSL/TLS**: Daraja requires modern TLS versions. Ensure your server's SSL certificate is valid.

## Important Note
**Sim-Pesa is not an official Safaricom product.** It is a community-driven tool designed to improve developer experience. Always perform final testing in the Daraja Sandbox and Production environments before going live.
