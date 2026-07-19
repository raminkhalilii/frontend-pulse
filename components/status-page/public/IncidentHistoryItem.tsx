import type { Incident } from '@/types/incident'
import type { StatusPageMonitorData } from '@/types/status-page'
import {
  IMPACT_LABEL,
  STATUS_LABEL,
  IMPACT_BADGE_LIGHT,
  STATUS_BADGE_LIGHT,
} from '@/types/incident'
import { MarkdownRenderer } from '@/components/incidents/MarkdownRenderer'

// ── Time helpers ──────────────────────────────────────────────────────────────

function formatDuration(startIso: string, endIso: string | null): string {
  const ms   = (endIso ? new Date(endIso) : new Date()).getTime() - new Date(startIso).getTime()
  const mins = Math.floor(ms / 60_000)
  if (mins < 1)  return 'Less than a minute'
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''}`
  const hours   = Math.floor(mins / 60)
  const remMins = mins % 60
  if (remMins === 0) return `${hours} hour${hours !== 1 ? 's' : ''}`
  return `${hours}h ${remMins}m`
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month:  'short',
    day:    'numeric',
    hour:   '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

interface IncidentHistoryItemProps {
  incident: Incident
  monitors: StatusPageMonitorData[]
}

export function IncidentHistoryItem({ incident, monitors }: IncidentHistoryItemProps) {
  const monitorMap    = new Map(monitors.map((m) => [m.id, m.displayName]))
  const affectedNames = incident.affectedMonitorIds.map((id) => monitorMap.get(id) ?? id)

  // Render updates oldest-first
  const orderedUpdates = [...incident.updates].reverse()

  return (
    <div className="py-4 border-b border-gray-100 last:border-b-0">
      {/* Incident header */}
      <div className="flex flex-wrap items-start gap-2 mb-1">
        <span
          className={[
            'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold',
            IMPACT_BADGE_LIGHT[incident.impact],
          ].join(' ')}
        >
          {IMPACT_LABEL[incident.impact]}
        </span>

        <span className="text-sm font-semibold text-gray-900 flex-1 min-w-0">
          {incident.title}
        </span>
      </div>

      {/* Duration */}
      <p className="text-xs text-gray-500 mb-2">
        Lasted {formatDuration(incident.startedAt, incident.resolvedAt)}
        {incident.resolvedAt && (
          <> · Resolved {formatTimestamp(incident.resolvedAt)}</>
        )}
      </p>

      {/* Affected monitors */}
      {affectedNames.length > 0 && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-3">
          {affectedNames.map((name) => (
            <span key={name} className="flex items-center gap-1 text-xs text-gray-500">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full bg-gray-400"
                aria-hidden="true"
              />
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Update timeline (always expanded, oldest-first, vertical line) */}
      {orderedUpdates.length > 0 && (
        <div className="relative ml-1 pl-5 border-l-2 border-gray-200 space-y-4">
          {orderedUpdates.map((update) => (
            <div key={update.id} className="relative">
              {/* Timeline dot */}
              <span
                className="absolute -left-[1.6rem] top-[0.35rem] flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-gray-200 bg-white"
                aria-hidden="true"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
              </span>

              {/* Update header */}
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span
                  className={[
                    'inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
                    STATUS_BADGE_LIGHT[update.status],
                  ].join(' ')}
                >
                  {STATUS_LABEL[update.status]}
                </span>
                <span className="text-[11px] text-gray-400">
                  {formatTimestamp(update.createdAt)}
                </span>
              </div>

              {/* Update message */}
              <p className="text-sm text-gray-700 leading-relaxed">
                <MarkdownRenderer content={update.message} variant="light" />
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
