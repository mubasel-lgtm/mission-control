import { NextRequest, NextResponse } from 'next/server';
import { getDb, ensureTables } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/bots - List Claude bots
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    await ensureTables();
    const bots = await db.prepare('SELECT * FROM bots').all();
    
    // Parse config JSON and fetch recent logs
    const botsWithDetails = await Promise.all((bots as any[]).map(async (bot: any) => {
      const logs = await db.prepare(
        'SELECT * FROM bot_logs WHERE bot_id = ? ORDER BY timestamp DESC LIMIT 10'
      ).all(bot.id);
      
      return {
        ...bot,
        config: bot.config ? JSON.parse(bot.config) : {},
        logs: logs || [],
      };
    }));
    
    return NextResponse.json(botsWithDetails);
  } catch (error) {
    console.error('Error fetching bots:', error);
    return NextResponse.json(
      { error: 'Failed to fetch bots' },
      { status: 500 }
    );
  }
}

// POST /api/bots - Create or update a bot
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    await ensureTables();
    const body = await request.json();
    const crypto = await import('crypto');
    
    const id = body.id || crypto.randomUUID();
    const now = new Date().toISOString();
    
    // Check if bot exists
    const existing = await db.prepare('SELECT id FROM bots WHERE id = ?').get(id);
    
    if (existing) {
      // Update existing
      await db.prepare(`
        UPDATE bots SET
          name = ?,
          description = ?,
          status = ?,
          schedule = ?,
          config = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        body.name,
        body.description || null,
        body.status || 'paused',
        body.schedule || null,
        body.config ? JSON.stringify(body.config) : '{}',
        now,
        id
      );
    } else {
      // Insert new
      await db.prepare(`
        INSERT INTO bots (id, name, description, status, schedule, config)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        id,
        body.name,
        body.description || null,
        body.status || 'paused',
        body.schedule || null,
        body.config ? JSON.stringify(body.config) : '{}'
      );
    }
    
    const bot = await db.prepare('SELECT * FROM bots WHERE id = ?').get(id) as any;
    return NextResponse.json({
      ...bot,
      config: bot.config ? JSON.parse(bot.config) : {},
    });
  } catch (error) {
    console.error('Error saving bot:', error);
    return NextResponse.json(
      { error: 'Failed to save bot' },
      { status: 500 }
    );
  }
}
