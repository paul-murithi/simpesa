CREATE TABLE IF NOT EXISTS webhook_attempts (
    id BIGSERIAL PRIMARY KEY,
    dispatch_id UUID NOT NULL
        REFERENCES webhook_dispatches(id) ON DELETE CASCADE,
    attempt_number INT NOT NULL,
    response_status INT,
    response_body TEXT,
    error_message TEXT,
    duration_ms INT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_attempts_dispatch_attempt
ON webhook_attempts(dispatch_id, attempt_number DESC);