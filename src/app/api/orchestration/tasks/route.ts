import { NextRequest, NextResponse } from 'next/server';
import { getDb, ensureTables } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    await ensureTables();
    const rows = await db.prepare('SELECT * FROM orchestration_tasks ORDER BY created_at DESC').all();
    return NextResponse.json(rows);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    await ensureTables();
    const body = await request.json();
    const crypto = await import('crypto');
    const id = body.id || crypto.randomUUID();
    await db.prepare(`INSERT INTO orchestration_tasks (id,title,objective,definition_of_done,owner_bot,priority,status,due_at,constraints_json,created_at,updated_at)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
      id,
      body.title,
      body.objective,
      body.definition_of_done,
      body.owner_bot,
      body.priority || 'P2',
      body.status || 'queued',
      body.due_at || null,
      JSON.stringify(body.constraints || []),
      new Date().toISOString(),
      new Date().toISOString()
    );
    const row = await db.prepare('SELECT * FROM orchestration_tasks WHERE id = ?').get(id);
    return NextResponse.json(row);
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create task' }, { status: 500 });
  }
}
