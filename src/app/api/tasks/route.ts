import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { fetchTodoistTasks, mapTodoistPriority } from '@/lib/todoist';

export const dynamic = 'force-dynamic';

// GET /api/tasks - List tasks (optionally synced from Todoist)
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const sync = searchParams.get('sync') === 'true';
    const projectId = searchParams.get('projectId');
    const status = searchParams.get('status');
    
    // Sync with Todoist if requested
    if (sync) {
      await syncTodoistTasks(db);
    }
    
    // Build query
    let query = 'SELECT * FROM tasks';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (projectId) {
      conditions.push('project_id = ?');
      params.push(projectId);
    }
    
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY priority ASC, created_at DESC';
    
    const tasks = db.prepare(query).all(...params);
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks' },
      { status: 500 }
    );
  }
}

// POST /api/tasks - Create a new task
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const crypto = await import('crypto');
    
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO tasks (id, title, description, status, priority, project_id, due_date, labels, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.title,
      body.description || null,
      body.status || 'todo',
      body.priority || 4,
      body.projectId || null,
      body.dueDate || null,
      body.labels ? JSON.stringify(body.labels) : '[]',
      now,
      now
    );
    
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error('Error creating task:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}

async function syncTodoistTasks(db: any) {
  try {
    const todoistTasks = await fetchTodoistTasks();
    
    const insertOrUpdate = db.prepare(`
      INSERT INTO tasks (id, title, description, status, priority, todoist_task_id, due_date, labels, url, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(todoist_task_id) DO UPDATE SET
        title = excluded.title,
        description = excluded.description,
        status = excluded.status,
        priority = excluded.priority,
        due_date = excluded.due_date,
        labels = excluded.labels,
        updated_at = excluded.updated_at
    `);
    
    const now = new Date().toISOString();
    
    for (const task of todoistTasks) {
      const id = crypto.randomUUID();
      insertOrUpdate.run(
        id,
        task.content,
        task.description,
        task.is_completed ? 'completed' : 'todo',
        mapTodoistPriority(task.priority),
        task.id,
        task.due?.date || null,
        JSON.stringify(task.labels),
        task.url,
        now
      );
    }
    
    // Update sync metadata
    db.prepare('UPDATE sync_metadata SET last_todoist_sync = ? WHERE id = 1').run(now);
    
    console.log(`Synced ${todoistTasks.length} tasks from Todoist`);
  } catch (error) {
    console.error('Error syncing Todoist tasks:', error);
    throw error;
  }
}
