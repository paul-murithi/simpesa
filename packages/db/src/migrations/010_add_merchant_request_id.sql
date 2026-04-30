-- Migration: Add missing merchant_request_id to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS merchant_request_id UUID UNIQUE NOT NULL;
