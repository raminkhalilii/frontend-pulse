'use client'

import { useState } from 'react'
import type { StatusPageMonitorData } from '@/types/status-page'
import type { StatusPageSettings } from '@/types/status-page'
import type { Incident } from '@/types/incident'
import { IMPACT_BORDER_COLOR } from '@/types/incident'
import { UptimeBar } from './UptimeBar'

// ── Status helpers ────────────────────────────────────────────────────────────

function statusDotColor(status: StatusPageMonitorData['currentStatus']): string {
  if (status === 'UP') return '#16a34a'
  if (status === 'DOWN') return '#dc2626'
  return '#9ca3af' // UNKNOWN → gray
}

function statusLabel(status: StatusPageMonitorData['currentStatus']): string {
  if (status === 'UP') return 'Operational'
  if (status === 'DOWN') return 'Down'
  return 'No data'
}

function statusLabelColor(status: StatusPageMonitorData['currentStatus']): string {
  if (status === 'UP') return 'text-green-700'
  if (status === 'DOWN') return 'text-red-700'
  return 'text-gray-500'
}

// ── Warning icon (inline SVG — no lucide dependency in public pages) ──────────

function WarningIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5 flex-none text-orange-500"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

interface MonitorStatusRowProps {
  monitor: StatusPageMonitorData
  settings: Pick<StatusPageSettings, 'showUptimePercentage' | 'showResponseTime' | 'uptimePeriodDays'>
  /** Active incident affecting this monitor, if any */
  activeIncident?: Pick<Incident, 'id' | 'title' | 'impact'> | null
}

export function MonitorStatusRow({ monitor, settings, activeIncident }: MonitorStatusRowProps) {
  const [expanded, setExpanded] = useState(false)

  const dotColor   = statusDotColor(monitor.currentStatus)
  const label      = statusLabel(monitor.currentStatus)
  const labelColor = statusLabelColor(monitor.currentStatus)

  const borderColor = activeIncident ? IMPACT_BORDER_COLOR[activeIncident.impact] : undefined

  return (
    <div
      className="border-b border-gray-100 last:border-b-0"
      style={
        borderColor
          ? { borderLeft: `3px solid ${borderColor}`, paddingLeft: '12px' }
          : undefined
      }
    >
      {/* Clickable row header */}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="group w-full cursor-pointer px-0 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 rounded-sm"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-3">
          {/* Status dot */}
          <span
            className="flex-none"
            style={{
              display:         'inline-block',
              width:           '10px',
              height:          '10px',
              borderRadius:    '50%',
              backgroundColor: dotColor,
              flexShrink:      0,
            }}
            aria-hidden="true"
          />

          {/* Name + optional incident warning */}
          <span className="flex flex-1 min-w-0 items-center gap-1.5 truncate">
            <span className="truncate text-sm font-semibold text-gray-900">
              {monitor.displayName}
            </span>
            {activeIncident && (
              <span
                className="group/warn relative flex-none"
                title={`Affected by: ${activeIncident.title}`}
              >
                <WarningIcon />
                {/* CSS-only tooltip */}
                <span
                  className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-3 py-1.5 text-xs text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover/warn:opacity-100"
                  role="tooltip"
                >
                  Affected by: {activeIncident.title}
                  <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
                </span>
              </span>
            )}
          </span>

          {/* Pills */}
          <div className="flex flex-none items-center gap-2 flex-wrap justify-end">
            {/* Status label */}
            <span className={`text-xs font-medium ${labelColor}`}>{label}</span>

            {/* Uptime badge */}
            {settings.showUptimePercentage && monitor.uptimePercentage !== null && (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                {monitor.uptimePercentage.toFixed(2)}% uptime
              </span>
            )}

            {/* Response time badge */}
            {settings.showResponseTime &&
              monitor.showResponseTime &&
              monitor.avgResponseTimeMs !== null && (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  {monitor.avgResponseTimeMs}ms avg
                </span>
              )}

            {/* Expand chevron */}
            <svg
              className={`h-4 w-4 flex-none text-gray-400 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Uptime bar (always visible in collapsed row) */}
        <div className="mt-3" onClick={(e) => e.stopPropagation()}>
          <UptimeBar
            dailySummary={monitor.dailySummary}
            uptimePeriodDays={settings.uptimePeriodDays}
            uptimePercentage={monitor.uptimePercentage}
          />
        </div>
      </button>

      {/* Expanded detail panel — CSS max-height accordion */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{ maxHeight: expanded ? '600px' : '0px' }}
        aria-hidden={!expanded}
      >
        <div className="pb-4">
          <div className="rounded-lg bg-gray-50 px-4 py-3">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
              Daily Breakdown
            </h3>

            {monitor.dailySummary.length === 0 ? (
              <p className="text-sm text-gray-400">No historical data available.</p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {[...monitor.dailySummary].reverse().map((day) => (
                  <div key={day.date} className="flex items-center justify-between gap-4 py-1">
                    <span className="text-xs text-gray-500 tabular-nums">{day.date}</span>
                    <div className="flex items-center gap-3">
                      {day.uptimePercentage !== null ? (
                        <>
                          <span
                            className={`text-xs font-medium tabular-nums ${
                              day.uptimePercentage >= 99
                                ? 'text-green-700'
                                : day.uptimePercentage >= 95
                                  ? 'text-yellow-700'
                                  : 'text-red-700'
                            }`}
                          >
                            {day.uptimePercentage.toFixed(2)}%
                          </span>
                          {day.avgResponseTimeMs !== null && (
                            <span className="text-xs text-gray-400 tabular-nums">
                              {day.avgResponseTimeMs}ms
                            </span>
                          )}
                          {day.hadOutage && (
                            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
                              Outage
                            </span>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">No data</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Last checked */}
          {monitor.lastCheckedAt && (
            <p className="mt-2 text-right text-xs text-gray-400">
              Last checked:{' '}
              {new Date(monitor.lastCheckedAt).toLocaleString('en-US', {
                month:        'short',
                day:          'numeric',
                hour:         '2-digit',
                minute:       '2-digit',
                timeZoneName: 'short',
              })}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
