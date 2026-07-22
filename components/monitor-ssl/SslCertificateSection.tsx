'use client'

import { useEffect, useState } from 'react'
import { ShieldAlert, ShieldCheck } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import { getSslCertificate } from '@/lib/api/ssl'
import type { SslCertificate } from '@/types/ssl'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return 'Unknown'
  return new Date(iso).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** green > 30 days, orange 7–30 (inclusive), red < 7 */
function daysRemainingClasses(days: number | null): string {
  if (days === null) return 'text-slate-400'
  if (days > 30) return 'text-pulse-green'
  if (days >= 7) return 'text-orange-400'
  return 'text-pulse-red'
}

function daysRemainingBadgeClasses(days: number | null): string {
  if (days === null) return 'border-white/[0.08] bg-white/[0.04] text-slate-400'
  if (days > 30) return 'border-pulse-green/30 bg-pulse-green/10 text-pulse-green'
  if (days >= 7) return 'border-orange-500/30 bg-orange-500/10 text-orange-400'
  return 'border-pulse-red/30 bg-pulse-red/10 text-pulse-red'
}

// ── Component ─────────────────────────────────────────────────────────────────

interface SslCertificateSectionProps {
  monitorId: string
}

export function SslCertificateSection({ monitorId }: SslCertificateSectionProps) {
  const [cert, setCert] = useState<SslCertificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    getSslCertificate(monitorId)
      .then((data) => {
        if (!cancelled) setCert(data)
      })
      .catch((err) => {
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : 'Failed to load certificate data.')
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [monitorId])

  return (
    <GlassCard hoverEffect={false} glowColor="none" className="p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-white">SSL Certificate</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Checked once daily. Expiry warnings fire at 30, 14, 7, and 1 day(s) out.
        </p>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          {[96].map((h, i) => (
            <div
              key={i}
              className="rounded-xl border border-white/[0.05] bg-white/[0.02]"
              style={{ height: `${h}px` }}
            />
          ))}
        </div>
      ) : fetchError ? (
        <p className="text-sm text-pulse-red">{fetchError}</p>
      ) : !cert ? (
        <p className="py-6 text-center text-sm text-slate-500">
          Not checked yet — the first check runs within 24h of this monitor being created.
        </p>
      ) : !cert.isValid ? (
        <div className="flex items-start gap-3 rounded-xl border border-pulse-red/20 bg-pulse-red/[0.06] px-4 py-3.5">
          <ShieldAlert size={18} className="mt-0.5 flex-none text-pulse-red" aria-hidden="true" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-pulse-red">Invalid Certificate</p>
            <p className="mt-0.5 text-sm text-slate-300">{cert.lastError ?? 'Unknown error'}</p>
            <p className="mt-1.5 font-mono text-xs text-slate-600">
              Last checked {formatDate(cert.lastCheckedAt)}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3">
            <ShieldCheck size={16} className="flex-none text-pulse-green" aria-hidden="true" />
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${daysRemainingBadgeClasses(cert.daysRemaining)}`}
            >
              {cert.daysRemaining === null
                ? 'Unknown expiry'
                : `${cert.daysRemaining} day${cert.daysRemaining === 1 ? '' : 's'} remaining`}
            </span>
          </div>

          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-slate-600">Issued to</dt>
              <dd className="mt-0.5 truncate text-sm text-slate-200">{cert.subject ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-slate-600">Issuer</dt>
              <dd className="mt-0.5 truncate text-sm text-slate-200">{cert.issuer ?? 'Unknown'}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-slate-600">Issued</dt>
              <dd className="mt-0.5 font-mono text-sm text-slate-200">{formatDate(cert.validFrom)}</dd>
            </div>
            <div>
              <dt className="text-[10px] uppercase tracking-wider text-slate-600">Expires</dt>
              <dd className={`mt-0.5 font-mono text-sm font-semibold ${daysRemainingClasses(cert.daysRemaining)}`}>
                {formatDate(cert.validTo)}
              </dd>
            </div>
          </dl>

          <p className="font-mono text-xs text-slate-600">Last checked {formatDate(cert.lastCheckedAt)}</p>
        </div>
      )}
    </GlassCard>
  )
}
