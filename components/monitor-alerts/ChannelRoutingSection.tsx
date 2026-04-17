'use client'

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Info, Mail, Link2, Save } from 'lucide-react'
import Link from 'next/link'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import { SlackIcon } from '@/components/alerts/SlackSetupGuide'
import { DiscordIcon } from '@/components/alerts/DiscordSetupGuide'
import { setMonitorAlertChannels } from '@/lib/api'
import type { AlertChannel } from '@/types'

// ─── Channel Icon ─────────────────────────────────────────────────────────────

function ChannelIcon({ type }: { type: AlertChannel['type'] }) {
  const cls = 'flex h-7 w-7 flex-none items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03]'
  if (type === 'EMAIL')   return <div className={cls}><Mail   size={13} className="text-slate-400" aria-hidden="true" /></div>
  if (type === 'WEBHOOK') return <div className={cls}><Link2  size={13} className="text-slate-400" aria-hidden="true" /></div>
  if (type === 'SLACK')   return <div className={cls}><SlackIcon   size={13} /></div>
  if (type === 'DISCORD') return <div className={cls}><DiscordIcon size={13} /></div>
  return null
}

// ─── Checkbox item ────────────────────────────────────────────────────────────

function ChannelCheckbox({
  channel,
  checked,
  onChange,
}: {
  channel: AlertChannel
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  const displayName =
    channel.label ||
    (channel.value.length > 44 ? channel.value.slice(0, 44) + '…' : channel.value)

  const typeLabel: Record<AlertChannel['type'], string> = {
    EMAIL: 'Email', WEBHOOK: 'Webhook', SLACK: 'Slack', DISCORD: 'Discord',
  }

  return (
    <label
      className={[
        'flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-3 transition-all duration-200',
        checked
          ? 'border-pulse-blue/30 bg-pulse-blue/[0.06]'
          : 'border-white/[0.06] bg-white/[0.02] hover:border-white/[0.10] hover:bg-white/[0.04]',
        !channel.enabled ? 'opacity-50' : '',
      ].join(' ')}
    >
      {/* Custom checkbox */}
      <div
        className={[
          'flex h-4 w-4 flex-none items-center justify-center rounded border transition-all duration-200',
          checked
            ? 'border-pulse-blue bg-pulse-blue'
            : 'border-white/[0.20] bg-white/[0.04]',
        ].join(' ')}
        aria-hidden="true"
      >
        {checked && (
          <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l3 3 5-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>

      <input
        type="checkbox"
        checked={checked}
        disabled={!channel.enabled}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
        aria-label={`${typeLabel[channel.type]}: ${displayName}`}
      />

      <ChannelIcon type={channel.type} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-slate-200">{displayName}</p>
        <p className="truncate text-[11px] text-slate-500">
          {typeLabel[channel.type]}{!channel.enabled && ' · Disabled'}
        </p>
      </div>
    </label>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export interface ChannelRoutingSectionHandle {
  save: () => Promise<void>
}

interface ChannelRoutingSectionProps {
  allChannels: AlertChannel[]
  initialChannelIds: string[]
  initialEscalationIds: string[]
  monitorId: string
  /** Live escalation threshold from AlertThresholdSection for the callout. */
  liveEscalationThreshold: number
  onDirtyChange: (dirty: boolean) => void
  onSaved: () => void
  onToast: (message: string, type?: 'success' | 'error') => void
}

export const ChannelRoutingSection = forwardRef<
  ChannelRoutingSectionHandle,
  ChannelRoutingSectionProps
>(function ChannelRoutingSection(
  {
    allChannels, initialChannelIds, initialEscalationIds,
    monitorId, liveEscalationThreshold,
    onDirtyChange, onSaved, onToast,
  },
  ref,
) {
  const [selectedIds,    setSelectedIds]    = useState<string[]>(initialChannelIds)
  const [escalationIds,  setEscalationIds]  = useState<string[]>(initialEscalationIds)
  const [isSaving,       setIsSaving]       = useState(false)

  const initial = useRef({ selectedIds: initialChannelIds, escalationIds: initialEscalationIds })

  const isDirty =
    JSON.stringify([...selectedIds].sort())    !== JSON.stringify([...initial.current.selectedIds].sort()) ||
    JSON.stringify([...escalationIds].sort()) !== JSON.stringify([...initial.current.escalationIds].sort())

  useEffect(() => { onDirtyChange(isDirty) }, [isDirty, onDirtyChange])

  function toggleChannel(id: string, checked: boolean) {
    setSelectedIds((prev) => checked ? [...prev, id] : prev.filter((x) => x !== id))
  }

  function toggleEscalation(id: string, checked: boolean) {
    setEscalationIds((prev) => checked ? [...prev, id] : prev.filter((x) => x !== id))
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      await setMonitorAlertChannels(monitorId, {
        channelIds:           selectedIds,
        escalationChannelIds: escalationIds,
      })
      initial.current = { selectedIds: [...selectedIds], escalationIds: [...escalationIds] }
      onSaved()
      onToast('Channel settings saved')
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to save channel settings.', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  useImperativeHandle(ref, () => ({ save: handleSave }))

  const hasNoChannels = allChannels.length === 0

  return (
    <GlassCard hoverEffect={false} glowColor="none" className="p-5 sm:p-6">
      {/* Header */}
      <div className="mb-5">
        <h2 className="text-base font-semibold text-white">Alert Channels</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Choose which channels receive alerts for this monitor. If none are selected, all your
          channels will be notified.
        </p>
      </div>

      {hasNoChannels ? (
        /* Empty state */
        <div className="rounded-xl border border-dashed border-white/[0.08] bg-white/[0.01] px-5 py-8 text-center">
          <p className="mb-1 text-sm font-medium text-slate-400">No channels configured</p>
          <p className="text-xs text-slate-500">
            Add channels in{' '}
            <Link
              href="/dashboard/alerts"
              className="text-pulse-blue underline underline-offset-2 transition-colors hover:text-blue-300"
            >
              Alert Settings
            </Link>{' '}
            first, then come back to route them here.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Normal channels */}
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              Notify these channels
            </p>
            <div className="space-y-2">
              {allChannels.map((ch) => (
                <ChannelCheckbox
                  key={ch.id}
                  channel={ch}
                  checked={selectedIds.includes(ch.id)}
                  onChange={(v) => toggleChannel(ch.id, v)}
                />
              ))}
            </div>
          </div>

          {/* Escalation info callout */}
          <div className="flex items-start gap-2.5 rounded-xl border border-pulse-blue/20 bg-pulse-blue/[0.06] px-4 py-3">
            <Info size={14} className="mt-0.5 flex-none text-pulse-blue" aria-hidden="true" />
            <p className="text-xs text-slate-400">
              Escalation channels fire after{' '}
              <span className="font-semibold text-slate-200">{liveEscalationThreshold}</span>{' '}
              consecutive failures (your escalation threshold). Use these for on-call contacts or
              urgent Slack channels.
            </p>
          </div>

          {/* Escalation channels */}
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              Escalate to these channels
            </p>
            <p className="mb-3 text-xs text-slate-600">
              These channels are only notified after the escalation threshold is reached. A channel
              can appear in both lists.
            </p>
            <div className="space-y-2">
              {allChannels.map((ch) => (
                <ChannelCheckbox
                  key={ch.id}
                  channel={ch}
                  checked={escalationIds.includes(ch.id)}
                  onChange={(v) => toggleEscalation(ch.id, v)}
                />
              ))}
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Save size={13} />}
              isLoading={isSaving}
              disabled={!isDirty}
              onClick={handleSave}
            >
              Save Channel Settings
            </Button>
          </div>
        </div>
      )}
    </GlassCard>
  )
})
