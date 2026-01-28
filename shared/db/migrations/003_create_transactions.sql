-- Migration: Create Transactions Table
-- Date: Jan 28, 2025
CREATE TABLE
    IF NOT EXISTS transactions (
        request_id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
        checkout_id VARCHAR(50) UNIQUE NOT NULL,
        short_code VARCHAR(6) NOT NULL REFERENCES merchants (short_code),
        phone_number VARCHAR(15) NOT NULL REFERENCES users (phone_number) ON UPDATE CASCADE,
        amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
        transaction_state VARCHAR(20) DEFAULT 'PENDING' CHECK (
            transaction_state IN (
                'PENDING',
                'PROCESSING',
                'SUCCESS',
                'FAILED',
                'CANCELLED'
            )
        ),
        result_code INTEGER,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW ()
    );

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_transactions_phone_number ON transactions (phone_number);

CREATE INDEX IF NOT EXISTS idx_transactions_short_code ON transactions (short_code);