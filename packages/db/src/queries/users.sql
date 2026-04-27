-- name: createUser
INSERT INTO users (phone_number, pin, balance, status)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: findUserByPhoneNumber
SELECT * FROM users WHERE phone_number = $1;

-- name: lockUserByPhoneNumber
SELECT balance FROM users
WHERE phone_number = $1
FOR UPDATE;

-- name: debitUser
UPDATE users
SET balance = balance - $1
WHERE phone_number = $2;