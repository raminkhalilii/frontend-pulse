'use client'

import { type ReactNode, type InputHTMLAttributes, forwardRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import GlassCard from '@/components/ui/GlassCard'

// ─── Shared polished input field ─────────────────────────────────────────────

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  id: string
  error?: string
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(
  function FormField({ label, id, error, className = '', ...props }, ref) {
    return (
      <div className="space-y-1.5">
        <label
          htmlFor={id}
          className="block text-[11px] font-semibold text-slate-500 tracking-[0.08em] uppercase"
        >
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          {...props}
          className={[
            'w-full px-4 py-2.5 rounded-lg text-sm text-white placeholder-slate-700',
            'bg-white/5 border',
            error ? 'border-pulse-red/40' : 'border-white/[0.08]',
            'focus:outline-none focus:bg-white/[0.07]',
            error
              ? 'focus:border-pulse-red/60 focus:shadow-[0_0_0_3px_rgba(239,68,68,0.10)]'
              : 'focus:border-pulse-blue/50 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]',
            'transition-all duration-200',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        />
        {error && (
          <p className="text-[11px] text-pulse-red mt-1">{error}</p>
        )}
      </div>
    )
  }
)

// ─── Auth page shell ──────────────────────────────────────────────────────────

interface AuthShellProps {
  title: string
  subtitle?: string
  /** Footer slot — typically a "switch to login/register" link */
  footer: ReactNode
  children: ReactNode
}

export function AuthShell({ title, subtitle, footer, children }: AuthShellProps) {
  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center px-4 overflow-hidden">

      {/* Subtle CSS grid */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(59,130,246,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(59,130,246,0.045) 1px, transparent 1px)
          `,
          backgroundSize: '52px 52px',
        }}
      />

      {/* Centre radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 65% 55% at 50% 50%, rgba(59,130,246,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Fade + scale entrance */}
      <motion.div
        className="relative z-10 w-full max-w-md"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      >

        {/* Brand mark */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pulse-green to-emerald-400 flex items-center justify-center shadow-[0_0_18px_rgba(16,185,129,0.45)] group-hover:shadow-[0_0_26px_rgba(16,185,129,0.65)] transition-shadow duration-300">
              <span className="text-background font-bold text-sm font-mono leading-none">P</span>
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">Pulse</span>
          </Link>
          <p className="text-sm text-slate-500">Uptime monitoring, simplified.</p>
        </div>

        <GlassCard hoverEffect={false} glowColor="none" className="p-8">
          {/* Card header */}
          <div className="mb-7">
            <h1 className="text-lg font-semibold text-white mb-1">{title}</h1>
            {subtitle && (
              <p className="text-sm text-slate-500">{subtitle}</p>
            )}
          </div>

          {children}

          {/* Footer (toggle link) */}
          <div className="text-center text-sm text-slate-600 mt-6">
            {footer}
          </div>
        </GlassCard>
      </motion.div>
    </div>
  )
}
