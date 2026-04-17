'use client'

import { useState, useEffect, useRef } from 'react'
import { Info, X } from 'lucide-react'

// ─── Discord brand icon (inline SVG, Blurple #5865F2) ─────────────────────────

export function DiscordIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      <path
        fill="#5865F2"
        d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.033.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.21 13.21 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"
      />
    </svg>
  )
}

// ─── Setup guide popover ──────────────────────────────────────────────────────

export function DiscordSetupGuide() {
  const [open, setOpen]   = useState(false)
  const buttonRef         = useRef<HTMLButtonElement>(null)
  const panelRef          = useRef<HTMLDivElement>(null)
  const firstFocusRef     = useRef<HTMLAnchorElement>(null)

  // ESC closes and returns focus to trigger
  useEffect(() => {
    if (!open) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  // Click outside closes
  useEffect(() => {
    if (!open) return
    function onMouseDown(e: MouseEvent) {
      const target = e.target as Node
      if (
        !panelRef.current?.contains(target) &&
        !buttonRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  // Move focus into panel when it opens
  useEffect(() => {
    if (open) {
      setTimeout(() => firstFocusRef.current?.focus(), 50)
    }
  }, [open])

  return (
    <div className="relative inline-flex items-center">
      <button
        ref={buttonRef}
        type="button"
        aria-label="Discord setup guide"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((v) => !v)}
        className="cursor-pointer text-slate-600 transition-colors hover:text-slate-400 focus:outline-none focus-visible:text-slate-400"
      >
        <Info size={11} aria-hidden="true" />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="How to create a Discord webhook"
          className={[
            'absolute bottom-full left-0 z-30 mb-2 w-72',
            'rounded-lg border border-white/[0.08] bg-[#0d1421] p-4 shadow-xl',
          ].join(' ')}
        >
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <DiscordIcon size={13} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300">
                Discord Setup
              </span>
            </div>
            <button
              type="button"
              onClick={() => { setOpen(false); buttonRef.current?.focus() }}
              aria-label="Close"
              className="cursor-pointer text-slate-600 transition-colors hover:text-slate-300"
            >
              <X size={13} aria-hidden="true" />
            </button>
          </div>

          {/* Steps */}
          <ol className="space-y-2">
            {[
              'Open Discord and navigate to your server',
              'Server Settings → Integrations → Webhooks',
              'Click New Webhook → choose a channel → give it a name',
              'Click Copy Webhook URL and paste it here',
            ].map((step, i) => (
              <li key={i} className="flex gap-2 text-[11px] leading-relaxed text-slate-400">
                <span className="mt-px flex h-4 w-4 flex-none items-center justify-center rounded-full bg-white/[0.06] text-[9px] font-bold text-slate-500">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>

          {/* CTA */}
          <a
            ref={firstFocusRef}
            href="https://support.discord.com/hc/en-us/articles/228383668"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-1 text-[11px] text-[#5865F2] transition-opacity hover:opacity-80"
          >
            Discord Webhook Docs →
          </a>
        </div>
      )}
    </div>
  )
}
