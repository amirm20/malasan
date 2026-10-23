-- Server-side sessions: only a SHA-256 hash of the random cookie value is stored.
CREATE TABLE IF NOT EXISTS user_sessions (
  id_hash CHAR(64) PRIMARY KEY,
  user_id VARCHAR(50) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  revoked_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expiry ON user_sessions(expires_at);
