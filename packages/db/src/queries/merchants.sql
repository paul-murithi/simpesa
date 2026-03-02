-- name: creditMerchant
UPDATE merchants
SET balance = balance + $1
WHERE short_code = $2;

-- name: lockMerchantByShortCode
SELECT balance FROM merchants WHERE short_code = $1 FOR UPDATE;