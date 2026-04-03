'use client'

import { useRef, useState, useEffect, useCallback } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type LogLevel = 'success' | 'error' | 'warn' | 'info' | 'ws'

interface LogSegment {
  text: string
  cls: string
}

interface LogLine {
  id: number
  level: LogLevel
  segments: LogSegment[]
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TARGETS = [
  'https://api.stripe.com/healthz',
  'https://hooks.shopify.com/ping',
  'https://status.github.com/api/v2/status.json',
  'https://api.vercel.com/v1/health',
  'https://app.acme.io/health',
  'https://webhook.example.com/callback',
  'https://api.twilio.com/healthcheck',
  'https://notify.prod.example.com/ping',
]

const WS_EVENTS = [
  (id: string) => `[WS] client:${id} subscribed → monitor:847a3c`,
  (id: string) => `[WS] broadcast → ${id} peers | event:ping_result`,
  (id: string) => `[WS] heartbeat ← client:${id} — latency 4ms`,
]

const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min

const randHex = (len: number) =>
  Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('')

let _id = 10

function buildLine(): LogLine {
  const id = ++_id
  const roll = Math.random()
  const ts = new Date().toISOString().replace('T', ' ').replace('Z', 'Z')
  const target = TARGETS[randInt(0, TARGETS.length - 1)]

  const seg = (text: string, cls: string): LogSegment => ({ text, cls })
  const dim = 'text-slate-500'
  const url = 'text-slate-300'

  // 8 % WebSocket event
  if (roll < 0.08) {
    const evtFn = WS_EVENTS[randInt(0, WS_EVENTS.length - 1)]
    const clientId = randHex(4)
    return {
      id, level: 'ws',
      segments: [
        seg(`${ts}  `, dim),
        seg(evtFn(clientId), 'text-pulse-blue'),
      ],
    }
  }

  // 15 % timeout / error
  if (roll < 0.23) {
    const attempt = randInt(1, 3)
    if (attempt < 3) {
      return {
        id, level: 'warn',
        segments: [
          seg(`${ts}  `, dim),
          seg(`RETRY ${attempt}/3`, 'text-yellow-400 font-semibold'),
          seg('  ↳  ', dim),
          seg(target, url),
          seg(`  — timeout`, 'text-yellow-500'),
        ],
      }
    }
    return {
      id, level: 'error',
      segments: [
        seg(`${ts}  `, dim),
        seg('PING ERR', 'text-pulse-red font-semibold'),
        seg('  ↳  ', dim),
        seg(target, url),
        seg(`  — ${randInt(9999, 10001)}ms`, 'text-slate-400'),
        seg('  ETIMEDOUT', 'text-pulse-red'),
      ],
    }
  }

  // Success (default)
  const ms = randInt(18, 340)
  const status = ms > 250 ? 200 : 200
  return {
    id, level: 'success',
    segments: [
      seg(`${ts}  `, dim),
      seg('PING OK ', 'text-pulse-green font-semibold'),
      seg('  ↳  ', dim),
      seg(target, url),
      seg(`  — ${ms}ms`, ms > 200 ? 'text-yellow-400' : 'text-slate-300'),
      seg(`  HTTP ${status}`, 'text-slate-500'),
    ],
  }
}

const BOOT_LINES: LogLine[] = [
  {
    id: 1, level: 'info',
    segments: [
      { text: '  Pulse Worker v2.4.1 initialising…', cls: 'text-slate-400' },
    ],
  },
  {
    id: 2, level: 'info',
    segments: [
      { text: '  Redis BullMQ connected  ● queue:monitors ready', cls: 'text-slate-500' },
    ],
  },
  {
    id: 3, level: 'ws',
    segments: [
      { text: '  Socket.io server listening on :3001 — 0 clients', cls: 'text-pulse-blue' },
    ],
  },
  {
    id: 4, level: 'info',
    segments: [
      { text: '  ─────────────────────────────────────────────────', cls: 'text-slate-700' },
    ],
  },
]

const MAX_LINES = 40

// ─── Component ────────────────────────────────────────────────────────────────

export function TerminalWindow() {
  const [lines, setLines] = useState<LogLine[]>(BOOT_LINES)
  const scrollRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const schedule = useCallback(() => {
    const delay = randInt(900, 2100)
    timerRef.current = setTimeout(() => {
      setLines(prev => {
        const next = [...prev, buildLine()]
        return next.length > MAX_LINES ? next.slice(next.length - MAX_LINES) : next
      })
      schedule()
    }, delay)
  }, [])

  useEffect(() => {
    schedule()
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [schedule])

  // Auto-scroll to bottom
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [lines])

  return (
    <div className="w-full rounded-2xl overflow-hidden border border-white/[0.07] shadow-[0_24px_64px_rgba(0,0,0,0.6)]">
      {/* macOS title bar */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[#1C1C1E] border-b border-white/[0.06]">
        <span className="w-3 h-3 rounded-full bg-[#FF5F57] shadow-[0_0_6px_rgba(255,95,87,0.5)]" />
        <span className="w-3 h-3 rounded-full bg-[#FEBC2E] shadow-[0_0_6px_rgba(254,188,46,0.5)]" />
        <span className="w-3 h-3 rounded-full bg-[#28C840] shadow-[0_0_6px_rgba(40,200,64,0.5)]" />
        <span className="ml-auto font-mono text-[11px] text-slate-500 tracking-wide select-none">
          pulse-worker — bash
        </span>
      </div>

      {/* Log body */}
      <div
        ref={scrollRef}
        className="h-[360px] overflow-y-auto bg-[#0D1117] px-4 py-3 font-mono text-[11.5px] leading-[1.75] scroll-smooth"
        style={{ scrollbarWidth: 'thin', scrollbarColor: '#1E2A3B transparent' }}
      >
        {lines.map(line => (
          <div key={line.id} className="whitespace-pre flex flex-wrap items-baseline">
            {line.segments.map((seg, i) => (
              <span key={i} className={seg.cls}>{seg.text}</span>
            ))}
          </div>
        ))}

        {/* Blinking cursor */}
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-pulse-green">›</span>
          <span className="inline-block w-1.5 h-3.5 bg-pulse-green/80 animate-pulse" />
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161B22] border-t border-white/[0.05]">
        <div className="flex items-center gap-2">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pulse-green opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-pulse-green" />
          </span>
          <span className="text-[10px] font-mono text-slate-500">live stream</span>
        </div>
        <span className="text-[10px] font-mono text-slate-600">{lines.length} events</span>
      </div>
    </div>
  )
}
