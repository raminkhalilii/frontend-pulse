'use client'

import { useState, useEffect, FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, EyeOff, Plus, RotateCcw, Trash2 } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import { FormField } from '@/components/auth/AuthShell'
import { updateAlertChannel } from '@/lib/api'
import type { AlertChannel, UpdateAlertChannelPayload } from '@/types'

// ─── Shared toggle ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex cursor-pointer items-center gap-3"
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
      <span className="text-sm text-slate-300">{label}</span>
    </button>
  )
}

// ─── Webhook secret section ───────────────────────────────────────────────────
//
// Three possible states:
//   'unchanged' — leave whatever is on the server as-is
//   'remove'    — send secret: null  (clears the secret)
//   'set-new'   — send secret: <newSecret>

type SecretMode = 'unchanged' | 'remove' | 'set-new'

interface WebhookSecretFieldProps {
  hasSecret: boolean
  secretMode: SecretMode
  newSecret: string
  showNewSecret: boolean
  onSecretModeChange: (m: SecretMode) => void
  onNewSecretChange: (v: string) => void
  onToggleShowSecret: () => void
}

function WebhookSecretField({
  hasSecret,
  secretMode,
  newSecret,
  showNewSecret,
  onSecretModeChange,
  onNewSecretChange,
  onToggleShowSecret,
}: WebhookSecretFieldProps) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        Signing Secret
      </p>

      {/* ── Case 1: secret exists, no pending change ── */}
      {hasSecret && secretMode === 'unchanged' && (
        <div className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2.5">
          <span className="flex-1 font-mono text-sm text-slate-400 tracking-widest">
            ••••••••
          </span>
          <button
            type="button"
            onClick={() => onSecretModeChange('set-new')}
            title="Replace with a new secret"
            className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-slate-400 transition-colors hover:bg-white/[0.05] hover:text-slate-200"
          >
            <RotateCcw size={11} aria-hidden="true" />
            Regenerate
          </button>
          <button
            type="button"
            onClick={() => onSecretModeChange('remove')}
            title="Remove signing secret"
            className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium text-pulse-red/70 transition-colors hover:bg-pulse-red/[0.08] hover:text-pulse-red"
          >
            <Trash2 size={11} aria-hidden="true" />
            Remove
          </button>
        </div>
      )}

      {/* ── Case 2: no secret, no pending change ── */}
      {!hasSecret && secretMode === 'unchanged' && (
        <button
          type="button"
          onClick={() => onSecretModeChange('set-new')}
          className="flex cursor-pointer items-center gap-1.5 text-[12px] text-slate-500 transition-colors hover:text-slate-300"
        >
          <Plus size={12} aria-hidden="true" />
          Add signing secret
        </button>
      )}

      {/* ── Case 3: pending removal ── */}
      {secretMode === 'remove' && (
        <div className="flex items-center gap-3 rounded-lg border border-pulse-red/20 bg-pulse-red/[0.05] px-4 py-2.5">
          <span className="flex-1 text-sm text-pulse-red">
            Secret will be removed on save
          </span>
          <button
            type="button"
            onClick={() => onSecretModeChange('unchanged')}
            className="cursor-pointer text-[11px] text-slate-400 transition-colors hover:text-slate-200"
          >
            Cancel
          </button>
        </div>
      )}

      {/* ── Case 4: entering a new secret ── */}
      {secretMode === 'set-new' && (
        <div className="space-y-1.5">
          <div className="relative">
            <input
              id="edit-webhook-secret"
              type={showNewSecret ? 'text' : 'password'}
              autoComplete="new-password"
              value={newSecret}
              onChange={(e) => onNewSecretChange(e.target.value)}
              placeholder={hasSecret ? 'Enter new secret to replace existing' : 'Enter signing secret'}
              className="w-full rounded-lg border border-white/[0.08] bg-white/5 px-4 py-2.5 pr-10 text-sm text-white placeholder-slate-700 transition-all duration-200 focus:border-pulse-blue/50 focus:bg-white/[0.07] focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)] focus:outline-none"
            />
            <button
              type="button"
              onClick={onToggleShowSecret}
              aria-label={showNewSecret ? 'Hide secret' : 'Show secret'}
              className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-slate-500 transition-colors hover:text-slate-300"
            >
              {showNewSecret
                ? <EyeOff size={14} aria-hidden="true" />
                : <Eye size={14} aria-hidden="true" />
              }
            </button>
          </div>
          <button
            type="button"
            onClick={() => { onSecretModeChange('unchanged'); onNewSecretChange('') }}
            className="cursor-pointer text-[11px] text-slate-500 transition-colors hover:text-slate-300"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface EditChannelModalProps {
  open: boolean
  channel: AlertChannel | null
  onClose: () => void
  onUpdated: (channel: AlertChannel) => void
}

export function EditChannelModal({
  open,
  channel,
  onClose,
  onUpdated,
}: EditChannelModalProps) {
  const [label,         setLabel]         = useState('')
  const [enabled,       setEnabled]       = useState(true)
  const [loading,       setLoading]       = useState(false)
  const [error,         setError]         = useState('')

  // Webhook-only secret state
  const [secretMode,    setSecretMode]    = useState<SecretMode>('unchanged')
  const [newSecret,     setNewSecret]     = useState('')
  const [showNewSecret, setShowNewSecret] = useState(false)

  // Pre-fill whenever the target channel changes
  useEffect(() => {
    if (channel) {
      setLabel(channel.label ?? '')
      setEnabled(channel.enabled)
      setError('')
      // Reset webhook-specific state
      setSecretMode('unchanged')
      setNewSecret('')
      setShowNewSecret(false)
    }
  }, [channel, open])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!channel) return

    setError('')
    setLoading(true)
    try {
      const payload: UpdateAlertChannelPayload = {}

      if (label.trim() !== (channel.label ?? '')) payload.label = label.trim()
      if (enabled !== channel.enabled)             payload.enabled = enabled

      // Webhook secret changes
      if (channel.type === 'WEBHOOK') {
        if (secretMode === 'remove') {
          payload.secret = null
        } else if (secretMode === 'set-new' && newSecret.trim()) {
          payload.secret = newSecret.trim()
        }
        // secretMode === 'unchanged' → don't include secret in payload
      }

      // Nothing changed — skip the network call
      if (Object.keys(payload).length === 0) {
        onClose()
        return
      }

      const updated = await updateAlertChannel(channel.id, payload)
      onUpdated(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update channel.')
    } finally {
      setLoading(false)
    }
  }

  function handleClose() {
    if (loading) return
    onClose()
  }

  const isWebhook = channel?.type === 'WEBHOOK'

  return (
    <AnimatePresence>
      {open && channel && (
        <>
          {/* Backdrop */}
          <motion.div
            key="edit-channel-backdrop"
            className="fixed inset-0 z-40 bg-background/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Dialog */}
          <motion.div
            key="edit-channel-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-channel-title"
            className="fixed inset-x-0 bottom-0 z-50 flex justify-center sm:inset-0 sm:items-center sm:px-4"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{    opacity: 0, y: 40 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            <GlassCard
              hoverEffect={false}
              glowColor="none"
              className="w-full max-h-[90vh] overflow-y-auto rounded-b-none rounded-t-2xl p-5 sm:max-h-none sm:max-w-md sm:rounded-2xl sm:p-7"
              style={{ borderColor: 'rgba(59,130,246,0.22)' }}
            >
              {/* Header */}
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2
                    id="edit-channel-title"
                    className="text-base font-semibold text-white"
                  >
                    Edit {isWebhook ? 'Webhook' : 'Email'} Channel
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {isWebhook
                      ? 'Update the label, enabled state, or signing secret.'
                      : 'Update the label or enable / disable this channel.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Close modal"
                  className="-mt-0.5 cursor-pointer text-slate-600 transition-colors hover:text-slate-300"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>

                {/* Read-only address / URL */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    {isWebhook ? 'Webhook URL' : 'Address'}
                  </p>
                  <p
                    className="truncate rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 font-mono text-sm text-slate-400"
                    title={channel.value}
                  >
                    {channel.value}
                  </p>
                </div>

                <FormField
                  label="Label (optional)"
                  id="edit-channel-label"
                  type="text"
                  autoComplete="off"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder={
                    isWebhook
                      ? 'e.g. Production alerts, PagerDuty'
                      : 'e.g. Work email, On-call phone'
                  }
                />

                {/* Enabled toggle */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Status
                  </p>
                  <Toggle
                    checked={enabled}
                    onChange={setEnabled}
                    label={enabled ? 'Enabled — will receive alerts' : 'Disabled — alerts paused'}
                  />
                </div>

                {/* Webhook-only: signing secret management */}
                {isWebhook && (
                  <WebhookSecretField
                    hasSecret={channel.hasSecret ?? false}
                    secretMode={secretMode}
                    newSecret={newSecret}
                    showNewSecret={showNewSecret}
                    onSecretModeChange={setSecretMode}
                    onNewSecretChange={setNewSecret}
                    onToggleShowSecret={() => setShowNewSecret((s) => !s)}
                  />
                )}

                {/* Inline error */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      key="edit-channel-error"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0  }}
                      exit={{    opacity: 0        }}
                      className="rounded-lg border border-pulse-red/20 bg-pulse-red/[0.06] px-4 py-2.5 text-sm text-pulse-red"
                    >
                      {error}
                    </motion.p>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex gap-2.5 pt-1">
                  <Button
                    type="submit"
                    variant="primary"
                    size="md"
                    fullWidth
                    isLoading={loading}
                  >
                    Save Changes
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
