// Ultra-simple test page
'use client';

import { useState, useEffect } from 'react';

export default function TestPage() {
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/tasks')
      .then(r => {
        console.log('Status:', r.status);
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        console.log('Data:', d);
        setData(d);
        setLoading(false);
      })
      .catch(e => {
        console.error('Error:', e);
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading...</div>;
  if (error) return <div className="p-8 text-red-500">Error: {error}</div>;
  
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">Test Results</h1>
      <p>Type: {Array.isArray(data) ? `Array (${data.length} items)` : typeof data}</p>
      <pre className="mt-4 bg-gray-100 p-4 rounded text-sm">
        {JSON.stringify(data?.slice?.(0, 2) || data, null, 2)}
      </pre>
    </div>
  );
}
