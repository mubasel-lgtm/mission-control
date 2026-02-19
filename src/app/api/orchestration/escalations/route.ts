import { NextResponse } from 'next/server';
import { getDb, ensureTables } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  await ensureTables();
  const rows = await db.prepare("SELECT * FROM escalations ORDER BY created_at DESC").all();
  return NextResponse.json(rows);
}
