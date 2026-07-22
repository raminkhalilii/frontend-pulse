'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import { useToast, ToastContainer } from '@/components/ui/Toast'
import { MaintenanceWindowsSection } from '@/components/monitor-maintenance/MaintenanceWindowsSection'
import { getMonitors } from '@/lib/api'
import type { Monitor } from '@/types'

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-4">
      {[220].map((h, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.02]"
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function MonitorMaintenancePage() {
  const params = useParams()
  const router = useRouter()
  const monitorId = typeof params.id === 'string' ? params.id : (params.id as string[])[0]

  const [monitor, setMonitor] = useState<Monitor | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')

  const { toasts, toast, dismiss } = useToast()

  const fetchMonitor = useCallback(async () => {
    setLoading(true)
    setFetchError('')
    try {
      const monitors = await getMonitors()
      setMonitor(monitors.find((m) => m.id === monitorId) ?? null)
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load monitor.')
    } finally {
      setLoading(false)
    }
  }, [monitorId])

  useEffect(() => { fetchMonitor() }, [fetchMonitor])

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">

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
          <span className="truncate max-w-[12rem] text-slate-400">
            {monitor?.name ?? monitorId}
          </span>
          <ChevronRight size={13} className="flex-none text-slate-700" aria-hidden="true" />
          <span className="font-medium text-white">Maintenance</span>
        </nav>

        {/* ── Page header ── */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl font-bold text-white">Maintenance Windows</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Schedule planned downtime so checks and alerts pause automatically.
          </p>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <PageSkeleton />
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="mb-4 text-sm text-pulse-red">{fetchError}</p>
            <Button variant="outline" size="sm" onClick={fetchMonitor}>Retry</Button>
          </div>
        ) : (
          <MaintenanceWindowsSection monitorId={monitorId} onToast={toast} />
        )}

      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </DashboardLayout>
  )
}
