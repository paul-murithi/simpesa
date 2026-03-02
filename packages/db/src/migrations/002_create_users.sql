-- Migration: Create Users Table (Updated)
CREATE TABLE IF NOT EXISTS users (
    phone_number VARCHAR(15) PRIMARY KEY,
    pin VARCHAR(4) NOT NULL CHECK (pin ~ '^[0-9]{4}$'),
    balance NUMERIC(15, 2) DEFAULT 0.00 CHECK (balance >= 0),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);