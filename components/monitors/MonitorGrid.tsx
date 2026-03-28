'use client';

import type { Monitor, MonitorFrequency } from '@/types';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import { Card, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';

const FREQUENCY_LABELS: Record<MonitorFrequency, string> = {
  ONE_MIN: '1m',
  FIVE_MIN: '5m',
  THIRTY_MIN: '30m',
};

interface Props {
  monitors: Monitor[];
}

function MonitorCard({ monitor }: { monitor: Monitor }) {
  const freqLabel = FREQUENCY_LABELS[monitor.frequency];
  const latestPing =
    monitor.latestLatencyMs === null || monitor.latestLatencyMs === undefined
      ? 'N/A'
      : `${monitor.latestLatencyMs}ms`;

  return (
    <Card className="hover:border-gray-700 transition-colors">
      <CardHeader className="flex items-start justify-between gap-2 pb-4">
        <div className="min-w-0">
          <CardTitle className="truncate">{monitor.name}</CardTitle>
          <a
            href={monitor.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-400 text-xs hover:text-indigo-400 transition-colors truncate block mt-0.5"
            title={monitor.url}
          >
            {monitor.url}
          </a>
        </div>

        <div className="flex-shrink-0 flex items-center gap-1.5">
          {monitor.isActive ? (
            <>
              <span className="relative flex size-2">
                <span className="animate-ping absolute inline-flex size-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
              </span>
              <span className="text-emerald-400 text-xs font-medium">Active</span>
            </>
          ) : (
            <>
              <span className="size-2 rounded-full bg-gray-600" />
              <span className="text-gray-500 text-xs font-medium">Paused</span>
            </>
          )}
        </div>
      </CardHeader>

      <CardFooter className="flex items-center justify-between">
        <StatusBadge status={monitor.latestStatus} />

        <div className="flex items-center gap-2">
          <Badge tone="neutral">Ping {latestPing}</Badge>
          <Badge tone="neutral">
            <svg className="size-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Every {freqLabel}
          </Badge>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function MonitorGrid({ monitors }: Props) {
  if (monitors.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="size-14 rounded-2xl bg-gray-800 flex items-center justify-center mb-4">
          <svg className="size-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <p className="text-gray-300 font-semibold mb-1">No monitors yet</p>
        <p className="text-gray-500 text-sm">Add your first monitor above to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {monitors.map((monitor) => (
        <MonitorCard key={monitor.id} monitor={monitor} />
      ))}
    </div>
  );
}
