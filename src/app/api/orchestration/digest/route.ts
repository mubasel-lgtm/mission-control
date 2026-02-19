import { NextResponse } from 'next/server';
import { getDb, ensureTables } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  await ensureTables();
  const tasks = await db.prepare("SELECT * FROM orchestration_tasks ORDER BY updated_at DESC LIMIT 50").all();
  const escalations = await db.prepare("SELECT * FROM escalations WHERE status = 'open' ORDER BY created_at DESC LIMIT 20").all();
  const reports = await db.prepare("SELECT * FROM worker_reports ORDER BY created_at DESC LIMIT 50").all();

  const done = (tasks as any[]).filter(t => t.status === 'done').length;
  const running = (tasks as any[]).filter(t => t.status === 'running' || t.status === 'assigned').length;
  const blocked = (tasks as any[]).filter(t => t.status === 'blocked').length;

  const digest = {
    wins: done,
    active: running,
    blocked,
    openEscalations: (escalations as any[]).length,
    latestReports: reports.slice(0, 10)
  };

  return NextResponse.json(digest);
}
