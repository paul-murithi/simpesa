# Error simulation

One of Sim-Pesa's core advantages over the Daraja sandbox: **you control when and how things fail.**

In production, errors like `1037` and `9999` happen to you unpredictably. In Sim-Pesa, you trigger them deliberately so you can write code that handles them correctly.

---

## Error reference

### Error 1037 -- DS Timeout

**What it means in Sim-Pesa:** The user failed to submit their PIN within the configured time limit (default 60 seconds).

**How to simulate it:** Initiate an STK Push and **do not** interact with the Virtual Smartphone. After the `PIN_TIMEOUT_MS` duration (configurable in `.env`), the transaction will move to `FAILED` with `result_code: 1037`.

**What your code must handle:** Treat 1037 as a retriable failure. The user may have been distracted or didn't see the prompt in time. Your application should surface a "payment request timed out -- please try again" message.

---

### Error 9999 -- System Error

**What it means in production:** A catch-all error from the Safaricom gateway, usually indicating a transient internal failure.

**How to simulate it:** Any unexpected failure in the processing pipeline (e.g., a database connection drop or an unhandled exception) will result in a 9999 error. In a stable Sim-Pesa environment, this represents the "unknown failure" path.

**What your code must handle:** Treat 9999 as a retryable transient failure. Log the error with context. Show the user a generic "payment service temporarily unavailable" message.

---

### Error 1001 -- Subscriber Locked

**What it means in production:** The phone number is already engaged in an active USSD or STK session. Cannot initiate a new one until the current session expires.

**How to simulate it:** Fire an STK Push to a phone number, and while it is still in the `PROCESSING` state (waiting for a PIN), fire **another** STK Push to the same phone number. The second request will be rejected (or move to FAILED) with a "Subscriber Locked" message.

**What your code must handle:** Do not immediately retry. Show a message like "another payment is in progress -- please wait a moment and try again." Consider polling the transaction status before retrying.

---

### Error 2001 -- Invalid PIN

**What it means in production:** The user entered the wrong PIN at the STK Push prompt.

**How to simulate it:** With a transaction in `PROCESSING` state on the Virtual Smartphone, enter any PIN other than `1234` (the default test PIN). The transaction moves to `FAILED` with `result_code: 2001`.

**What your code must handle:** This is a terminal failure for that transaction. Do not retry automatically. Show the user a "incorrect PIN" message and let them initiate a new payment if they wish.

---

### Error 1 -- Insufficient Funds

**What it means in production:** The user's M-Pesa wallet balance is below the transaction amount.

**How to simulate it:** Fire an STK Push for an amount that exceeds the user's current balance (default seeded balance is 10,000 KES). For example, request a payment of 50,000 KES.

**What your code must handle:** This is a terminal failure. Do not retry. Show the user an "insufficient funds" message.

---

### Error 1032 -- Request Cancelled by User

**What it means in production:** The user received the STK prompt and explicitly pressed "Cancel."

**How to simulate it:** With a transaction in `PROCESSING` state, click **Cancel** on the Virtual Smartphone instead of entering a PIN.

**What your code must handle:** This is a terminal failure for that transaction. The user made an active choice. Do not retry without user action. Show a "payment was cancelled" message with an option to try again.

---

## Testing concurrent requests

Sim-Pesa uses PostgreSQL row-level locking to safely handle concurrent STK Push requests to the same phone number. You can test this behavior directly.

To simulate concurrent requests:

```bash
# Fire 5 concurrent requests to the same phone number
for i in {1..5}; do
  curl -s -X POST http://localhost:33000/stkpush/v1/processrequest \
    -H "Authorization: Bearer test-token" \
    -H "Content-Type: application/json" \
    -d '{
      "short_code": "174379",
      "phone_number": "254700000000",
      "amount": 100,
      "external_reference": "Concurrent-Test-'$i'"
    }' &
done
wait
```

All 5 requests will be acknowledged immediately (each gets a unique `CheckoutRequestID`). The worker processes them sequentially behind the row-level lock -- each balance deduction is applied atomically, with no double-spending possible.

Check the dashboard to watch all 5 appear in **PENDING**, then move through **PROCESSING** one at a time.

---

## Auto-Approve mode

For load testing or CI/CD pipelines where manual PIN entry isn't practical, enable **Auto-Approve** in the dashboard. In this mode:

- Every transaction that reaches `PROCESSING` is automatically approved with the correct PIN.
- The balance deduction and webhook dispatch happen without manual intervention.
- The Virtual Smartphone panel is hidden.

To enable: toggle the **Auto-Approve** switch in the dashboard header at [http://localhost:35173](http://localhost:35173).

::: warning
Auto-Approve is designed for automated testing only. It bypasses the PIN verification step, which means your PIN validation logic is not exercised in this mode.
:::
