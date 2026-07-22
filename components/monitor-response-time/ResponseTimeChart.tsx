'use client'

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ResponseTimeBucket, ResponseTimeRange } from '@/types/response-time'

const PULSE_BLUE = '#3B82F6'

function formatTick(iso: string, range: ResponseTimeRange): string {
  const d = new Date(iso)
  if (range === '24h') {
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

function formatTooltipTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

interface TooltipPayloadEntry {
  payload: ResponseTimeBucket
}

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean
  payload?: TooltipPayloadEntry[]
}) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload

  return (
    <div className="rounded-lg border border-white/[0.08] bg-[#0A0F1A]/95 px-3 py-2 text-xs shadow-xl backdrop-blur-sm">
      <p className="mb-1 font-medium text-slate-400">{formatTooltipTime(point.timestamp)}</p>
      <p className="font-mono text-slate-200">
        avg <span className="font-semibold text-pulse-blue">{point.avgMs}ms</span>
      </p>
      {point.minMs !== point.maxMs && (
        <p className="mt-0.5 font-mono text-slate-500">
          {point.minMs}–{point.maxMs}ms range
        </p>
      )}
    </div>
  )
}

interface ResponseTimeChartProps {
  series: ResponseTimeBucket[]
  range: ResponseTimeRange
}

export function ResponseTimeChart({ series, range }: ResponseTimeChartProps) {
  if (series.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-slate-500">
        No response-time data for this range yet.
      </div>
    )
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <defs>
            <linearGradient id="responseTimeFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={PULSE_BLUE} stopOpacity={0.28} />
              <stop offset="100%" stopColor={PULSE_BLUE} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
          <XAxis
            dataKey="timestamp"
            tickFormatter={(v: string) => formatTick(v, range)}
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
            tickLine={false}
            minTickGap={40}
          />
          <YAxis
            tick={{ fill: '#64748b', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={44}
            unit="ms"
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(255,255,255,0.15)' }} />
          <Area
            type="monotone"
            dataKey="avgMs"
            stroke={PULSE_BLUE}
            strokeWidth={2}
            strokeLinecap="round"
            fill="url(#responseTimeFill)"
            dot={false}
            activeDot={{ r: 4, fill: PULSE_BLUE, stroke: '#0A0F1A', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
