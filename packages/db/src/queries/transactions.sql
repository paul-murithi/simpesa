-- name: ensureTransaction
INSERT INTO transactions (
    checkout_id,
    external_reference,
    short_code,
    phone_number,
    amount,
    metadata,
    merchant_request_id,
    "status",
    expires_at
)
VALUES (
    $1,-- Generated UUID
    $2,-- Merchant Reference
    $3,-- Merchant ShortCode
    $4,-- User Phone Number
    $5,-- Amount
    $6,-- Metadata
    $7,--merchant_request_id
    'PENDING',
    NOW() + INTERVAL '15 minutes'
)
ON CONFLICT (checkout_id) DO NOTHING
RETURNING *;

-- name: getTransactionStatusByCheckoutId
SELECT "status" FROM transactions WHERE checkout_id = $1;

-- name: markTransactionSuccess
UPDATE transactions
SET
    "status" = $1,
    result_code = $4
WHERE
    checkout_id = $2
    AND "status" = $3;


-- name: markTransactionProcessing
UPDATE transactions
SET "status" = $1
WHERE
    checkout_id = $2
    AND "status" = $3;

-- name: lockTransactionsByCheckoutId
SELECT "status" FROM transactions
WHERE checkout_id = $1
FOR UPDATE;

-- name: markTransactionFailed
UPDATE transactions
SET
    "status" = $1,
    result_code = $4
WHERE
    checkout_id = $2
    AND "status" = $3;

-- name: hasActiveTransactionForUser
SELECT EXISTS (
    SELECT 1
    FROM transactions
    WHERE phone_number = $1
    AND "status" = 'PROCESSING'
    AND checkout_id != $2
) AS has_active_transaction;