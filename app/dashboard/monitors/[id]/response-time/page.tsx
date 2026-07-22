'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import { useToast, ToastContainer } from '@/components/ui/Toast'
import { ResponseTimeChart } from '@/components/monitor-response-time/ResponseTimeChart'
import { ResponseTimeStatTiles } from '@/components/monitor-response-time/ResponseTimeStatTiles'
import { PerformanceAlertSection } from '@/components/monitor-response-time/PerformanceAlertSection'
import { getMonitors } from '@/lib/api'
import { getResponseTime } from '@/lib/api/response-time'
import type { Monitor } from '@/types'
import type { ResponseTimeRange, ResponseTimeResult } from '@/types/response-time'

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-4">
      {[280, 160].map((h, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.02]"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  )
}

// ─── Range toggle ─────────────────────────────────────────────────────────────

const RANGES: { value: ResponseTimeRange; label: string }[] = [
  { value: '24h', label: '24h' },
  { value: '7d', label: '7d' },
  { value: '30d', label: '30d' },
]

function RangeToggle({
  value,
  onChange,
}: {
  value: ResponseTimeRange
  onChange: (r: ResponseTimeRange) => void
}) {
  return (
    <div className="inline-flex rounded-lg border border-white/[0.08] bg-white/[0.02] p-0.5">
      {RANGES.map((r) => (
        <button
          key={r.value}
          type="button"
          onClick={() => onChange(r.value)}
          className={[
            'cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium transition-all duration-150',
            value === r.value
              ? 'bg-pulse-blue/20 text-pulse-blue'
              : 'text-slate-500 hover:text-slate-300',
          ].join(' ')}
        >
          {r.label}
        </button>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MonitorResponseTimePage() {
  const params = useParams()
  const router = useRouter()
  const monitorId = typeof params.id === 'string' ? params.id : (params.id as string[])[0]

  const [monitor, setMonitor] = useState<Monitor | null>(null)
  const [range, setRange] = useState<ResponseTimeRange>('24h')
  const [data, setData] = useState<ResponseTimeResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [rangeLoading, setRangeLoading] = useState(false)
  const [fetchError, setFetchError] = useState('')

  const { toasts, toast, dismiss } = useToast()

  const fetchMonitor = useCallback(async () => {
    const monitors = await getMonitors()
    setMonitor(monitors.find((m) => m.id === monitorId) ?? null)
  }, [monitorId])

  const fetchAll = useCallback(
    async (isInitial: boolean) => {
      if (isInitial) setLoading(true)
      else setRangeLoading(true)
      setFetchError('')
      try {
        const [, rt] = await Promise.all([isInitial ? fetchMonitor() : Promise.resolve(), getResponseTime(monitorId, range)])
        setData(rt)
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : 'Failed to load response-time data.')
      } finally {
        setLoading(false)
        setRangeLoading(false)
      }
    },
    [monitorId, range, fetchMonitor],
  )

  useEffect(() => {
    fetchAll(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monitorId])

  useEffect(() => {
    if (!loading) fetchAll(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range])

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {/* ── Breadcrumb ── */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
          <button
            type="button"
            onClick={() => router.push('/dashboard')}
            className="flex cursor-pointer items-center gap-1.5 text-slate-500 transition-colors hover:text-slate-300"
          >
            <ArrowLeft size={13} className="flex-none" aria-hidden="true" />
            Monitors
          </button>
          <ChevronRight size={13} className="flex-none text-slate-700" aria-hidden="true" />
          <span className="truncate max-w-[12rem] text-slate-400">{monitor?.name ?? monitorId}</span>
          <ChevronRight size={13} className="flex-none text-slate-700" aria-hidden="true" />
          <span className="font-medium text-white">Response Time</span>
        </nav>

        {/* ── Page header ── */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
          <div>
            <h1 className="text-xl font-bold text-white">Response Time</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Historical latency, percentiles, and Apdex score.
            </p>
          </div>
          {!loading && !fetchError && <RangeToggle value={range} onChange={setRange} />}
        </div>

        {/* ── Content ── */}
        {loading ? (
          <PageSkeleton />
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="mb-4 text-sm text-pulse-red">{fetchError}</p>
            <Button variant="outline" size="sm" onClick={() => fetchAll(true)}>
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div
              className={`rounded-2xl border border-white/[0.08] bg-gradient-to-br from-white/[0.05] to-white/[0.02] p-5 backdrop-blur-xl transition-opacity sm:p-6 ${
                rangeLoading ? 'opacity-50' : ''
              }`}
            >
              {data && <ResponseTimeChart series={data.series} range={range} />}
            </div>

            {data && <ResponseTimeStatTiles stats={data.stats} />}

            {monitor && (
              <PerformanceAlertSection
                monitor={monitor}
                onSaved={setMonitor}
                onToast={toast}
              />
            )}
          </div>
        )}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </DashboardLayout>
  )
}
