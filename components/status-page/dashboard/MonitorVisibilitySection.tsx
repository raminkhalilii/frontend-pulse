'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { GripVertical, Plus } from 'lucide-react'
import Link from 'next/link'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import type { Monitor } from '@/types'
import type { StatusPageSettings, MonitorVisibilityRow } from '@/types/status-page'
import { setStatusPageMonitors } from '@/lib/api/status-page'

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Builds an initial MonitorVisibilityRow[] by merging the user's full
 * monitor list with the currently linked StatusPageMonitor entries.
 * Non-linked monitors appear at the bottom with included=false.
 */
function buildRows(
  allMonitors: Monitor[],
  settings: StatusPageSettings,
  linkedMonitors: { id: string; displayName: string | null; showResponseTime: boolean; position: number }[],
): MonitorVisibilityRow[] {
  const linkedMap = new Map(linkedMonitors.map((lm) => [lm.id, lm]))

  const linked = linkedMonitors
    .slice()
    .sort((a, b) => a.position - b.position)
    .map((lm) => {
      const mon = allMonitors.find((m) => m.id === lm.id)
      if (!mon) return null
      return {
        monitorId: lm.id,
        name: mon.name,
        liveStatus: mon.latestStatus,
        included: true,
        displayName: lm.displayName ?? '',
        showResponseTime: lm.showResponseTime,
        position: lm.position,
      } satisfies MonitorVisibilityRow
    })
    .filter((r): r is MonitorVisibilityRow => r !== null)

  const unlinked = allMonitors
    .filter((m) => !linkedMap.has(m.id))
    .map((m, i) => ({
      monitorId: m.id,
      name: m.name,
      liveStatus: m.latestStatus,
      included: false,
      displayName: '',
      showResponseTime: true,
      position: linked.length + i,
    }))

  return [...linked, ...unlinked]
}

// ── Status dot ────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: 'UP' | 'DOWN' | undefined }) {
  const color =
    status === 'UP' ? 'bg-pulse-green' : status === 'DOWN' ? 'bg-pulse-red' : 'bg-slate-600'
  return (
    <span
      className={`inline-block h-2 w-2 flex-none rounded-full ${color}`}
      aria-hidden="true"
    />
  )
}


// ── Props ─────────────────────────────────────────────────────────────────────

interface MonitorVisibilitySectionProps {
  allMonitors: Monitor[]
  settings: StatusPageSettings
  /**
   * Currently linked monitors from the status page. The page component
   * passes these through after the initial data load.
   */
  linkedMonitors: { id: string; displayName: string | null; showResponseTime: boolean; position: number }[]
  onSaved: () => void
  onToast: (msg: string, type?: 'success' | 'error') => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MonitorVisibilitySection({
  allMonitors,
  settings,
  linkedMonitors,
  onSaved,
  onToast,
}: MonitorVisibilitySectionProps) {
  const [rows, setRows] = useState<MonitorVisibilityRow[]>(() =>
    buildRows(allMonitors, settings, linkedMonitors),
  )
  const [saving, setSaving] = useState(false)

  // Re-build when inputs change
  useEffect(() => {
    setRows(buildRows(allMonitors, settings, linkedMonitors))
  }, [allMonitors, settings, linkedMonitors])

  // ── Drag-and-drop state ───────────────────────────────────────────────────
  const dragIndexRef = useRef<number | null>(null)
  const dragOverIndexRef = useRef<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)

  // ── Drag handlers ─────────────────────────────────────────────────────────

  function onDragStart(index: number) {
    dragIndexRef.current = index
    setDragIndex(index)
  }

  function onDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    dragOverIndexRef.current = index
    setDragOverIndex(index)
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    const from = dragIndexRef.current
    const to = dragOverIndexRef.current
    if (from === null || to === null || from === to) {
      cleanup()
      return
    }

    setRows((prev) => {
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      // Re-assign positions
      return next.map((r, i) => ({ ...r, position: i }))
    })
    cleanup()
  }

  function onDragEnd() {
    cleanup()
  }

  function cleanup() {
    dragIndexRef.current = null
    dragOverIndexRef.current = null
    setDragIndex(null)
    setDragOverIndex(null)
  }

  // ── Keyboard reorder ──────────────────────────────────────────────────────

  function onKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === 'ArrowUp' && index > 0) {
      e.preventDefault()
      setRows((prev) => {
        const next = [...prev]
        ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
        return next.map((r, i) => ({ ...r, position: i }))
      })
    }
    if (e.key === 'ArrowDown' && index < rows.length - 1) {
      e.preventDefault()
      setRows((prev) => {
        const next = [...prev]
        ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
        return next.map((r, i) => ({ ...r, position: i }))
      })
    }
  }

  // ── Row updaters ──────────────────────────────────────────────────────────

  const toggleIncluded = useCallback((monitorId: string) => {
    setRows((prev) =>
      prev.map((r) => (r.monitorId === monitorId ? { ...r, included: !r.included } : r)),
    )
  }, [])

  const updateDisplayName = useCallback((monitorId: string, value: string) => {
    setRows((prev) =>
      prev.map((r) => (r.monitorId === monitorId ? { ...r, displayName: value } : r)),
    )
  }, [])

  const updateShowResponseTime = useCallback((monitorId: string, value: boolean) => {
    setRows((prev) =>
      prev.map((r) => (r.monitorId === monitorId ? { ...r, showResponseTime: value } : r)),
    )
  }, [])

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true)
    try {
      const included = rows
        .filter((r) => r.included)
        .sort((a, b) => a.position - b.position)
        .map((r, i) => ({
          monitorId: r.monitorId,
          displayName: r.displayName.trim() || undefined,
          showResponseTime: r.showResponseTime,
          position: i,
        }))

      await setStatusPageMonitors({ monitors: included })
      onSaved()
      onToast('Monitor settings saved')
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to save monitors.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  if (allMonitors.length === 0) {
    return (
      <GlassCard hoverEffect={false} glowColor="none" className="p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-white">Monitors on Status Page</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Choose which monitors appear on your public status page and in what order.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.03]">
            <Plus size={20} className="text-slate-600" aria-hidden="true" />
          </div>
          <p className="mb-1 font-semibold text-white">No monitors yet</p>
          <p className="mb-5 max-w-xs text-sm text-slate-500">
            Add your first monitor to get started.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-pulse-green to-emerald-400 px-4 py-2 text-sm font-semibold text-background transition-all duration-200 hover:from-emerald-400 hover:to-pulse-green hover:shadow-[0_0_24px_rgba(16,185,129,0.45)]"
          >
            <Plus size={14} aria-hidden="true" />
            Add Monitor
          </Link>
        </div>
      </GlassCard>
    )
  }

  return (
    <GlassCard hoverEffect={false} glowColor="none" className="p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-white">Monitors on Status Page</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Choose which monitors appear on your public status page and in what order.
          Drag rows to reorder, or use{' '}
          <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1 py-0.5 font-mono text-[10px] text-slate-400">
            ↑
          </kbd>{' '}
          /{' '}
          <kbd className="rounded border border-white/[0.08] bg-white/[0.04] px-1 py-0.5 font-mono text-[10px] text-slate-400">
            ↓
          </kbd>{' '}
          arrow keys.
        </p>
      </div>

      <div className="space-y-0.5" role="list" aria-label="Monitor visibility list">
        {rows.map((row, index) => (
          <div
            key={row.monitorId}
            role="listitem"
            draggable
            onDragStart={() => onDragStart(index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
            className={[
              'group relative flex items-center gap-3 rounded-lg border px-3 py-3',
              'transition-all duration-150',
              dragIndex === index
                ? 'opacity-40'
                : dragOverIndex === index
                  ? 'border-pulse-blue/40 bg-pulse-blue/[0.05]'
                  : 'border-white/[0.05] bg-white/[0.02] hover:border-white/[0.08] hover:bg-white/[0.04]',
            ].join(' ')}
          >
            {/* Drop insertion line */}
            {dragOverIndex === index && dragIndex !== index && (
              <div className="pointer-events-none absolute -top-px left-3 right-3 h-0.5 rounded-full bg-pulse-blue" />
            )}

            {/* Drag handle */}
            <button
              type="button"
              aria-label={`Drag to reorder ${row.name}`}
              onKeyDown={(e) => onKeyDown(e, index)}
              tabIndex={0}
              className="flex-none cursor-grab touch-none text-slate-700 transition-colors duration-150 focus-visible:outline-none focus-visible:text-slate-400 hover:text-slate-400 active:cursor-grabbing"
            >
              <GripVertical size={14} aria-hidden="true" />
            </button>

            {/* Checkbox */}
            <input
              type="checkbox"
              id={`include-${row.monitorId}`}
              checked={row.included}
              onChange={() => toggleIncluded(row.monitorId)}
              className="h-3.5 w-3.5 flex-none cursor-pointer rounded accent-pulse-blue"
            />

            {/* Status dot + name */}
            <label
              htmlFor={`include-${row.monitorId}`}
              className="flex min-w-0 flex-1 cursor-pointer items-center gap-2"
            >
              <StatusDot status={row.liveStatus} />
              <span className="truncate text-sm font-medium text-slate-300">{row.name}</span>
            </label>

            {/* Display name input */}
            <input
              type="text"
              value={row.displayName}
              onChange={(e) => updateDisplayName(row.monitorId, e.target.value)}
              placeholder="Leave blank to use monitor name"
              maxLength={100}
              className="hidden w-36 rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-xs text-slate-300 placeholder-slate-700 transition-colors focus:border-pulse-blue/40 focus:outline-none lg:block"
            />

            {/* Per-monitor show response time toggle */}
            <div className="flex flex-none items-center gap-1.5">
              <span className="hidden text-[10px] text-slate-600 sm:block">Latency</span>
              <Toggle
                size="sm"
                checked={row.showResponseTime}
                onChange={(v) => updateShowResponseTime(row.monitorId, v)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Save */}
      <div className="mt-5 pt-1">
        <Button variant="primary" size="md" onClick={handleSave} isLoading={saving}>
          Save Monitor Settings
        </Button>
      </div>
    </GlassCard>
  )
}
