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
RETURNING request_id;

-- name: getTransactionStatusByCheckoutId
SELECT "status", metadata FROM transactions WHERE checkout_id = $1;

-- name: GetTransactionWithCallbackByCheckoutID
SELECT
    t.checkout_id,
    t.external_reference,
    t.short_code,
    t.merchant_request_id,
    t.phone_number,
    t.amount,
    t.status,
    t.result_code,
    t.created_at,
    t.metadata,
    m.callback_url
FROM
    transactions t
JOIN
    merchants m
ON
    t.short_code = m.short_code
WHERE
    t.checkout_id = $1;

-- name: markTransactionSuccess
UPDATE transactions
SET
    "status" = $1,
    result_code = $4,
    metadata = metadata || $5::jsonb
WHERE
    checkout_id = $2
    AND "status" = $3;


-- name: markTransactionProcessing
UPDATE transactions
SET
    "status" = $1,
    metadata = metadata || $4::jsonb
WHERE
    checkout_id = $2
    AND "status" = $3;

-- name: lockTransactionsByCheckoutId
SELECT "status", metadata FROM transactions
WHERE checkout_id = $1
FOR UPDATE;

-- name: markTransactionFailed
UPDATE transactions
SET
    "status" = $1,
    result_code = $4,
    metadata = metadata || $5::jsonb
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

-- name: updateTransactionMetadata
UPDATE transactions
SET metadata = metadata || $2::jsonb
WHERE request_id = $1;

-- name: listRecentTransactions
SELECT
    checkout_id,
    external_reference,
    short_code,
    phone_number,
    amount,
    "status",
    created_at,
    metadata
FROM
    transactions
ORDER BY
    created_at DESC
LIMIT $1;