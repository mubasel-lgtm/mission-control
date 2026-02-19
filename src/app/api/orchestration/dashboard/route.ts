import { NextResponse } from 'next/server';
import { getDb, ensureTables } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getDb();
    await ensureTables();
    const [tasks, reports, escalations, bots] = await Promise.all([
      db.prepare('SELECT * FROM orchestration_tasks').all(),
      db.prepare('SELECT * FROM worker_reports ORDER BY created_at DESC LIMIT 20').all(),
      db.prepare("SELECT * FROM escalations WHERE status='open'").all(),
      db.prepare('SELECT * FROM bots').all(),
    ]);

    return NextResponse.json({
      ok: true,
      stats: {
        tasksTotal: (tasks as any[]).length,
        tasksDone: (tasks as any[]).filter(t => t.status === 'done').length,
        tasksBlocked: (tasks as any[]).filter(t => t.status === 'blocked').length,
        openEscalations: (escalations as any[]).length,
        botsTotal: (bots as any[]).length,
      },
      tasks,
      reports,
      escalations,
      bots,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Dashboard API unavailable',
        details: error instanceof Error ? error.message : 'Unknown error',
        stats: { tasksTotal: 0, tasksDone: 0, tasksBlocked: 0, openEscalations: 0, botsTotal: 0 },
        tasks: [],
        reports: [],
        escalations: [],
        bots: [],
      },
      { status: 200 }
    );
  }
}
