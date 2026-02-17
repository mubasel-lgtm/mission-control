import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH /api/projects/[id] - Update a project
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const body = await request.json();
    const now = new Date().toISOString();
    
    const existing = await db.prepare('SELECT * FROM projects WHERE id = ?').get(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    await db.prepare(`
      UPDATE projects SET
        name = COALESCE(?, name),
        description = COALESCE(?, description),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        progress = COALESCE(?, progress),
        due_date = COALESCE(?, due_date),
        updated_at = ?
      WHERE id = ?
    `).run(
      body.name,
      body.description,
      body.status,
      body.priority,
      body.progress,
      body.dueDate,
      now,
      params.id
    );
    
    const project = await db.prepare('SELECT * FROM projects WHERE id = ?').get(params.id);
    return NextResponse.json(project);
  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Delete a project
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const existing = await db.prepare('SELECT * FROM projects WHERE id = ?').get(params.id);
    
    if (!existing) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }
    
    await db.prepare('DELETE FROM projects WHERE id = ?').run(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
