import 'dotenv/config';
import crypto from 'crypto';
import { createPgPool } from '../server/infrastructure/dbMigrator.js';
import { hashPassword } from '../server/infrastructure/auth.js';

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const mobile = process.env.ADMIN_MOBILE?.trim();
  if (!email || !password || !mobile) {
    throw new Error('Set ADMIN_EMAIL, ADMIN_PASSWORD, and ADMIN_MOBILE before running this command.');
  }
  if (password.length < 14) throw new Error('ADMIN_PASSWORD must be at least 14 characters.');
  const pool = createPgPool();
  const auth = hashPassword(password);
  const id = `usr-admin-${crypto.randomUUID()}`;
  const permissions = ['overview','products','orders','wholesale','reviews','categories','coupons','customers','staff','blog','settings','chat'];
  try {
    const existing = await pool.query('SELECT id, role FROM users WHERE email = $1 LIMIT 1', [email]);
    if (existing.rows[0] && !['Admin', 'SuperAdmin'].includes(existing.rows[0].role)) {
      throw new Error('ADMIN_EMAIL belongs to a customer account. Choose a dedicated administrator email.');
    }
    if (existing.rows[0]) {
      await pool.query(
        `UPDATE users SET mobile = $2, password_hash = $3, salt = $4,
          role = 'SuperAdmin', permissions = $5::jsonb, is_active = TRUE,
          updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [existing.rows[0].id, mobile, auth.hash, auth.salt, JSON.stringify(permissions)]
      );
    } else {
      await pool.query(
        `INSERT INTO users (id, name, family, email, mobile, password_hash, salt, role, permissions, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'SuperAdmin', $8::jsonb, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [id, 'مدیر', 'سیستم ملس‌بان', email, mobile, auth.hash, auth.salt, JSON.stringify(permissions)]
      );
    }
    console.log(`Administrator account configured for ${email}. Keep ADMIN_PASSWORD out of source control and remove it from the environment after this command.`);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Administrator bootstrap failed:', error.message || error);
  process.exitCode = 1;
});
