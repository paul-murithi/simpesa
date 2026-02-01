-- name: insertNewTransaction
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
)
RETURNING request_id;