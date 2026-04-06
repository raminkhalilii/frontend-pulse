'use client'

import { useState, FormEvent, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import { FormField } from '@/components/auth/AuthShell'
import { updateMonitor } from '@/lib/api'
import type { Monitor, MonitorFrequency } from '@/types'

// ─── Frequency pill options ───────────────────────────────────────────────────

const FREQ_OPTIONS: { value: MonitorFrequency; label: string }[] = [
  { value: 'ONE_MIN',    label: '1 min'  },
  { value: 'FIVE_MIN',  label: '5 min'  },
  { value: 'THIRTY_MIN', label: '30 min' },
]

// ─── Component ────────────────────────────────────────────────────────────────

interface EditMonitorModalProps {
  open: boolean
  monitor: Monitor | null
  onClose: () => void
  onUpdated: (monitor: Monitor) => void
}

export function EditMonitorModal({ open, monitor, onClose, onUpdated }: EditMonitorModalProps) {
  const [name,      setName]      = useState('')
  const [url,       setUrl]       = useState('')
  const [frequency, setFrequency] = useState<MonitorFrequency>('FIVE_MIN')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)

  // Populate form when monitor changes
  useEffect(() => {
    if (monitor) {
      setName(monitor.name)
      setUrl(monitor.url)
      setFrequency(monitor.frequency)
      setError('')
    }
  }, [monitor, open])

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!monitor) return

    setError('')
    setLoading(true)
    try {
      const updated = await updateMonitor(monitor.id, {
        name: name !== monitor.name ? name : undefined,
        url: url !== monitor.url ? url : undefined,
        frequency: frequency !== monitor.frequency ? frequency : undefined,
      })
      onUpdated(updated)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update monitor.')
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
      {open && monitor && (
        <>
          {/* Backdrop */}
          <motion.div
            key="modal-backdrop"
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
            key="modal-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-modal-title"
            className="fixed inset-x-0 bottom-0 z-50 flex justify-center sm:inset-0 sm:items-center sm:px-4"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
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
                    id="edit-modal-title"
                    className="text-base font-semibold text-white"
                  >
                    Edit Monitor
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Update the monitor settings.
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
                <FormField
                  label="Monitor name"
                  id="edit-mon-name"
                  type="text"
                  required
                  autoComplete="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Production API"
                />

                <FormField
                  label="URL"
                  id="edit-mon-url"
                  type="url"
                  required
                  autoComplete="off"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="example.com or https://api.example.com/health"
                />

                {/* Frequency pill selector */}
                <div className="space-y-1.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Check frequency
                  </p>
                  <div className="flex gap-2">
                    {FREQ_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setFrequency(opt.value)}
                        className={[
                          'flex-1 rounded-lg border py-2 text-xs font-medium transition-all duration-150',
                          frequency === opt.value
                            ? 'border-pulse-blue/40 bg-pulse-blue/15 text-pulse-blue'
                            : 'border-white/[0.08] bg-white/[0.03] text-slate-500 hover:bg-white/[0.07] hover:text-slate-300',
                        ].join(' ')}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      key="modal-error"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
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
                    Save changes
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
