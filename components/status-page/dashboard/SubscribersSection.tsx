'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, ChevronLeft, ChevronRight } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import { getSubscriberStats, getSubscriberList } from '@/lib/api/subscribers'
import type { SubscriberStats, SubscriberListItem } from '@/types/subscriber'

const PAGE_SIZE = 20

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string
  value: number
  accent?: 'green' | 'blue' | 'amber' | 'default'
}

function StatCard({ label, value, accent = 'default' }: StatCardProps) {
  const accentClass =
    accent === 'green'
      ? 'text-pulse-green'
      : accent === 'blue'
        ? 'text-pulse-blue'
        : accent === 'amber'
          ? 'text-yellow-400'
          : 'text-white'

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] px-5 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <p className={`mt-1.5 text-2xl font-bold tabular-nums ${accentClass}`}>
        {value.toLocaleString()}
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

/**
 * Displays subscriber stats + paginated list of confirmed subscribers for
 * the authenticated user's status page.
 *
 * Fetches independently so loading this section never blocks the rest
 * of the status page settings page.
 */
export function SubscribersSection() {
  const [stats, setStats]       = useState<SubscriberStats | null>(null)
  const [items, setItems]       = useState<SubscriberListItem[]>([])
  const [total, setTotal]       = useState(0)
  const [offset, setOffset]     = useState(0)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1

  const load = useCallback(async (newOffset = 0) => {
    setLoading(true)
    setError('')
    try {
      const [statsData, listData] = await Promise.all([
        getSubscriberStats(),
        getSubscriberList(PAGE_SIZE, newOffset),
      ])
      setStats(statsData)
      setItems(listData.items ?? [])
      setTotal(listData.total ?? 0)
      setOffset(newOffset)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load subscribers.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(0)
  }, [load])

  // ── Loading skeleton ────────────────────────────────────────────────────────

  if (loading && !stats) {
    return (
      <GlassCard hoverEffect={false} glowColor="none" className="p-5 sm:p-6">
        <div className="mb-5">
          <div className="h-5 w-32 animate-pulse rounded bg-white/[0.06]" />
          <div className="mt-1.5 h-3.5 w-56 animate-pulse rounded bg-white/[0.04]" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 animate-pulse rounded-xl border border-white/[0.05] bg-white/[0.02]"
            />
          ))}
        </div>
        <div className="mt-5 h-40 animate-pulse rounded-xl border border-white/[0.05] bg-white/[0.02]" />
      </GlassCard>
    )
  }

  // ── Error state ─────────────────────────────────────────────────────────────

  if (error && !stats) {
    return (
      <GlassCard hoverEffect={false} glowColor="none" className="p-5 sm:p-6">
        <div className="flex items-center gap-2 text-sm text-pulse-red">
          <span>{error}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="mt-3"
          onClick={() => load(0)}
        >
          Retry
        </Button>
      </GlassCard>
    )
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <GlassCard hoverEffect={false} glowColor="none" className="p-5 sm:p-6">
      {/* Section header */}
      <div className="mb-5 flex items-center gap-2">
        <Users size={16} className="flex-none text-slate-400" aria-hidden="true" />
        <div>
          <h2 className="text-base font-semibold text-white">Subscribers</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            Email subscribers who receive incident notifications.
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total"        value={stats?.total ?? 0}        accent="default" />
        <StatCard label="Active"       value={stats?.confirmed ?? 0}    accent="green"   />
        <StatCard label="Pending"      value={stats?.pending ?? 0}      accent="amber"   />
        <StatCard label="Unsubscribed" value={stats?.unsubscribed ?? 0} accent="default" />
      </div>

      {/* Subscriber list */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/[0.08] py-12 text-center">
          <Users size={28} className="mb-3 text-slate-700" aria-hidden="true" />
          <p className="text-sm font-medium text-slate-500">No subscribers yet</p>
          <p className="mt-1 text-xs text-slate-600">
            Visitors can subscribe via the subscribe form on your public status page.
          </p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-white/[0.06]">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06] bg-white/[0.02]">
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500"
                  >
                    Subscribed
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {items.map((sub) => (
                  <tr
                    key={sub.id}
                    className="transition-colors duration-75 hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3">
                      <span className="font-mono text-slate-300">{sub.email}</span>
                    </td>
                    <td className="px-4 py-3">
                      {sub.isConfirmed ? (
                        <span className="inline-flex items-center rounded-full bg-pulse-green/10 px-2 py-0.5 text-[11px] font-medium text-pulse-green">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-yellow-500/10 px-2 py-0.5 text-[11px] font-medium text-yellow-400">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {formatDate(sub.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                Page {currentPage} of {totalPages}
                {' '}
                <span className="text-slate-600">
                  ({total.toLocaleString()} total)
                </span>
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={offset === 0 || loading}
                  onClick={() => load(Math.max(0, offset - PAGE_SIZE))}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/[0.08] text-slate-400 transition-all hover:bg-white/[0.06] hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  disabled={offset + PAGE_SIZE >= total || loading}
                  onClick={() => load(offset + PAGE_SIZE)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/[0.08] text-slate-400 transition-all hover:bg-white/[0.06] hover:text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </GlassCard>
  )
}
