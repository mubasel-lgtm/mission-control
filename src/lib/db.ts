import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'mission-control.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initTables();
  }
  return db;
}

function initTables() {
  if (!db) return;

  // Projects table
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
  db.exec(`
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
  db.exec(`
    CREATE TABLE IF NOT EXISTS bot_logs (
      id TEXT PRIMARY KEY,
      bot_id TEXT,
      timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
      level TEXT DEFAULT 'info',
      message TEXT
    )
  `);

  // Sync metadata
  db.exec(`
    CREATE TABLE IF NOT EXISTS sync_metadata (
      id INTEGER PRIMARY KEY,
      last_todoist_sync TEXT,
      last_calendar_sync TEXT
    )
  `);

  // Insert default sync record if not exists
  db.exec(`
    INSERT OR IGNORE INTO sync_metadata (id) VALUES (1)
  `);

  // Insert sample data if tables are empty
  const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
  if (projectCount.count === 0) {
    insertSampleData();
  }
}

function insertSampleData() {
  if (!db) return;

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

  // Sample projects
  insertProject.run(
    'proj-1',
    'Mission Control Dashboard',
    'Building the central command center for project management',
    'active',
    'high',
    65
  );
  insertProject.run(
    'proj-2',
    'PetBloom AI',
    'AI-powered pet care platform',
    'active',
    'high',
    40
  );
  insertProject.run(
    'proj-3',
    'Website Redesign',
    'Personal portfolio website update',
    'paused',
    'medium',
    20
  );

  // Sample blockers
  insertBlocker.run(
    'block-1',
    'Need API approval from Todoist',
    'Waiting for enterprise API access approval',
    'blocking',
    'open'
  );
  insertBlocker.run(
    'block-2',
    'Decide on database schema',
    'Finalizing the data structure for tasks and projects',
    'warning',
    'in_progress'
  );

  // Sample research
  insertResearch.run(
    'res-1',
    'Vector databases comparison',
    'AI Infrastructure',
    'queued',
    'high',
    'ai,database,research'
  );
  insertResearch.run(
    'res-2',
    'Next.js 15 features',
    'Web Development',
    'in_progress',
    'medium',
    'nextjs,frontend'
  );

  // Sample bots
  insertBot.run(
    'bot-1',
    'Task Sync Bot',
    'Syncs tasks from Todoist every 15 minutes',
    'active',
    '*/15 * * * *',
    JSON.stringify({ source: 'todoist', autoResolve: true })
  );
  insertBot.run(
    'bot-2',
    'Calendar Sync Bot',
    'Syncs events from Google Calendar',
    'paused',
    '0 */1 * * *',
    JSON.stringify({ source: 'google_calendar', reminders: true })
  );
  insertBot.run(
    'bot-3',
    'Research Digest Bot',
    'Compiles daily research summaries',
    'active',
    '0 9 * * *',
    JSON.stringify({ format: 'markdown', recipients: ['email'] })
  );
}

export default getDb;
