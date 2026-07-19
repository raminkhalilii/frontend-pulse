'use client'

import Link from 'next/link'
import type { Incident } from '@/types/incident'
import type { Monitor } from '@/types'
import {
  IMPACT_LABEL,
  STATUS_LABEL,
  IMPACT_BADGE_DARK,
  STATUS_BADGE_DARK,
} from '@/types/incident'
import Button from '@/components/ui/Button'

// ── Relative time (mirrors StatusPageHeader.timeAgo) ─────────────────────────

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

const TRUNCATE = 120

// ── Component ─────────────────────────────────────────────────────────────────

interface IncidentDashboardCardProps {
  incident: Incident
  monitors: Monitor[]
  onPostUpdate: (id: string) => void
  onResolve:    (id: string) => void
  onEdit:       (id: string) => void
}

export function IncidentDashboardCard({
  incident,
  monitors,
  onPostUpdate,
  onResolve,
  onEdit,
}: IncidentDashboardCardProps) {
  const monitorMap    = new Map(monitors.map((m) => [m.id, m.name]))
  const affectedNames = incident.affectedMonitorIds.map((id) => monitorMap.get(id) ?? id)
  const latestUpdate  = incident.updates[0] ?? null

  const isResolved = incident.status === 'RESOLVED'

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5">
      {/* Header */}
      <div className="flex flex-wrap items-start gap-2 mb-2">
        <span
          className={[
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
            IMPACT_BADGE_DARK[incident.impact],
          ].join(' ')}
        >
          {IMPACT_LABEL[incident.impact]}
        </span>

        <span
          className={[
            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
            STATUS_BADGE_DARK[incident.status],
          ].join(' ')}
        >
          {STATUS_LABEL[incident.status]}
        </span>

        {incident.autoCreated && (
          <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs text-slate-500">
            ⚡ Auto-generated
          </span>
        )}
      </div>

      {/* Title */}
      <Link
        href={`/dashboard/incidents/${incident.id}`}
        className="block text-sm font-semibold text-white hover:text-pulse-blue transition-colors mb-1"
      >
        {incident.title}
      </Link>

      {/* Meta */}
      <p className="text-xs text-slate-500 mb-3">
        Started {timeAgo(incident.startedAt)}
      </p>

      {/* Affected monitors */}
      {affectedNames.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
          {affectedNames.map((name) => (
            <span key={name} className="flex items-center gap-1 text-xs text-slate-500">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-slate-600"
                aria-hidden="true"
              />
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Latest update */}
      {latestUpdate && (
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          {latestUpdate.message.length > TRUNCATE
            ? latestUpdate.message.slice(0, TRUNCATE) + '…'
            : latestUpdate.message}
        </p>
      )}

      {/* Action buttons — only for active incidents */}
      {!isResolved && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onPostUpdate(incident.id)}
          >
            Post Update
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onResolve(incident.id)}
          >
            Resolve
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(incident.id)}
          >
            Edit
          </Button>
        </div>
      )}
    </div>
  )
}
