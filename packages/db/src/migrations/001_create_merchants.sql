-- Migration: Create Merchants Table (Updated)
CREATE TABLE IF NOT EXISTS merchants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    short_code VARCHAR(6) UNIQUE NOT NULL,
    pass_key TEXT NOT NULL,
    callback_url TEXT NOT NULL CHECK (callback_url ~ '^https?://[^\s/$.?#].[^\s]*$'),
    balance NUMERIC(15, 2) DEFAULT 0.00 CHECK (balance >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_merchants_short_code ON merchants(short_code);