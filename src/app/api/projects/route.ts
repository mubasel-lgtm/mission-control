import { NextRequest, NextResponse } from 'next/server';
import { fetchTodoistProjects } from '@/lib/todoist';

export const dynamic = 'force-dynamic';

// GET /api/projects - Fetch directly from Todoist
export async function GET(request: NextRequest) {
  try {
    const projects = await fetchTodoistProjects();
    
    // Transform to our format
    const formattedProjects = projects.map((p: any) => ({
      id: p.id,
      name: p.name,
      description: '',
      status: 'active',
      priority: 'medium',
      progress: 0,
      todoist_project_id: p.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    
    return NextResponse.json(formattedProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json([]);
  }
}
