'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Save } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import { upsertMonitorAlertSettings } from '@/lib/api'
import type { MonitorAlertSettings, UpsertAlertSettingsPayload } from '@/types/alert-settings'
import type { MonitorFrequency } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FREQUENCY_MINUTES: Record<MonitorFrequency, number> = {
  ONE_MIN:    1,
  FIVE_MIN:   5,
  THIRTY_MIN: 30,
}

// Simple useDebounce hook — 300ms default
function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

// ─── Number Stepper ───────────────────────────────────────────────────────────

interface StepperProps {
  value: number
  min: number
  max: number
  onChange: (n: number) => void
  disabled?: boolean
  id: string
}

function NumberStepper({ value, min, max, onChange, disabled = false, id }: StepperProps) {
  const dec = () => onChange(Math.max(min, value - 1))
  const inc = () => onChange(Math.min(max, value + 1))

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={dec}
        disabled={disabled || value <= min}
        aria-label="Decrease"
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-sm font-bold text-slate-300 transition-all duration-200 hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-40"
      >
        −
      </button>
      <input
        id={id}
        type="number"
        min={min}
        max={max}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const n = parseInt(e.target.value, 10)
          if (!isNaN(n)) onChange(Math.min(max, Math.max(min, n)))
        }}
        className="h-8 w-14 rounded-lg border border-white/[0.08] bg-white/[0.04] text-center font-mono text-sm font-semibold text-white focus:border-pulse-blue/40 focus:outline-none focus:ring-1 focus:ring-pulse-blue/30 disabled:opacity-50 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={inc}
        disabled={disabled || value >= max}
        aria-label="Increase"
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-sm font-bold text-slate-300 transition-all duration-200 hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-40"
      >
        +
      </button>
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  checked, onChange, label, id,
}: {
  checked: boolean; onChange: (v: boolean) => void; label: string; id: string
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex cursor-pointer items-center gap-2"
    >
      <div
        className={[
          'relative h-5 w-9 rounded-full border transition-all duration-200',
          checked
            ? 'border-pulse-green/40 bg-pulse-green/20'
            : 'border-white/[0.08] bg-white/[0.05]',
        ].join(' ')}
        aria-hidden="true"
      >
        <div
          className={[
            'absolute top-0.5 h-3.5 w-3.5 rounded-full transition-all duration-200',
            checked ? 'left-[18px] bg-pulse-green' : 'left-0.5 bg-slate-500',
          ].join(' ')}
        />
      </div>
    </button>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface AlertThresholdSectionHandle {
  save: () => Promise<void>
}

interface AlertThresholdSectionProps {
  settings: MonitorAlertSettings | null
  monitorFrequency: MonitorFrequency
  monitorId: string
  onDirtyChange: (dirty: boolean) => void
  onSaved: (updated: MonitorAlertSettings) => void
  /** Callback fired on every change so ChannelRoutingSection can show live escalation threshold. */
  onEscalationThresholdChange: (value: number) => void
  onToast: (message: string, type?: 'success' | 'error') => void
}

export const AlertThresholdSection = forwardRef<
  AlertThresholdSectionHandle,
  AlertThresholdSectionProps
>(function AlertThresholdSection(
  {
    settings, monitorFrequency, monitorId,
    onDirtyChange, onSaved, onEscalationThresholdChange, onToast,
  },
  ref,
) {
  const intervalMin = FREQUENCY_MINUTES[monitorFrequency]

  // ── State ────────────────────────────────────────────────────────────────
  const [threshold,          setThreshold]          = useState(settings?.alertThreshold     ?? 2)
  const [escalationThreshold, setEscalationThreshold] = useState(settings?.escalationThreshold ?? 5)
  const [alertOnRecovery,    setAlertOnRecovery]    = useState(settings?.alertOnRecovery    ?? true)
  const [isSaving,           setIsSaving]           = useState(false)

  // ── Dirty tracking ───────────────────────────────────────────────────────
  const initial = useRef({ threshold, escalationThreshold, alertOnRecovery })
  const isDirty =
    threshold          !== initial.current.threshold          ||
    escalationThreshold !== initial.current.escalationThreshold ||
    alertOnRecovery    !== initial.current.alertOnRecovery

  useEffect(() => { onDirtyChange(isDirty) }, [isDirty, onDirtyChange])

  // Notify parent of live escalation threshold changes
  useEffect(() => { onEscalationThresholdChange(escalationThreshold) }, [escalationThreshold, onEscalationThresholdChange])

  // ── Live preview (debounced) ─────────────────────────────────────────────
  const debouncedThreshold = useDebounce(threshold, 300)
  const estimatedMinutes   = debouncedThreshold * intervalMin

  // ── Validation ───────────────────────────────────────────────────────────
  const escalationError =
    escalationThreshold <= threshold
      ? 'Escalation threshold must be greater than alert threshold.'
      : null

  // ── Save ─────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (escalationError) {
      onToast(escalationError, 'error')
      return
    }
    setIsSaving(true)
    try {
      const payload: UpsertAlertSettingsPayload = {
        alertThreshold:       threshold,
        escalationThreshold,
        alertOnRecovery,
        quietHoursEnabled:    settings?.quietHoursEnabled    ?? false,
        quietHoursStart:      settings?.quietHoursStart      ?? undefined,
        quietHoursEnd:        settings?.quietHoursEnd        ?? undefined,
        quietHoursDays:       settings?.quietHoursDays       ?? [0, 1, 2, 3, 4, 5, 6],
      }
      const updated = await upsertMonitorAlertSettings(monitorId, payload)
      initial.current = { threshold, escalationThreshold, alertOnRecovery }
      onSaved(updated)
      onToast('Threshold settings saved')
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to save settings.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  useImperativeHandle(ref, () => ({ save: handleSave }))

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <GlassCard hoverEffect={false} glowColor="none" className="p-5 sm:p-6">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-base font-semibold text-white">Notification Threshold</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Control how sensitive this monitor is to failures.
        </p>
      </div>

      <div className="space-y-6">
        {/* Alert Threshold */}
        <div>
          <label htmlFor="alert-threshold" className="mb-2 block text-sm font-medium text-slate-300">
            Alert after consecutive failures
          </label>
          <NumberStepper
            id="alert-threshold"
            value={threshold}
            min={1}
            max={10}
            onChange={setThreshold}
          />
          <p className="mt-2 text-xs text-slate-500">
            Pulse will only alert you after this many consecutive failed checks in a row.
          </p>
          {/* Live preview */}
          <p className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-xs text-slate-400">
            With a {intervalMin}-minute check interval and threshold of{' '}
            <span className="font-semibold text-slate-200">{debouncedThreshold}</span>, you will be
            alerted after approximately{' '}
            <span className="font-semibold text-pulse-blue">
              {estimatedMinutes === 1 ? '1 minute' : `${estimatedMinutes} minutes`}
            </span>{' '}
            of downtime.
          </p>
        </div>

        {/* Escalation Threshold */}
        <div>
          <label htmlFor="escalation-threshold" className="mb-2 block text-sm font-medium text-slate-300">
            Escalate after consecutive failures
          </label>
          <NumberStepper
            id="escalation-threshold"
            value={escalationThreshold}
            min={2}
            max={20}
            onChange={setEscalationThreshold}
          />
          <p className="mt-2 text-xs text-slate-500">
            After this many failures, Pulse will also notify your escalation contacts.
          </p>
          {escalationError && (
            <p className="mt-2 text-xs font-medium text-pulse-red">{escalationError}</p>
          )}
        </div>

        {/* Recovery Alerts */}
        <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div className="min-w-0">
            <label htmlFor="alert-on-recovery" className="block text-sm font-medium text-slate-300">
              Notify when monitor recovers
            </label>
            <p className="mt-0.5 text-xs text-slate-500">
              Send an alert when the monitor comes back UP after being DOWN.
            </p>
          </div>
          <Toggle
            id="alert-on-recovery"
            checked={alertOnRecovery}
            onChange={setAlertOnRecovery}
            label={alertOnRecovery ? 'Disable recovery alerts' : 'Enable recovery alerts'}
          />
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Save size={13} />}
            isLoading={isSaving}
            disabled={!isDirty || !!escalationError}
            onClick={handleSave}
          >
            Save Threshold Settings
          </Button>
        </div>
      </div>
    </GlassCard>
  )
})
