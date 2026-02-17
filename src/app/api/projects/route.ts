import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import crypto from 'crypto';

// GET /api/projects - List all projects
export async function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    
    let query = 'SELECT * FROM projects';
    const params: any[] = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY priority ASC, created_at DESC';
    
    const projects = db.prepare(query).all(...params);
    
    return NextResponse.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = await request.json();
    
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO projects (id, name, description, status, priority, progress, due_date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      body.name,
      body.description || null,
      body.status || 'active',
      body.priority || 'medium',
      body.progress || 0,
      body.dueDate || null,
      now,
      now
    );
    
    const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
