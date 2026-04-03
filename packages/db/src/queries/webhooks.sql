-- name: createWebhookDispatch
INSERT INTO webhook_dispatches (
    transaction_id,
    checkout_id,
    callback_url,
    payload,
    status
)
VALUES ($1, $2, $3, $4, 'pending')
RETURNING id;

-- name: logWebhookAttempt
INSERT INTO webhook_attempts (
    dispatch_id,
    attempt_number,
    response_status,
    response_body,
    error_message,
    duration_ms
)
VALUES ($1, $2, $3, $4, $5, $6);

-- name: fetchDispatch
SELECT * FROM webhook_dispatches WHERE id = $1;

-- name: getPendingWebhookDispatchForUpdate
SELECT *
FROM webhook_dispatches
WHERE id = $1
FOR UPDATE;

-- name: markWebhookDispatchDelivered
UPDATE webhook_dispatches
SET status = 'delivered',
    last_attempt_number = $2,
    updated_at = now()
WHERE id = $1
  AND last_attempt_number < $2
  AND status != 'delivered';

-- name: markWebhookDispatchFailed
UPDATE webhook_dispatches
SET status = 'failed',
    last_attempt_number = $2,
    updated_at = now()
WHERE id = $1
  AND last_attempt_number < $2
  AND status != 'delivered';

-- name: getWebhookAttemptsByDispatch
SELECT *
FROM webhook_attempts
WHERE dispatch_id = $1
ORDER BY attempt_number DESC;

-- name: getPendingWebhookDispatches
SELECT *
FROM webhook_dispatches
WHERE status = 'pending'
ORDER BY created_at ASC;