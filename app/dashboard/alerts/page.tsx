'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Plus } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import { AlertChannelRow } from '@/components/alerts/AlertChannelRow'
import { AddAlertChannelForm } from '@/components/alerts/AddAlertChannelForm'
import { EditChannelModal } from '@/components/alerts/EditChannelModal'
import { useToast, ToastContainer } from '@/components/ui/Toast'
import {
  getAlertChannels,
  updateAlertChannel,
  deleteAlertChannel,
  testAlertChannel,
  testWebhookChannel,
} from '@/lib/api'
import type { AlertChannel, WebhookTestResult } from '@/types'

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

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyChannels({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
        <Bell size={22} className="text-slate-600" aria-hidden="true" />
      </div>
      <p className="mb-1 font-semibold text-white">No notification channels yet</p>
      <p className="mb-5 max-w-xs text-sm text-slate-500">
        Add an email address or webhook URL to start receiving alerts when
        your monitors go down.
      </p>
      <Button
        variant="primary"
        size="sm"
        leftIcon={<Plus size={13} />}
        onClick={onAdd}
      >
        Add Channel
      </Button>
    </div>
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

  // Webhook test results — keyed by channel id, null means dismissed
  const [webhookTestResults, setWebhookTestResults] = useState<
    Record<string, WebhookTestResult | null>
  >({})

  // Tracks pending auto-dismiss timers so we can cancel them on re-test
  const webhookTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const { toasts, toast, dismiss } = useToast()

  // ── Cleanup timers on unmount ────────────────────────────────────────────
  useEffect(() => {
    const timers = webhookTimers.current
    return () => { Object.values(timers).forEach(clearTimeout) }
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
    // Optimistic update
    setChannels((prev) =>
      prev.map((c) => (c.id === channel.id ? { ...c, enabled: next } : c)),
    )
    setTogglingId(channel.id)
    try {
      const updated = await updateAlertChannel(channel.id, { enabled: next })
      setChannels((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    } catch (err) {
      // Revert optimistic change
      setChannels((prev) =>
        prev.map((c) => (c.id === channel.id ? { ...c, enabled: channel.enabled } : c)),
      )
      toast(err instanceof Error ? err.message : 'Failed to update channel.', 'error')
    } finally {
      setTogglingId(null)
    }
  }

  // ── Test channel — dispatches to email or webhook based on type ──────────
  async function handleTest(channel: AlertChannel) {
    setTestingId(channel.id)
    try {
      if (channel.type === 'WEBHOOK') {
        // Webhook test returns a structured result — show inline badge
        const result = await testWebhookChannel(channel.id)
        setWebhookTestResults((prev) => ({ ...prev, [channel.id]: result }))

        // Cancel any previous auto-dismiss timer for this channel
        if (webhookTimers.current[channel.id]) {
          clearTimeout(webhookTimers.current[channel.id])
        }
        // Auto-dismiss the result badge after 8 seconds
        webhookTimers.current[channel.id] = setTimeout(() => {
          setWebhookTestResults((prev) => ({ ...prev, [channel.id]: null }))
        }, 8_000)
      } else {
        // Email test — fire-and-forget, show toast
        await testAlertChannel(channel.id)
        toast(`Test alert sent to ${channel.value}`)
      }
    } catch (err) {
      toast(
        err instanceof Error ? err.message : 'Test failed — please try again',
        'error',
      )
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
      // Clean up any pending test result for the deleted channel
      setWebhookTestResults((prev) => { const next = { ...prev }; delete next[id]; return next })
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
  }

  // ── Scroll to add form ───────────────────────────────────────────────────
  function scrollToAddForm() {
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
              <h2 className="text-base font-semibold text-white">
                Notification Channels
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Where Pulse sends alerts when a monitor goes down or recovers.
              </p>
            </div>

            {loading ? (
              <ChannelSkeleton />
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="mb-3 text-sm text-pulse-red">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchChannels}>
                  Retry
                </Button>
              </div>
            ) : channels.length === 0 ? (
              <EmptyChannels onAdd={scrollToAddForm} />
            ) : (
              <AnimatePresence initial={false}>
                {channels.map((channel) => (
                  <AlertChannelRow
                    key={channel.id}
                    channel={channel}
                    isToggling={togglingId === channel.id}
                    isTesting={testingId === channel.id}
                    webhookTestResult={
                      channel.type === 'WEBHOOK'
                        ? (webhookTestResults[channel.id] ?? null)
                        : null
                    }
                    isConfirmingDelete={confirmDeleteId === channel.id}
                    onToggle={handleToggle}
                    onEdit={setEditingChannel}
                    onTest={handleTest}
                    onDeleteRequest={(id) => setConfirmDeleteId(id)}
                    onDeleteConfirm={handleDeleteConfirm}
                    onDeleteCancel={() => setConfirmDeleteId(null)}
                  />
                ))}
              </AnimatePresence>
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
              <h2 className="text-base font-semibold text-white">
                Add Notification Channel
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Receive DOWN and RECOVERY alerts by email or via webhook.
              </p>
            </div>

            <AddAlertChannelForm
              onCreated={handleCreated}
              onToast={toast}
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
