-- name: countMerchants
SELECT COUNT(*)::int as count FROM merchants;

-- name: createMerchant
INSERT INTO merchants (short_code, pass_key, callback_url, balance)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: findMerchantByShortCode
SELECT * FROM merchants WHERE short_code = $1;

-- name: creditMerchant
UPDATE merchants
SET balance = balance + $1
WHERE short_code = $2;

-- name: lockMerchantByShortCode
SELECT balance FROM merchants WHERE short_code = $1 FOR UPDATE;