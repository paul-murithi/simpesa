# Simulating Scenarios

Use these walkthroughs to verify that your application handles every possible M-Pesa STK Push outcome correctly.

## 1. The Happy Path (Success)

**Goal**: Verify that your application correctly handles a successful payment and updates its internal state.

1.  **Trigger**: Send a valid STK Push request.
    ```bash
    curl -X POST http://localhost:33000/stkpush/v1/processrequest \
    -H "Authorization: Bearer test-token" \
    -H "Content-Type: application/json" \
    -d '{
      "short_code": "174379",
      "phone_number": "254700000000",
      "amount": 100,
      "external_reference": "ORDER_123"
    }'
    ```
2.  **Action**: In the Virtual Smartphone UI, enter PIN `1234` and click **Approve**.
3.  **Expected Outcome**: 
    - The transaction moves to `SUCCESS` in the dashboard.
    - Your `CallBackURL` receives a JSON payload with `ResultCode: 0`.
    - Your application marks the order as "Paid".

## 2. User Cancellation

**Goal**: Ensure your application doesn't get "stuck" if a user changes their mind.

1.  **Trigger**: Send an STK Push request.
2.  **Action**: In the Virtual Smartphone UI, click the **Cancel** button.
3.  **Expected Outcome**:
    - The transaction moves to `CANCELLED` in the dashboard.
    - Your `CallBackURL` receives `ResultCode: 1032`.
    - Your application should allow the user to try paying again or choose a different method.

## 3. Wrong PIN Entry

**Goal**: Verify that your application handles authentication failures at the handset level.

1.  **Trigger**: Send an STK Push request.
2.  **Action**: In the Virtual Smartphone UI, enter an incorrect PIN (e.g., `0000`) and click **Approve**.
3.  **Expected Outcome**:
    - The transaction moves to `FAILED` in the dashboard.
    - Your `CallBackURL` receives `ResultCode: 2001`.
    - Your application should notify the user that the PIN was incorrect.

## 4. Insufficient Funds

**Goal**: Test your application's response when the user's M-Pesa balance is too low.

1.  **Trigger**: Send an STK Push for an amount greater than the user's balance (e.g., `50000`).
2.  **Action**: No action required; Sim-Pesa's worker detects the low balance during the locking phase.
3.  **Expected Outcome**:
    - The transaction moves to `FAILED` immediately.
    - Your `CallBackURL` receives `ResultCode: 1`.
    - Your application should ask the user to top up their M-Pesa or use a different wallet.

## 5. Duplicate Request (Idempotency)

**Goal**: Ensure your application doesn't accidentally trigger two payments for the same order.

1.  **Trigger**: Send the exact same STK Push request twice within 60 seconds.
2.  **Action**: Observe the API response for the second request.
3.  **Expected Outcome**:
    - The second request is rejected with a `409 Conflict` error.
    - Your application's retry logic should handle this gracefully without showing an error to the user if one request is already in flight.

## 6. Handset Timeout

**Goal**: Verify your application's behavior when a user ignores the STK prompt.

1.  **Trigger**: Send an STK Push request.
2.  **Action**: Do not interact with the Dashboard for 60 seconds.
3.  **Expected Outcome**:
    - The transaction moves to `FAILED` after 60s.
    - Your `CallBackURL` receives `ResultCode: 1037`.
    - Your application should surface a "timeout" message and offer a retry.
