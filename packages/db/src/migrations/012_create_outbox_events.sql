CREATE TABLE outbox_events (
    id UUID PRIMARY KEY,
    aggregate_type VARCHAR(50),
    aggregate_id UUID,
    event_type VARCHAR(100),
    payload JSONB,

    status VARCHAR(20) DEFAULT 'PENDING',

    created_at TIMESTAMP DEFAULT NOW(),
    published_at TIMESTAMP NULL
);