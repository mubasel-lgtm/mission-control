import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// PATCH /api/blockers/[id] - Update a blocker
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const body = await request.json();
    const now = new Date().toISOString();
    
    const existing = db.prepare('SELECT * FROM blockers WHERE id = ?').get(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Blocker not found' }, { status: 404 });
    }
    
    db.prepare(`
      UPDATE blockers SET
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        severity = COALESCE(?, severity),
        status = COALESCE(?, status),
        assigned_to = COALESCE(?, assigned_to),
        updated_at = ?
      WHERE id = ?
    `).run(
      body.title,
      body.description,
      body.severity,
      body.status,
      body.assignedTo,
      now,
      params.id
    );
    
    const blocker = db.prepare('SELECT * FROM blockers WHERE id = ?').get(params.id);
    return NextResponse.json(blocker);
  } catch (error) {
    console.error('Error updating blocker:', error);
    return NextResponse.json(
      { error: 'Failed to update blocker' },
      { status: 500 }
    );
  }
}

// DELETE /api/blockers/[id] - Delete a blocker
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM blockers WHERE id = ?').get(params.id);
    
    if (!existing) {
      return NextResponse.json({ error: 'Blocker not found' }, { status: 404 });
    }
    
    db.prepare('DELETE FROM blockers WHERE id = ?').run(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blocker:', error);
    return NextResponse.json(
      { error: 'Failed to delete blocker' },
      { status: 500 }
    );
  }
}
