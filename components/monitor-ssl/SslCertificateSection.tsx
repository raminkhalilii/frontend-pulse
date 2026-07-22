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

// Monitor creation/URL-change now enqueues an immediate SSL check, so a null
// cert is normally transient (worker finishes within seconds) rather than the
// old "wait for the daily cron" case. Poll briefly until it resolves.
const POLL_INTERVAL_MS = 3000
const MAX_POLL_ATTEMPTS = 20 // ~60s

interface SslCertificateSectionProps {
  monitorId: string
}

export function SslCertificateSection({ monitorId }: SslCertificateSectionProps) {
  const [cert, setCert] = useState<SslCertificate | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [pollTimedOut, setPollTimedOut] = useState(false)

  useEffect(() => {
    let cancelled = false
    let attempts = 0
    let timeoutId: ReturnType<typeof setTimeout> | undefined

    async function load(isInitial: boolean) {
      if (isInitial) setLoading(true)
      try {
        const data = await getSslCertificate(monitorId)
        if (cancelled) return
        setCert(data)
        setFetchError('')

        if (!data) {
          attempts += 1
          if (attempts < MAX_POLL_ATTEMPTS) {
            timeoutId = setTimeout(() => {
              void load(false)
            }, POLL_INTERVAL_MS)
          } else {
            setPollTimedOut(true)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setFetchError(err instanceof Error ? err.message : 'Failed to load certificate data.')
        }
      } finally {
        if (!cancelled && isInitial) setLoading(false)
      }
    }

    void load(true)

    return () => {
      cancelled = true
      if (timeoutId) clearTimeout(timeoutId)
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
        pollTimedOut ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Still not checked — this can take a little longer than usual. It will appear here
            automatically once ready.
          </p>
        ) : (
          <div className="flex items-center justify-center gap-2.5 py-6 text-sm text-slate-500">
            <span
              className="h-3.5 w-3.5 flex-none animate-spin rounded-full border border-slate-600 border-t-slate-300"
              aria-hidden="true"
            />
            Checking certificate…
          </div>
        )
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
