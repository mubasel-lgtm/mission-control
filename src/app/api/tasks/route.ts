import { NextRequest, NextResponse } from 'next/server';
import { fetchTodoistTasks, mapTodoistPriority } from '@/lib/todoist';

export const dynamic = 'force-dynamic';

// GET /api/tasks - Fetch directly from Todoist (no persistence)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');
    
    // Fetch directly from Todoist
    const todoistTasks = await fetchTodoistTasks();
    
    // Transform to our format
    let tasks = todoistTasks.map((task: any) => ({
      id: task.id,
      title: task.content,
      description: task.description || '',
      status: (task.checked ?? task.is_completed) ? 'completed' : 'todo',
      priority: mapTodoistPriority(task.priority),
      project_id: task.project_id,
      todoist_task_id: task.id,
      due_date: task.due?.date || null,
      labels: JSON.stringify(task.labels || []),
      url: task.url || `https://todoist.com/showTask?id=${task.id}`,
      created_at: task.added_at || task.created_at || new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));
    
    // Filter by project if specified
    if (projectId) {
      tasks = tasks.filter((t: any) => t.project_id === projectId);
    }
    
    // Sort by priority
    tasks.sort((a: any, b: any) => a.priority - b.priority);
    
    return NextResponse.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tasks', details: String(error) },
      { status: 500 }
    );
  }
}
