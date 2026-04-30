-- Migration: Sync webhook_dispatches table with current code expectations
ALTER TABLE webhook_dispatches
ADD COLUMN IF NOT EXISTS last_attempt_number INTEGER DEFAULT 0;