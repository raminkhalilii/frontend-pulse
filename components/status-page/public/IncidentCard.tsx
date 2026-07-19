'use client'

import { useState, useEffect } from 'react'
import type { Incident } from '@/types/incident'
import type { StatusPageMonitorData } from '@/types/status-page'
import {
  IMPACT_LABEL,
  STATUS_LABEL,
  IMPACT_BADGE_LIGHT,
  STATUS_BADGE_LIGHT,
} from '@/types/incident'
import { MarkdownRenderer } from '@/components/incidents/MarkdownRenderer'

// ── Time helper ───────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diffMs  = Date.now() - new Date(iso).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 10)  return 'just now'
  if (diffSec < 60)  return `${diffSec} seconds ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60)  return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`
  const diffHr  = Math.floor(diffMin / 60)
  if (diffHr  < 24)  return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`
}

// ── Component ─────────────────────────────────────────────────────────────────

interface IncidentCardProps {
  incident: Incident
  /** All monitors on this status page — used to look up display names by ID */
  monitors: StatusPageMonitorData[]
}

const TRUNCATE_LEN = 150

export function IncidentCard({ incident, monitors }: IncidentCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [, setTick] = useState(0)

  // Refresh relative times every 30 s
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  const latestUpdate = incident.updates[0] ?? null
  const needsTruncate =
    latestUpdate !== null && latestUpdate.message.length > TRUNCATE_LEN
  const previewText = needsTruncate && !expanded
    ? latestUpdate.message.slice(0, TRUNCATE_LEN) + '…'
    : latestUpdate?.message ?? ''

  // Map affected monitor IDs → display names
  const monitorMap = new Map(monitors.map((m) => [m.id, m.displayName]))
  const affectedNames = incident.affectedMonitorIds
    .map((id) => monitorMap.get(id) ?? id)

  return (
    <div className="rounded-xl border border-orange-200 bg-orange-50 px-5 py-4">
      {/* Header row */}
      <div className="flex flex-wrap items-start gap-2">
        {/* Impact badge */}
        <span
          className={[
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
            IMPACT_BADGE_LIGHT[incident.impact],
          ].join(' ')}
        >
          {IMPACT_LABEL[incident.impact]}
        </span>

        {/* Status badge */}
        <span
          className={[
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            STATUS_BADGE_LIGHT[incident.status],
          ].join(' ')}
        >
          {STATUS_LABEL[incident.status]}
        </span>

        {/* Title */}
        <span className="flex-1 min-w-0 text-sm font-semibold text-gray-900">
          {incident.title}
        </span>
      </div>

      {/* Meta row */}
      <p className="mt-1.5 text-xs text-gray-500">
        Started {timeAgo(incident.startedAt)}
      </p>

      {/* Affected monitors */}
      {affectedNames.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          {affectedNames.map((name) => (
            <span key={name} className="flex items-center gap-1 text-xs text-gray-600">
              <span
                className="inline-block h-2 w-2 rounded-full bg-orange-500"
                aria-hidden="true"
              />
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Latest update */}
      {latestUpdate && (
        <div className="mt-3 border-t border-orange-200 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">
            Latest update · {timeAgo(latestUpdate.createdAt)}
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            <MarkdownRenderer content={previewText} variant="light" />
            {needsTruncate && (
              <button
                type="button"
                onClick={() => setExpanded((v) => !v)}
                className="ml-1.5 cursor-pointer text-xs font-medium text-blue-600 hover:underline focus-visible:outline-none"
              >
                {expanded ? 'Show less' : 'Read more'}
              </button>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
