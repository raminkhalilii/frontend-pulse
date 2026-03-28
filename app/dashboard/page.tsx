'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getMonitors } from '@/lib/api';
import { removeToken } from '@/lib/auth';
import type { Monitor, MonitorUpdatedPayload } from '@/types';
import CreateMonitorForm from '@/components/monitors/CreateMonitorForm';
import MonitorGrid from '@/components/monitors/MonitorGrid';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { usePulseSocket } from '@/hooks/usePulseSocket';

export default function DashboardPage() {
  const router = useRouter();
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchMonitors = useCallback(async () => {
    try {
      const data = await getMonitors();
      setMonitors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load monitors.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMonitorUpdated = useCallback((payload: MonitorUpdatedPayload) => {
    setMonitors((prev) =>
      prev.map((monitor) =>
        monitor.id === payload.monitorId
          ? {
              ...monitor,
              latestStatus: payload.status,
              latestLatencyMs: payload.latencyMs,
              latestCheckedAt: payload.timestamp,
            }
          : monitor,
      ),
    );
  }, []);

  usePulseSocket({ onMonitorUpdated: handleMonitorUpdated, enabled: !loading });

  useEffect(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  function handleLogout() {
    removeToken();
    router.push('/login');
  }

  function handleMonitorCreated(monitor: Monitor) {
    setMonitors((prev) => [monitor, ...prev]);
  }

  const activeCount = monitors.filter((m) => m.isActive).length;

  return (
    <div className="min-h-screen bg-gray-950">
      <header className="border-b border-gray-800 bg-gray-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="size-7 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
              P
            </span>
            <span className="text-white font-bold tracking-tight">Pulse</span>
          </div>
          <Button onClick={handleLogout} variant="ghost" size="sm">
            Log out
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Monitors</h1>
            <p className="text-gray-400 text-sm mt-0.5">Track the uptime of your services in real time.</p>
          </div>

          {!loading && monitors.length > 0 && (
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-gray-500" />
                <span className="text-gray-400">
                  <span className="text-white font-semibold">{monitors.length}</span> total
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" />
                <span className="text-gray-400">
                  <span className="text-white font-semibold">{activeCount}</span> active
                </span>
              </div>
            </div>
          )}
        </div>

        <CreateMonitorForm onCreated={handleMonitorCreated} />

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex items-center gap-3 text-gray-400 text-sm">
              <svg className="animate-spin size-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
              Loading monitors...
            </div>
          </div>
        ) : error ? (
          <Card className="rounded-xl border-red-800/60 bg-red-950/30 px-5 py-4 text-red-400 text-sm">{error}</Card>
        ) : (
          <MonitorGrid monitors={monitors} />
        )}
      </main>
    </div>
  );
}
