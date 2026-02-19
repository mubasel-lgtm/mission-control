import { NextRequest, NextResponse } from 'next/server';
import { getDb, ensureTables } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  await ensureTables();
  const rows = await db.prepare('SELECT * FROM worker_reports ORDER BY created_at DESC LIMIT 200').all();
  return NextResponse.json(rows);
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    await ensureTables();
    const body = await request.json();
    const crypto = await import('crypto');
    const id = body.event_id || crypto.randomUUID();
    await db.prepare(`INSERT INTO worker_reports (id,event_type,bot_id,task_id,payload_json,ts,created_at)
      VALUES (?,?,?,?,?,?,?)`).run(
      id,
      body.event_type,
      body.bot_id,
      body.task_id || null,
      JSON.stringify(body.payload || {}),
      body.ts || new Date().toISOString(),
      new Date().toISOString()
    );

    if (body.event_type === 'TASK_FAILED' || body.event_type === 'ESCALATION_REQUIRED') {
      const escId = crypto.randomUUID();
      await db.prepare(`INSERT INTO escalations (id,task_id,bot_id,reason,options_json,recommendation,status,created_at,updated_at)
        VALUES (?,?,?,?,?,?,?,?,?)`).run(
        escId,
        body.task_id || null,
        body.bot_id || null,
        body.payload?.error_summary || body.payload?.reason || 'Escalation required',
        JSON.stringify(body.payload?.options || []),
        body.payload?.recommendation || null,
        'open',
        new Date().toISOString(),
        new Date().toISOString()
      );
    }

    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
  }
}
