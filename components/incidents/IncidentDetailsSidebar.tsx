'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import type { Incident } from '@/types/incident'
import type { Monitor } from '@/types'
import Button from '@/components/ui/Button'
import { updateIncident, resolveIncident } from '@/lib/api/incidents'
import { postIncidentUpdate } from '@/lib/api/incidents'

// ── Time helpers ──────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year:   'numeric',
    month:  'short',
    day:    'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDuration(startIso: string, endIso: string | null): string {
  const ms   = (endIso ? new Date(endIso) : new Date()).getTime() - new Date(startIso).getTime()
  const mins = Math.floor(ms / 60_000)
  if (mins < 1)  return 'Less than a minute'
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

// ── Sub-sections ──────────────────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-white/[0.05] last:border-b-0">
      <span className="text-xs text-slate-500 flex-none">{label}</span>
      <span className="text-xs text-slate-300 text-right">{value}</span>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

interface IncidentDetailsSidebarProps {
  incident:          Incident
  monitors:          Monitor[]
  statusPageSlug?:   string | null
  onIncidentUpdated: (updated: Incident) => void
  onDeleted:         () => void
}

export function IncidentDetailsSidebar({
  incident,
  monitors,
  statusPageSlug,
  onIncidentUpdated,
  onDeleted,
}: IncidentDetailsSidebarProps) {
  const [, setTick] = useState(0)

  // Tick every minute for the live duration counter
  useEffect(() => {
    if (incident.status === 'RESOLVED') return
    const id = setInterval(() => setTick((n) => n + 1), 60_000)
    return () => clearInterval(id)
  }, [incident.status])

  // Resolve flow state
  const [showResolveForm,  setShowResolveForm]  = useState(false)
  const [resolveMessage,   setResolveMessage]   = useState('This incident has been resolved.')
  const [resolvingLoading, setResolvingLoading] = useState(false)
  const [resolveError,     setResolveError]     = useState('')

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading,     setDeleteLoading]     = useState(false)

  // Affected monitors popover
  const [showMonitorEdit, setShowMonitorEdit] = useState(false)

  const monitorMap    = new Map(monitors.map((m) => [m.id, m]))
  const affectedNames = incident.affectedMonitorIds.map(
    (id) => monitorMap.get(id)?.name ?? id,
  )
  const isResolved = incident.status === 'RESOLVED'

  async function handleResolve() {
    setResolvingLoading(true)
    setResolveError('')
    try {
      // Use postIncidentUpdate with RESOLVED to include a custom message
      const updated = await postIncidentUpdate(incident.id, {
        message: resolveMessage.trim() || 'This incident has been resolved.',
        status:  'RESOLVED',
      })
      onIncidentUpdated(updated)
      setShowResolveForm(false)
    } catch (err) {
      setResolveError(err instanceof Error ? err.message : 'Failed to resolve incident.')
    } finally {
      setResolvingLoading(false)
    }
  }

  async function handleDelete() {
    setDeleteLoading(true)
    try {
      const { deleteIncident } = await import('@/lib/api/incidents')
      await deleteIncident(incident.id)
      onDeleted()
    } catch {
      setDeleteLoading(false)
      setShowDeleteConfirm(false)
    }
  }

  const inputCls = [
    'w-full px-3 py-2 rounded-lg text-sm text-white placeholder-slate-700',
    'bg-white/5 border border-white/[0.08]',
    'focus:outline-none focus:border-pulse-blue/50',
    'transition-all duration-200 resize-none',
  ].join(' ')

  return (
    <div className="space-y-4">
      {/* Incident Details card */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4">
        <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 mb-3">
          Incident Details
        </h3>
        <div>
          <DetailRow label="Started"  value={formatDate(incident.startedAt)} />
          <DetailRow
            label="Duration"
            value={
              isResolved
                ? formatDuration(incident.startedAt, incident.resolvedAt)
                : <span className="text-orange-400">{formatDuration(incident.startedAt, null)} (ongoing)</span>
            }
          />
          <DetailRow
            label="Resolved"
            value={
              incident.resolvedAt
                ? formatDate(incident.resolvedAt)
                : <span className="text-slate-600">Ongoing</span>
            }
          />
        </div>
      </div>

      {/* Affected Monitors card */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Affected Monitors
          </h3>
          {!isResolved && (
            <button
              type="button"
              onClick={() => setShowMonitorEdit((v) => !v)}
              className="cursor-pointer text-[11px] text-pulse-blue hover:underline"
            >
              Edit
            </button>
          )}
        </div>

        {affectedNames.length === 0 ? (
          <p className="text-xs text-slate-600">No monitors linked.</p>
        ) : (
          <ul className="space-y-1">
            {affectedNames.map((name) => (
              <li key={name} className="flex items-center gap-2 text-xs text-slate-300">
                <span
                  className="h-1.5 w-1.5 rounded-full bg-orange-400 flex-none"
                  aria-hidden="true"
                />
                {name}
              </li>
            ))}
          </ul>
        )}

        {/* Monitor edit popover */}
        {showMonitorEdit && (
          <AffectedMonitorEditor
            incident={incident}
            monitors={monitors}
            onUpdated={onIncidentUpdated}
            onClose={() => setShowMonitorEdit(false)}
          />
        )}
      </div>

      {/* Quick Actions card */}
      <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-4 space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
          Quick Actions
        </h3>

        {/* View on status page */}
        {statusPageSlug && (
          <Link
            href={`/status/${statusPageSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs text-pulse-blue hover:underline"
          >
            View on status page →
          </Link>
        )}

        {/* Resolve */}
        {!isResolved && (
          <div>
            {!showResolveForm ? (
              <Button
                variant="primary"
                size="sm"
                fullWidth
                onClick={() => setShowResolveForm(true)}
                className="!from-emerald-500 !to-emerald-400"
              >
                Resolve Incident
              </Button>
            ) : (
              <div className="space-y-2.5">
                <textarea
                  rows={3}
                  value={resolveMessage}
                  onChange={(e) => setResolveMessage(e.target.value)}
                  className={inputCls}
                />
                {resolveError && (
                  <p className="text-xs text-pulse-red">{resolveError}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={resolvingLoading}
                    onClick={handleResolve}
                    className="!from-emerald-500 !to-emerald-400 flex-1"
                  >
                    Confirm Resolve
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowResolveForm(false); setResolveError('') }}
                    disabled={resolvingLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Delete (manual incidents only) */}
        {!incident.autoCreated && (
          <div>
            {!showDeleteConfirm ? (
              <Button
                variant="ghost"
                size="sm"
                fullWidth
                onClick={() => setShowDeleteConfirm(true)}
                className="!text-pulse-red hover:!bg-pulse-red/[0.08]"
              >
                Delete Incident
              </Button>
            ) : (
              <div className="rounded-lg border border-pulse-red/20 bg-pulse-red/[0.06] p-3 space-y-2">
                <p className="text-xs text-red-400">
                  This will permanently delete the incident and all its updates.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    isLoading={deleteLoading}
                    onClick={handleDelete}
                    className="!text-pulse-red hover:!bg-pulse-red/[0.1] flex-1"
                  >
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={deleteLoading}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Affected monitor editor (inline popover) ──────────────────────────────────

function AffectedMonitorEditor({
  incident,
  monitors,
  onUpdated,
  onClose,
}: {
  incident:   Incident
  monitors:   Monitor[]
  onUpdated:  (inc: Incident) => void
  onClose:    () => void
}) {
  const [selected, setSelected] = useState<string[]>(incident.affectedMonitorIds)
  const [loading,  setLoading]  = useState(false)

  function toggle(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    )
  }

  async function save() {
    setLoading(true)
    try {
      // Re-create the incident monitor links by patching via the update endpoint
      // (Currently the backend updateIncident doesn't handle monitorIds,
      //  so we use createIncident + a workaround. For now just close.)
      // TODO(backend): add PATCH /status-page/incidents/:id/monitors
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-white/[0.1] bg-white/[0.04] p-3 space-y-2">
      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
        Edit affected monitors
      </p>
      <div className="space-y-1 max-h-32 overflow-y-auto">
        {monitors.map((m) => (
          <label key={m.id} className="flex cursor-pointer items-center gap-2 text-xs text-slate-300 hover:text-white">
            <input
              type="checkbox"
              checked={selected.includes(m.id)}
              onChange={() => toggle(m.id)}
              className="h-3 w-3 cursor-pointer accent-pulse-blue"
            />
            {m.name}
          </label>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <Button variant="secondary" size="sm" isLoading={loading} onClick={save}>
          Save
        </Button>
        <Button variant="ghost" size="sm" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
