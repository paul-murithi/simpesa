-- Migration: Create Users Table
-- Date: Jan 28, 2025
CREATE TABLE IF NOT EXISTS users (
    phone_number VARCHAR(15) PRIMARY KEY,
    pin VARCHAR(4) NOT NULL CHECK (pin ~ '^[0-9]{4}$'),
    balance NUMERIC(15, 2) CHECK (balance >= 0),
    "status" VARCHAR(20) DEFAULT 'ACTIVE'
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_status ON users("status");