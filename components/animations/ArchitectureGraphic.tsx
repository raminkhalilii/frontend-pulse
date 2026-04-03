'use client'

import { useEffect, useRef } from 'react'
import { motion, useAnimate, useReducedMotion } from 'framer-motion'
import { Server, Database, Cpu, ArrowDown } from 'lucide-react'

// ─── Layout constants ─────────────────────────────────────────────────────────
// Node box: h-[76px].  Connector: h-[64px].
// Packet starts centred on node-1 (y=38), travels to node-2 (y=38+76+64=178),
// dwells, then continues to node-3 (y=178+76+64=318).
const Y_NODE1   = 38
const Y_NODE2   = 178
const Y_NODE3   = 318
const DWELL_MS  = 700   // ms packet sits at Redis queue

// ─── Sub-components ───────────────────────────────────────────────────────────

interface NodeBoxProps {
  icon: React.ReactNode
  label: string
  sublabel: string
  accent: string          // tailwind colour token, e.g. 'pulse-blue'
  accentHex: string
  badge?: string
}

function NodeBox({ icon, label, sublabel, accent, accentHex, badge }: NodeBoxProps) {
  return (
    <div
      className="relative w-full flex items-center gap-4 px-5 h-[76px] rounded-xl border border-white/[0.07] bg-gradient-to-r from-white/[0.04] to-white/[0.02] backdrop-blur-sm"
      style={{ boxShadow: `0 0 24px ${accentHex}18` }}
    >
      {/* Left accent bar */}
      <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-${accent}`} />

      {/* Icon */}
      <div
        className={`flex-none flex items-center justify-center w-9 h-9 rounded-lg bg-${accent}/10 text-${accent}`}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white truncate">{label}</p>
        <p className="text-[11px] text-slate-500 truncate">{sublabel}</p>
      </div>

      {/* Badge */}
      {badge && (
        <span
          className={`flex-none text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-${accent}/10 text-${accent} border border-${accent}/20`}
        >
          {badge}
        </span>
      )}
    </div>
  )
}

interface ConnectorProps {
  label: string
  accentHex: string
}

function Connector({ label, accentHex }: ConnectorProps) {
  return (
    <div className="relative flex flex-col items-center h-[64px] w-full">
      {/* Dashed vertical line */}
      <div
        className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px"
        style={{
          background: `repeating-linear-gradient(to bottom, ${accentHex}50 0px, ${accentHex}50 4px, transparent 4px, transparent 10px)`,
        }}
      />
      {/* Label chip */}
      <div className="absolute top-1/2 -translate-y-1/2 px-3 py-0.5 rounded-full text-[10px] font-mono text-slate-500 bg-[#0D1117] border border-white/[0.06] z-10 whitespace-nowrap">
        {label}
      </div>
      {/* Arrow */}
      <ArrowDown
        size={12}
        className="absolute bottom-1 text-slate-600"
        style={{ color: `${accentHex}60` }}
      />
    </div>
  )
}

// ─── Animated data packet ─────────────────────────────────────────────────────

function DataPacket({ animate: doAnimate }: { animate: boolean }) {
  const [scope, animate] = useAnimate()
  const prefersReduced = useReducedMotion()

  useEffect(() => {
    if (!doAnimate || prefersReduced) return

    let cancelled = false

    const loop = async () => {
      if (cancelled) return

      // Reset to above node-1 (invisible)
      await animate(scope.current, { y: Y_NODE1 - 12, opacity: 0, scale: 0.6 }, { duration: 0 })

      // Appear at node-1
      await animate(scope.current, { opacity: 1, scale: 1 }, { duration: 0.25, ease: 'easeOut' })

      // Travel to node-2 (Redis Queue)
      await animate(scope.current, { y: Y_NODE2 }, {
        duration: 0.7,
        ease: [0.4, 0, 0.2, 1],
      })

      // Pulse while queued
      await animate(scope.current, { scale: [1, 1.35, 1] }, {
        duration: 0.35,
        times: [0, 0.5, 1],
        ease: 'easeInOut',
      })

      await new Promise<void>(r => setTimeout(r, DWELL_MS))

      if (cancelled) return

      // Travel to worker
      await animate(scope.current, { y: Y_NODE3 }, {
        duration: 0.7,
        ease: [0.4, 0, 0.2, 1],
      })

      // Burst and disappear (job processed)
      await animate(scope.current, { scale: 2.2, opacity: 0 }, {
        duration: 0.35,
        ease: 'easeOut',
      })

      await new Promise<void>(r => setTimeout(r, 900))

      if (!cancelled) loop()
    }

    loop()
    return () => { cancelled = true }
  }, [doAnimate, prefersReduced, animate, scope])

  return (
    <div
      ref={scope}
      className="absolute left-1/2 -translate-x-1/2 z-20"
      style={{ top: 0, opacity: 0 }}
    >
      {/* Outer glow ring */}
      <div className="absolute inset-0 -m-2 rounded-full bg-pulse-green/20 blur-sm" />
      {/* Core dot */}
      <div className="w-3.5 h-3.5 rounded-full bg-pulse-green shadow-[0_0_10px_#10B981,0_0_20px_rgba(16,185,129,0.4)]" />
    </div>
  )
}

// ─── Queue depth indicator ────────────────────────────────────────────────────

function QueueDepthBar() {
  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0.5">
      {[...Array(4)].map((_, i) => (
        <motion.div
          key={i}
          className="w-1 rounded-full bg-pulse-blue"
          animate={{ opacity: [0.2, 0.9, 0.2], scaleY: [0.6, 1, 0.6] }}
          transition={{
            duration: 1.4,
            repeat: Infinity,
            delay: i * 0.25,
            ease: 'easeInOut',
          }}
          style={{ height: 6 - i }}
        />
      ))}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ArchitectureGraphic() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <div className="w-full max-w-sm mx-auto select-none">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-pulse-green animate-[pulse-glow_2.4s_ease-in-out_infinite]" />
        <p className="text-[11px] font-mono text-slate-500 tracking-wider uppercase">
          Live Job Lifecycle
        </p>
      </div>

      {/* Pipeline */}
      <div ref={containerRef} className="relative flex flex-col items-center gap-0">

        {/* Animated packet — sits over the whole stack */}
        <DataPacket animate />

        <NodeBox
          icon={<Server size={16} />}
          label="API Gateway"
          sublabel="POST /monitors/:id/check"
          accent="pulse-blue"
          accentHex="#3B82F6"
          badge="REST"
        />

        <Connector label="BullMQ.add('ping', job)" accentHex="#3B82F6" />

        <div className="relative w-full">
          <NodeBox
            icon={<Database size={16} />}
            label="Redis BullMQ"
            sublabel="queue:monitors — waiting"
            accent="pulse-green"
            accentHex="#10B981"
            badge="Queue"
          />
          <QueueDepthBar />
        </div>

        <Connector label="worker.process(job)" accentHex="#10B981" />

        <NodeBox
          icon={<Cpu size={16} />}
          label="Worker Node"
          sublabel="HTTP ping → result emitted"
          accent="pulse-green"
          accentHex="#10B981"
          badge="BG"
        />
      </div>

      {/* Result legend */}
      <div className="mt-6 flex items-center justify-between px-1">
        <div className="flex items-center gap-4 text-[10px] font-mono text-slate-600">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pulse-green" />
            success
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pulse-red" />
            timeout
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-pulse-blue" />
            queued
          </span>
        </div>
        <span className="text-[10px] font-mono text-slate-600">avg 42ms</span>
      </div>
    </div>
  )
}
