'use client'

import type { DailyUptimeSummary } from '@/types/status-page'

// ── Color logic ───────────────────────────────────────────────────────────────

function barColor(day: DailyUptimeSummary): string {
  if (day.uptimePercentage === null) return '#d1d5db' // gray-300 — no data
  if (day.uptimePercentage >= 99) return '#16a34a'    // green-600
  if (day.uptimePercentage >= 95) return '#ca8a04'    // yellow-600
  if (day.uptimePercentage >= 90) return '#ea580c'    // orange-600
  return '#dc2626'                                     // red-600
}

function formatDowntime(day: DailyUptimeSummary): string {
  if (day.totalChecks === 0) return '—'
  if (day.downChecks === 0) return 'None'
  // rough estimate: downtime = downChecks / totalChecks * 24h in minutes
  const ratio = day.downChecks / day.totalChecks
  const minutes = Math.round(ratio * 24 * 60)
  if (minutes < 60) return `~${minutes}m`
  const hours = (minutes / 60).toFixed(1)
  return `~${hours}h`
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr + 'T00:00:00Z').toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    })
  } catch {
    return dateStr
  }
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface UptimeBarProps {
  dailySummary: DailyUptimeSummary[]
  uptimePeriodDays: number
  /** Overall uptime % for the right-side label */
  uptimePercentage: number | null
}

// ── Component ─────────────────────────────────────────────────────────────────

export function UptimeBar({ dailySummary, uptimePeriodDays, uptimePercentage }: UptimeBarProps) {
  const total = dailySummary.length

  return (
    <div>
      {/* Bar row */}
      <div
        className="flex items-end gap-px"
        role="img"
        aria-label={`${uptimePeriodDays}-day uptime history`}
      >
        {dailySummary.map((day, i) => {
          const color = barColor(day)
          const isInLast30 = i >= total - 30
          const label =
            day.uptimePercentage !== null
              ? `${formatDate(day.date)}: ${day.uptimePercentage.toFixed(2)}% uptime`
              : `${formatDate(day.date)}: No data`

          const tooltipText = [
            formatDate(day.date),
            day.uptimePercentage !== null
              ? `Uptime: ${day.uptimePercentage.toFixed(2)}%`
              : 'Uptime: No data',
            `Downtime: ${formatDowntime(day)}`,
            day.avgResponseTimeMs !== null
              ? `Avg response: ${day.avgResponseTimeMs}ms`
              : null,
          ]
            .filter(Boolean)
            .join('\n')

          return (
            <div
              key={day.date}
              // On mobile show only last 30 bars; on sm+ show all
              className={[
                'relative flex-1',
                // Named group so inner tooltip can target it without conflicting
                // with outer accordion group
                'group/bar',
                isInLast30 ? '' : 'hidden sm:flex',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              {/* The bar */}
              <div
                style={{ backgroundColor: color, height: '28px', borderRadius: '3px' }}
                aria-label={label}
              />

              {/* CSS-only tooltip — shown on :hover via group-hover */}
              <div
                className={[
                  'pointer-events-none absolute bottom-full z-20 mb-2',
                  'opacity-0 group-hover/bar:opacity-100 transition-opacity duration-150',
                  // Horizontal placement: first 10 bars → align left, last 10 → align right, else center
                  i < 10
                    ? 'left-0'
                    : i >= total - 10
                      ? 'right-0'
                      : 'left-1/2 -translate-x-1/2',
                  'min-w-[140px]',
                  'rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-xl',
                  'whitespace-pre-line leading-relaxed',
                ].join(' ')}
                role="tooltip"
              >
                {tooltipText}
                {/* Caret arrow */}
                <span
                  className={[
                    'absolute top-full',
                    i < 10
                      ? 'left-3'
                      : i >= total - 10
                        ? 'right-3'
                        : 'left-1/2 -translate-x-1/2',
                    'border-4 border-transparent border-t-gray-900',
                  ].join(' ')}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer labels */}
      <div className="mt-1.5 flex items-center justify-between">
        <span className="text-xs text-gray-400">{uptimePeriodDays}-day uptime</span>
        {uptimePercentage !== null ? (
          <span className="text-xs font-medium text-gray-600">
            {uptimePercentage.toFixed(2)}%
          </span>
        ) : (
          <span className="text-xs text-gray-400">No data</span>
        )}
      </div>
    </div>
  )
}
