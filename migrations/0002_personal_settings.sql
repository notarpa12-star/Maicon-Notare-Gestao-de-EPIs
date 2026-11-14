-- Preferências de visual pessoal e identidade Firebase por pessoa.
-- A migração é aditiva: não remove nem reescreve os registros existentes.
ALTER TABLE users ADD COLUMN firebase_uid TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_firebase_uid_unique_idx
    ON users(firebase_uid)
    WHERE firebase_uid IS NOT NULL;

CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY,
    theme TEXT NOT NULL DEFAULT 'bc2'
        CHECK (theme IN ('bc2', 'light', 'black', 'aurora')),
    updated_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS pending_email_changes (
    firebase_uid TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    old_email TEXT NOT NULL COLLATE NOCASE,
    new_email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    requested_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS pending_email_changes_expiry_idx
    ON pending_email_changes(expires_at);
