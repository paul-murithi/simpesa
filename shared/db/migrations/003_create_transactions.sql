-- Migration: Create Transactions Table (Updated with Idempotency & Expiry)
-- 1. Create a custom Type for our State Machine
DO $$ BEGIN
    CREATE TYPE transaction_status AS ENUM (
        'PENDING',
        'PROCESSING',
        'SUCCESS',
        'FAILED',
        'CANCELLED',
        'VOIDED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Create Table
CREATE TABLE IF NOT EXISTS transactions (
    request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkout_id UUID UNIQUE NOT NULL,
    external_reference VARCHAR(255) NOT NULL,
    short_code VARCHAR(6) NOT NULL REFERENCES merchants (short_code),
    phone_number VARCHAR(15) NOT NULL REFERENCES users (phone_number) ON UPDATE CASCADE,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount > 0),
    status transaction_status DEFAULT 'PENDING',
    result_code INTEGER,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '15 minutes')
);

-- 3. High-Performance Indices
CREATE INDEX IF NOT EXISTS idx_transactions_phone_number ON transactions (phone_number);
CREATE INDEX IF NOT EXISTS idx_transactions_short_code ON transactions (short_code);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions (status);
CREATE INDEX IF NOT EXISTS idx_transactions_expiry ON transactions (expires_at) WHERE status = 'PENDING';