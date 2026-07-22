'use client'

import GlassCard from '@/components/ui/GlassCard'
import type { ApdexRating, ResponseTimeStats } from '@/types/response-time'

const APDEX_RATING_CLASSES: Record<ApdexRating, string> = {
  Excellent: 'text-pulse-green',
  Good: 'text-pulse-green',
  Fair: 'text-orange-400',
  Poor: 'text-orange-400',
  Unacceptable: 'text-pulse-red',
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <GlassCard hoverEffect={false} glowColor="none" className="p-4">
      <p className="text-[10px] uppercase tracking-wider text-slate-600">{label}</p>
      <p className="mt-1 font-mono text-lg font-semibold text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500">{sub}</p>}
    </GlassCard>
  )
}

interface ResponseTimeStatTilesProps {
  stats: ResponseTimeStats
}

export function ResponseTimeStatTiles({ stats }: ResponseTimeStatTilesProps) {
  const noData = stats.sampleCount === 0
  const ms = (v: number | null) => (v === null ? '—' : `${v}ms`)

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <Tile label="Avg" value={ms(stats.avgMs)} />
      <Tile label="p50" value={ms(stats.p50Ms)} />
      <Tile label="p95" value={ms(stats.p95Ms)} />
      <Tile label="p99" value={ms(stats.p99Ms)} />
      <Tile label="Min / Max" value={noData ? '—' : `${stats.minMs} / ${stats.maxMs}`} />
      <GlassCard hoverEffect={false} glowColor="none" className="p-4">
        <p className="text-[10px] uppercase tracking-wider text-slate-600">Apdex</p>
        <p className="mt-1 font-mono text-lg font-semibold text-white">
          {stats.apdexScore === null ? '—' : stats.apdexScore.toFixed(3)}
        </p>
        {stats.apdexRating && (
          <p className={`mt-0.5 text-xs font-medium ${APDEX_RATING_CLASSES[stats.apdexRating]}`}>
            {stats.apdexRating}
          </p>
        )}
      </GlassCard>
    </div>
  )
}
