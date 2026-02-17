const TODOIST_API_TOKEN = process.env.TODOIST_API_TOKEN || 'db85fc7c526a7bd2d575f44a4293ef7ff70fa1ca';
const TODOIST_API_URL = 'https://api.todoist.com/api/v1';

export interface TodoistTask {
  id: string;
  content: string;
  description: string;
  priority: number;
  due?: {
    date: string;
    datetime?: string;
  };
  labels: string[];
  project_id: string;
  url: string;
  is_completed: boolean;
  created_at: string;
}

export interface TodoistProject {
  id: string;
  name: string;
  color: string;
  url: string;
}

export async function fetchTodoistTasks(filters?: { projectId?: string; label?: string }): Promise<TodoistTask[]> {
  const url = new URL(`${TODOIST_API_URL}/tasks`);
  
  if (filters?.projectId) {
    url.searchParams.append('project_id', filters.projectId);
  }
  if (filters?.label) {
    url.searchParams.append('label', filters.label);
  }

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${TODOIST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Todoist API error: ${error}`);
  }

  return response.json();
}

export async function fetchTodoistProjects(): Promise<TodoistProject[]> {
  const response = await fetch(`${TODOIST_API_URL}/projects`, {
    headers: {
      'Authorization': `Bearer ${TODOIST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Todoist API error: ${error}`);
  }

  return response.json();
}

export async function completeTodoistTask(taskId: string): Promise<void> {
  const response = await fetch(`${TODOIST_API_URL}/tasks/${taskId}/close`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TODOIST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to complete task: ${error}`);
  }
}

export async function createTodoistTask(data: {
  content: string;
  description?: string;
  projectId?: string;
  priority?: number;
  dueDate?: string;
  labels?: string[];
}): Promise<TodoistTask> {
  const body: Record<string, any> = {
    content: data.content,
    description: data.description || '',
    priority: data.priority || 4,
  };

  if (data.projectId) body.project_id = data.projectId;
  if (data.dueDate) body.due_date = data.dueDate;
  if (data.labels) body.labels = data.labels;

  const response = await fetch(`${TODOIST_API_URL}/tasks`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TODOIST_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to create task: ${error}`);
  }

  return response.json();
}

export function mapTodoistPriority(priority: number): 1 | 2 | 3 | 4 {
  // Todoist: 4 = highest, 1 = lowest
  // Our app: 1 = highest, 4 = lowest
  const mapping: Record<number, 1 | 2 | 3 | 4> = {
    4: 1,
    3: 2,
    2: 3,
    1: 4,
  };
  return mapping[priority] || 4;
}
