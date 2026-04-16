'use client'

import { useEffect, useState, useCallback, FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Mail, Pencil, Trash2, Send, Plus } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import { FormField } from '@/components/auth/AuthShell'
import { EditChannelModal } from '@/components/alerts/EditChannelModal'
import { useToast, ToastContainer } from '@/components/ui/Toast'
import {
  getAlertChannels,
  createAlertChannel,
  updateAlertChannel,
  deleteAlertChannel,
  testAlertChannel,
} from '@/lib/api'
import type { AlertChannel } from '@/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isValidEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
}

// ─── Inline Toggle ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  disabled = false,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={[
        'flex cursor-pointer items-center gap-2 transition-opacity',
        disabled ? 'pointer-events-none opacity-50' : '',
      ].join(' ')}
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

// ─── Channel Row ──────────────────────────────────────────────────────────────

interface ChannelRowProps {
  channel: AlertChannel
  isToggling: boolean
  isTesting: boolean
  isConfirmingDelete: boolean
  onToggle: (channel: AlertChannel) => void
  onEdit: (channel: AlertChannel) => void
  onTest: (channel: AlertChannel) => void
  onDeleteRequest: (id: string) => void
  onDeleteConfirm: (id: string) => void
  onDeleteCancel: () => void
}

function ChannelRow({
  channel,
  isToggling,
  isTesting,
  isConfirmingDelete,
  onToggle,
  onEdit,
  onTest,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: ChannelRowProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="flex items-center gap-3 border-t border-white/[0.06] py-4 first:border-t-0"
    >
      {/* Type icon */}
      <div className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03]">
        <Mail size={14} className="text-slate-400" aria-hidden="true" />
      </div>

      {/* Address + label */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-mono text-sm font-medium text-white">
          {channel.value}
        </p>
        {channel.label && (
          <p className="truncate text-xs text-slate-500">{channel.label}</p>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-none items-center gap-1">
        {/* Enabled toggle */}
        <Toggle
          checked={channel.enabled}
          onChange={() => onToggle(channel)}
          disabled={isToggling}
          label={channel.enabled ? 'Disable channel' : 'Enable channel'}
        />

        {/* Test alert */}
        <button
          type="button"
          onClick={() => onTest(channel)}
          disabled={isTesting}
          aria-label={`Send test alert to ${channel.value}`}
          title="Send test alert"
          className="ml-1 cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-300 disabled:pointer-events-none disabled:opacity-40"
        >
          {isTesting ? (
            <span className="block h-3.5 w-3.5 animate-spin rounded-full border border-slate-600 border-t-slate-300" aria-hidden="true" />
          ) : (
            <Send size={14} aria-hidden="true" />
          )}
        </button>

        {/* Edit */}
        <button
          type="button"
          onClick={() => onEdit(channel)}
          aria-label={`Edit channel ${channel.value}`}
          className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-300"
        >
          <Pencil size={14} aria-hidden="true" />
        </button>

        {/* Delete / inline confirm */}
        {isConfirmingDelete ? (
          <div className="flex items-center gap-1">
            <span className="text-xs text-slate-400">Delete?</span>
            <button
              type="button"
              onClick={() => onDeleteConfirm(channel.id)}
              aria-label="Confirm delete"
              className="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-pulse-red transition-colors hover:bg-pulse-red/10"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={onDeleteCancel}
              aria-label="Cancel delete"
              className="cursor-pointer rounded-lg px-2 py-1 text-xs font-medium text-slate-400 transition-colors hover:text-slate-200"
            >
              No
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => onDeleteRequest(channel.id)}
            aria-label={`Delete channel ${channel.value}`}
            className="cursor-pointer rounded-lg p-1.5 text-slate-500 transition-colors hover:bg-pulse-red/[0.08] hover:text-pulse-red"
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        )}
      </div>
    </motion.div>
  )
}

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
        Add an email address to start receiving alerts when your monitors go down.
      </p>
      <Button
        variant="primary"
        size="sm"
        leftIcon={<Plus size={13} />}
        onClick={onAdd}
      >
        Add Email Channel
      </Button>
    </div>
  )
}

// ─── Add Channel Form ─────────────────────────────────────────────────────────

interface AddChannelFormProps {
  onCreated: (channel: AlertChannel) => void
  onToast: (message: string, type?: 'success' | 'error') => void
}

function AddChannelForm({ onCreated, onToast }: AddChannelFormProps) {
  const [email,      setEmail]      = useState('')
  const [label,      setLabel]      = useState('')
  const [loading,    setLoading]    = useState(false)
  const [emailError, setEmailError] = useState('')
  const [formError,  setFormError]  = useState('')

  function validateEmailField(value: string) {
    if (!value.trim()) return 'Email address is required'
    if (!isValidEmail(value.trim())) return 'Enter a valid email address'
    return ''
  }

  function handleEmailBlur() {
    setEmailError(validateEmailField(email))
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const err = validateEmailField(email)
    if (err) { setEmailError(err); return }

    setFormError('')
    setLoading(true)
    try {
      const created = await createAlertChannel({
        type: 'EMAIL',
        value: email.trim(),
        label: label.trim() || undefined,
      })
      onCreated(created)
      onToast('Email channel added')
      setEmail('')
      setLabel('')
      setEmailError('')
    } catch (err) {
      // Show plan-limit and other meaningful errors inline, not just as a toast
      setFormError(err instanceof Error ? err.message : 'Failed to add channel.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <FormField
        label="Email Address"
        id="add-channel-email"
        type="email"
        autoComplete="email"
        required
        value={email}
        onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError('') }}
        onBlur={handleEmailBlur}
        placeholder="you@example.com"
        error={emailError}
      />

      <div className="space-y-1.5">
        <label
          htmlFor="add-channel-label"
          className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500"
        >
          Label
        </label>
        <input
          id="add-channel-label"
          type="text"
          autoComplete="off"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="e.g. Work email, On-call phone"
          className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-4 py-2.5 text-sm text-white placeholder-slate-700 transition-all duration-200 focus:border-pulse-blue/50 focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)] focus:outline-none"
        />
        <p className="text-[11px] text-slate-600">
          Optional. Helps you identify this channel.
        </p>
      </div>

      {/* Inline form-level error (plan limits, server errors) */}
      <AnimatePresence>
        {formError && (
          <motion.p
            key="form-error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{    opacity: 0        }}
            className="rounded-lg border border-pulse-red/20 bg-pulse-red/[0.06] px-4 py-2.5 text-sm text-pulse-red"
          >
            {formError}
          </motion.p>
        )}
      </AnimatePresence>

      <Button
        type="submit"
        variant="primary"
        size="md"
        isLoading={loading}
        leftIcon={!loading ? <Plus size={15} /> : undefined}
      >
        Add Channel
      </Button>
    </form>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AlertsPage() {
  const [channels,       setChannels]       = useState<AlertChannel[]>([])
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState('')
  const [editingChannel, setEditingChannel] = useState<AlertChannel | null>(null)
  const [togglingId,     setTogglingId]     = useState<string | null>(null)
  const [testingId,      setTestingId]      = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  const { toasts, toast, dismiss } = useToast()

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

  // ── Toggle ────────────────────────────────────────────────────────────────
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

  // ── Test alert ────────────────────────────────────────────────────────────
  async function handleTest(channel: AlertChannel) {
    setTestingId(channel.id)
    try {
      await testAlertChannel(channel.id)
      toast(`Test alert sent to ${channel.value}`)
    } catch {
      toast('Failed to send test alert — please try again', 'error')
    } finally {
      setTestingId(null)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDeleteConfirm(id: string) {
    setConfirmDeleteId(null)
    try {
      await deleteAlertChannel(id)
      setChannels((prev) => prev.filter((c) => c.id !== id))
      toast('Channel removed')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to delete channel.', 'error')
    }
  }

  // ── Edit saved ────────────────────────────────────────────────────────────
  function handleUpdated(updated: AlertChannel) {
    setChannels((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
    toast('Channel updated')
  }

  // ── Channel added ─────────────────────────────────────────────────────────
  function handleCreated(channel: AlertChannel) {
    setChannels((prev) => [channel, ...prev])
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
              <EmptyChannels onAdd={() => document.getElementById('add-channel-email')?.focus()} />
            ) : (
              <AnimatePresence initial={false}>
                {channels.map((channel) => (
                  <ChannelRow
                    key={channel.id}
                    channel={channel}
                    isToggling={togglingId === channel.id}
                    isTesting={testingId === channel.id}
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

          {/* ── Section B: Add New Channel ── */}
          <GlassCard hoverEffect={false} glowColor="none" className="p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-white">
                Add Email Channel
              </h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Pulse will send DOWN and RECOVERY emails to this address.
              </p>
            </div>

            <AddChannelForm
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
