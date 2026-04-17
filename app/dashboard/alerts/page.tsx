'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BellOff, Plus } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import { AlertChannelRow } from '@/components/alerts/AlertChannelRow'
import { AddAlertChannelForm } from '@/components/alerts/AddAlertChannelForm'
import { EditChannelModal } from '@/components/alerts/EditChannelModal'
import { SlackIcon } from '@/components/alerts/SlackSetupGuide'
import { DiscordIcon } from '@/components/alerts/DiscordSetupGuide'
import { useToast, ToastContainer } from '@/components/ui/Toast'
import {
  getAlertChannels,
  updateAlertChannel,
  deleteAlertChannel,
  testAlertChannel,
  testWebhookChannel,
  testSlackChannel,
  testDiscordChannel,
} from '@/lib/api'
import type {
  AlertChannel,
  AlertChannelType,
  PlatformTestResult,
  WebhookTestResult,
} from '@/types'

// ─── Skeleton rows ────────────────────────────────────────────────────────────

function ChannelSkeleton() {
  return (
    <div className="animate-pulse space-y-3 py-2">
      {[72, 56, 64].map((w, i) => (
        <div key={i} className="flex items-center gap-3 border-t border-white/[0.06] py-4 first:border-t-0">
          <div className="h-8 w-8 flex-none rounded-lg bg-white/[0.05]" />
          <div className="flex-1 space-y-1.5">
            <div className={`h-3.5 w-${w} rounded bg-white/[0.06]`} />
            <div className="h-2.5 w-24 rounded bg-white/[0.04]" />
          </div>
          <div className="flex gap-2">
            <div className="h-5 w-9 rounded-full bg-white/[0.05]" />
            <div className="h-7 w-7 rounded-lg bg-white/[0.04]" />
            <div className="h-7 w-7 rounded-lg bg-white/[0.04]" />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-center gap-2 pb-1 pt-3 first:pt-0">
      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-slate-600">
        {label}
      </span>
      <span className="rounded-full bg-white/[0.05] px-1.5 py-px text-[10px] font-medium text-slate-600">
        {count}
      </span>
      <div className="h-px flex-1 bg-white/[0.04]" />
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyChannels({ onAdd }: { onAdd: (type: AlertChannelType) => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
        <BellOff size={22} className="text-slate-600" aria-hidden="true" />
      </div>
      <p className="mb-1 font-semibold text-white">No alert channels configured</p>
      <p className="mb-6 max-w-xs text-sm text-slate-500">
        Add a channel to start receiving alerts when your monitors go down.
      </p>
      <div className="grid grid-cols-2 gap-2">
        {([
          { type: 'EMAIL'   as AlertChannelType, label: '+ Add Email',   icon: null },
          { type: 'WEBHOOK' as AlertChannelType, label: '+ Add Webhook', icon: null },
          { type: 'SLACK'   as AlertChannelType, label: '+ Add Slack',   icon: <SlackIcon size={13} /> },
          { type: 'DISCORD' as AlertChannelType, label: '+ Add Discord', icon: <DiscordIcon size={13} /> },
        ] as const).map(({ type, label, icon }) => (
          <button
            key={type}
            type="button"
            onClick={() => onAdd(type)}
            className="flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-medium text-slate-400 transition-all duration-200 hover:bg-white/[0.07] hover:text-slate-200"
          >
            {icon}
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Grouped channel list ─────────────────────────────────────────────────────

const SECTION_ORDER: AlertChannelType[] = ['EMAIL', 'WEBHOOK', 'SLACK', 'DISCORD']
const SECTION_LABELS: Record<AlertChannelType, string> = {
  EMAIL: 'Email', WEBHOOK: 'Webhook', SLACK: 'Slack', DISCORD: 'Discord',
}

interface GroupedListProps {
  channels: AlertChannel[]
  togglingId: string | null
  testingId: string | null
  confirmDeleteId: string | null
  webhookTestResults: Record<string, WebhookTestResult | null>
  platformTestResults: Record<string, PlatformTestResult | null>
  onToggle: (channel: AlertChannel) => void
  onEdit: (channel: AlertChannel) => void
  onTest: (channel: AlertChannel) => void
  onDeleteRequest: (id: string) => void
  onDeleteConfirm: (id: string) => void
  onDeleteCancel: () => void
}

function GroupedChannelList({
  channels, togglingId, testingId, confirmDeleteId,
  webhookTestResults, platformTestResults,
  onToggle, onEdit, onTest, onDeleteRequest, onDeleteConfirm, onDeleteCancel,
}: GroupedListProps) {
  const grouped = SECTION_ORDER
    .map((type) => ({ type, items: channels.filter((c) => c.type === type) }))
    .filter(({ items }) => items.length > 0)

  const showHeaders = grouped.length > 1

  return (
    <AnimatePresence initial={false}>
      {grouped.map(({ type, items }) => (
        <div key={type}>
          {showHeaders && <SectionLabel label={SECTION_LABELS[type]} count={items.length} />}
          {items.map((channel) => (
            <AlertChannelRow
              key={channel.id}
              channel={channel}
              isToggling={togglingId === channel.id}
              isTesting={testingId === channel.id}
              webhookTestResult={channel.type === 'WEBHOOK' ? (webhookTestResults[channel.id] ?? null) : null}
              platformTestResult={
                channel.type === 'SLACK' || channel.type === 'DISCORD'
                  ? (platformTestResults[channel.id] ?? null)
                  : null
              }
              isConfirmingDelete={confirmDeleteId === channel.id}
              onToggle={onToggle}
              onEdit={onEdit}
              onTest={onTest}
              onDeleteRequest={onDeleteRequest}
              onDeleteConfirm={onDeleteConfirm}
              onDeleteCancel={onDeleteCancel}
            />
          ))}
        </div>
      ))}
    </AnimatePresence>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const [channels,        setChannels]        = useState<AlertChannel[]>([])
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState('')
  const [editingChannel,  setEditingChannel]  = useState<AlertChannel | null>(null)
  const [togglingId,      setTogglingId]      = useState<string | null>(null)
  const [testingId,       setTestingId]       = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // Pre-selected type from empty-state quick-add buttons
  const [preSelectType, setPreSelectType] = useState<AlertChannelType | undefined>()

  // Webhook test results — keyed by channel id, null means dismissed
  const [webhookTestResults, setWebhookTestResults] = useState<
    Record<string, WebhookTestResult | null>
  >({})

  // Platform (Slack / Discord) test results — same pattern
  const [platformTestResults, setPlatformTestResults] = useState<
    Record<string, PlatformTestResult | null>
  >({})

  // Tracks pending auto-dismiss timers so we can cancel on re-test
  const webhookTimers  = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const platformTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const { toasts, toast, dismiss } = useToast()

  // ── Cleanup timers on unmount ────────────────────────────────────────────
  useEffect(() => {
    const wt = webhookTimers.current
    const pt = platformTimers.current
    return () => {
      Object.values(wt).forEach(clearTimeout)
      Object.values(pt).forEach(clearTimeout)
    }
  }, [])

  // ── Load channels ────────────────────────────────────────────────────────
  const fetchChannels = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getAlertChannels()
      setChannels(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load channels.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchChannels() }, [fetchChannels])

  // ── Toggle enabled/disabled ──────────────────────────────────────────────
  async function handleToggle(channel: AlertChannel) {
    const next = !channel.enabled
    setChannels((prev) => prev.map((c) => (c.id === channel.id ? { ...c, enabled: next } : c)))
    setTogglingId(channel.id)
    try {
      const updated = await updateAlertChannel(channel.id, { enabled: next })
      setChannels((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    } catch (err) {
      setChannels((prev) =>
        prev.map((c) => (c.id === channel.id ? { ...c, enabled: channel.enabled } : c)),
      )
      toast(err instanceof Error ? err.message : 'Failed to update channel.', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  // ── Test channel ─────────────────────────────────────────────────────────
  async function handleTest(channel: AlertChannel) {
    setTestingId(channel.id)
    try {
      if (channel.type === 'WEBHOOK') {
        const result = await testWebhookChannel(channel.id)
        setWebhookTestResults((prev) => ({ ...prev, [channel.id]: result }))
        if (webhookTimers.current[channel.id]) clearTimeout(webhookTimers.current[channel.id])
        webhookTimers.current[channel.id] = setTimeout(() => {
          setWebhookTestResults((prev) => ({ ...prev, [channel.id]: null }))
        }, 8_000)

      } else if (channel.type === 'SLACK') {
        const result = await testSlackChannel(channel.id)
        setPlatformTestResults((prev) => ({ ...prev, [channel.id]: result }))
        if (platformTimers.current[channel.id]) clearTimeout(platformTimers.current[channel.id])
        platformTimers.current[channel.id] = setTimeout(() => {
          setPlatformTestResults((prev) => ({ ...prev, [channel.id]: null }))
        }, 8_000)

      } else if (channel.type === 'DISCORD') {
        const result = await testDiscordChannel(channel.id)
        setPlatformTestResults((prev) => ({ ...prev, [channel.id]: result }))
        if (platformTimers.current[channel.id]) clearTimeout(platformTimers.current[channel.id])
        platformTimers.current[channel.id] = setTimeout(() => {
          setPlatformTestResults((prev) => ({ ...prev, [channel.id]: null }))
        }, 8_000)

      } else {
        // EMAIL — fire-and-forget, show toast
        await testAlertChannel(channel.id)
        toast(`Test alert sent to ${channel.value}`)
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Test failed — please try again', 'error')
    } finally {
      setTestingId(null)
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────
  async function handleDeleteConfirm(id: string) {
    setConfirmDeleteId(null)
    try {
      await deleteAlertChannel(id)
      setChannels((prev) => prev.filter((c) => c.id !== id))
      setWebhookTestResults((prev) => { const next = { ...prev }; delete next[id]; return next })
      setPlatformTestResults((prev) => { const next = { ...prev }; delete next[id]; return next })
      toast('Channel removed')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete channel.', 'error')
    }
  }

  // ── Edit saved ───────────────────────────────────────────────────────────
  function handleUpdated(updated: AlertChannel) {
    setChannels((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    toast('Channel updated')
  }

  // ── Channel added ────────────────────────────────────────────────────────
  function handleCreated(channel: AlertChannel) {
    setChannels((prev) => [channel, ...prev])
    setPreSelectType(undefined)
  }

  // ── Scroll to add form (optionally pre-selecting a type) ─────────────────
  function scrollToAddForm(type?: AlertChannelType) {
    if (type) setPreSelectType(type)
    document.getElementById('add-channel-section')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">

        {/* ── Page header ── */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl font-bold text-white">Alerts</h1>
          <p className="mt-0.5 text-sm text-slate-500">
            Manage where Pulse notifies you when a monitor changes state.
          </p>
        </div>

        <div className="space-y-6">

          {/* ── Section A: Notification Channels ── */}
          <GlassCard hoverEffect={false} glowColor="none" className="p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-white">Notification Channels</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Where Pulse sends alerts when a monitor goes down or recovers.
              </p>
            </div>

            {loading ? (
              <ChannelSkeleton />
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="mb-3 text-sm text-pulse-red">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchChannels}>Retry</Button>
              </div>
            ) : channels.length === 0 ? (
              <EmptyChannels onAdd={scrollToAddForm} />
            ) : (
              <GroupedChannelList
                channels={channels}
                togglingId={togglingId}
                testingId={testingId}
                confirmDeleteId={confirmDeleteId}
                webhookTestResults={webhookTestResults}
                platformTestResults={platformTestResults}
                onToggle={handleToggle}
                onEdit={setEditingChannel}
                onTest={handleTest}
                onDeleteRequest={(id) => setConfirmDeleteId(id)}
                onDeleteConfirm={handleDeleteConfirm}
                onDeleteCancel={() => setConfirmDeleteId(null)}
              />
            )}
          </GlassCard>

          {/* ── Section B: Add Notification Channel ── */}
          <GlassCard
            id="add-channel-section"
            hoverEffect={false}
            glowColor="none"
            className="p-5 sm:p-6"
          >
            <div className="mb-5">
              <h2 className="text-base font-semibold text-white">Add Notification Channel</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Receive DOWN and RECOVERY alerts by email, webhook, Slack, or Discord.
              </p>
            </div>

            <AddAlertChannelForm
              onCreated={handleCreated}
              onToast={toast}
              externalType={preSelectType}
            />
          </GlassCard>

        </div>
      </div>

      {/* ── Edit modal ── */}
      <EditChannelModal
        open={editingChannel !== null}
        channel={editingChannel}
        onClose={() => setEditingChannel(null)}
        onUpdated={handleUpdated}
      />

      {/* ── Toast notifications ── */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </DashboardLayout>
  )
}
