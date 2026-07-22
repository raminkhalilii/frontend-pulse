'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Copy, Check } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'

// ── Props ─────────────────────────────────────────────────────────────────────

interface MonitorBadgeModalProps {
  open: boolean
  onClose: () => void
  slug: string
  monitorId: string
  monitorName: string
}

// ── Copy button ───────────────────────────────────────────────────────────────

function CopySnippetRow({ label, snippet }: { label: string; snippet: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(snippet)
    } catch {
      const el = document.createElement('input')
      el.value = snippet
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{label}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 overflow-x-auto rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5">
          <span className="whitespace-nowrap font-mono text-xs text-slate-400">{snippet}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          title={`Copy ${label}`}
          className="flex h-10 w-10 flex-none cursor-pointer items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-400 transition-all duration-200 hover:bg-white/[0.08] hover:text-slate-200"
        >
          {copied ? <Check size={14} className="text-pulse-green" /> : <Copy size={14} />}
        </button>
      </div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function MonitorBadgeModal({ open, onClose, slug, monitorId, monitorName }: MonitorBadgeModalProps) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const badgeUrl = `${origin}/api/status/${slug}/monitors/${monitorId}/badge.svg`
  const markdownSnippet = `![Uptime](${badgeUrl})`
  const htmlSnippet = `<img src="${badgeUrl}" alt="${monitorName} uptime" />`

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-background/75 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-50 flex justify-center sm:inset-0 sm:items-center sm:px-4"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          >
            <GlassCard
              hoverEffect={false}
              glowColor="none"
              className="w-full max-h-[90vh] overflow-y-auto rounded-b-none rounded-t-2xl p-5 sm:max-h-none sm:max-w-md sm:rounded-2xl sm:p-7"
              style={{ borderColor: 'rgba(59,130,246,0.22)' }}
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold text-white">Uptime Badge</h2>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Embed a live 30-day uptime badge for {monitorName}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close modal"
                  className="flex-none cursor-pointer text-slate-500 transition-colors hover:text-slate-300"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-5">
                {/* Live preview */}
                <div className="flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.02] p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={badgeUrl} alt={`${monitorName} uptime badge`} />
                </div>

                <CopySnippetRow label="Markdown" snippet={markdownSnippet} />
                <CopySnippetRow label="HTML" snippet={htmlSnippet} />
              </div>
            </GlassCard>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
