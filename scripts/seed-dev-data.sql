-- Development seed data

INSERT INTO users (phone_number, pin, balance, status)
VALUES
	('254712345678', '1234', 1000.00, 'ACTIVE'),
	('254798765432', '1234', 50.00, 'ACTIVE'),
	('254789765432', '1234', 50.00, 'BLOCKED'),
	('254712345679', '1234', 100.00, 'ACTIVE')
ON CONFLICT (phone_number) DO UPDATE
SET
	pin = EXCLUDED.pin,
	balance = EXCLUDED.balance,
	status = EXCLUDED.status;

INSERT INTO merchants (short_code, pass_key, callback_url, balance)
VALUES ('174379', 'pass_key123', 'http://api:3000/callback', 0.00)
ON CONFLICT (short_code) DO UPDATE
SET
	pass_key = EXCLUDED.pass_key,
	callback_url = EXCLUDED.callback_url,
	balance = EXCLUDED.balance;
