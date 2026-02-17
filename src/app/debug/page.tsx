// Debug page to test API endpoints
'use client';

import { useState, useEffect } from 'react';

export default function DebugPage() {
  const [results, setResults] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testEndpoints = async () => {
      const endpoints = [
        '/api/tasks',
        '/api/projects', 
        '/api/calendar/events?range=today',
        '/api/sync/status',
        '/api/blockers',
        '/api/research',
        '/api/bots'
      ];

      const newResults: Record<string, any> = {};
      const newErrors: Record<string, string> = {};

      for (const endpoint of endpoints) {
        try {
          console.log(`Fetching ${endpoint}...`);
          const res = await fetch(endpoint);
          console.log(`${endpoint} status:`, res.status);
          
          if (!res.ok) {
            newErrors[endpoint] = `HTTP ${res.status}`;
            continue;
          }

          const data = await res.json();
          console.log(`${endpoint} data:`, data);
          
          // Handle both array and object responses
          if (Array.isArray(data)) {
            newResults[endpoint] = { count: data.length, sample: data.slice(0, 2) };
          } else {
            newResults[endpoint] = data;
          }
        } catch (err) {
          console.error(`Error fetching ${endpoint}:`, err);
          newErrors[endpoint] = err instanceof Error ? err.message : String(err);
        }
      }

      setResults(newResults);
      setErrors(newErrors);
      setLoading(false);
    };

    testEndpoints();
  }, []);

  if (loading) {
    return <div className="p-8">Testing API endpoints...</div>;
  }

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-4">API Debug</h1>
      
      {Object.keys(errors).length > 0 && (
        <div className="mb-6 p-4 bg-red-100 rounded">
          <h2 className="font-bold text-red-800">Errors:</h2>
          {Object.entries(errors).map(([endpoint, error]) => (
            <div key={endpoint} className="text-red-700">
              {endpoint}: {error}
            </div>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(results).map(([endpoint, data]) => (
          <div key={endpoint} className="p-4 bg-gray-100 rounded">
            <h3 className="font-bold">{endpoint}</h3>
            <pre className="mt-2 text-sm overflow-auto">{JSON.stringify(data, null, 2)}</pre>
          </div>
        ))}
      </div>
    </div>
  );
}
