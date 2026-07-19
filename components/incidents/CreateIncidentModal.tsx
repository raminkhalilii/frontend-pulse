'use client'

import { useState, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import { createIncident } from '@/lib/api/incidents'
import type { Incident, IncidentImpact, IncidentStatus } from '@/types/incident'
import type { Monitor } from '@/types'

// ── Option arrays ─────────────────────────────────────────────────────────────

const IMPACT_OPTIONS: { value: IncidentImpact; label: string }[] = [
  { value: 'CRITICAL', label: 'Critical'      },
  { value: 'MAJOR',    label: 'Major'         },
  { value: 'MINOR',    label: 'Minor'         },
  { value: 'NONE',     label: 'Informational' },
]

const STATUS_OPTIONS: { value: IncidentStatus; label: string }[] = [
  { value: 'INVESTIGATING', label: 'Investigating' },
  { value: 'IDENTIFIED',    label: 'Identified'    },
  { value: 'MONITORING',    label: 'Monitoring'    },
]

const MAX_TITLE   = 200
const MAX_MESSAGE = 2000

// ── Shared input style (matches FormField pattern) ───────────────────────────

const inputCls = [
  'w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-slate-700',
  'bg-white/5 border border-white/[0.08]',
  'focus:outline-none focus:bg-white/[0.07] focus:border-pulse-blue/50',
  'focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]',
  'transition-all duration-200',
].join(' ')

const labelCls = 'block text-[11px] font-semibold text-slate-500 tracking-[0.08em] uppercase mb-1.5'

// ── Component ─────────────────────────────────────────────────────────────────

interface CreateIncidentModalProps {
  open:      boolean
  monitors:  Monitor[]
  onClose:   () => void
  onCreated: (incident: Incident) => void
}

export function CreateIncidentModal({
  open,
  monitors,
  onClose,
  onCreated,
}: CreateIncidentModalProps) {
  const [title,      setTitle]      = useState('')
  const [impact,     setImpact]     = useState<IncidentImpact>('MAJOR')
  const [status,     setStatus]     = useState<IncidentStatus>('INVESTIGATING')
  const [message,    setMessage]    = useState('')
  const [monitorIds, setMonitorIds] = useState<string[]>([])
  const [error,      setError]      = useState('')
  const [loading,    setLoading]    = useState(false)

  function handleClose() {
    if (loading) return
    // Reset form
    setTitle('')
    setImpact('MAJOR')
    setStatus('INVESTIGATING')
    setMessage('')
    setMonitorIds([])
    setError('')
    onClose()
  }

  function toggleMonitor(id: string) {
    setMonitorIds((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id],
    )
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!title.trim()) { setError('Title is required.'); return }
    if (!message.trim()) { setError('Initial message is required.'); return }

    setError('')
    setLoading(true)
    try {
      const incident = await createIncident({
        title:      title.trim(),
        impact,
        status,
        message:    message.trim(),
        monitorIds: monitorIds.length > 0 ? monitorIds : undefined,
      })
      onCreated(incident)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create incident.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="ci-backdrop"
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
            key="ci-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="ci-title"
            className="fixed inset-x-0 bottom-0 z-50 flex justify-center sm:inset-0 sm:items-center sm:px-4"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          >
            <GlassCard
              hoverEffect={false}
              glowColor="none"
              className="flex w-full max-h-[92vh] min-h-0 flex-col overflow-hidden rounded-b-none rounded-t-2xl sm:max-h-[88vh] sm:max-w-lg sm:rounded-2xl"
              style={{ borderColor: 'rgba(59,130,246,0.22)' }}
            >
              <div className="modal-scroll min-h-0 flex-1 overflow-y-auto p-5 sm:p-7">
              {/* Header */}
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 id="ci-title" className="text-base font-semibold text-white">
                    Create Incident
                  </h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Communicate a service disruption to your users.
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

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                {/* Title */}
                <div>
                  <label htmlFor="ci-title-input" className={labelCls}>
                    Title <span className="text-pulse-red">*</span>
                  </label>
                  <input
                    id="ci-title-input"
                    type="text"
                    required
                    maxLength={MAX_TITLE}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="API Service Disruption"
                    className={inputCls}
                  />
                  <p className="mt-1 text-right text-[11px] text-slate-600">
                    {title.length}/{MAX_TITLE}
                  </p>
                </div>

                {/* Impact */}
                <div>
                  <p className={labelCls}>Impact <span className="text-pulse-red">*</span></p>
                  <div className="flex gap-2">
                    {IMPACT_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setImpact(opt.value)}
                        className={[
                          'flex-1 rounded-lg border py-2 text-xs font-medium transition-all duration-150',
                          impact === opt.value
                            ? 'border-pulse-blue/40 bg-pulse-blue/15 text-pulse-blue'
                            : 'border-white/[0.08] bg-white/[0.03] text-slate-500 hover:bg-white/[0.07] hover:text-slate-300',
                        ].join(' ')}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label htmlFor="ci-status" className={labelCls}>
                    Status <span className="text-pulse-red">*</span>
                  </label>
                  <select
                    id="ci-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as IncidentStatus)}
                    className={inputCls + ' cursor-pointer'}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Initial message */}
                <div>
                  <label htmlFor="ci-message" className={labelCls}>
                    Initial message <span className="text-pulse-red">*</span>
                  </label>
                  <textarea
                    id="ci-message"
                    rows={4}
                    maxLength={MAX_MESSAGE}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="We are investigating reports of…"
                    className={[
                      inputCls,
                      'resize-y min-h-[96px]',
                    ].join(' ')}
                  />
                  <div className="mt-1 flex items-center justify-between">
                    <p className="text-[11px] text-slate-600">Markdown is supported.</p>
                    <p className="text-[11px] text-slate-600">
                      {message.length}/{MAX_MESSAGE}
                    </p>
                  </div>
                </div>

                {/* Affected monitors */}
                {monitors.length > 0 && (
                  <div>
                    <p className={labelCls}>Affected monitors <span className="text-slate-600 normal-case">(optional)</span></p>
                    <div className="space-y-1.5 max-h-40 overflow-y-auto rounded-lg border border-white/[0.08] bg-white/[0.03] p-3">
                      {monitors.map((m) => (
                        <label
                          key={m.id}
                          className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1 hover:bg-white/[0.04]"
                        >
                          <input
                            type="checkbox"
                            checked={monitorIds.includes(m.id)}
                            onChange={() => toggleMonitor(m.id)}
                            className="h-3.5 w-3.5 cursor-pointer accent-pulse-blue"
                          />
                          <span
                            className="inline-block h-2 w-2 flex-none rounded-full"
                            style={{
                              backgroundColor:
                                m.latestStatus === 'UP'   ? '#16a34a' :
                                m.latestStatus === 'DOWN' ? '#dc2626' : '#9ca3af',
                            }}
                            aria-hidden="true"
                          />
                          <span className="text-sm text-slate-300">{m.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.p
                      key="ci-error"
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
                    Create Incident
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
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
