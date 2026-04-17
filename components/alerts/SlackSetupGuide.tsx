'use client'

import { useState, useEffect, useRef } from 'react'
import { Info, X } from 'lucide-react'

// ─── Slack brand icon (inline SVG, original brand colors) ─────────────────────

export function SlackIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 54 54"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Blue — left column top */}
      <path
        d="M19.712.133a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386h5.376V5.52A5.381 5.381 0 0 0 19.712.133m0 14.365H5.376A5.381 5.381 0 0 0 0 19.884a5.381 5.381 0 0 0 5.376 5.387h14.336a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386"
        fill="#36C5F0"
      />
      {/* Green — right column bottom */}
      <path
        d="M53.76 19.884a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386v5.387h5.376a5.381 5.381 0 0 0 5.376-5.387m-14.336 0V5.52A5.381 5.381 0 0 0 34.048.133a5.381 5.381 0 0 0-5.376 5.387v14.364a5.381 5.381 0 0 0 5.376 5.387 5.381 5.381 0 0 0 5.376-5.387"
        fill="#2EB67D"
      />
      {/* Yellow — top row right */}
      <path
        d="M34.048 54a5.381 5.381 0 0 0 5.376-5.387 5.381 5.381 0 0 0-5.376-5.386h-5.376v5.386A5.381 5.381 0 0 0 34.048 54m0-14.365h14.336a5.381 5.381 0 0 0 5.376-5.386 5.381 5.381 0 0 0-5.376-5.387H34.048a5.381 5.381 0 0 0-5.376 5.387 5.381 5.381 0 0 0 5.376 5.386"
        fill="#ECB22E"
      />
      {/* Red — bottom row left */}
      <path
        d="M0 34.249a5.381 5.381 0 0 0 5.376 5.386 5.381 5.381 0 0 0 5.376-5.386v-5.387H5.376A5.381 5.381 0 0 0 0 34.249m14.336 0v14.364A5.381 5.381 0 0 0 19.712 54a5.381 5.381 0 0 0 5.376-5.387V34.249a5.381 5.381 0 0 0-5.376-5.386 5.381 5.381 0 0 0-5.376 5.386"
        fill="#E01E5A"
      />
    </svg>
  )
}

// ─── Setup guide popover ──────────────────────────────────────────────────────

export function SlackSetupGuide() {
  const [open, setOpen]     = useState(false)
  const buttonRef           = useRef<HTMLButtonElement>(null)
  const panelRef            = useRef<HTMLDivElement>(null)
  const firstFocusRef       = useRef<HTMLAnchorElement>(null)

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
        aria-label="Slack setup guide"
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
          aria-label="How to create a Slack Incoming Webhook"
          className={[
            'absolute bottom-full left-0 z-30 mb-2 w-72',
            'rounded-lg border border-white/[0.08] bg-[#0d1421] p-4 shadow-xl',
          ].join(' ')}
        >
          {/* Header */}
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <SlackIcon size={13} />
              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-300">
                Slack Setup
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
              'Go to api.slack.com/apps → Create New App → From Scratch',
              'In the app dashboard, click Incoming Webhooks → toggle On',
              'Click Add New Webhook to Workspace → pick a channel',
              'Copy the Webhook URL and paste it here',
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
            href="https://api.slack.com/messaging/webhooks"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-1 text-[11px] text-[#36C5F0] transition-opacity hover:opacity-80"
          >
            Open Slack App Directory →
          </a>
        </div>
      )}
    </div>
  )
}
