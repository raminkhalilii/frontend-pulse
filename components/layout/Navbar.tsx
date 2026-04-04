'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { useAuthStatus } from '@/hooks/useAuthStatus';

export default function Navbar() {
  const { scrollY } = useScroll();
  const isAuthenticated = useAuthStatus();
  const ctaHref  = isAuthenticated ? '/dashboard' : '/login';
  const ctaLabel = isAuthenticated ? 'Go to Dashboard' : 'Login';

  /* Increase backdrop opacity as the user scrolls */
  const bgOpacity = useTransform(scrollY, [0, 80], [0, 1]);

  return (
    <motion.header
      className="fixed top-0 inset-x-0 z-50"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Dynamic glass blur layer */}
      <motion.div
        className="absolute inset-0 backdrop-blur-xl border-b border-white/[0.06]"
        style={{
          backgroundColor: `rgba(10, 15, 26, ${bgOpacity})` as unknown as string,
        }}
        aria-hidden="true"
      />

      <nav className="relative mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* ── Logo ── */}
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="Pulse home">
          {/* Pulsing status dot */}
          <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pulse-green opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-pulse-green animate-pulse-glow" />
          </span>

          {/* Wordmark */}
          <span
            className={[
              'font-mono text-xl font-bold tracking-[0.22em] uppercase',
              'text-white group-hover:text-gradient-green',
              'transition-all duration-300',
            ].join(' ')}
          >
            PULSE
          </span>
        </Link>

        {/* ── CTA ── */}
        <Link
          href={ctaHref}
          className={[
            'inline-flex items-center gap-2',
            'px-5 py-2.5 text-sm font-semibold rounded-lg',
            'relative overflow-hidden',
            /* gradient fill */
            'bg-gradient-to-r from-pulse-green to-emerald-400',
            'text-background',
            /* shimmer on hover */
            'before:absolute before:inset-0',
            'before:bg-gradient-to-r before:from-white/0 before:via-white/15 before:to-white/0',
            'before:-translate-x-full hover:before:translate-x-full',
            'before:transition-transform before:duration-500',
            /* glow */
            'hover:shadow-[0_0_28px_rgba(16,185,129,0.5)]',
            /* scale */
            'active:scale-95',
            'transition-all duration-200',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pulse-green/60',
          ].join(' ')}
        >
          {ctaLabel}
          <ArrowRightIcon />
        </Link>
      </nav>
    </motion.header>
  );
}

function ArrowRightIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}
