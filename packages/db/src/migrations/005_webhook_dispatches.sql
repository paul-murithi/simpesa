CREATE TABLE webhook_dispatches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id UUID NOT NULL
        REFERENCES transactions(request_id) ON DELETE CASCADE,
    checkout_id VARCHAR(50) NOT NULL,
    callback_url TEXT NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    -- pending, delivering, delivered, failed
    attempt_count INT DEFAULT 0,
    max_attempts INT DEFAULT 5,
    next_retry_at TIMESTAMP,
    last_attempt_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_webhook_dispatch_retry
ON webhook_dispatches(next_retry_at)
WHERE status IN ('pending', 'failed');

CREATE INDEX idx_webhook_dispatch_transaction
ON webhook_dispatches(transaction_id)