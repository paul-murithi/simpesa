CREATE TABLE webhook_attempts (
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

CREATE INDEX idx_webhook_attempts_dispatch
ON webhook_attempts(dispatch_id);