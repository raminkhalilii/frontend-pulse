'use client'

import { useEffect, useRef, useState } from 'react'
import { Save } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { updateMonitor } from '@/lib/api'
import type { Monitor } from '@/types'

interface PerformanceAlertSectionProps {
  monitor: Monitor
  onSaved: (updated: Monitor) => void
  onToast: (message: string, type?: 'success' | 'error') => void
}

export function PerformanceAlertSection({ monitor, onSaved, onToast }: PerformanceAlertSectionProps) {
  const [apdexThresholdMs, setApdexThresholdMs] = useState(monitor.apdexThresholdMs)
  const [alertEnabled, setAlertEnabled] = useState(monitor.responseTimeAlertThresholdMs !== null)
  const [alertThresholdMs, setAlertThresholdMs] = useState(
    monitor.responseTimeAlertThresholdMs ?? 2000,
  )
  const [consecutiveBreaches, setConsecutiveBreaches] = useState(
    monitor.responseTimeAlertConsecutiveBreaches,
  )
  const [isSaving, setIsSaving] = useState(false)

  const initial = useRef({
    apdexThresholdMs: monitor.apdexThresholdMs,
    alertEnabled: monitor.responseTimeAlertThresholdMs !== null,
    alertThresholdMs: monitor.responseTimeAlertThresholdMs ?? 2000,
    consecutiveBreaches: monitor.responseTimeAlertConsecutiveBreaches,
  })

  const isDirty =
    apdexThresholdMs !== initial.current.apdexThresholdMs ||
    alertEnabled !== initial.current.alertEnabled ||
    (alertEnabled && alertThresholdMs !== initial.current.alertThresholdMs) ||
    (alertEnabled && consecutiveBreaches !== initial.current.consecutiveBreaches)

  // Re-sync if the parent refreshes the monitor from elsewhere
  useEffect(() => {
    setApdexThresholdMs(monitor.apdexThresholdMs)
    setAlertEnabled(monitor.responseTimeAlertThresholdMs !== null)
    setAlertThresholdMs(monitor.responseTimeAlertThresholdMs ?? 2000)
    setConsecutiveBreaches(monitor.responseTimeAlertConsecutiveBreaches)
    initial.current = {
      apdexThresholdMs: monitor.apdexThresholdMs,
      alertEnabled: monitor.responseTimeAlertThresholdMs !== null,
      alertThresholdMs: monitor.responseTimeAlertThresholdMs ?? 2000,
      consecutiveBreaches: monitor.responseTimeAlertConsecutiveBreaches,
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monitor.id])

  async function handleSave() {
    setIsSaving(true)
    try {
      const updated = await updateMonitor(monitor.id, {
        apdexThresholdMs,
        responseTimeAlertThresholdMs: alertEnabled ? alertThresholdMs : null,
        responseTimeAlertConsecutiveBreaches: consecutiveBreaches,
      })
      initial.current = { apdexThresholdMs, alertEnabled, alertThresholdMs, consecutiveBreaches }
      onSaved(updated)
      onToast('Performance settings saved')
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to save settings.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <GlassCard hoverEffect={false} glowColor="none" className="p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-white">Performance</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Apdex satisfaction threshold and slow-response alerting.
        </p>
      </div>

      <div className="space-y-6">
        {/* Apdex threshold */}
        <div>
          <label htmlFor="apdex-threshold" className="mb-2 block text-sm font-medium text-slate-300">
            Apdex &ldquo;satisfied&rdquo; threshold
          </label>
          <div className="flex items-center gap-2">
            <input
              id="apdex-threshold"
              type="number"
              min={1}
              value={apdexThresholdMs}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10)
                if (!isNaN(n) && n > 0) setApdexThresholdMs(n)
              }}
              className="h-9 w-28 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-right font-mono text-sm font-semibold text-white focus:border-pulse-blue/40 focus:outline-none focus:ring-1 focus:ring-pulse-blue/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <span className="text-sm text-slate-500">ms</span>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Requests at or under this respond &ldquo;satisfied&rdquo;; up to 4× tolerating; beyond
            that, frustrated.
          </p>
        </div>

        {/* Performance alert toggle */}
        <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div className="min-w-0">
            <label htmlFor="perf-alert-enabled" className="block text-sm font-medium text-slate-300">
              Alert on slow response time
            </label>
            <p className="mt-0.5 text-xs text-slate-500">
              Notify through your alert channels when response time crosses a threshold.
            </p>
          </div>
          <Toggle
            id="perf-alert-enabled"
            checked={alertEnabled}
            onChange={setAlertEnabled}
            label={alertEnabled ? 'Disable performance alerts' : 'Enable performance alerts'}
          />
        </div>

        {alertEnabled && (
          <>
            <div>
              <label
                htmlFor="perf-alert-threshold"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Alert threshold
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="perf-alert-threshold"
                  type="number"
                  min={1}
                  value={alertThresholdMs}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10)
                    if (!isNaN(n) && n > 0) setAlertThresholdMs(n)
                  }}
                  className="h-9 w-28 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 text-right font-mono text-sm font-semibold text-white focus:border-pulse-blue/40 focus:outline-none focus:ring-1 focus:ring-pulse-blue/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <span className="text-sm text-slate-500">ms</span>
              </div>
            </div>

            <div>
              <label
                htmlFor="perf-consecutive-breaches"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Consecutive slow checks required
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConsecutiveBreaches((n) => Math.max(1, n - 1))}
                  disabled={consecutiveBreaches <= 1}
                  aria-label="Decrease"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-sm font-bold text-slate-300 transition-all duration-200 hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-40"
                >
                  −
                </button>
                <input
                  id="perf-consecutive-breaches"
                  type="number"
                  min={1}
                  max={20}
                  value={consecutiveBreaches}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10)
                    if (!isNaN(n)) setConsecutiveBreaches(Math.min(20, Math.max(1, n)))
                  }}
                  className="h-8 w-14 rounded-lg border border-white/[0.08] bg-white/[0.04] text-center font-mono text-sm font-semibold text-white focus:border-pulse-blue/40 focus:outline-none focus:ring-1 focus:ring-pulse-blue/30 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setConsecutiveBreaches((n) => Math.min(20, n + 1))}
                  disabled={consecutiveBreaches >= 20}
                  aria-label="Increase"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-sm font-bold text-slate-300 transition-all duration-200 hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-40"
                >
                  +
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                Avoids alerting on a single slow blip — response time must breach the threshold
                this many checks in a row.
              </p>
            </div>
          </>
        )}

        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Save size={13} />}
            isLoading={isSaving}
            disabled={!isDirty}
            onClick={handleSave}
          >
            Save Performance Settings
          </Button>
        </div>
      </div>
    </GlassCard>
  )
}
