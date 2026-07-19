'use client'

import { useEffect, useRef } from 'react'
import type { IncidentUpdateEntry } from '@/types/incident'
import { STATUS_LABEL, STATUS_BADGE_DARK } from '@/types/incident'
import { MarkdownRenderer } from './MarkdownRenderer'

// ── Time helpers ──────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diffMs  = Date.now() - new Date(iso).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 10)  return 'just now'
  if (diffSec < 60)  return `${diffSec} seconds ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60)  return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`
  const diffHr  = Math.floor(diffMin / 60)
  if (diffHr  < 24)  return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`
}

function fullTimestamp(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year:    'numeric',
    month:   'long',
    day:     'numeric',
    hour:    '2-digit',
    minute:  '2-digit',
    hour12:  true,
  })
}

// ── Component ─────────────────────────────────────────────────────────────────

interface UpdateTimelineProps {
  updates:     IncidentUpdateEntry[]
  isAutoCreated: boolean
  /** Called when component mounts/updates to scroll to the bottom */
  scrollToBottom?: boolean
}

export function UpdateTimeline({
  updates,
  isAutoCreated,
  scrollToBottom = true,
}: UpdateTimelineProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to the latest update on mount and whenever updates grow
  useEffect(() => {
    if (scrollToBottom) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [updates.length, scrollToBottom])

  if (updates.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-slate-500">No updates posted yet.</p>
      </div>
    )
  }

  // Render oldest-first so the timeline reads top-to-bottom chronologically
  const ordered = [...updates].reverse()

  return (
    <div className="relative pl-6 border-l-2 border-white/[0.08] space-y-6">
      {ordered.map((update, i) => {
        const isLast       = i === ordered.length - 1
        const isAutoEntry  = isAutoCreated && (i === 0 || isLast)

        return (
          <div key={update.id} className="relative">
            {/* Timeline dot */}
            <span
              className={[
                'absolute -left-[1.65rem] top-[0.3rem]',
                'flex h-3.5 w-3.5 items-center justify-center rounded-full',
                'border-2 bg-[#05080F]',
                isLast
                  ? 'border-pulse-blue'
                  : 'border-white/[0.15]',
              ].join(' ')}
              aria-hidden="true"
            >
              {isLast && (
                <span className="h-1.5 w-1.5 rounded-full bg-pulse-blue" />
              )}
            </span>

            {/* Header row */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span
                className={[
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                  STATUS_BADGE_DARK[update.status],
                ].join(' ')}
              >
                {STATUS_LABEL[update.status]}
              </span>

              {isAutoEntry && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-2.5 py-0.5 text-xs text-slate-500">
                  ⚡ Auto-generated
                </span>
              )}

              {/* Relative time with full timestamp on hover */}
              <span
                className="text-xs text-slate-500 cursor-default"
                title={fullTimestamp(update.createdAt)}
              >
                {timeAgo(update.createdAt)}
              </span>
            </div>

            {/* Message */}
            <div className="text-sm text-slate-300 leading-relaxed">
              <MarkdownRenderer content={update.message} variant="dark" />
            </div>
          </div>
        )
      })}

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  )
}
