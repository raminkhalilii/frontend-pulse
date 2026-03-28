'use client';

import { useState, FormEvent } from 'react';
import { createMonitor } from '@/lib/api';
import type { Monitor, MonitorFrequency } from '@/types';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

const FREQUENCY_OPTIONS: { value: MonitorFrequency; label: string }[] = [
  { value: 'ONE_MIN', label: 'Every 1 minute' },
  { value: 'FIVE_MIN', label: 'Every 5 minutes' },
  { value: 'THIRTY_MIN', label: 'Every 30 minutes' },
];

interface Props {
  onCreated: (monitor: Monitor) => void;
}

export default function CreateMonitorForm({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [frequency, setFrequency] = useState<MonitorFrequency>('FIVE_MIN');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const monitor = await createMonitor({ name, url, frequency });
      onCreated(monitor);
      setName('');
      setUrl('');
      setFrequency('FIVE_MIN');
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create monitor.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="rounded-2xl overflow-hidden">
      <Button
        type="button"
        variant="ghost"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-800/50 rounded-none"
      >
        <span className="flex items-center gap-3">
          <span className="size-7 rounded-md bg-indigo-600/20 flex items-center justify-center text-indigo-400 text-lg font-light leading-none">
            +
          </span>
          <span className="text-sm font-semibold text-white">Add a new monitor</span>
        </span>
        <svg
          className={`size-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </Button>

      {open && (
        <div className="border-t border-gray-800 px-6 py-5">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="mon-name" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                  Monitor name
                </label>
                <input
                  id="mon-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Google Homepage"
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label htmlFor="mon-freq" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                  Check frequency
                </label>
                <select
                  id="mon-freq"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as MonitorFrequency)}
                  className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition appearance-none cursor-pointer"
                >
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="mon-url" className="block text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wide">
                URL to monitor
              </label>
              <input
                id="mon-url"
                type="url"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-950/40 border border-red-800/60 rounded-lg px-4 py-2.5">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <Button type="submit" disabled={loading} variant="primary">
                {loading ? 'Creating...' : 'Create monitor'}
              </Button>
              <Button type="button" onClick={() => setOpen(false)} variant="secondary">
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}
    </Card>
  );
}
