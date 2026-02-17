import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/tasks/[id] - Get a single task
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const task = await db.prepare('SELECT * FROM tasks WHERE id = ?').get(params.id);
    
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    return NextResponse.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    return NextResponse.json(
      { error: 'Failed to fetch task' },
      { status: 500 }
    );
  }
}

// PATCH /api/tasks/[id] - Update a task
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const body = await request.json();
    const now = new Date().toISOString();
    
    const existing = await db.prepare('SELECT * FROM tasks WHERE id = ?').get(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    await db.prepare(`
      UPDATE tasks SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        due_date = COALESCE(?, due_date),
        updated_at = ?
      WHERE id = ?
    `).run(
      body.title,
      body.description,
      body.status,
      body.priority,
      body.dueDate,
      now,
      params.id
    );
    
    const task = await db.prepare('SELECT * FROM tasks WHERE id = ?').get(params.id);
    return NextResponse.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    return NextResponse.json(
      { error: 'Failed to update task' },
      { status: 500 }
    );
  }
}

// DELETE /api/tasks/[id] - Delete a task
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const existing = await db.prepare('SELECT * FROM tasks WHERE id = ?').get(params.id);
    
    if (!existing) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 });
    }
    
    await db.prepare('DELETE FROM tasks WHERE id = ?').run(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return NextResponse.json(
      { error: 'Failed to delete task' },
      { status: 500 }
    );
  }
}
