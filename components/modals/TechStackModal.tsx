'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X, Monitor, Server, Database, Cloud } from 'lucide-react'
import { useState, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

// ─── Data ─────────────────────────────────────────────────────────────────────

interface TechItem {
  name: string
  badge: string
}

interface Layer {
  id: string
  label: string
  icon: ReactNode
  accentText: string
  borderColor: string
  bgColor: string
  items: TechItem[]
}

const LAYERS: Layer[] = [
  {
    id: 'frontend',
    label: 'Frontend',
    icon: <Monitor size={13} />,
    accentText: 'text-pulse-blue',
    borderColor: 'rgba(59,130,246,0.22)',
    bgColor: 'rgba(59,130,246,0.05)',
    items: [
      { name: 'Next.js 16',      badge: 'App Router · RSC · SSR' },
      { name: 'Tailwind CSS',    badge: 'Utility-first styling' },
      { name: 'Framer Motion',   badge: 'Animation engine' },
      { name: 'Three.js / R3F',  badge: '3D WebGL network scene' },
    ],
  },
  {
    id: 'backend',
    label: 'Backend',
    icon: <Server size={13} />,
    accentText: 'text-pulse-green',
    borderColor: 'rgba(16,185,129,0.22)',
    bgColor: 'rgba(16,185,129,0.05)',
    items: [
      { name: 'NestJS',          badge: 'REST API · Modular DI' },
      { name: 'Socket.io',       badge: 'WebSocket real-time events' },
      { name: 'Passport + JWT',  badge: 'Auth · Refresh token rotation' },
      { name: 'Prisma ORM',      badge: 'Type-safe database client' },
    ],
  },
  {
    id: 'data',
    label: 'Data Layer',
    icon: <Database size={13} />,
    accentText: 'text-amber-400',
    borderColor: 'rgba(251,191,36,0.20)',
    bgColor: 'rgba(251,191,36,0.04)',
    items: [
      { name: 'PostgreSQL',  badge: 'Primary relational store' },
      { name: 'Redis',       badge: 'Cache · Pub/Sub broker' },
      { name: 'BullMQ',      badge: 'Durable job queue · retries' },
    ],
  },
  {
    id: 'infra',
    label: 'Infrastructure',
    icon: <Cloud size={13} />,
    accentText: 'text-slate-400',
    borderColor: 'rgba(148,163,184,0.15)',
    bgColor: 'rgba(148,163,184,0.03)',
    items: [
      { name: 'Docker',          badge: 'Containerised services' },
      { name: 'Nginx',           badge: 'Reverse proxy · SSL termination' },
      { name: 'AWS EC2',         badge: 'Cloud compute host' },
      { name: "Let's Encrypt",   badge: 'Auto-renewed TLS certificates' },
    ],
  },
]

// ─── Request-flow nodes ───────────────────────────────────────────────────────

interface FlowNode {
  label: string
  sublabel?: string
  style: 'neutral' | 'green' | 'blue' | 'amber'
}

const FLOW_NODES: FlowNode[] = [
  { label: 'Browser',                  style: 'neutral' },
  { label: 'Nginx',  sublabel: 'SSL',  style: 'green'   },
  { label: 'Next.js', sublabel: 'SSR', style: 'blue'    },
  { label: 'NestJS',  sublabel: 'API', style: 'blue'    },
  { label: 'PostgreSQL · Redis',        style: 'amber'   },
]

const NODE_STYLES: Record<FlowNode['style'], string> = {
  neutral: 'bg-white/[0.06] text-slate-300 border-white/[0.1]',
  green:   'bg-pulse-green/10 text-pulse-green border-pulse-green/25',
  blue:    'bg-pulse-blue/10 text-pulse-blue border-pulse-blue/20',
  amber:   'bg-amber-400/10 text-amber-400 border-amber-400/20',
}

function ArrowIcon() {
  return (
    <svg width="14" height="10" viewBox="0 0 14 10" fill="none" aria-hidden="true">
      <path
        d="M1 5h12M8 1l5 4-5 4"
        stroke="rgba(100,116,139,0.45)"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface TechStackModalProps {
  open: boolean
  onClose: () => void
}

export function TechStackModal({ open, onClose }: TechStackModalProps) {
  // Mount guard — createPortal requires document to exist (client-only).
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  // Prevent background scrolling while the modal is open.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = previous }
  }, [open])

  if (!mounted) return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* ── Backdrop ── */}
          <motion.div
            key="arch-backdrop"
            className="fixed inset-0 z-[100] bg-[#0A0F1A]/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            aria-hidden="true"
          />

          {/* ── Dialog ── */}
          <motion.div
            key="arch-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="arch-modal-title"
            className="fixed inset-x-0 bottom-0 z-[100] flex justify-center sm:inset-0 sm:items-center sm:p-4"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 32 }}
            transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
          >
            <div className="relative w-full max-h-[90vh] overflow-y-auto sm:max-w-3xl rounded-t-2xl rounded-b-none sm:rounded-2xl border border-white/[0.1] bg-[#0C1220]/97 shadow-[0_0_80px_rgba(16,185,129,0.14)] backdrop-blur-2xl">

              {/* Top glow line */}
              <div
                className="absolute top-0 inset-x-0 h-px rounded-t-2xl"
                style={{
                  background:
                    'linear-gradient(to right, transparent, rgba(16,185,129,0.55) 50%, transparent)',
                }}
                aria-hidden="true"
              />

              <div className="p-6 sm:p-8">

                {/* ── Header ── */}
                <div className="flex items-start justify-between mb-7">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pulse-green opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-pulse-green" />
                      </span>
                      <span className="text-[10px] font-mono text-pulse-green uppercase tracking-[0.18em]">
                        System Architecture
                      </span>
                    </div>
                    <h2
                      id="arch-modal-title"
                      className="text-xl font-bold text-white"
                    >
                      Tech Stack &amp; Infrastructure
                    </h2>
                    <p className="mt-0.5 text-sm text-slate-500">
                      Full-stack breakdown of the Pulse monitoring platform.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close architecture modal"
                    className="mt-0.5 cursor-pointer rounded-lg p-1.5 text-slate-600 transition-colors hover:bg-white/[0.06] hover:text-slate-300"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* ── Layer grid ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                  {LAYERS.map((layer) => (
                    <div
                      key={layer.id}
                      className="rounded-xl border p-4"
                      style={{ borderColor: layer.borderColor, backgroundColor: layer.bgColor }}
                    >
                      {/* Layer header */}
                      <div className={`flex items-center gap-1.5 mb-3.5 ${layer.accentText}`}>
                        {layer.icon}
                        <span className="text-[10px] font-mono font-semibold uppercase tracking-[0.14em]">
                          {layer.label}
                        </span>
                      </div>

                      {/* Tech items */}
                      <ul className="space-y-2.5">
                        {layer.items.map((item) => (
                          <li key={item.name} className="flex items-baseline gap-2 min-w-0">
                            <span className="text-[13px] font-semibold text-white whitespace-nowrap">
                              {item.name}
                            </span>
                            <span className="text-[11px] text-slate-500 leading-snug truncate">
                              — {item.badge}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* ── Request flow ── */}
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
                  <p className="mb-4 text-[10px] font-mono uppercase tracking-widest text-slate-600">
                    Request Flow
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {FLOW_NODES.map((node, i) => (
                      <div key={node.label} className="flex items-center gap-2">
                        <div
                          className={`rounded-md border px-2.5 py-1 text-center ${NODE_STYLES[node.style]}`}
                        >
                          <p className="text-[11px] font-mono font-semibold leading-none">
                            {node.label}
                          </p>
                          {node.sublabel && (
                            <p className="text-[9px] opacity-60 mt-0.5">{node.sublabel}</p>
                          )}
                        </div>
                        {i < FLOW_NODES.length - 1 && <ArrowIcon />}
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
