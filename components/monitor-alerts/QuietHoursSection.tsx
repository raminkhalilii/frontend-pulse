'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Moon, BellOff, Bell, Save } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import { upsertMonitorAlertSettings } from '@/lib/api'
import {
  formatQuietHoursSummary,
  getNextAlertTime,
  isCrossMidnight,
  isInQuietHours,
} from '@/lib/quiet-hours'
import type { MonitorAlertSettings, UpsertAlertSettingsPayload } from '@/types/alert-settings'

// ─── Day toggle buttons ───────────────────────────────────────────────────────

const DAY_LABELS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function DaysSelector({
  activeDays,
  onChange,
  disabled,
}: {
  activeDays: number[]
  onChange: (days: number[]) => void
  disabled: boolean
}) {
  function toggle(day: number) {
    if (activeDays.includes(day)) {
      onChange(activeDays.filter((d) => d !== day))
    } else {
      onChange([...activeDays, day].sort((a, b) => a - b))
    }
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {DAY_LABELS.map((label, i) => {
        const active = activeDays.includes(i)
        return (
          <button
            key={i}
            type="button"
            onClick={() => toggle(i)}
            disabled={disabled}
            aria-pressed={active}
            aria-label={label}
            className={[
              'flex h-8 min-w-[2rem] cursor-pointer items-center justify-center rounded-lg border px-2',
              'text-xs font-semibold transition-all duration-200',
              'disabled:pointer-events-none disabled:opacity-40',
              active
                ? 'border-pulse-blue/40 bg-pulse-blue/20 text-pulse-blue'
                : 'border-white/[0.08] bg-white/[0.03] text-slate-500 hover:border-white/[0.14] hover:text-slate-300',
            ].join(' ')}
          >
            {label}
          </button>
        )
      })}
    </div>
  )
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({
  checked, onChange, label,
}: {
  checked: boolean; onChange: (v: boolean) => void; label: string
}) {
  return (
    <button
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

// ─── Current status indicator ─────────────────────────────────────────────────

function QuietHoursStatus({ settings }: { settings: Partial<MonitorAlertSettings> }) {
  if (!settings.quietHoursEnabled) return null

  const active = isInQuietHours(settings as MonitorAlertSettings)

  if (active) {
    const resumeTime = settings.quietHoursEnd ?? '—'
    return (
      <div className="flex items-center gap-2 rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-3.5 py-2.5">
        <BellOff size={14} className="flex-none text-amber-400" aria-hidden="true" />
        <p className="text-xs font-medium text-amber-300">
          Quiet hours active — alerts resume at {resumeTime} UTC
        </p>
      </div>
    )
  }

  const nextWindow = settings.quietHoursStart ?? '—'
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3.5 py-2.5">
      <Bell size={14} className="flex-none text-slate-500" aria-hidden="true" />
      <p className="text-xs text-slate-500">
        Quiet hours inactive — next window: {nextWindow} UTC today
      </p>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface QuietHoursSectionHandle {
  save: () => Promise<void>
}

interface QuietHoursSectionProps {
  settings: MonitorAlertSettings | null
  monitorId: string
  onDirtyChange: (dirty: boolean) => void
  onSaved: (updated: MonitorAlertSettings) => void
  onToast: (message: string, type?: 'success' | 'error') => void
}

export const QuietHoursSection = forwardRef<QuietHoursSectionHandle, QuietHoursSectionProps>(
  function QuietHoursSection({ settings, monitorId, onDirtyChange, onSaved, onToast }, ref) {
    const [enabled,    setEnabled]    = useState(settings?.quietHoursEnabled     ?? false)
    const [startTime,  setStartTime]  = useState(settings?.quietHoursStart       ?? '22:00')
    const [endTime,    setEndTime]    = useState(settings?.quietHoursEnd         ?? '08:00')
    const [activeDays, setActiveDays] = useState<number[]>(settings?.quietHoursDays ?? [0, 1, 2, 3, 4, 5, 6])
    const [isSaving,   setIsSaving]   = useState(false)

    const initial = useRef({ enabled, startTime, endTime, activeDays })

    const isDirty =
      enabled    !== initial.current.enabled    ||
      startTime  !== initial.current.startTime  ||
      endTime    !== initial.current.endTime    ||
      JSON.stringify(activeDays) !== JSON.stringify(initial.current.activeDays)

    useEffect(() => { onDirtyChange(isDirty) }, [isDirty, onDirtyChange])

    // ── Validation ─────────────────────────────────────────────────────────
    const noDaysError = enabled && activeDays.length === 0
      ? 'Select at least one day.' : null

    // ── Summary sentence ───────────────────────────────────────────────────
    const summary = startTime && endTime
      ? formatQuietHoursSummary(startTime, endTime, activeDays)
      : null

    const crossesMidnight = startTime && endTime ? isCrossMidnight(startTime, endTime) : false

    // ── Save ───────────────────────────────────────────────────────────────
    async function handleSave() {
      if (noDaysError) { onToast(noDaysError, 'error'); return }
      setIsSaving(true)
      try {
        const payload: UpsertAlertSettingsPayload = {
          alertThreshold:      settings?.alertThreshold      ?? 2,
          escalationThreshold: settings?.escalationThreshold ?? 5,
          alertOnRecovery:     settings?.alertOnRecovery     ?? true,
          quietHoursEnabled:   enabled,
          quietHoursStart:     enabled ? startTime  : undefined,
          quietHoursEnd:       enabled ? endTime    : undefined,
          quietHoursDays:      activeDays,
        }
        const updated = await upsertMonitorAlertSettings(monitorId, payload)
        initial.current = { enabled, startTime, endTime, activeDays }
        onSaved(updated)
        onToast('Quiet hours saved')
      } catch (err) {
        onToast(err instanceof Error ? err.message : 'Failed to save quiet hours.', 'error')
      } finally {
        setIsSaving(false)
      }
    }

    useImperativeHandle(ref, () => ({ save: handleSave }))

    const inputCls = [
      'h-9 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3',
      'text-sm font-mono text-white',
      'focus:border-pulse-blue/40 focus:outline-none focus:ring-1 focus:ring-pulse-blue/30',
      'disabled:cursor-not-allowed disabled:opacity-40',
    ].join(' ')

    return (
      <GlassCard hoverEffect={false} glowColor="none" className="p-5 sm:p-6">
        {/* Header */}
        <div className="mb-5">
          <h2 className="text-base font-semibold text-white">Quiet Hours</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Suppress alerts during specific times. Alerts resume automatically when quiet hours end.
          </p>
        </div>

        <div className="space-y-5">
          {/* Enable toggle */}
          <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
            <div>
              <p className="text-sm font-medium text-slate-300">Enable quiet hours</p>
            </div>
            <Toggle
              checked={enabled}
              onChange={setEnabled}
              label={enabled ? 'Disable quiet hours' : 'Enable quiet hours'}
            />
          </div>

          {/* Fields — visually disabled when off */}
          <div className={['space-y-5 transition-opacity duration-200', !enabled ? 'opacity-40 pointer-events-none' : ''].join(' ')}>

            {/* Time range */}
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Time Range
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    Silence from
                  </label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={!enabled}
                    className={inputCls}
                    aria-label="Quiet hours start time (UTC)"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-400">
                    Until
                  </label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={!enabled}
                    className={inputCls}
                    aria-label="Quiet hours end time (UTC)"
                  />
                </div>
              </div>

              {/* Summary sentence */}
              {summary && enabled && (
                <p className="mt-2 text-xs text-slate-400">
                  Alerts will be suppressed {summary}.
                </p>
              )}

              {/* Overnight notice */}
              {crossesMidnight && enabled && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <Moon size={12} className="flex-none text-slate-500" aria-hidden="true" />
                  <span>
                    This range crosses midnight (silenced from {startTime} tonight to {endTime} tomorrow).
                  </span>
                </div>
              )}
            </div>

            {/* Days selector */}
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                Active on
              </label>
              <DaysSelector
                activeDays={activeDays}
                onChange={setActiveDays}
                disabled={!enabled}
              />
              {noDaysError && (
                <p className="mt-2 text-xs font-medium text-pulse-red">{noDaysError}</p>
              )}
            </div>
          </div>

          {/* Status indicator */}
          <QuietHoursStatus
            settings={{ quietHoursEnabled: enabled, quietHoursStart: startTime, quietHoursEnd: endTime, quietHoursDays: activeDays }}
          />

          {/* Save */}
          <div className="flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Save size={13} />}
              isLoading={isSaving}
              disabled={!isDirty || !!noDaysError}
              onClick={handleSave}
            >
              Save Quiet Hours
            </Button>
          </div>
        </div>
      </GlassCard>
    )
  },
)
