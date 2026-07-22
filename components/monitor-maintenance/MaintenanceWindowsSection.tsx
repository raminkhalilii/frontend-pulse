'use client'

import { useEffect, useState } from 'react'
import { Wrench, Trash2 } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import {
  createMaintenanceWindow,
  deleteMaintenanceWindow,
  listMaintenanceWindows,
} from '@/lib/api/maintenance'
import type { MaintenanceWindow } from '@/types/maintenance'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatRange(startsAt: string, endsAt: string): string {
  const fmt: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }
  const start = new Date(startsAt).toLocaleString(undefined, fmt)
  const end = new Date(endsAt).toLocaleString(undefined, fmt)
  return `${start} → ${end}`
}

type WindowPhase = 'active' | 'upcoming' | 'past'

function phaseOf(w: MaintenanceWindow, now: number): WindowPhase {
  const starts = new Date(w.startsAt).getTime()
  const ends = new Date(w.endsAt).getTime()
  if (now < starts) return 'upcoming'
  if (now > ends) return 'past'
  return 'active'
}

const PHASE_BADGE: Record<WindowPhase, string> = {
  active: 'border-pulse-blue/30 bg-pulse-blue/10 text-pulse-blue',
  upcoming: 'border-white/[0.08] bg-white/[0.04] text-slate-400',
  past: 'border-white/[0.05] bg-white/[0.02] text-slate-600',
}

const PHASE_LABEL: Record<WindowPhase, string> = {
  active: 'Active now',
  upcoming: 'Upcoming',
  past: 'Past',
}

/** Converts a `datetime-local` input value (local wall-clock time) to a UTC ISO string. */
function localInputToIso(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toISOString()
}

// ── Component ─────────────────────────────────────────────────────────────────

interface MaintenanceWindowsSectionProps {
  monitorId: string
  onToast: (message: string, type?: 'success' | 'error') => void
}

export function MaintenanceWindowsSection({ monitorId, onToast }: MaintenanceWindowsSectionProps) {
  const [windows, setWindows] = useState<MaintenanceWindow[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  const [title, setTitle] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [formError, setFormError] = useState('')
  const [scheduling, setScheduling] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    listMaintenanceWindows(monitorId)
      .then((data) => { if (!cancelled) setWindows(data) })
      .catch((err) => {
        if (!cancelled) setFetchError(err instanceof Error ? err.message : 'Failed to load maintenance windows.')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [monitorId])

  async function handleSchedule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError('')

    const startIso = localInputToIso(startsAt)
    const endIso = localInputToIso(endsAt)
    if (!startIso || !endIso) {
      setFormError('Pick both a start and end time.')
      return
    }
    if (new Date(endIso) <= new Date(startIso)) {
      setFormError('End time must be after start time.')
      return
    }

    setScheduling(true)
    try {
      const created = await createMaintenanceWindow(monitorId, {
        title: title.trim() || undefined,
        startsAt: startIso,
        endsAt: endIso,
      })
      setWindows((prev) => [created, ...prev])
      setTitle('')
      setStartsAt('')
      setEndsAt('')
      onToast('Maintenance window scheduled')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to schedule window.')
    } finally {
      setScheduling(false)
    }
  }

  async function handleDelete(windowId: string) {
    setDeletingId(windowId)
    try {
      await deleteMaintenanceWindow(monitorId, windowId)
      setWindows((prev) => prev.filter((w) => w.id !== windowId))
      onToast('Maintenance window deleted')
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to delete window.', 'error')
    } finally {
      setDeletingId(null)
      setConfirmingId(null)
    }
  }

  const inputCls = [
    'h-9 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-3',
    'text-sm text-white placeholder-slate-700',
    'focus:border-pulse-blue/40 focus:outline-none focus:ring-1 focus:ring-pulse-blue/30',
  ].join(' ')

  const now = Date.now()

  return (
    <GlassCard hoverEffect={false} glowColor="none" className="p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-white">Maintenance Windows</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          During a scheduled window this monitor won&apos;t be marked DOWN and no alerts will fire.
        </p>
      </div>

      {/* ── Schedule form ── */}
      <form onSubmit={handleSchedule} className="mb-6 space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
        <div>
          <label htmlFor="mw-title" className="mb-1.5 block text-xs font-medium text-slate-400">
            Title <span className="text-slate-700">(optional)</span>
          </label>
          <input
            id="mw-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 200))}
            placeholder="Database upgrade"
            maxLength={200}
            className={inputCls}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="mw-starts" className="mb-1.5 block text-xs font-medium text-slate-400">
              Starts at
            </label>
            <input
              id="mw-starts"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="mw-ends" className="mb-1.5 block text-xs font-medium text-slate-400">
              Ends at
            </label>
            <input
              id="mw-ends"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className={inputCls}
            />
          </div>
        </div>
        {formError && <p className="text-xs font-medium text-pulse-red">{formError}</p>}
        <div className="flex justify-end">
          <Button type="submit" variant="secondary" size="sm" leftIcon={<Wrench size={13} />} isLoading={scheduling}>
            Schedule Window
          </Button>
        </div>
      </form>

      {/* ── List ── */}
      {loading ? (
        <div className="animate-pulse space-y-2">
          {[64, 64].map((h, i) => (
            <div key={i} className="rounded-xl border border-white/[0.05] bg-white/[0.02]" style={{ height: `${h}px` }} />
          ))}
        </div>
      ) : fetchError ? (
        <p className="text-sm text-pulse-red">{fetchError}</p>
      ) : windows.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">No maintenance windows scheduled yet.</p>
      ) : (
        <div className="space-y-2">
          {windows.map((w) => {
            const phase = phaseOf(w, now)
            return (
              <div
                key={w.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium text-slate-200">
                      {w.title || 'Untitled window'}
                    </span>
                    <span className={`inline-flex flex-none items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${PHASE_BADGE[phase]}`}>
                      {PHASE_LABEL[phase]}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate font-mono text-xs text-slate-500">
                    {formatRange(w.startsAt, w.endsAt)}
                  </p>
                </div>

                {confirmingId === w.id ? (
                  <div className="flex flex-none items-center gap-1">
                    <span className="text-xs text-slate-400">Delete?</span>
                    <button
                      type="button"
                      onClick={() => handleDelete(w.id)}
                      disabled={deletingId === w.id}
                      className="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-pulse-red transition-colors hover:bg-pulse-red/10"
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingId(null)}
                      className="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:text-slate-200"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingId(w.id)}
                    aria-label="Delete maintenance window"
                    title="Delete"
                    className="flex-none cursor-pointer text-slate-600 transition-colors hover:text-pulse-red"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </GlassCard>
  )
}
