import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { fetchTodoistTasks, mapTodoistPriority } from '@/lib/todoist';

export const dynamic = 'force-dynamic';

// POST /api/webhooks/todoist - Receive Todoist webhook events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const db = getDb();
    const crypto = await import('crypto');
    
    console.log('Todoist webhook received:', body.event_name);
    
    // Handle different event types
    switch (body.event_name) {
      case 'item:added':
      case 'item:updated':
        await handleTaskUpdate(db, body.event_data, crypto);
        break;
        
      case 'item:completed':
        await handleTaskCompletion(db, body.event_data.id);
        break;
        
      case 'item:uncompleted':
        await handleTaskUncompletion(db, body.event_data.id);
        break;
        
      case 'item:deleted':
        await handleTaskDeletion(db, body.event_data.id);
        break;
        
      default:
        console.log('Unhandled Todoist event:', body.event_name);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function handleTaskUpdate(db: any, eventData: any, crypto: any) {
  const task = eventData;
  const now = new Date().toISOString();
  
  // Check if task already exists
  const existing = db.prepare('SELECT id FROM tasks WHERE todoist_task_id = ?').get(task.id);
  
  if (existing) {
    db.prepare(`
      UPDATE tasks SET
        title = ?,
        description = ?,
        priority = ?,
        due_date = ?,
        labels = ?,
        updated_at = ?
      WHERE todoist_task_id = ?
    `).run(
      task.content,
      task.description,
      mapTodoistPriority(task.priority),
      task.due?.date || null,
      JSON.stringify(task.labels),
      now,
      task.id
    );
  } else {
    const id = crypto.randomUUID();
    db.prepare(`
      INSERT INTO tasks (id, title, description, status, priority, todoist_task_id, due_date, labels, url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      task.content,
      task.description,
      task.is_completed ? 'completed' : 'todo',
      mapTodoistPriority(task.priority),
      task.id,
      task.due?.date || null,
      JSON.stringify(task.labels),
      task.url,
      now,
      now
    );
  }
}

async function handleTaskCompletion(db: any, todoistTaskId: string) {
  const now = new Date().toISOString();
  db.prepare('UPDATE tasks SET status = ?, updated_at = ? WHERE todoist_task_id = ?')
    .run('completed', now, todoistTaskId);
}

async function handleTaskUncompletion(db: any, todoistTaskId: string) {
  const now = new Date().toISOString();
  db.prepare('UPDATE tasks SET status = ?, updated_at = ? WHERE todoist_task_id = ?')
    .run('todo', now, todoistTaskId);
}

async function handleTaskDeletion(db: any, todoistTaskId: string) {
  db.prepare('DELETE FROM tasks WHERE todoist_task_id = ?').run(todoistTaskId);
}
