# Simulating Scenarios

The power of Sim-Pesa lies in its ability to reliably reproduce edge cases that are difficult or slow to test in the Daraja sandbox.

## 1. Successful Transaction
- **Trigger**: Send an STK Push request with valid data:
```json
{
  "short_code": "174379",
  "phone_number": "254700000000",
  "amount": 10,
  "external_reference": "Order_001"
}
```
- **Action**: In the Dashboard, enter the default PIN `1234` and click **Submit**.
- **Result**: Callback with `ResultCode: 0`.

## 2. User Cancellation
- **Trigger**: Send an STK Push request.
- **Action**: In the Dashboard, click the **Cancel** button on the virtual phone.
- **Result**: Callback with `ResultCode: 1032` (Request cancelled by user).

## 3. Wrong PIN
- **Trigger**: Send an STK Push request.
- **Action**: In the Dashboard, enter any PIN *except* `1234` and click **Submit**.
- **Result**: Callback with `ResultCode: 2001` (The initiator account is invalid - often used for PIN errors).

## 4. Insufficient Balance
- **Trigger**: Send an STK Push request for an amount larger than the user's balance. (Default seed user `254700000000` has 10,000).
- **Action**: The system will automatically detect this during Phase 1.
- **Result**: Callback with `ResultCode: 1` (Insufficient Funds). No PIN prompt will appear.

## 5. Duplicate Request (Idempotency)
- **Trigger**: Send the exact same STK Push request (same phone, amount, and reference) twice within 60 seconds.
- **Action**: The second request will be rejected by the API immediately.
- **Result**: API response with an error indicating a duplicate transaction.

## 6. Timeout
- **Trigger**: Send an STK Push request and don't interact with the UI.
- **Action**: Wait for 60 seconds (default `PIN_TIMEOUT_MS`).
- **Result**: Callback with `ResultCode: 1037` (Request timed out).

## 7. Auto-Approve Flow
Toggle the **Auto-Approve PIN** switch in the Dashboard.
- Any incoming request will be automatically approved with PIN `1234` after a short delay, allowing you to test your end-to-end integration without manual intervention.
