import { NextResponse } from 'next/server';
import { getDb, ensureTables } from '@/lib/db';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const db = getDb();
    await ensureTables();
    const row = await db.prepare("SELECT * FROM worker_reports WHERE event_type = 'SUPPORT_DAILY_REPORT' ORDER BY ts DESC LIMIT 1").get();
    if (!row) return NextResponse.json({ hasReport: false, summary: 'No support report submitted yet.' });
    const report = row as any;
    let payload: any = {};
    try { payload = report.payload_json ? JSON.parse(report.payload_json) : {}; } catch {}
    return NextResponse.json({
      hasReport: true,
      botId: report.bot_id,
      ts: report.ts,
      ticketsToday: payload.tickets_today ?? null,
      resolvedToday: payload.resolved_today ?? null,
      backlog: payload.backlog ?? null,
      topObstacles: payload.top_obstacles ?? [],
      importantTickets: payload.important_tickets ?? [],
      needsOwner: payload.needs_owner ?? [],
    });
  } catch (error) {
    return NextResponse.json({ hasReport: false, summary: 'Support report API unavailable', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 200 });
  }
}
