'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ChevronRight, Layers } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Button from '@/components/ui/Button'
import { useToast, ToastContainer } from '@/components/ui/Toast'
import { AlertThresholdSection, type AlertThresholdSectionHandle } from '@/components/monitor-alerts/AlertThresholdSection'
import { ChannelRoutingSection, type ChannelRoutingSectionHandle } from '@/components/monitor-alerts/ChannelRoutingSection'
import { QuietHoursSection, type QuietHoursSectionHandle } from '@/components/monitor-alerts/QuietHoursSection'
import { SuppressedAlertsLog } from '@/components/monitor-alerts/SuppressedAlertsLog'
import { useUnsavedChangesGuard } from '@/components/monitor-alerts/UnsavedChangesGuard'
import { getMonitorAlertSettings, getAlertChannels, getMonitors } from '@/lib/api'
import type { Monitor, AlertChannel } from '@/types'
import type { AlertSettingsResponse, MonitorAlertSettings } from '@/types/alert-settings'

// ─── Loading skeleton ─────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="space-y-4">
      {[120, 200, 160, 80].map((h, i) => (
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

export default function MonitorAlertsPage() {
  const params    = useParams()
  const router    = useRouter()
  const monitorId = typeof params.id === 'string' ? params.id : (params.id as string[])[0]

  // ── Data state ──────────────────────────────────────────────────────────
  const [monitor,       setMonitor]       = useState<Monitor | null>(null)
  const [alertSettings, setAlertSettings] = useState<AlertSettingsResponse | null>(null)
  const [allChannels,   setAllChannels]   = useState<AlertChannel[]>([])
  const [loading,       setLoading]       = useState(true)
  const [fetchError,    setFetchError]    = useState('')

  // ── Per-section dirty state ──────────────────────────────────────────────
  const [thresholdDirty,  setThresholdDirty]  = useState(false)
  const [channelsDirty,   setChannelsDirty]   = useState(false)
  const [quietHoursDirty, setQuietHoursDirty] = useState(false)
  const hasUnsaved = thresholdDirty || channelsDirty || quietHoursDirty

  // ── Save All loading ─────────────────────────────────────────────────────
  const [isSavingAll, setIsSavingAll] = useState(false)

  // ── Live escalation threshold (from threshold section → channel section) ─
  const [liveEscalationThreshold, setLiveEscalationThreshold] = useState(5)

  // ── Section refs for Save All ────────────────────────────────────────────
  const thresholdRef  = useRef<AlertThresholdSectionHandle>(null)
  const channelsRef   = useRef<ChannelRoutingSectionHandle>(null)
  const quietHoursRef = useRef<QuietHoursSectionHandle>(null)

  // ── Toast ────────────────────────────────────────────────────────────────
  const { toasts, toast, dismiss } = useToast()

  // ── Unsaved changes guard ────────────────────────────────────────────────
  const { guardNavigation, GuardDialog } = useUnsavedChangesGuard(hasUnsaved)

  // ── Fetch ────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    setFetchError('')
    try {
      const [monitors, settings, channels] = await Promise.all([
        getMonitors(),
        getMonitorAlertSettings(monitorId),
        getAlertChannels(),
      ])
      const found = monitors.find((m) => m.id === monitorId) ?? null
      setMonitor(found)
      setAlertSettings(settings)
      setAllChannels(channels)
      // Seed live escalation threshold from loaded settings
      if (settings.settings?.escalationThreshold) {
        setLiveEscalationThreshold(settings.settings.escalationThreshold)
      }
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Failed to load alert settings.')
    } finally {
      setLoading(false)
    }
  }, [monitorId])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ── Handlers passed to sections ──────────────────────────────────────────
  function handleThresholdSaved(updated: MonitorAlertSettings) {
    setAlertSettings((prev) => prev ? { ...prev, settings: updated } : prev)
    setThresholdDirty(false)
  }

  function handleChannelsSaved() {
    setChannelsDirty(false)
  }

  function handleQuietHoursSaved(updated: MonitorAlertSettings) {
    setAlertSettings((prev) => prev ? { ...prev, settings: updated } : prev)
    setQuietHoursDirty(false)
  }

  // ── Save All ─────────────────────────────────────────────────────────────
  async function handleSaveAll() {
    setIsSavingAll(true)
    const jobs = [
      thresholdDirty  && thresholdRef.current?.save(),
      channelsDirty   && channelsRef.current?.save(),
      quietHoursDirty && quietHoursRef.current?.save(),
    ].filter(Boolean) as Promise<void>[]

    await Promise.allSettled(jobs)
    setIsSavingAll(false)
  }

  // ── Render ───────────────────────────────────────────────────────────────
  const frequency = monitor?.frequency ?? 'ONE_MIN'

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">

        {/* ── Breadcrumb ── */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
          <button
            type="button"
            onClick={() => guardNavigation(() => router.push('/dashboard'))}
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
          <span className="font-medium text-white">Alert Settings</span>
        </nav>

        {/* ── Page header ── */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl font-bold text-white">Alert Settings</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Per-monitor threshold overrides, channel routing, and quiet hours.
          </p>
        </div>

        {/* ── Content ── */}
        {loading ? (
          <PageSkeleton />
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="mb-4 text-sm text-pulse-red">{fetchError}</p>
            <Button variant="outline" size="sm" onClick={fetchAll}>Retry</Button>
          </div>
        ) : (
          <div className="space-y-4">

            {/* Section A — Threshold */}
            <AlertThresholdSection
              ref={thresholdRef}
              settings={alertSettings?.settings ?? null}
              monitorFrequency={frequency}
              monitorId={monitorId}
              onDirtyChange={setThresholdDirty}
              onSaved={handleThresholdSaved}
              onEscalationThresholdChange={setLiveEscalationThreshold}
              onToast={toast}
            />

            {/* Section B — Channel Routing */}
            <ChannelRoutingSection
              ref={channelsRef}
              allChannels={allChannels}
              initialChannelIds={(alertSettings?.channels ?? []).map((c) => c.id)}
              initialEscalationIds={(alertSettings?.escalationChannels ?? []).map((c) => c.id)}
              monitorId={monitorId}
              liveEscalationThreshold={liveEscalationThreshold}
              onDirtyChange={setChannelsDirty}
              onSaved={handleChannelsSaved}
              onToast={toast}
            />

            {/* Section C — Quiet Hours */}
            <QuietHoursSection
              ref={quietHoursRef}
              settings={alertSettings?.settings ?? null}
              monitorId={monitorId}
              onDirtyChange={setQuietHoursDirty}
              onSaved={handleQuietHoursSaved}
              onToast={toast}
            />

            {/* Section D — Suppressed Alerts Log */}
            <SuppressedAlertsLog monitorId={monitorId} />

          </div>
        )}

        {/* ── Save All — appears only when sections have unsaved changes ── */}
        <AnimatePresence>
          {hasUnsaved && !loading && !fetchError && (
            <motion.div
              key="save-all"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="sticky bottom-4 mt-4 flex justify-end md:static md:mt-6"
            >
              <Button
                variant="primary"
                size="md"
                leftIcon={<Layers size={15} />}
                isLoading={isSavingAll}
                onClick={handleSaveAll}
                className="shadow-[0_0_32px_rgba(16,185,129,0.25)]"
              >
                Save All Changes
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* ── Unsaved changes dialog ── */}
      {GuardDialog}

      {/* ── Toasts ── */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </DashboardLayout>
  )
}
