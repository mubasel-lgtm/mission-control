import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { fetchTodoistTasks, mapTodoistPriority } from '@/lib/todoist';
import { fetchTodayEvents, fetchUpcomingEvents } from '@/lib/calendar';

// POST /api/sync - Trigger full sync
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const results: Record<string, any> = {};
    
    // Sync Todoist tasks
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
      const crypto = await import('crypto');
      
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
      
      db.prepare('UPDATE sync_metadata SET last_todoist_sync = ? WHERE id = 1').run(now);
      results.todoist = { success: true, count: todoistTasks.length };
    } catch (error) {
      console.error('Todoist sync error:', error);
      results.todoist = { success: false, error: String(error) };
    }
    
    // Sync Calendar events (store in memory/cache for now)
    try {
      const events = await fetchUpcomingEvents(7);
      const now = new Date().toISOString();
      db.prepare('UPDATE sync_metadata SET last_calendar_sync = ? WHERE id = 1').run(now);
      results.calendar = { success: true, count: events.length };
    } catch (error) {
      console.error('Calendar sync error:', error);
      results.calendar = { success: false, error: String(error) };
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error) {
    console.error('Sync error:', error);
    return NextResponse.json(
      { error: 'Failed to sync', details: String(error) },
      { status: 500 }
    );
  }
}

// GET /api/sync/status - Get sync status
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const metadata = db.prepare('SELECT * FROM sync_metadata WHERE id = 1').get();
    
    // Get counts
    const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get() as { count: number };
    const projectCount = db.prepare('SELECT COUNT(*) as count FROM projects').get() as { count: number };
    
    return NextResponse.json({
      lastTodoistSync: metadata?.last_todoist_sync,
      lastCalendarSync: metadata?.last_calendar_sync,
      counts: {
        tasks: taskCount.count,
        projects: projectCount.count,
      },
    });
  } catch (error) {
    console.error('Error getting sync status:', error);
    return NextResponse.json(
      { error: 'Failed to get sync status' },
      { status: 500 }
    );
  }
}
