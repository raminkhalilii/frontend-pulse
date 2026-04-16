'use client'

import { useState, useEffect, FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import { FormField } from '@/components/auth/AuthShell'
import { updateAlertChannel } from '@/lib/api'
import type { AlertChannel, UpdateAlertChannelPayload } from '@/types'

// ─── Inline toggle — mirrors the exact toggle pattern used in the page ────────

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
  const [label,   setLabel]   = useState('')
  const [enabled, setEnabled] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  // Pre-fill whenever the target channel changes
  useEffect(() => {
    if (channel) {
      setLabel(channel.label ?? '')
      setEnabled(channel.enabled)
      setError('')
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
                    Edit Channel
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Update the label or enable / disable this channel.
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
                {/* Read-only address */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Address
                  </p>
                  <p className="truncate rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 font-mono text-sm text-slate-400">
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
                  placeholder="e.g. Work email, On-call phone"
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
