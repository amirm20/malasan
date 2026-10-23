import crypto from 'crypto';
import { UserRole } from '../domain/models.js';

export interface AuthenticatedUser {
  userId: string;
  email: string;
  role: UserRole;
  isSuperAdmin?: boolean;
  permissions?: string[];
  name: string;
}

const CURRENT_PBKDF2_ITERATIONS = 310_000;
const LEGACY_PBKDF2_ITERATIONS = 10_000;

export function hashPassword(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const digest = crypto.pbkdf2Sync(password, salt, CURRENT_PBKDF2_ITERATIONS, 64, 'sha512').toString('hex');
  return { hash: `pbkdf2-sha512$${CURRENT_PBKDF2_ITERATIONS}$${digest}`, salt };
}

export function verifyPassword(password: string, storedHash: string, salt: string): boolean {
  try {
    // Existing accounts keep working with their legacy 10,000-iteration hashes.
    // New password hashes carry their work factor in the stored value.
    const match = storedHash.match(/^pbkdf2-sha512\$(\d+)\$([a-f0-9]+)$/i);
    const iterations = match ? Number(match[1]) : LEGACY_PBKDF2_ITERATIONS;
    const expectedHex = match ? match[2] : storedHash;
    if (!Number.isSafeInteger(iterations) || iterations < LEGACY_PBKDF2_ITERATIONS || iterations > 2_000_000) return false;
    const expected = Buffer.from(expectedHex, 'hex');
    if (expected.length !== 64) return false;
    const actual = crypto.pbkdf2Sync(password, salt, iterations, expected.length, 'sha512');
    return crypto.timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}
