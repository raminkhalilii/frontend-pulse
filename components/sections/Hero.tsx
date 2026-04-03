'use client'

import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import { NetworkScene } from '@/components/3d/NetworkScene'
import Button from '@/components/ui/Button'

// ─── Loader ───────────────────────────────────────────────────────────────────

function SceneLoader() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-background">
      <span
        className="block w-8 h-8 rounded-full border-2 border-pulse-green border-t-transparent animate-spin"
        aria-hidden="true"
      />
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

export function Hero() {
  return (
    <section className="relative w-full h-screen overflow-hidden bg-[#0A0F1A] z-10">

      {/* ── 3-D Canvas Background ── */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <Suspense fallback={<SceneLoader />}>
          <Canvas
            dpr={[1, 2]}
            gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
            style={{ background: '#0A0F1A' }}
          >
            <PerspectiveCamera makeDefault position={[1.5, 0.8, 9]} fov={58} />
            <NetworkScene />
          </Canvas>
        </Suspense>
      </div>

      {/* ── Depth Gradient Overlays ── */}
      <div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 60% at 50% 50%, transparent 0%, rgba(10,15,26,0.55) 65%, rgba(10,15,26,0.92) 100%)',
        }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-x-0 bottom-0 z-10 h-40 pointer-events-none"
        style={{
          background: 'linear-gradient(to bottom, transparent, #0A0F1A)',
        }}
        aria-hidden="true"
      />

      {/* ── UI Overlay ── */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6 gap-8">

        {/* Badge */}
        <div className="inline-flex items-center gap-2.5 rounded-full border border-pulse-green/25 bg-pulse-green/5 px-4 py-1.5 text-xs font-mono tracking-widest text-pulse-green uppercase">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pulse-green opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-pulse-green" />
          </span>
          Distributed · Real-Time · Zero Downtime
        </div>

        {/* Headline */}
        <h1 className="font-sans text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.08] tracking-tight">
          <span className="text-white">Uptime Monitoring,</span>
          <br />
          <span
            style={{
              background: 'linear-gradient(115deg, #ffffff 0%, #10B981 45%, #3B82F6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Engineered for Scale.
          </span>
        </h1>

        {/* Subheadline */}
        <p className="max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed font-sans">
          SaaS-grade distributed architecture.{' '}
          <span className="text-slate-300 font-medium">Real-time WebSockets.</span>{' '}
          Zero compromises.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-2">
          <Button variant="primary" size="lg">
            Get Started
          </Button>
          <Button variant="outline" size="lg">
            View Architecture
          </Button>
        </div>

        {/* Social proof strip */}
        <p className="text-xs text-slate-600 font-mono tracking-wider mt-2">
          9 nodes monitored · 17 connections · packets in flight
        </p>
      </div>
    </section>
  )
}
