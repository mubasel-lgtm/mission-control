'use client';

import { useEffect, useMemo, useState } from 'react';

type DashboardData = {
  stats: {
    tasksTotal: number;
    tasksDone: number;
    tasksBlocked: number;
    openEscalations: number;
    botsTotal: number;
  };
  tasks: any[];
  reports: any[];
  escalations: any[];
  bots: any[];
};

export default function OrchestrationPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [support, setSupport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [r1, r2] = await Promise.all([
      fetch('/api/orchestration/dashboard'),
      fetch('/api/orchestration/support-report'),
    ]);
    const [j1, j2] = await Promise.all([r1.json(), r2.json()]);
    setData(j1);
    setSupport(j2);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const i = setInterval(load, 15000);
    return () => clearInterval(i);
  }, []);

  const blockedTasks = useMemo(
    () => (data?.tasks || []).filter((t) => t.status === 'blocked').slice(0, 8),
    [data]
  );

  if (loading && !data) return <div className="p-6">Loading orchestration…</div>;
  if (!data) return <div className="p-6">No orchestration data available.</div>;

  return (
    <div className="min-h-screen bg-background p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orchestration Control</h1>
        <button onClick={load} className="px-3 py-2 rounded-lg border text-sm hover:bg-muted">Refresh</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat title="Tasks" value={data.stats.tasksTotal} />
        <Stat title="Done" value={data.stats.tasksDone} />
        <Stat title="Blocked" value={data.stats.tasksBlocked} />
        <Stat title="Escalations" value={data.stats.openEscalations} />
        <Stat title="Bots" value={data.stats.botsTotal} />
      </div>

      <section className="rounded-xl border p-4">
        <h2 className="font-semibold mb-3">Louisa Support Report</h2>
        {!support?.hasReport ? (
          <div className="text-sm opacity-70">No support report submitted yet.</div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-3 gap-2">
              <Stat title="Tickets today" value={support.ticketsToday ?? 0} />
              <Stat title="Resolved" value={support.resolvedToday ?? 0} />
              <Stat title="Backlog" value={support.backlog ?? 0} />
            </div>
            <div>
              <div className="font-medium">Top obstacles</div>
              <ul className="list-disc ml-5 opacity-80">
                {(support.topObstacles || []).slice(0,5).map((o:string,i:number)=><li key={i}>{o}</li>)}
              </ul>
            </div>
            <div>
              <div className="font-medium">Important tickets</div>
              <ul className="list-disc ml-5 opacity-80">
                {(support.importantTickets || []).slice(0,5).map((o:string,i:number)=><li key={i}>{o}</li>)}
              </ul>
            </div>
          </div>
        )}
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <section className="xl:col-span-1 rounded-xl border p-4">
          <h2 className="font-semibold mb-3">Task Router (latest)</h2>
          <div className="space-y-2 max-h-[420px] overflow-auto">
            {data.tasks.slice(0, 16).map((t) => (
              <div key={t.id} className="rounded-lg border px-3 py-2 text-sm flex items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="opacity-60 text-xs">{t.owner_bot} · {t.priority}</div>
                </div>
                <StatusBadge value={t.status} />
              </div>
            ))}
          </div>
        </section>

        <section className="xl:col-span-1 rounded-xl border p-4">
          <h2 className="font-semibold mb-3">Reports Feed</h2>
          <div className="space-y-2 max-h-[420px] overflow-auto">
            {data.reports.slice(0, 16).map((r) => (
              <div key={r.id} className="rounded-lg border px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{r.event_type}</span>
                  <span className="opacity-60 text-xs">{r.bot_id}</span>
                </div>
                <div className="opacity-60 text-xs mt-1">Task: {r.task_id || '-'} · {r.ts}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="xl:col-span-1 rounded-xl border p-4">
          <h2 className="font-semibold mb-3">Escalation Desk</h2>
          <div className="space-y-2 max-h-[420px] overflow-auto">
            {data.escalations.length === 0 ? (
              <div className="text-sm opacity-70">No open escalations.</div>
            ) : (
              data.escalations.slice(0, 16).map((e) => (
                <div key={e.id} className="rounded-lg border px-3 py-2 text-sm">
                  <div className="font-medium">{e.reason}</div>
                  <div className="opacity-60 text-xs mt-1">Bot: {e.bot_id || '-'} · Task: {e.task_id || '-'}</div>
                </div>
              ))
            )}
          </div>

          {blockedTasks.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-semibold mb-2">Blocked Tasks Snapshot</h3>
              <div className="space-y-1">
                {blockedTasks.map((t) => (
                  <div key={t.id} className="text-xs opacity-80">• {t.title}</div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-xl border p-3">
      <div className="text-xs opacity-70">{title}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function StatusBadge({ value }: { value: string }) {
  const cls =
    value === 'done'
      ? 'bg-green-500/10 text-green-600'
      : value === 'blocked'
      ? 'bg-red-500/10 text-red-600'
      : value === 'running' || value === 'assigned'
      ? 'bg-yellow-500/10 text-yellow-700'
      : 'bg-slate-500/10 text-slate-600';
  return <span className={`px-2 py-1 rounded text-xs ${cls}`}>{value}</span>;
}
