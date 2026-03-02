-- Table to track which migrations have run
CREATE TABLE
    IF NOT EXISTS schema_migrations (
        migration_version INTEGER PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP DEFAULT NOW ()
    );