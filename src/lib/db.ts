import path from 'path';
import fs from 'fs';

// Database interface to abstract both better-sqlite3 and libsql
// Using Promises to unify sync (better-sqlite3) and async (libsql) APIs
export interface Database {
  prepare(sql: string): Statement;
  exec(sql: string): Promise<void> | void;
  pragma(pragma: string): Promise<unknown> | unknown;
}

export interface Statement {
  run(...params: unknown[]): Promise<{ changes: number; lastInsertRowid: number }> | { changes: number; lastInsertRowid: number };
  get(...params: unknown[]): Promise<Record<string, unknown> | undefined> | Record<string, unknown> | undefined;
  all(...params: unknown[]): Promise<Record<string, unknown>[]> | Record<string, unknown>[];
}

// Check if we're in a serverless environment (Vercel)
const isServerless = process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;

let db: Database | null = null;

export function getDb(): Database {
  if (!db) {
    // Try better-sqlite3 first for local development
    // but use libsql on Vercel or if better-sqlite3 fails
    if (isServerless) {
      console.log('Serverless environment detected, using libsql');
      db = createLibSqlDb();
    } else {
      console.log('Local environment, trying better-sqlite3');
      try {
        // Check if better-sqlite3 is available
        require.resolve('better-sqlite3');
        db = createBetterSqliteDb();
      } catch (error) {
        console.warn('better-sqlite3 not available, falling back to libsql:', error);
        db = createLibSqlDb();
      }
    }
    initTables();
  }
  return db;
}

// Better-sqlite3 implementation (local development)
function createBetterSqliteDb(): Database {
  try {
    const Database = require('better-sqlite3');
    const DB_DIR = path.join(process.cwd(), 'data');
    const DB_PATH = path.join(DB_DIR, 'mission-control.db');

    if (!fs.existsSync(DB_DIR)) {
      fs.mkdirSync(DB_DIR, { recursive: true });
    }

    const sqliteDb = new Database(DB_PATH);
    sqliteDb.pragma('journal_mode = WAL');

    return {
      prepare: (sql: string) => {
        const stmt = sqliteDb.prepare(sql);
        return {
          run: (...params: unknown[]) => stmt.run(...params),
          get: (...params: unknown[]) => stmt.get(...params) as Record<string, unknown> | undefined,
          all: (...params: unknown[]) => stmt.all(...params) as Record<string,unknown>[],
        };
      },
      exec: (sql: string) => sqliteDb.exec(sql),
      pragma: (pragma: string) => sqliteDb.pragma(pragma),
    };
  } catch (error) {
    console.warn('better-sqlite3 not available, falling back to libsql:', error);
    return createLibSqlDb();
  }
}

// LibSQL implementation (Vercel/serverless)
function createLibSqlDb(): Database {
  const { createClient } = require('@libsql/client');
  
  const url = process.env.TURSO_DATABASE_URL || process.env.LIBSQL_URL || ':memory:';
  const authToken = process.env.TURSO_AUTH_TOKEN;
  
  const client = createClient({ url, authToken });

  return {
    prepare: (sql: string) => {
      return {
        run: async (...params: unknown[]) => {
          const result = await client.execute({ sql, args: params as (string | number | null)[] });
          return {
            changes: result.rowsAffected,
            lastInsertRowid: result.lastInsertRowid ?? 0,
          };
        },
        get: async (...params: unknown[]) => {
          const result = await client.execute({ sql, args: params as (string | number | null)[] });
          return result.rows[0] as Record<string, unknown> | undefined;
        },
        all: async (...params: unknown[]) => {
          const result = await client.execute({ sql, args: params as (string | number | null)[] });
          return result.rows as Record<string, unknown>[];
        },
      };
    },
    exec: async (sql: string) => {
      await client.executeMultiple(sql);
    },
    pragma: () => null,
  };
}

function initTables() {
  if (!db) return;

  const exec = async () => {
    // Projects table
    await db!.exec(`
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
      )
    `);

    // Tasks table (synced from Todoist)
    await db!.exec(`
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
      )
    `);

    // Blockers table (Needs Mubasel)
    await db!.exec(`
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
      )
    `);

    // Research queue table
    await db!.exec(`
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
      )
    `);

    // Claude Bots table
    await db!.exec(`
      CREATE TABLE IF NOT EXISTS bots (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        status TEXT DEFAULT 'paused',
        last_run TEXT,
        next_run TEXT,
        schedule TEXT,
        config TEXT
      )
    `);

    // Bot logs table
    await db!.exec(`
      CREATE TABLE IF NOT EXISTS bot_logs (
        id TEXT PRIMARY KEY,
        bot_id TEXT,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        level TEXT DEFAULT 'info',
        message TEXT
      )
    `);

    // Sync metadata
    await db!.exec(`
      CREATE TABLE IF NOT EXISTS sync_metadata (
        id INTEGER PRIMARY KEY,
        last_todoist_sync TEXT,
        last_calendar_sync TEXT
      )
    `);

    // Insert default sync record if not exists
    try {
      await db!.prepare('INSERT OR IGNORE INTO sync_metadata (id) VALUES (1)').run();
    } catch {
      // May fail on some DBs, ignore
    }
  };

  // Execute and optionally insert sample data
  exec().then(() => {
    // Only insert sample data for local development
    if (!isServerless) {
      insertSampleData();
    }
  });
}

function insertSampleData() {
  if (!db || isServerless) return;

  const count = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number } | undefined;
  if (count && count.count === 0) {
    const insertProject = db.prepare(`
      INSERT INTO projects (id, name, description, status, priority, progress)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertBlocker = db.prepare(`
      INSERT INTO blockers (id, title, description, severity, status)
      VALUES (?, ?, ?, ?, ?)
    `);

    const insertResearch = db.prepare(`
      INSERT INTO research (id, title, topic, status, priority, tags)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertBot = db.prepare(`
      INSERT INTO bots (id, name, description, status, schedule, config)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertProject.run('proj-1', 'Mission Control Dashboard', 'Building the central command center for project management', 'active', 'high', 65);
    insertProject.run('proj-2', 'PetBloom AI', 'AI-powered pet care platform', 'active', 'high', 40);
    insertProject.run('proj-3', 'Website Redesign', 'Personal portfolio website update', 'paused', 'medium', 20);

    insertBlocker.run('block-1', 'Need API approval from Todoist', 'Waiting for enterprise API access approval', 'blocking', 'open');
    insertBlocker.run('block-2', 'Decide on database schema', 'Finalizing the data structure for tasks and projects', 'warning', 'in_progress');

    insertResearch.run('res-1', 'Vector databases comparison', 'AI Infrastructure', 'queued', 'high', 'ai,database,research');
    insertResearch.run('res-2', 'Next.js 15 features', 'Web Development', 'in_progress', 'medium', 'nextjs,frontend');

    insertBot.run('bot-1', 'Task Sync Bot', 'Syncs tasks from Todoist every 15 minutes', 'active', '*/15 * * * *', JSON.stringify({ source: 'todoist', autoResolve: true }));
    insertBot.run('bot-2', 'Calendar Sync Bot', 'Syncs events from Google Calendar', 'paused', '0 */1 * * *', JSON.stringify({ source: 'google_calendar', reminders: true }));
    insertBot.run('bot-3', 'Research Digest Bot', 'Compiles daily research summaries', 'active', '0 9 * * *', JSON.stringify({ format: 'markdown', recipients: ['email'] }));
  }
}

export default getDb;
