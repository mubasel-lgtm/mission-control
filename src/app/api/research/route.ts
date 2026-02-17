import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/research - List research items
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    
    let query = 'SELECT * FROM research';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    
    if (priority) {
      conditions.push('priority = ?');
      params.push(priority);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY priority ASC, created_at DESC';
    
    const items = await db.prepare(query).all(...params);
    
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching research items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch research items' },
      { status: 500 }
    );
  }
}

// POST /api/research - Create a new research item
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const crypto = await import('crypto');
    
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO research (id, title, topic, status, priority, notes, url, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.title,
      body.topic || null,
      body.status || 'queued',
      body.priority || 'medium',
      body.notes || null,
      body.url || null,
      body.tags ? JSON.stringify(body.tags) : '[]',
      now,
      now
    );
    
    const item = await db.prepare('SELECT * FROM research WHERE id = ?').get(id);
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating research item:', error);
    return NextResponse.json(
      { error: 'Failed to create research item' },
      { status: 500 }
    );
  }
}
