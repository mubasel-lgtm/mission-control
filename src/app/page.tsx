'use client';

import { useState, useEffect } from 'react';
import { Project, Task, Blocker, ResearchItem, ClaudeBot, CalendarEvent } from '@/types';
import { cn, getPriorityColor, getStatusColor, formatDate, formatRelativeTime } from '@/lib/utils';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  AlertCircle, 
  BookOpen, 
  Bot,
  RefreshCw,
  Plus,
  ExternalLink,
  Clock,
  MoreHorizontal,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="rounded-xl bg-card p-6 border border-border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={cn("p-3 rounded-lg", color)}>
          {icon}
        </div>
      </div>
    </div>
  );
}

interface SectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}

function Section({ title, icon, children, action }: SectionProps) {
  return (
    <div className="rounded-xl bg-card border border-border overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [blockers, setBlockers] = useState<Blocker[]>([]);
  const [research, setResearch] = useState<ResearchItem[]>([]);
  const [bots, setBots] = useState<ClaudeBot[]>([]);
  const [syncStatus, setSyncStatus] = useState<{ lastTodoistSync?: string }>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch all data
  const fetchData = async () => {
    try {
      console.log('Fetching data...');
      const [projectsRes, tasksRes, eventsRes, blockersRes, researchRes, botsRes, syncRes] = await Promise.all([
        fetch('/api/projects'),
        fetch('/api/tasks'),
        fetch('/api/calendar/events?range=today'),
        fetch('/api/blockers'),
        fetch('/api/research'),
        fetch('/api/bots'),
        fetch('/api/sync'),
      ]);

      console.log('Response statuses:', {
        projects: projectsRes.status,
        tasks: tasksRes.status,
        events: eventsRes.status,
        blockers: blockersRes.status,
        research: researchRes.status,
        bots: botsRes.status,
        sync: syncRes.status,
      });

      const [projectsData, tasksData, eventsData, blockersData, researchData, botsData, syncData] = await Promise.all([
        projectsRes.json(),
        tasksRes.json(),
        eventsRes.json(),
        blockersRes.json(),
        researchRes.json(),
        botsRes.json(),
        syncRes.json(),
      ]);

      console.log('Data received:', {
        projects: Array.isArray(projectsData) ? projectsData.length : typeof projectsData,
        tasks: Array.isArray(tasksData) ? tasksData.length : typeof tasksData,
        events: Array.isArray(eventsData) ? eventsData.length : typeof eventsData,
        blockers: Array.isArray(blockersData) ? blockersData.length : typeof blockersData,
        research: Array.isArray(researchData) ? researchData.length : typeof researchData,
        bots: Array.isArray(botsData) ? botsData.length : typeof botsData,
        sync: syncData,
      });

      setProjects(projectsData);
      setTasks(tasksData.filter((t: Task) => t.status !== 'completed').slice(0, 10));
      setEvents(eventsData.slice(0, 5));
      setBlockers(blockersData.filter((b: Blocker) => b.status !== 'resolved').slice(0, 5));
      setResearch(researchData.slice(0, 5));
      setBots(botsData);
      setSyncStatus(syncData);
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Fetch error: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsLoading(false);
    }
  };

  // Sync with external services
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await fetch('/api/sync', { method: 'POST' });
      await fetchData();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const activeProjects = projects.filter(p => p.status === 'active').length;
  const pendingTasks = tasks.filter(t => t.status !== 'completed').length;
  const todaysEvents = events.length;
  const openBlockers = blockers.filter(b => b.status === 'open').length;
  const researchQueue = research.filter(r => r.status === 'queued').length;
  const activeBots = bots.filter(b => b.status === 'active').length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin" />
          <span className="text-lg">Loading Mission Control...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <LayoutDashboard className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Mission Control</h1>
                <p className="text-xs text-muted-foreground">
                  Last sync: {syncStatus.lastTodoistSync ? formatRelativeTime(syncStatus.lastTodoistSync) : 'Never'}
                </p>
              </div>
            </div>
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className={cn("w-4 h-4", isSyncing && "animate-spin")} />
              {isSyncing ? 'Syncing...' : 'Sync'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
          <StatCard
            title="Active Projects"
            value={activeProjects}
            icon={<LayoutDashboard className="w-5 h-5" />}
            color="bg-blue-500/10 text-blue-500"
          />
          <StatCard
            title="Pending Tasks"
            value={pendingTasks}
            icon={<CheckSquare className="w-5 h-5" />}
            color="bg-yellow-500/10 text-yellow-500"
          />
          <StatCard
            title="Today's Events"
            value={todaysEvents}
            icon={<Calendar className="w-5 h-5" />}
            color="bg-purple-500/10 text-purple-500"
          />
          <StatCard
            title="Blockers"
            value={openBlockers}
            icon={<AlertCircle className="w-5 h-5" />}
            color="bg-red-500/10 text-red-500"
          />
          <StatCard
            title="Research Queue"
            value={researchQueue}
            icon={<BookOpen className="w-5 h-5" />}
            color="bg-green-500/10 text-green-500"
          />
          <StatCard
            title="Active Bots"
            value={activeBots}
            icon={<Bot className="w-5 h-5" />}
            color="bg-cyan-500/10 text-cyan-500"
          />
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {/* Projects Section */}
          <Section
            title="Active Projects"
            icon={<LayoutDashboard className="w-5 h-5 text-blue-500" />}
            action={
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            }
          >
            <div className="space-y-3">
              {projects.filter(p => p.status === 'active').map(project => (
                <div key={project.id} className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium">{project.name}</h3>
                    <span className={cn("px-2 py-0.5 text-xs rounded-full", getPriorityColor(project.priority))}>
                      {project.priority}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${project.progress}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{project.progress}% complete</p>
                </div>
              ))}
              {projects.filter(p => p.status === 'active').length === 0 && (
                <p className="text-muted-foreground text-sm">No active projects</p>
              )}
            </div>
          </Section>

          {/* Tasks Section */}
          <Section
            title="Recent Tasks"
            icon={<CheckSquare className="w-5 h-5 text-yellow-500" />}
            action={
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            }
          >
            <div className="space-y-2">
              {tasks.map(task => (
                <div key={task.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors group">
                  <button className="w-5 h-5 rounded border border-muted-foreground/30 flex items-center justify-center hover:border-primary transition-colors">
                    <CheckCircle2 className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{task.title}</p>
                    {task.dueDate && (
                      <p className="text-xs text-muted-foreground">
                        Due {formatRelativeTime(task.dueDate)}
                      </p>
                    )}
                  </div>
                  <span className={cn("px-2 py-0.5 text-xs rounded-full", getPriorityColor(String(task.priority)))}>
                    P{task.priority}
                  </span>
                </div>
              ))}
              {tasks.length === 0 && (
                <p className="text-muted-foreground text-sm">No pending tasks</p>
              )}
            </div>
          </Section>

          {/* Calendar Section */}
          <Section
            title="Today's Schedule"
            icon={<Calendar className="w-5 h-5 text-purple-500" />}
          >
            <div className="space-y-3">
              {events.map(event => (
                <div key={event.id} className="flex gap-3 p-3 rounded-lg bg-muted/50">
                  <div className="text-center min-w-[60px]">
                    <p className="text-sm font-medium">
                      {new Date(event.startTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{event.title}</p>
                    {event.location && (
                      <p className="text-xs text-muted-foreground truncate">📍 {event.location}</p>
                    )}
                  </div>
                </div>
              ))}
              {events.length === 0 && (
                <p className="text-muted-foreground text-sm">No events today</p>
              )}
            </div>
          </Section>

          {/* Blockers Section (Needs Mubasel) */}
          <Section
            title="Needs Mubasel"
            icon={<AlertCircle className="w-5 h-5 text-red-500" />}
            action={
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            }
          >
            <div className="space-y-2">
              {blockers.map(blocker => (
                <div key={blocker.id} className={cn(
                  "p-3 rounded-lg border-l-4",
                  blocker.severity === 'blocking' && "border-l-red-500 bg-red-500/5",
                  blocker.severity === 'warning' && "border-l-yellow-500 bg-yellow-500/5",
                  blocker.severity === 'info' && "border-l-blue-500 bg-blue-500/5",
                )}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {blocker.severity === 'blocking' && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      <p className="font-medium text-sm">{blocker.title}</p>
                    </div>
                    <span className={cn("px-2 py-0.5 text-xs rounded-full", getStatusColor(blocker.status))}>
                      {blocker.status}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{blocker.description}</p>
                </div>
              ))}
              {blockers.length === 0 && (
                <p className="text-muted-foreground text-sm">No blockers - all clear! 🎉</p>
              )}
            </div>
          </Section>

          {/* Research Queue Section */}
          <Section
            title="Research Queue"
            icon={<BookOpen className="w-5 h-5 text-green-500" />}
            action={
              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                <Plus className="w-4 h-4" />
              </button>
            }
          >
            <div className="space-y-2">
              {research.map(item => (
                <div key={item.id} className="p-3 rounded-lg hover:bg-muted transition-colors">
                  <div className="flex items-start justify-between">
                    <p className="font-medium text-sm">{item.title}</p>
                    <span className={cn("px-2 py-0.5 text-xs rounded-full", getPriorityColor(item.priority))}>
                      {item.priority}
                    </span>
                  </div>
                  {item.topic && (
                    <p className="text-xs text-muted-foreground mt-1">Topic: {item.topic}</p>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {item.tags.map((tag: string, i: number) => (
                        <span key={i} className="px-1.5 py-0.5 text-xs rounded bg-muted text-muted-foreground">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {research.length === 0 && (
                <p className="text-muted-foreground text-sm">No research items queued</p>
              )}
            </div>
          </Section>

          {/* Claude Bot Manager Section */}
          <Section
            title="Claude Bot Manager"
            icon={<Bot className="w-5 h-5 text-cyan-500" />}
          >
            <div className="space-y-3">
              {bots.map(bot => (
                <div key={bot.id} className="p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {bot.status === 'active' ? (
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      ) : bot.status === 'error' ? (
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                      )}
                      <span className="font-medium text-sm">{bot.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button className="p-1 hover:bg-muted rounded transition-colors">
                        {bot.status === 'active' ? (
                          <Pause className="w-3 h-3" />
                        ) : (
                          <Play className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{bot.description}</p>
                  {bot.schedule && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {bot.schedule}
                    </p>
                  )}
                  {bot.lastRun && (
                    <p className="text-xs text-muted-foreground">
                      Last run: {formatRelativeTime(bot.lastRun)}
                    </p>
                  )}
                </div>
              ))}
              {bots.length === 0 && (
                <p className="text-muted-foreground text-sm">No bots configured</p>
              )}
            </div>
          </Section>
        </div>
      </main>
    </div>
  );
}
