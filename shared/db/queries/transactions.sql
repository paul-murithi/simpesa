-- name: ensureTransaction
INSERT INTO transactions (
    checkout_id,
    external_reference,
    short_code,
    phone_number,
    amount,
    "status",
    expires_at
)
VALUES (
    $1,-- Generated UUID
    $2,-- Merchant Reference
    $3,-- Merchant ShortCode
    $4,-- User Phone Number
    $5,-- Amount
    'PENDING',
    NOW() + INTERVAL '15 minutes'
) RETURNING request_id;


-- name: markTransactionSuccess
UPDATE transactions
SET "status" = $1
WHERE
    checkout_id = $2
    AND "status" = $3;


-- name: markTransactionProcessing
UPDATE transactions
SET "status" = $1
WHERE
    checkout_id = $2
    AND "status" = $3;