'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import Button from '@/components/ui/Button'
import { ArrowRight } from 'lucide-react'

// ─── Animated gradient mesh background ───────────────────────────────────────
// Three blurred orbs drift slowly at different speeds/directions,
// compositing a living mesh without JavaScript animation overhead.

function GradientMesh() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Base vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_50%,rgba(16,185,129,0.07)_0%,transparent_70%)]" />

      {/* Orb 1 — green, drifts top-left → bottom-right */}
      <div
        className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-30"
        style={{
          background: 'radial-gradient(circle, rgba(16,185,129,0.35) 0%, transparent 65%)',
          filter: 'blur(72px)',
          animation: 'cta-orb-a 18s ease-in-out infinite alternate',
        }}
      />

      {/* Orb 2 — blue, drifts opposite */}
      <div
        className="absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full opacity-25"
        style={{
          background: 'radial-gradient(circle, rgba(59,130,246,0.4) 0%, transparent 65%)',
          filter: 'blur(80px)',
          animation: 'cta-orb-b 22s ease-in-out infinite alternate',
        }}
      />

      {/* Orb 3 — indigo, centre pulse */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full opacity-15"
        style={{
          background: 'radial-gradient(circle, rgba(99,102,241,0.5) 0%, transparent 65%)',
          filter: 'blur(60px)',
          animation: 'cta-orb-c 14s ease-in-out infinite alternate',
        }}
      />

      {/* Noise texture overlay — kills banding */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        }}
      />

      <style>{`
        @keyframes cta-orb-a {
          0%   { transform: translate(0,   0)   scale(1);    }
          50%  { transform: translate(60px, 40px) scale(1.12); }
          100% { transform: translate(120px, 80px) scale(0.95); }
        }
        @keyframes cta-orb-b {
          0%   { transform: translate(0,   0)    scale(1);    }
          50%  { transform: translate(-50px, -30px) scale(1.08); }
          100% { transform: translate(-100px, -60px) scale(1.15); }
        }
        @keyframes cta-orb-c {
          0%   { transform: translate(-50%, -50%) scale(0.9);  opacity: 0.12; }
          50%  { transform: translate(-50%, -50%) scale(1.15); opacity: 0.18; }
          100% { transform: translate(-50%, -50%) scale(0.95); opacity: 0.10; }
        }
      `}</style>
    </div>
  )
}

// ─── Social proof strip ───────────────────────────────────────────────────────

const STATS = [
  { value: '99.98%', label: 'Uptime SLA' },
  { value: '<5ms',   label: 'WS latency' },
  { value: '100k+',  label: 'Checks / day' },
]

// ─── Component ────────────────────────────────────────────────────────────────

const CONTAINER_VARIANTS = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

const ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.4, 0, 0.2, 1] } },
}

export function CTA() {
  return (
    <section className="relative z-30 py-32 bg-[#0A0F1A] overflow-hidden">
      <GradientMesh />

      {/* Top separator */}
      <div
        className="absolute top-0 inset-x-0 h-px"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(16,185,129,0.25) 30%, rgba(59,130,246,0.25) 70%, transparent)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          variants={CONTAINER_VARIANTS}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          className="flex flex-col items-center gap-8"
        >
          {/* Eyebrow */}
          <motion.div variants={ITEM_VARIANTS}>
            <span className="inline-flex items-center gap-2 rounded-full border border-pulse-green/20 bg-pulse-green/5 px-4 py-1.5 text-[11px] font-mono tracking-widest text-pulse-green uppercase">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pulse-green opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-pulse-green" />
              </span>
              Start monitoring in 60 seconds
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h2
            variants={ITEM_VARIANTS}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight text-white max-w-3xl"
          >
            Stop guessing if your app{' '}
            <br className="hidden sm:block" />
            is down.{' '}
            <span
              style={{
                background: 'linear-gradient(115deg, #10B981 0%, #34D399 50%, #3B82F6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Know it before
            </span>{' '}
            your users do.
          </motion.h2>

          {/* Sub-copy */}
          <motion.p
            variants={ITEM_VARIANTS}
            className="max-w-xl text-base sm:text-lg text-slate-400 leading-relaxed"
          >
            Free tier included. No credit card required.
            Up and running in under a minute.
          </motion.p>

          {/* CTA button */}
          <motion.div variants={ITEM_VARIANTS}>
            <Link href="/login" tabIndex={-1}>
              <Button
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight size={16} />}
              >
                Get Started Free
              </Button>
            </Link>
          </motion.div>

          {/* Stats strip */}
          <motion.div
            variants={ITEM_VARIANTS}
            className="flex flex-wrap items-center justify-center gap-8 pt-4"
          >
            {STATS.map(({ value, label }) => (
              <div key={label} className="flex flex-col items-center gap-0.5">
                <span className="text-2xl font-bold text-white font-mono">{value}</span>
                <span className="text-[11px] text-slate-600 tracking-wide">{label}</span>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Bottom separator */}
      <div
        className="absolute bottom-0 inset-x-0 h-px"
        style={{
          background:
            'linear-gradient(to right, transparent, rgba(255,255,255,0.05) 50%, transparent)',
        }}
        aria-hidden="true"
      />
    </section>
  )
}
