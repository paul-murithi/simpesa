-- name: lockUserByPhoneNumber
SELECT balance FROM users
WHERE phone_number = $1
FOR UPDATE;

-- name: debitUser
UPDATE users
SET balance = balance - $1
WHERE phone_number = $2;