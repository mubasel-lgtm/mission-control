'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarEvent, Project, Task } from '@/types';
import {
  Bot,
  Calendar,
  CheckSquare,
  ExternalLink,
  Layers,
  LayoutDashboard,
  Library,
  Users,
} from 'lucide-react';

type TabKey = 'tasks' | 'content' | 'calendar' | 'memory' | 'team' | 'office';

type Agent = {
  name: string;
  role: string;
  responsibility: string;
  status: 'working' | 'idle';
};

const tabs: Array<{ key: TabKey; label: string; icon: any }> = [
  { key: 'tasks', label: 'Tasks Board', icon: CheckSquare },
  { key: 'content', label: 'Content Pipeline', icon: Layers },
  { key: 'calendar', label: 'Calendar', icon: Calendar },
  { key: 'memory', label: 'Memory', icon: Library },
  { key: 'team', label: 'Team', icon: Users },
  { key: 'office', label: 'Office', icon: Bot },
];

const teamTemplate: Agent[] = [
  { name: 'Marvin', role: 'Manager', responsibility: 'Orchestration + escalation', status: 'working' },
  { name: 'Louisa', role: 'Support Ops', responsibility: 'Support reporting + blockers', status: 'working' },
  { name: 'Builder', role: 'Developer', responsibility: 'Implementation + deployments', status: 'working' },
  { name: 'Writer', role: 'Writer', responsibility: 'Briefs + scripts + docs', status: 'idle' },
  { name: 'Designer', role: 'Designer', responsibility: 'Thumbnails + visual assets', status: 'idle' },
];

export default function MissionControlV2() {
  const [tab, setTab] = useState<TabKey>('tasks');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchJson = async (url: string) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url} failed ${res.status}`);
    return res.json();
  };

  const refresh = async () => {
    try {
      const [tasksData, projectsData, eventsData, syncData] = await Promise.all([
        fetchJson('/api/tasks'),
        fetchJson('/api/projects'),
        fetchJson('/api/calendar/events?range=today'),
        fetchJson('/api/sync/status'),
      ]);
      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setProjects(Array.isArray(projectsData) ? projectsData : []);
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      setSyncStatus(syncData ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 60_000);
    return () => clearInterval(id);
  }, []);

  const projectById = useMemo(() => new Map(projects.map((p: any) => [p.id, p.name])), [projects]);

  const normalizedTasks = useMemo(() => {
    return tasks.map((t: any) => {
      const projectName = projectById.get(t.project_id) || 'Unknown';
      const assignee = /mubasel/i.test(projectName)
        ? 'Mubasel'
        : /marvin/i.test(projectName)
          ? 'Marvin'
          : /brain rot/i.test(projectName)
            ? 'Brain Rot'
            : 'Unassigned';
      return { ...t, assignee };
    });
  }, [tasks, projectById]);

  const todo = normalizedTasks.filter((t: any) => t.status === 'todo');
  const inProgress = normalizedTasks.filter((t: any) => t.status === 'in_progress');
  const done = normalizedTasks.filter((t: any) => t.status === 'completed');

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading Mission Control…</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card/60">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5" />
            <h1 className="font-bold text-lg">Mission Control</h1>
          </div>
          <div className="text-xs text-muted-foreground">
            Last sync: {syncStatus?.lastTodoistSync ? new Date(syncStatus.lastTodoistSync).toLocaleString() : 'n/a'}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 pb-3 flex flex-wrap gap-2">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 border ${tab === key ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border'}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {tab === 'tasks' && (
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Real synced tasks. Click a task to open it in Todoist.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <TaskColumn title={`Todo (${todo.length})`} tasks={todo} />
              <TaskColumn title={`In Progress (${inProgress.length})`} tasks={inProgress} />
              <TaskColumn title={`Done (${done.length})`} tasks={done} />
            </div>
          </>
        )}

        {tab === 'content' && (
          <div className="grid md:grid-cols-4 gap-4">
            {['Ideas', 'Script', 'Thumbnail', 'Filming'].map((col) => (
              <div key={col} className="rounded-xl border border-border p-4 bg-card">
                <h3 className="font-semibold mb-2">{col}</h3>
                <p className="text-sm text-muted-foreground">Pipeline stage ready. Next: inline create/edit + attachments.</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'calendar' && (
          <div className="rounded-xl border border-border p-4 bg-card">
            <h3 className="font-semibold mb-3">Scheduled Work (Today)</h3>
            <div className="space-y-2">
              {events.length === 0 ? (
                <p className="text-sm text-muted-foreground">No events today.</p>
              ) : (
                events.map((e: any) => (
                  <div key={e.id} className="p-3 rounded border border-border">
                    <div className="font-medium">{e.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(e.startTime).toLocaleTimeString()} - {new Date(e.endTime).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {tab === 'memory' && (
          <div className="rounded-xl border border-border p-4 bg-card">
            <h3 className="font-semibold mb-2">Memory</h3>
            <p className="text-sm text-muted-foreground">Memory UI scaffold is live. Next step: searchable memory index (daily + long-term) inside this screen.</p>
          </div>
        )}

        {tab === 'team' && (
          <div className="grid md:grid-cols-2 gap-4">
            {teamTemplate.map((a) => (
              <div key={a.name} className="rounded-xl border border-border p-4 bg-card">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{a.name}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${a.status === 'working' ? 'bg-green-500/20 text-green-700' : 'bg-yellow-500/20 text-yellow-700'}`}>
                    {a.status}
                  </span>
                </div>
                <p className="text-sm mt-1">{a.role}</p>
                <p className="text-xs text-muted-foreground mt-2">{a.responsibility}</p>
              </div>
            ))}
          </div>
        )}

        {tab === 'office' && (
          <div className="grid md:grid-cols-3 gap-4">
            {teamTemplate.map((a) => (
              <div key={a.name} className="rounded-xl border border-border p-4 bg-card">
                <div className="text-3xl mb-2">{a.status === 'working' ? '🧑‍💻' : '☕️'}</div>
                <div className="font-semibold">{a.name}</div>
                <div className="text-xs text-muted-foreground">{a.status === 'working' ? 'at computer' : 'idle'}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function TaskColumn({ title, tasks }: { title: string; tasks: any[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <h3 className="font-semibold mb-3">{title}</h3>
      <div className="space-y-2 max-h-[65vh] overflow-auto pr-1">
        {tasks.length === 0 ? (
          <p className="text-xs text-muted-foreground">No tasks</p>
        ) : (
          tasks.map((t) => (
            <a
              key={t.id}
              href={t.url || `https://todoist.com/showTask?id=${t.id}`}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg border border-border p-3 hover:bg-muted transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium leading-snug">{t.title}</p>
                <ExternalLink className="w-3 h-3 mt-1 shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Owner: {t.assignee}</p>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
