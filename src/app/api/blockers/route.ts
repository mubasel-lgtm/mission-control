import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/blockers - List blockers ("Needs Mubasel")
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const severity = searchParams.get('severity');
    
    let query = 'SELECT * FROM blockers';
    const params: any[] = [];
    const conditions: string[] = [];
    
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }
    
    if (severity) {
      conditions.push('severity = ?');
      params.push(severity);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY CASE severity WHEN "blocking" THEN 1 WHEN "warning" THEN 2 ELSE 3 END, created_at DESC';
    
    const blockers = db.prepare(query).all(...params);
    
    return NextResponse.json(blockers);
  } catch (error) {
    console.error('Error fetching blockers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blockers' },
      { status: 500 }
    );
  }
}

// POST /api/blockers - Create a new blocker
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    const crypto = await import('crypto');
    
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO blockers (id, title, description, project_id, severity, status, assigned_to, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.title,
      body.description || null,
      body.projectId || null,
      body.severity || 'warning',
      body.status || 'open',
      body.assignedTo || null,
      now,
      now
    );
    
    const blocker = db.prepare('SELECT * FROM blockers WHERE id = ?').get(id);
    return NextResponse.json(blocker, { status: 201 });
  } catch (error) {
    console.error('Error creating blocker:', error);
    return NextResponse.json(
      { error: 'Failed to create blocker' },
      { status: 500 }
    );
  }
}
