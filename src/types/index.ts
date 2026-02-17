export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed' | 'archived';
  priority: 'high' | 'medium' | 'low';
  progress: number;
  todoistProjectId?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'completed';
  priority: 1 | 2 | 3 | 4;
  projectId?: string;
  todoistTaskId?: string;
  dueDate?: string;
  labels: string[];
  url?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  location?: string;
  attendees?: string[];
  calendarId: string;
  isAllDay: boolean;
  url?: string;
}

export interface Blocker {
  id: string;
  title: string;
  description: string;
  projectId?: string;
  severity: 'blocking' | 'warning' | 'info';
  status: 'open' | 'in_progress' | 'resolved';
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResearchItem {
  id: string;
  title: string;
  topic: string;
  status: 'queued' | 'in_progress' | 'completed' | 'archived';
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  url?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ClaudeBot {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'error';
  lastRun?: string;
  nextRun?: string;
  schedule?: string;
  config: Record<string, any>;
  logs: BotLog[];
}

export interface BotLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
}

export interface DashboardStats {
  activeProjects: number;
  pendingTasks: number;
  todaysEvents: number;
  openBlockers: number;
  researchQueue: number;
  activeBots: number;
}
