import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/bots/[id]/logs - Get bot logs
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const logs = db.prepare(
      'SELECT * FROM bot_logs WHERE bot_id = ? ORDER BY timestamp DESC LIMIT ?'
    ).all(params.id, limit);
    
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Error fetching bot logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bot logs' },
      { status: 500 }
    );
  }
}

// POST /api/bots/[id]/logs - Add a bot log
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = getDb();
    const body = await request.json();
    const crypto = await import('crypto');
    
    const id = crypto.randomUUID();
    
    db.prepare(`
      INSERT INTO bot_logs (id, bot_id, level, message)
      VALUES (?, ?, ?, ?)
    `).run(
      id,
      params.id,
      body.level || 'info',
      body.message
    );
    
    // Update bot's last_run
    const now = new Date().toISOString();
    db.prepare('UPDATE bots SET last_run = ? WHERE id = ?').run(now, params.id);
    
    const log = db.prepare('SELECT * FROM bot_logs WHERE id = ?').get(id);
    return NextResponse.json(log, { status: 201 });
  } catch (error) {
    console.error('Error creating bot log:', error);
    return NextResponse.json(
      { error: 'Failed to create bot log' },
      { status: 500 }
    );
  }
}
