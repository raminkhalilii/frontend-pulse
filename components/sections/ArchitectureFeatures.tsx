'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GlassCard from '@/components/ui/GlassCard'
import { ArchitectureGraphic } from '@/components/animations/ArchitectureGraphic'
import { TerminalWindow } from '@/components/animations/TerminalWindow'
import { Server, Zap, ShieldCheck, Check } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type GlowColor = 'green' | 'blue' | 'red'

interface StageData {
  badge: string
  title: string
  description: string
  bullets: string[]
  icon: React.ReactNode
  glow: GlowColor
  accentClass: string
}

// ─── Stage definitions ────────────────────────────────────────────────────────

const STAGES: StageData[] = [
  {
    badge: 'BullMQ · Redis',
    title: 'Decoupled Worker Nodes',
    description:
      'Every check is a durable, queue-backed job. Workers run in isolated processes — a surge or crash never touches the API layer.',
    bullets: [
      'Horizontal scale: add workers without config changes',
      'Automatic retries with exponential back-off',
      'Job deduplication prevents thundering herds',
      'Dead-letter queue for forensic failure analysis',
    ],
    icon: <Server size={18} />,
    glow: 'green',
    accentClass: 'text-pulse-green',
  },
  {
    badge: 'Socket.io · WS',
    title: 'Real-time WebSocket Updates',
    description:
      'Results are pushed the moment a worker emits them. No polling, no stale dashboards — subscribers receive structured events in &lt;5ms.',
    bullets: [
      'Room-scoped broadcasts per monitor ID',
      'Reconnect with buffered event replay',
      'Binary-free JSON payloads stay inspector-friendly',
      'Server-side presence for multi-tab deduplication',
    ],
    icon: <Zap size={18} />,
    glow: 'blue',
    accentClass: 'text-pulse-blue',
  },
  {
    badge: 'Security Layer',
    title: 'SSRF Network Protection',
    description:
      'The worker enforces a strict egress allowlist before dialling any URL. Private ranges and loopback addresses are blocked at the syscall boundary — not just validated.',
    bullets: [
      'RFC-1918 + RFC-5735 ranges fully blocked',
      'IPv6 link-local and ULA ranges denied',
      'DNS resolution validated post-lookup (rebinding safe)',
      'Audit log for every blocked attempt',
    ],
    icon: <ShieldCheck size={18} />,
    glow: 'red',
    accentClass: 'text-pulse-red',
  },
]

// ─── Firewall Graphic (stage 2 visual) ───────────────────────────────────────

const BLOCKED_RANGES = [
  { range: '10.0.0.0/8',      label: 'RFC-1918 Private A' },
  { range: '172.16.0.0/12',   label: 'RFC-1918 Private B' },
  { range: '192.168.0.0/16',  label: 'RFC-1918 Private C' },
  { range: '127.0.0.0/8',     label: 'Loopback' },
  { range: '169.254.0.0/16',  label: 'Link-local / APIPA' },
  { range: '::1/128',         label: 'IPv6 Loopback' },
  { range: 'fc00::/7',        label: 'IPv6 ULA' },
]

function FirewallGraphic() {
  const [flashIdx, setFlashIdx] = useState<number | null>(null)
  const [attemptCount, setAttemptCount] = useState(0)

  useEffect(() => {
    let tid: ReturnType<typeof setTimeout>

    const fire = () => {
      const idx = Math.floor(Math.random() * BLOCKED_RANGES.length)
      setFlashIdx(idx)
      setAttemptCount(c => c + 1)
      tid = setTimeout(() => {
        setFlashIdx(null)
        tid = setTimeout(fire, 1400 + Math.random() * 1800)
      }, 900)
    }

    tid = setTimeout(fire, 600)
    return () => clearTimeout(tid)
  }, [])

  return (
    <div className="w-full max-w-sm mx-auto select-none">
      {/* Header */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-pulse-red animate-pulse" />
          <p className="text-[11px] font-mono text-slate-500 tracking-wider uppercase">
            SSRF Shield — Egress Filter
          </p>
        </div>
        <span className="text-[10px] font-mono text-pulse-red/70">
          {attemptCount} blocked
        </span>
      </div>

      {/* Blocked ranges table */}
      <div className="rounded-xl border border-white/[0.06] overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 bg-white/[0.03] border-b border-white/[0.05]">
          <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">CIDR Range</span>
          <span className="text-[10px] font-mono text-slate-600 uppercase tracking-widest">Status</span>
        </div>

        {BLOCKED_RANGES.map((item, i) => (
          <motion.div
            key={item.range}
            className="flex items-center justify-between px-4 py-2.5 border-b border-white/[0.04] last:border-0"
            animate={flashIdx === i
              ? { backgroundColor: 'rgba(239,68,68,0.10)' }
              : { backgroundColor: 'rgba(255,255,255,0)' }
            }
            transition={{ duration: 0.2 }}
          >
            <div>
              <p className="text-[11.5px] font-mono text-slate-300">{item.range}</p>
              <p className="text-[10px] text-slate-600">{item.label}</p>
            </div>

            <AnimatePresence mode="wait">
              {flashIdx === i ? (
                <motion.span
                  key="denied"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-pulse-red/15 text-pulse-red border border-pulse-red/30"
                >
                  DENIED
                </motion.span>
              ) : (
                <motion.span
                  key="blocked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.04] text-slate-600 border border-white/[0.06]"
                >
                  BLOCKED
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Footer stat */}
      <p className="mt-3 text-[10px] font-mono text-slate-600 text-center">
        0 private-range requests reach the network
      </p>
    </div>
  )
}

// ─── Feature card ─────────────────────────────────────────────────────────────

function FeatureCard({ data }: { data: StageData }) {
  const glowShadow: Record<GlowColor, string> = {
    green: '0 8px 40px rgba(16,185,129,0.20)',
    blue:  '0 8px 40px rgba(59,130,246,0.20)',
    red:   '0 8px 40px rgba(239,68,68,0.20)',
  }

  const borderColor: Record<GlowColor, string> = {
    green: 'rgba(16,185,129,0.28)',
    blue:  'rgba(59,130,246,0.28)',
    red:   'rgba(239,68,68,0.28)',
  }

  return (
    <GlassCard
      hoverEffect={false}
      glowColor="none"
      className="p-6"
      style={{ boxShadow: glowShadow[data.glow], borderColor: borderColor[data.glow] }}
    >
      {/* Badge */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-mono font-semibold tracking-wider ${
            data.glow === 'green'
              ? 'text-pulse-green border-pulse-green/25 bg-pulse-green/5'
              : data.glow === 'blue'
              ? 'text-pulse-blue border-pulse-blue/25 bg-pulse-blue/5'
              : 'text-pulse-red border-pulse-red/25 bg-pulse-red/5'
          }`}
        >
          <span className={data.accentClass}>{data.icon}</span>
          {data.badge}
        </span>
      </div>

      <h3 className="text-lg font-bold text-white mb-2 leading-snug">{data.title}</h3>
      <p
        className="text-sm text-slate-400 leading-relaxed mb-4"
        dangerouslySetInnerHTML={{ __html: data.description }}
      />

      {/* Bullets */}
      <ul className="space-y-2">
        {data.bullets.map(bullet => (
          <li key={bullet} className="flex items-start gap-2.5">
            <Check size={13} className={`flex-none mt-0.5 ${data.accentClass}`} />
            <span className="text-xs text-slate-500 leading-relaxed">{bullet}</span>
          </li>
        ))}
      </ul>
    </GlassCard>
  )
}

// ─── Visuals map ──────────────────────────────────────────────────────────────

const VISUALS = [
  <ArchitectureGraphic key="arch" />,
  <TerminalWindow key="terminal" />,
  <FirewallGraphic key="firewall" />,
]

// ─── Main export ──────────────────────────────────────────────────────────────

export function ArchitectureFeatures() {
  return (
    <section className="relative w-full bg-[#0A0F1A] py-32 z-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">

        {/* Section header */}
        <motion.div
          className="mb-24 text-center"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          viewport={{ once: true, margin: '-100px' }}
        >
          <p className="text-[11px] font-mono text-slate-600 tracking-[0.2em] uppercase mb-3">
            System Architecture
          </p>
          <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight">
            Built on patterns that{' '}
            <span
              style={{
                background: 'linear-gradient(115deg, #10B981, #3B82F6)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              survive production.
            </span>
          </h2>
        </motion.div>

        {/* Feature rows — alternate text/visual sides */}
        <div className="flex flex-col gap-32">
          {STAGES.map((stage, i) => {
            const isEven = i % 2 === 0
            const textCol = (
              <motion.div
                className="flex items-center"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                viewport={{ once: true, margin: '-100px' }}
              >
                <FeatureCard data={stage} />
              </motion.div>
            )
            const visualCol = (
              <motion.div
                className="flex items-center justify-center"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut', delay: 0.15 }}
                viewport={{ once: true, margin: '-100px' }}
              >
                {VISUALS[i]}
              </motion.div>
            )

            return (
              <div
                key={i}
                className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center"
              >
                {isEven ? (
                  <>
                    {textCol}
                    {visualCol}
                  </>
                ) : (
                  <>
                    {visualCol}
                    {textCol}
                  </>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
