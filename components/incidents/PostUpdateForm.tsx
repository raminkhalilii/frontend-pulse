'use client'

import { useState, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import type { IncidentStatus, PostIncidentUpdatePayload } from '@/types/incident'
import { MarkdownRenderer } from './MarkdownRenderer'

// ── Options ───────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: { value: IncidentStatus; label: string }[] = [
  { value: 'INVESTIGATING', label: 'Investigating' },
  { value: 'IDENTIFIED',    label: 'Identified'    },
  { value: 'MONITORING',    label: 'Monitoring'    },
  { value: 'RESOLVED',      label: 'Resolved'      },
]

const MAX_MESSAGE = 2000

// ── Shared style tokens ───────────────────────────────────────────────────────

const inputCls = [
  'w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-slate-700',
  'bg-white/5 border border-white/[0.08]',
  'focus:outline-none focus:bg-white/[0.07] focus:border-pulse-blue/50',
  'focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]',
  'transition-all duration-200',
].join(' ')

const labelCls = 'block text-[11px] font-semibold text-slate-500 tracking-[0.08em] uppercase mb-1.5'

// ── Component ─────────────────────────────────────────────────────────────────

interface PostUpdateFormProps {
  currentStatus: IncidentStatus
  isResolved:    boolean
  onSubmit:      (payload: PostIncidentUpdatePayload) => Promise<void>
}

export function PostUpdateForm({ currentStatus, isResolved, onSubmit }: PostUpdateFormProps) {
  const [status,  setStatus]  = useState<IncidentStatus>(currentStatus)
  const [message, setMessage] = useState('')
  const [tab,     setTab]     = useState<'write' | 'preview'>('write')
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  const isResolving = status === 'RESOLVED'

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!message.trim()) { setError('Message is required.'); return }

    setError('')
    setLoading(true)
    try {
      await onSubmit({ message: message.trim(), status })
      setMessage('')
      setStatus(currentStatus)
      setTab('write')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post update.')
    } finally {
      setLoading(false)
    }
  }

  if (isResolved) return null

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-xl border border-white/[0.08] bg-white/[0.02] p-4 space-y-4"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        Post Update
      </p>

      {/* Status select */}
      <div>
        <label htmlFor="pu-status" className={labelCls}>Status</label>
        <select
          id="pu-status"
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

      {/* Write / Preview tabs */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label htmlFor="pu-message" className={labelCls + ' !mb-0'}>
            Message
          </label>
          <div className="flex rounded-md overflow-hidden border border-white/[0.08]">
            {(['write', 'preview'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={[
                  'px-3 py-1 text-[11px] font-medium capitalize transition-colors',
                  tab === t
                    ? 'bg-white/[0.08] text-slate-200'
                    : 'bg-transparent text-slate-600 hover:text-slate-400',
                ].join(' ')}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {tab === 'write' ? (
          <textarea
            id="pu-message"
            rows={4}
            maxLength={MAX_MESSAGE}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe what changed…"
            className={[inputCls, 'resize-y min-h-[96px]'].join(' ')}
          />
        ) : (
          <div className="min-h-[96px] rounded-lg border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm text-slate-300 leading-relaxed">
            {message.trim() ? (
              <MarkdownRenderer content={message} variant="dark" />
            ) : (
              <span className="text-slate-600 italic">Nothing to preview.</span>
            )}
          </div>
        )}

        <p className="mt-1 text-right text-[11px] text-slate-600">
          {message.length}/{MAX_MESSAGE}
        </p>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            key="pu-error"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-lg border border-pulse-red/20 bg-pulse-red/[0.06] px-4 py-2.5 text-sm text-pulse-red"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Submit */}
      <Button
        type="submit"
        variant="primary"
        size="md"
        isLoading={loading}
        className={isResolving ? '!from-emerald-500 !to-emerald-400' : ''}
      >
        {isResolving ? 'Post Update & Resolve' : 'Post Update'}
      </Button>
    </form>
  )
}
