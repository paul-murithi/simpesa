-- name: createWebhookDispatch
INSERT INTO webhook_dispatches (
    -- transaction_id,
    checkout_id,
    callback_url,
    payload,
    status,
    next_retry_at
)
VALUES ($1, $2, $3, 'pending', NOW())
RETURNING id;

-- name: getWebhook
SELECT * FROM webhook_dispatches
WHERE status IN ('pending', 'failed')
AND next_retry_at <= NOW()
LIMIT 10;

-- name: insertWebhookAttempts
INSERT INTO webhook_dispatches ();

-- name: fetchDispatch
SELECT * FROM webhook_dispatches WHERE id = $1;

-- name: markWebhookDeliveredSuccess
UPDATE webhook_dispatches
SET status = 'delivered',
    last_attempt_at = NOW(),
    updated_at = NOW()
WHERE id = $1;

-- name: markWebhookDeliverFailed
UPDATE webhook_dispatches
SET status = 'failed',
    attempt_count = attempt_count + 1,
    last_attempt_at = NOW(),
    next_retry_at = NOW() + (INTERVAL '1 second' * POWER(2, attempt_count)),
    updated_at = NOW()
WHERE id = $1;

-- name: webhookMaxRetries
UPDATE webhook_dispatches
SET status = 'failed'
WHERE attempt_count >= max_attempts;