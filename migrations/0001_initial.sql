CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    permissions_json TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0 CHECK (is_admin IN (0, 1)),
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    display_name TEXT NOT NULL DEFAULT '',
    role_id TEXT,
    status TEXT NOT NULL CHECK (status IN ('pending', 'active', 'rejected', 'suspended')),
    requested_at TEXT NOT NULL,
    approved_at TEXT,
    approved_by TEXT,
    FOREIGN KEY (role_id) REFERENCES roles(id)
);

CREATE TABLE IF NOT EXISTS app_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    revision INTEGER NOT NULL DEFAULT 0,
    data_json TEXT NOT NULL,
    last_change_id TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    occurred_at TEXT NOT NULL,
    actor_user_id TEXT NOT NULL,
    actor_name TEXT NOT NULL,
    actor_email TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    area TEXT NOT NULL,
    record_id TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    changes_json TEXT NOT NULL DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS users_status_idx ON users(status, requested_at);
CREATE INDEX IF NOT EXISTS audit_log_date_idx ON audit_log(occurred_at DESC);
CREATE INDEX IF NOT EXISTS audit_log_actor_idx ON audit_log(actor_email, occurred_at DESC);

CREATE TRIGGER IF NOT EXISTS audit_log_no_update
BEFORE UPDATE ON audit_log
BEGIN
    SELECT RAISE(ABORT, 'audit_log is append-only');
END;

CREATE TRIGGER IF NOT EXISTS audit_log_no_delete
BEFORE DELETE ON audit_log
BEGIN
    SELECT RAISE(ABORT, 'audit_log is append-only');
END;

INSERT OR IGNORE INTO app_state (id, revision, data_json)
VALUES (1, 0, '{"epis":[],"employees":[],"movements":[],"inspections":[],"productCatalog":[],"suggestionsAdded":[],"version":1}');
