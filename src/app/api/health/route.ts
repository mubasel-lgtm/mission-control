import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/health - Check database connection
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    
    // Test database connection
    const result = await db.prepare('SELECT NOW() as time').get();
    
    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      timestamp: (result as any)?.time || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        database: 'disconnected',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
