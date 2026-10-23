import fs from 'fs';
import path from 'path';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export interface MigrationRecord {
  version: string;
  name: string;
  applied_at: Date;
}

export interface DbConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  ssl?: boolean | object;
}

export function getDbConfig(): DbConfig {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.PG_URL;

  if (connectionString) {
    return { connectionString };
  }

  return {
    host: process.env.PGHOST || process.env.SQL_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.PGPORT || process.env.DB_PORT || '5432', 10),
    database: process.env.PGDATABASE || process.env.SQL_DB_NAME || process.env.DB_NAME || 'malasban_db',
    user: process.env.PGUSER || process.env.SQL_USER || process.env.DB_USER || 'postgres',
    password: process.env.PGPASSWORD || process.env.SQL_PASSWORD || process.env.DB_PASSWORD || '',
  };
}

export function createPgPool(): pg.Pool {
  const config = getDbConfig();
  if (process.env.NODE_ENV === 'production') {
    const explicitHost = process.env.PGHOST || process.env.DB_HOST || process.env.SQL_HOST;
    const explicitPassword = process.env.PGPASSWORD || process.env.DB_PASSWORD || process.env.SQL_PASSWORD;
    const explicitDatabase = process.env.PGDATABASE || process.env.DB_NAME || process.env.SQL_DB_NAME;
    const explicitUser = process.env.PGUSER || process.env.DB_USER || process.env.SQL_USER;
    if (!config.connectionString && !(explicitHost && explicitPassword && explicitDatabase && explicitUser)) {
      throw new Error('Configure DATABASE_URL or explicit PostgreSQL host, database, user, and password in production.');
    }
    if (config.connectionString && !['localhost', '127.0.0.1', '[::1]'].some((host) => config.connectionString!.includes(host)) && process.env.DB_SSL !== 'true') {
      throw new Error('Set DB_SSL=true for remote PostgreSQL connections in production.');
    }
  }
  if (config.connectionString) {
    return new Pool({
      connectionString: config.connectionString,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
    });
  }
  return new Pool({
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user,
    password: config.password,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  });
}

/**
 * Migration Manager for Malasban Platform
 */
export class DbMigrator {
  private pool: pg.Pool;
  private migrationsDir: string;

  constructor(pool?: pg.Pool, migrationsDir?: string) {
    this.pool = pool || createPgPool();
    this.migrationsDir = migrationsDir || path.resolve(process.cwd(), 'database/migrations/postgres');
  }

  async ensureMigrationsTable(client: pg.PoolClient): Promise<void> {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  async getAppliedMigrations(): Promise<MigrationRecord[]> {
    const client = await this.pool.connect();
    try {
      await this.ensureMigrationsTable(client);
      const res = await client.query<MigrationRecord>(
        `SELECT version, name, applied_at FROM schema_migrations ORDER BY version ASC`
      );
      return res.rows;
    } finally {
      client.release();
    }
  }

  async getMigrationFiles(): Promise<{ version: string; name: string; fullPath: string; sql: string }[]> {
    if (!fs.existsSync(this.migrationsDir)) {
      throw new Error(`Migrations directory not found: ${this.migrationsDir}`);
    }

    const files = fs
      .readdirSync(this.migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    return files.map((file) => {
      const match = file.match(/^(\d+)_(.*)\.sql$/);
      const version = match ? match[1] : file.replace('.sql', '');
      const name = match ? match[2] : file.replace('.sql', '');
      const fullPath = path.join(this.migrationsDir, file);
      const sql = fs.readFileSync(fullPath, 'utf-8');
      return { version, name, fullPath, sql };
    });
  }

  async runMigrations(): Promise<{ applied: string[]; alreadyApplied: string[] }> {
    const client = await this.pool.connect();
    const applied: string[] = [];
    const alreadyApplied: string[] = [];

    try {
      await this.ensureMigrationsTable(client);
      const appliedRes = await client.query<MigrationRecord>(
        `SELECT version, name, applied_at FROM schema_migrations ORDER BY version ASC`
      );
      const appliedSet = new Set(appliedRes.rows.map((r) => r.version));

      const files = await this.getMigrationFiles();

      for (const file of files) {
        if (appliedSet.has(file.version)) {
          alreadyApplied.push(file.version);
          continue;
        }

        console.log(`⏳ Applying migration [${file.version}]: ${file.name}...`);
        await client.query('BEGIN');
        try {
          await client.query(file.sql);
          await client.query(
            `INSERT INTO schema_migrations (version, name) VALUES ($1, $2) ON CONFLICT (version) DO NOTHING`,
            [file.version, file.name]
          );
          await client.query('COMMIT');
          applied.push(file.version);
          console.log(`✅ Successfully applied [${file.version}]!`);
        } catch (err) {
          await client.query('ROLLBACK');
          console.error(`❌ Migration failed at [${file.version}]:`, err);
          throw err;
        }
      }

      return { applied, alreadyApplied };
    } finally {
      client.release();
    }
  }

  async runSeed(): Promise<void> {
    const seedFile = path.join(this.migrationsDir, '002_seed_initial_data.sql');
    if (!fs.existsSync(seedFile)) {
      throw new Error(`Seed migration file not found: ${seedFile}`);
    }

    console.log(`🌱 Seeding database from ${seedFile}...`);
    const sql = fs.readFileSync(seedFile, 'utf-8');
    const client = await this.pool.connect();
    try {
      await this.ensureMigrationsTable(client);
      await client.query('BEGIN');
      await client.query(sql);
      await client.query(
        `INSERT INTO schema_migrations (version, name) VALUES ('002', '002_seed_initial_data') ON CONFLICT (version) DO NOTHING`
      );
      await client.query('COMMIT');
      console.log(`✅ Database successfully seeded with initial data!`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`❌ Seeding failed:`, err);
      throw err;
    } finally {
      client.release();
    }
  }

  async getStatus(): Promise<{
    connected: boolean;
    error?: string;
    applied: MigrationRecord[];
    pending: { version: string; name: string }[];
  }> {
    try {
      const client = await this.pool.connect();
      try {
        await this.ensureMigrationsTable(client);
        const applied = await this.getAppliedMigrations();
        const appliedSet = new Set(applied.map((r) => r.version));
        const files = await this.getMigrationFiles();
        const pending = files
          .filter((f) => !appliedSet.has(f.version))
          .map((f) => ({ version: f.version, name: f.name }));

        return {
          connected: true,
          applied,
          pending,
        };
      } finally {
        client.release();
      }
    } catch (err: any) {
      return {
        connected: false,
        error: err.message || 'Could not connect to PostgreSQL database',
        applied: [],
        pending: [],
      };
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

// CLI Execution Handler
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'status';

  console.log('====================================================');
  console.log('   Malasban Lavashak - PostgreSQL Migration Runner  ');
  console.log('====================================================');

  const migrator = new DbMigrator();

  try {
    if (command === 'status') {
      const status = await migrator.getStatus();
      if (!status.connected) {
        console.log(`⚠️ Database connection status: Offline / Unreachable`);
        console.log(`   Error: ${status.error}`);
        console.log(`\nNote: If you are setting up a local PostgreSQL or Cloud SQL database,`);
        console.log(`configure DATABASE_URL in your .env file or environment variables.`);
      } else {
        console.log(`🟢 Database connection: Connected`);
        console.log(`Applied migrations (${status.applied.length}):`);
        status.applied.forEach((m) => console.log(`  - [${m.version}] ${m.name} (${m.applied_at})`));
        console.log(`\nPending migrations (${status.pending.length}):`);
        status.pending.forEach((m) => console.log(`  - [${m.version}] ${m.name}`));
      }
    } else if (command === 'migrate') {
      console.log('🚀 Running database migrations...');
      const res = await migrator.runMigrations();
      console.log(`Done! Applied: ${res.applied.length}, Already up-to-date: ${res.alreadyApplied.length}`);
    } else if (command === 'seed') {
      console.log('🌱 Seeding initial data...');
      await migrator.runSeed();
    } else if (command === 'init') {
      console.log('🚀 Initializing database (Migrations + Seed)...');
      const res = await migrator.runMigrations();
      console.log(`✅ Migrations completed. Applied: ${res.applied.length}`);
      console.log('🌱 Database initialized successfully with all schema and seed data!');
    } else {
      console.log(`Unknown command: ${command}`);
      console.log(`Usage: tsx server/infrastructure/dbMigrator.ts [migrate|seed|init|status]`);
    }
  } catch (err: any) {
    console.error('Migration error:', err.message || err);
    process.exit(1);
  } finally {
    await migrator.close().catch(() => {});
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('dbMigrator.ts')) {
  main();
}
