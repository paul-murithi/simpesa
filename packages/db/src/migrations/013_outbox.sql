CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(50) NOT NULL,
    aggregate_id UUID NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    published_at TIMESTAMP WITH TIME ZONE NULL
);

CREATE INDEX IF NOT EXISTS idx_outbox_pending ON outbox_events (status) WHERE status = 'PENDING';

-- function logic
CREATE OR REPLACE FUNCTION signal_outbox_event() RETURNS trigger AS $$
BEGIN
  PERFORM pg_notify('outbox_work', '');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger
CREATE TRIGGER trg_outbox_inserted
AFTER INSERT ON outbox_events
FOR EACH STATEMENT EXECUTE FUNCTION signal_outbox_event();
