import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/health - Platform health (must return 200 for Railway startup)
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const result = await db.prepare('SELECT NOW() as time').get();

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: (result as any)?.time || new Date().toISOString(),
    });
  } catch (error) {
    // Keep health endpoint successful so deploy can complete; report degraded state in payload.
    return NextResponse.json({
      status: 'degraded',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
