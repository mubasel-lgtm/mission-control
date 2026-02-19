import { Pool, PoolClient } from 'pg';

// Database interface - PostgreSQL implementation
export interface Database {
  prepare(sql: string): Statement;
  exec(sql: string): Promise<void>;
}

export interface Statement {
  run(...params: unknown[]): Promise<{ changes: number; lastInsertRowid: number }>;
  get(...params: unknown[]): Promise<Record<string, unknown> | undefined>;
  all(...params: unknown[]): Promise<Record<string, unknown>[]>;
}

let pool: Pool | null = null;

function toPgSql(sql: string): string {
  let i = 0;
  return sql.replace(/\?/g, () => `$${++i}`);
}

function resolveConnectionString(): string | null {
  const direct = process.env.DATABASE_URL;
  if (direct && direct.trim()) return direct.trim();

  const publicUrl = process.env.DATABASE_PUBLIC_URL;
  if (publicUrl && publicUrl.trim()) return publicUrl.trim();

  const host = process.env.PGHOST;
  const port = process.env.PGPORT || '5432';
  const user = process.env.PGUSER || process.env.POSTGRES_USER;
  const pass = process.env.PGPASSWORD || process.env.POSTGRES_PASSWORD;
  const db = process.env.PGDATABASE || process.env.POSTGRES_DB || 'postgres';

  if (host && user && pass) {
    return `postgresql://${encodeURIComponent(user)}:${encodeURIComponent(pass)}@${host}:${port}/${db}`;
  }

  return null;
}

export function getDb(): Database {
  if (!pool) {
    const connectionString = resolveConnectionString();
    
    if (!connectionString) {
      throw new Error('No PostgreSQL connection variables found (DATABASE_URL/DATABASE_PUBLIC_URL/PG*).');
    }

    pool = new Pool({
      connectionString,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected PostgreSQL pool error:', err);
    });

    console.log('PostgreSQL connection pool created');
  }

  return {
    prepare: (sql: string) => {
      return {
        run: async (...params: unknown[]) => {
          const pgSql = toPgSql(sql);
          const result = await pool!.query(pgSql, params as (string | number | null)[]);
          return {
            changes: result.rowCount || 0,
            lastInsertRowid: 0, // PostgreSQL uses SERIAL, use query returning for specific cases
          };
        },
        get: async (...params: unknown[]) => {
          const pgSql = toPgSql(sql);
          const result = await pool!.query(pgSql, params as (string | number | null)[]);
          return result.rows[0] as Record<string, unknown> | undefined;
        },
        all: async (...params: unknown[]) => {
          const pgSql = toPgSql(sql);
          const result = await pool!.query(pgSql, params as (string | number | null)[]);
          return result.rows as Record<string, unknown>[];
        },
      };
    },
    exec: async (sql: string) => {
      await pool!.query(sql);
    },
  };
}

export async function ensureTables() {
  const db = getDb();
  
  try {
    // Create tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'active',
        priority TEXT DEFAULT 'medium',
        progress INTEGER DEFAULT 0,
        todoist_project_id TEXT,
        due_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'todo',
        priority INTEGER DEFAULT 4,
        project_id TEXT,
        todoist_task_id TEXT UNIQUE,
        due_date TEXT,
        labels TEXT,
        url TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS blockers (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT,
        project_id TEXT,
        severity TEXT DEFAULT 'warning',
        status TEXT DEFAULT 'open',
        assigned_to TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS research (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        topic TEXT,
        status TEXT DEFAULT 'queued',
        priority TEXT DEFAULT 'medium',
        notes TEXT,
        url TEXT,
        tags TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS bots (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'inactive',
        schedule TEXT,
        config TEXT,
        last_run TEXT,
        next_run TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS bot_logs (
        id TEXT PRIMARY KEY,
        bot_id TEXT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        level TEXT DEFAULT 'info',
        message TEXT
      );
      
      
      CREATE TABLE IF NOT EXISTS orchestration_tasks (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        objective TEXT NOT NULL,
        definition_of_done TEXT NOT NULL,
        owner_bot TEXT NOT NULL,
        priority TEXT DEFAULT 'P2',
        status TEXT DEFAULT 'queued',
        due_at TEXT,
        constraints_json TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS worker_reports (
        id TEXT PRIMARY KEY,
        event_type TEXT NOT NULL,
        bot_id TEXT NOT NULL,
        task_id TEXT,
        payload_json TEXT NOT NULL,
        ts TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS escalations (
        id TEXT PRIMARY KEY,
        task_id TEXT,
        bot_id TEXT,
        reason TEXT NOT NULL,
        options_json TEXT,
        recommendation TEXT,
        status TEXT DEFAULT 'open',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS digests (
        id TEXT PRIMARY KEY,
        period TEXT,
        content TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS sync_metadata (
        id INTEGER PRIMARY KEY,
        last_todoist_sync TEXT,
        last_calendar_sync TEXT
      );
    `);
    
    // Insert default sync record if not exists
    await db.prepare('INSERT INTO sync_metadata (id) VALUES (1) ON CONFLICT (id) DO NOTHING').run();
    
    console.log('PostgreSQL tables initialized successfully');
  } catch (error) {
    console.error('Error initializing tables:', error);
    throw error;
  }
}

// Close pool on shutdown
export async function closeDb() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('PostgreSQL connection pool closed');
  }
}

export default getDb;
