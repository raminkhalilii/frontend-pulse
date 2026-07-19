import type { SystemStatus, SystemStatusLabel } from '@/types/status-page'

// ── Variant config ────────────────────────────────────────────────────────────

const VARIANTS: Record<
  SystemStatusLabel,
  { bg: string; border: string; text: string; icon: string; label: string }
> = {
  operational: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    icon: '✓',
    label: 'All Systems Operational',
  },
  degraded: {
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    icon: '⚠',
    label: 'Performance Degraded',
  },
  partial_outage: {
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    icon: '⚠',
    label: 'Partial System Outage',
  },
  major_outage: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    icon: '✗',
    label: 'Major System Outage',
  },
}

// ── Component ─────────────────────────────────────────────────────────────────

interface OverallStatusBannerProps {
  overallStatus: SystemStatus
}

export function OverallStatusBanner({ overallStatus }: OverallStatusBannerProps) {
  const variant = VARIANTS[overallStatus.status]

  return (
    <div
      className={[
        'mb-8 rounded-xl border px-5 py-4',
        variant.bg,
        variant.border,
        variant.text,
      ].join(' ')}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        {/* Icon */}
        <span className="flex-none text-xl font-bold leading-none" aria-hidden="true">
          {variant.icon}
        </span>

        <div className="min-w-0 flex-1">
          {/* Main label */}
          <p className="text-base font-semibold">{variant.label}</p>

          {/* Affected count — only shown when not operational */}
          {overallStatus.status !== 'operational' &&
            overallStatus.affectedMonitors > 0 && (
              <p className="mt-0.5 text-sm opacity-80">
                {overallStatus.affectedMonitors} of {overallStatus.totalMonitors}{' '}
                service{overallStatus.totalMonitors !== 1 ? 's' : ''} affected
              </p>
            )}
        </div>
      </div>
    </div>
  )
}
