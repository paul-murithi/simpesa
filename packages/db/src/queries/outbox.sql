-- name: getPendingRecords
SELECT * FROM outbox_events
WHERE status='PENDING'
LIMIT 50;

-- name: insertIngestionOutboxEvent
INSERT INTO outbox_events (
    aggregate_type,
    aggregate_id,
    payload
) VALUES ($1, $2, $3);

-- name: updateOutboxEvent
UPDATE outbox_events SET
    status='PUBLISHED',
    published_at=NOW()
WHERE id=$1;