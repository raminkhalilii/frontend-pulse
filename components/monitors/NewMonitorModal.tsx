'use client'

import { useState, FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import { FormField } from '@/components/auth/AuthShell'
import { createMonitor } from '@/lib/api'
import type { Monitor, MonitorFrequency } from '@/types'

// ─── Frequency pill options ───────────────────────────────────────────────────

const FREQ_OPTIONS: { value: MonitorFrequency; label: string }[] = [
  { value: 'ONE_MIN',    label: '1 min'  },
  { value: 'FIVE_MIN',  label: '5 min'  },
  { value: 'THIRTY_MIN', label: '30 min' },
]

// ─── Component ────────────────────────────────────────────────────────────────

interface NewMonitorModalProps {
  open: boolean
  onClose: () => void
  onCreated: (monitor: Monitor) => void
}

export function NewMonitorModal({ open, onClose, onCreated }: NewMonitorModalProps) {
  const [name,      setName]      = useState('')
  const [url,       setUrl]       = useState('')
  const [frequency, setFrequency] = useState<MonitorFrequency>('FIVE_MIN')
  const [error,     setError]     = useState('')
  const [loading,   setLoading]   = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const monitor = await createMonitor({ name, url, frequency })
      onCreated(monitor)
      // Reset form
      setName('')
      setUrl('')
      setFrequency('FIVE_MIN')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create monitor.')
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
      {open && (
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
            aria-labelledby="modal-title"
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <GlassCard
              hoverEffect={false}
              glowColor="none"
              className="w-full max-w-md p-7"
              style={{ borderColor: 'rgba(59,130,246,0.22)' }}
            >
              {/* Header */}
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2
                    id="modal-title"
                    className="text-base font-semibold text-white"
                  >
                    New Monitor
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Track the uptime of any public URL.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Close modal"
                  className="-mt-0.5 text-slate-600 transition-colors hover:text-slate-300"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <FormField
                  label="Monitor name"
                  id="mon-name"
                  type="text"
                  required
                  autoComplete="off"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Production API"
                />

                <FormField
                  label="URL"
                  id="mon-url"
                  type="url"
                  required
                  autoComplete="off"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://api.example.com/health"
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
                    Create monitor
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
