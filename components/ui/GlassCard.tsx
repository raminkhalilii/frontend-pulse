'use client';

import { motion } from 'framer-motion';
import type { HTMLAttributes } from 'react';

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
  glowColor?: 'green' | 'blue' | 'red' | 'none';
}

const GLOW_MAP: Record<NonNullable<GlassCardProps['glowColor']>, string> = {
  green: 'hover:shadow-[0_8px_40px_rgba(16,185,129,0.18)] hover:border-pulse-green/25',
  blue:  'hover:shadow-[0_8px_40px_rgba(59,130,246,0.18)]  hover:border-pulse-blue/25',
  red:   'hover:shadow-[0_8px_40px_rgba(239,68,68,0.18)]   hover:border-pulse-red/25',
  none:  '',
};

export default function GlassCard({
  hoverEffect = false,
  glowColor = 'blue',
  className = '',
  children,
  ...props
}: GlassCardProps) {
  const base = [
    /* glass surface */
    'relative rounded-2xl',
    'bg-gradient-to-br from-white/[0.05] to-white/[0.02]',
    'backdrop-blur-xl',
    'border border-white/[0.08]',
    /* subtle inner highlight */
    'before:absolute before:inset-0 before:rounded-2xl',
    'before:bg-gradient-to-br before:from-white/[0.06] before:to-transparent',
    'before:pointer-events-none',
    /* transition */
    'transition-all duration-300',
  ].join(' ');

  const hover = hoverEffect
    ? [
        'cursor-pointer',
        GLOW_MAP[glowColor],
        'hover:-translate-y-1',
      ].join(' ')
    : '';

  if (!hoverEffect) {
    return (
      <div
        className={[base, className].filter(Boolean).join(' ')}
        {...props}
      >
        {children}
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={[base, hover, className].filter(Boolean).join(' ')}
      {...(props as Record<string, unknown>)}
    >
      {children}
    </motion.div>
  );
}
