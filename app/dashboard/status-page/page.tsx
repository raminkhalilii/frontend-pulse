'use client'

import { useEffect, useState, useCallback } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import { useToast, ToastContainer } from '@/components/ui/Toast'
import { GeneralSettingsSection } from '@/components/status-page/dashboard/GeneralSettingsSection'
import { MonitorVisibilitySection } from '@/components/status-page/dashboard/MonitorVisibilitySection'
import { StatusPagePreviewSection } from '@/components/status-page/dashboard/StatusPagePreviewSection'
import { SubscribersSection } from '@/components/status-page/dashboard/SubscribersSection'
import { getMyStatusPage, previewStatusPage } from '@/lib/api/status-page'
import { getMonitors } from '@/lib/api'
import type { Monitor } from '@/types'
import type { StatusPageSettings, StatusPageData } from '@/types/status-page'

// ── Types ─────────────────────────────────────────────────────────────────────

interface LinkedMonitor {
  id: string
  displayName: string | null
  showResponseTime: boolean
  position: number
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-6">
      {[280, 200, 220].map((h, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5 sm:p-6"
          style={{ height: h }}
        />
      ))}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function StatusPageSettingsPage() {
  const [settings, setSettings] = useState<StatusPageSettings | null>(null)
  const [allMonitors, setAllMonitors] = useState<Monitor[]>([])
  const [linkedMonitors, setLinkedMonitors] = useState<LinkedMonitor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [previewRefreshKey, setPreviewRefreshKey] = useState(0)

  const { toasts, toast, dismiss } = useToast()

  // ── Load data ─────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [sp, monitors] = await Promise.all([getMyStatusPage(), getMonitors()])
      setSettings(sp)
      setAllMonitors(monitors)

      // Extract linked monitors from the preview endpoint (has position + displayName)
      const preview = await previewStatusPage()
      if (preview) {
        setLinkedMonitors(extractLinkedMonitors(preview))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load status page data.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // ── Callbacks ─────────────────────────────────────────────────────────────

  function handleSettingsSaved(updated: StatusPageSettings) {
    setSettings(updated)
    setPreviewRefreshKey((k) => k + 1)
  }

  async function handleMonitorsSaved() {
    // Re-fetch linked monitors after a save so the section stays in sync
    try {
      const preview = await previewStatusPage()
      if (preview) setLinkedMonitors(extractLinkedMonitors(preview))
    } catch {
      // non-critical
    }
    setPreviewRefreshKey((k) => k + 1)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        {/* Page header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl font-bold text-white">Status Page</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage your public-facing status page at status.pulsee.website/{settings?.slug ?? '…'}
          </p>
        </div>

        {loading ? (
          <PageSkeleton />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="mb-4 text-sm text-pulse-red">{error}</p>
            <Button variant="outline" size="sm" onClick={loadData}>
              Retry
            </Button>
          </div>
        ) : settings ? (
          <div className="space-y-6">
            {/* Section 1 — General Settings */}
            <GeneralSettingsSection
              settings={settings}
              onSaved={handleSettingsSaved}
              onToast={toast}
            />

            {/* Section 2 — Monitor Visibility */}
            <MonitorVisibilitySection
              allMonitors={allMonitors}
              settings={settings}
              linkedMonitors={linkedMonitors}
              onSaved={handleMonitorsSaved}
              onToast={toast}
            />

            {/* Section 3 — Preview */}
            <StatusPagePreviewSection
              settings={settings}
              refreshKey={previewRefreshKey}
            />

            {/* Section 4 — Subscribers */}
            <SubscribersSection />
          </div>
        ) : null}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </DashboardLayout>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extracts linked monitor metadata from a StatusPageData preview response.
 * The preview endpoint returns monitors ordered by position, so we
 * reconstruct the position from the array index.
 */
function extractLinkedMonitors(preview: StatusPageData): LinkedMonitor[] {
  return preview.monitors.map((m, i) => ({
    id: m.id,
    // The public payload uses displayName (already resolved from displayName ?? monitor.name)
    // We store it as-is; it may differ from Monitor.name if overridden.
    displayName: null, // TODO: backend should return the raw override, not the resolved name
    showResponseTime: m.showResponseTime,
    position: i,
  }))
}
