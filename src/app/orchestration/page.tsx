'use client';
import { useEffect, useState } from 'react';
export default function OrchestrationPage(){
  const [d,setD]=useState<any>(null);
  useEffect(()=>{fetch('/api/orchestration/dashboard').then(r=>r.json()).then(setD)},[]);
  if(!d) return <div className='p-6'>Loading orchestration…</div>;
  return <div className='p-6 space-y-4'><h1 className='text-2xl font-bold'>Orchestration Control</h1><div className='grid grid-cols-2 md:grid-cols-5 gap-3'>{[['Tasks',d.stats.tasksTotal],['Done',d.stats.tasksDone],['Blocked',d.stats.tasksBlocked],['Escalations',d.stats.openEscalations],['Bots',d.stats.botsTotal]].map(([k,v])=><div key={String(k)} className='border rounded-xl p-3'><div className='text-xs opacity-70'>{k}</div><div className='text-xl font-semibold'>{String(v)}</div></div>)}</div></div>
}
