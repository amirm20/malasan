import crypto from 'crypto';
import { getPgPool } from './pgRepository.js';

export const SESSION_COOKIE = 'malasban_session';
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

function hashSessionId(sessionId: string): string {
  return crypto.createHash('sha256').update(sessionId).digest('hex');
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  await getPgPool().query(
    `INSERT INTO user_sessions (id_hash, user_id, expires_at, created_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)`,
    [hashSessionId(sessionId), userId, expiresAt]
  );
  return sessionId;
}

export async function getSessionUserId(sessionId: string): Promise<string | null> {
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(sessionId)) return null;
  const result = await getPgPool().query(
    `SELECT user_id FROM user_sessions
     WHERE id_hash = $1 AND expires_at > CURRENT_TIMESTAMP AND revoked_at IS NULL
     LIMIT 1`,
    [hashSessionId(sessionId)]
  );
  return result.rows[0]?.user_id || null;
}

export async function revokeSession(sessionId: string): Promise<void> {
  if (!/^[A-Za-z0-9_-]{40,60}$/.test(sessionId)) return;
  await getPgPool().query(
    `UPDATE user_sessions SET revoked_at = CURRENT_TIMESTAMP
     WHERE id_hash = $1 AND revoked_at IS NULL`,
    [hashSessionId(sessionId)]
  );
}
