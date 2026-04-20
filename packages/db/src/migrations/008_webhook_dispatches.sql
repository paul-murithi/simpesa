CREATE TABLE IF NOT EXISTS webhook_dispatches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  transaction_id UUID NOT NULL,
  checkout_id VARCHAR(50) NOT NULL,

  callback_url TEXT NOT NULL,
  payload JSONB NOT NULL,

  status VARCHAR(20) DEFAULT 'pending',

  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  last_attempt_number INTEGER DEFAULT 0,

  CONSTRAINT webhook_dispatches_transaction_id_fkey
    FOREIGN KEY (transaction_id)
    REFERENCES transactions(request_id)
    ON DELETE CASCADE
);

CREATE INDEX idx_webhook_dispatch_transaction
ON webhook_dispatches(transaction_id)