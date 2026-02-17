import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH /api/research/[id] - Update a research item
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const body = await request.json();
    const now = new Date().toISOString();
    
    const existing = await db.prepare('SELECT * FROM research WHERE id = ?').get(params.id);
    if (!existing) {
      return NextResponse.json({ error: 'Research item not found' }, { status: 404 });
    }
    
    await db.prepare(`
      UPDATE research SET
        title = COALESCE(?, title),
        topic = COALESCE(?, topic),
        status = COALESCE(?, status),
        priority = COALESCE(?, priority),
        notes = COALESCE(?, notes),
        url = COALESCE(?, url),
        tags = COALESCE(?, tags),
        updated_at = ?
      WHERE id = ?
    `).run(
      body.title,
      body.topic,
      body.status,
      body.priority,
      body.notes,
      body.url,
      body.tags ? JSON.stringify(body.tags) : null,
      now,
      params.id
    );
    
    const item = await db.prepare('SELECT * FROM research WHERE id = ?').get(params.id);
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating research item:', error);
    return NextResponse.json(
      { error: 'Failed to update research item' },
      { status: 500 }
    );
  }
}

// DELETE /api/research/[id] - Delete a research item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const existing = await db.prepare('SELECT * FROM research WHERE id = ?').get(params.id);
    
    if (!existing) {
      return NextResponse.json({ error: 'Research item not found' }, { status: 404 });
    }
    
    await db.prepare('DELETE FROM research WHERE id = ?').run(params.id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting research item:', error);
    return NextResponse.json(
      { error: 'Failed to delete research item' },
      { status: 500 }
    );
  }
}
