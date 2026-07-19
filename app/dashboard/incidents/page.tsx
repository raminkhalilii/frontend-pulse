'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import { IncidentDashboardCard } from '@/components/incidents/IncidentDashboardCard'
import { CreateIncidentModal } from '@/components/incidents/CreateIncidentModal'
import { useToast, ToastContainer } from '@/components/ui/Toast'
import { listIncidents, resolveIncident } from '@/lib/api/incidents'
import { getMonitors } from '@/lib/api'
import type { Incident } from '@/types/incident'
import type { Monitor } from '@/types'
import { useRouter } from 'next/navigation'

// ── Skeleton ──────────────────────────────────────────────────────────────────

function IncidentSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.02] p-5"
          style={{ height: 160 }}
        />
      ))}
    </div>
  )
}

// ── Empty states ──────────────────────────────────────────────────────────────

function EmptyActive() {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
        <CheckCircle size={22} className="text-emerald-500" aria-hidden="true" />
      </div>
      <p className="mb-1 font-semibold text-white">No active incidents</p>
      <p className="max-w-xs text-sm text-slate-500">
        Everything looks good. If something goes wrong, incidents will appear here.
      </p>
    </div>
  )
}

function EmptyResolved() {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <p className="text-sm text-slate-500">No resolved incidents yet.</p>
    </div>
  )
}

// ── Duration helper (for resolved rows) ──────────────────────────────────────

function formatDuration(startIso: string, endIso: string | null): string {
  if (!endIso) return '—'
  const ms   = new Date(endIso).getTime() - new Date(startIso).getTime()
  const mins = Math.floor(ms / 60_000)
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m === 0 ? `${h}h` : `${h}h ${m}m`
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  })
}

// ── Page ──────────────────────────────────────────────────────────────────────

const RESOLVED_PAGE_SIZE = 10

export default function IncidentsPage() {
  const router = useRouter()
  const { toasts, toast, dismiss } = useToast()

  const [incidents,    setIncidents]    = useState<Incident[]>([])
  const [monitors,     setMonitors]     = useState<Monitor[]>([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [tab,          setTab]          = useState<'active' | 'resolved'>('active')
  const [modalOpen,    setModalOpen]    = useState(false)
  const [resolvedPage, setResolvedPage] = useState(1)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [incs, mons] = await Promise.all([listIncidents(), getMonitors()])
      setIncidents(incs)
      setMonitors(mons)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load incidents.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // Partition
  const active   = incidents.filter((i) => i.status !== 'RESOLVED')
  const resolved = incidents.filter((i) => i.status === 'RESOLVED')

  // Paginate resolved
  const resolvedStart  = 0
  const resolvedEnd    = resolvedPage * RESOLVED_PAGE_SIZE
  const resolvedSlice  = resolved.slice(resolvedStart, resolvedEnd)
  const hasMoreResolved = resolvedEnd < resolved.length

  function handleCreated(inc: Incident) {
    setIncidents((prev) => [inc, ...prev])
    toast('Incident created')
  }

  async function handleResolve(id: string) {
    try {
      const updated = await resolveIncident(id)
      setIncidents((prev) => prev.map((i) => (i.id === id ? updated : i)))
      toast('Incident resolved')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to resolve.', 'error')
    }
  }

  function handlePostUpdate(id: string) {
    router.push(`/dashboard/incidents/${id}`)
  }

  function handleEdit(id: string) {
    router.push(`/dashboard/incidents/${id}`)
  }

  return (
    <DashboardLayout>
      <div className="px-6 py-8 max-w-4xl mx-auto">
        {/* Page header */}
        <div className="flex items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl font-bold text-white">Incidents</h1>
            <p className="mt-0.5 text-sm text-slate-500">
              Track and communicate service disruptions to your users.
            </p>
          </div>
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus size={15} />}
            onClick={() => setModalOpen(true)}
          >
            Create Incident
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 mb-6 rounded-xl border border-white/[0.06] bg-white/[0.02] p-1 w-fit">
          {([
            { key: 'active',   label: 'Active',   count: active.length   },
            { key: 'resolved', label: 'Resolved',  count: resolved.length },
          ] as const).map(({ key, label, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={[
                'flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-150',
                tab === key
                  ? 'bg-white/[0.08] text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-300',
              ].join(' ')}
            >
              {label}
              {count > 0 && (
                <span
                  className={[
                    'rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
                    tab === key
                      ? key === 'active' ? 'bg-red-500/20 text-red-400' : 'bg-white/[0.08] text-slate-400'
                      : 'bg-white/[0.05] text-slate-600',
                  ].join(' ')}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-lg border border-pulse-red/20 bg-pulse-red/[0.06] px-4 py-3 text-sm text-pulse-red">
            {error}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <IncidentSkeleton />
        ) : tab === 'active' ? (
          /* ── Active tab ── */
          <GlassCard hoverEffect={false} glowColor="none" className="p-0 overflow-hidden">
            {active.length === 0 ? (
              <EmptyActive />
            ) : (
              <div className="divide-y divide-white/[0.05]">
                {active.map((inc) => (
                  <div key={inc.id} className="p-5">
                    <IncidentDashboardCard
                      incident={inc}
                      monitors={monitors}
                      onPostUpdate={handlePostUpdate}
                      onResolve={handleResolve}
                      onEdit={handleEdit}
                    />
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        ) : (
          /* ── Resolved tab ── */
          <GlassCard hoverEffect={false} glowColor="none" className="p-0 overflow-hidden">
            {resolved.length === 0 ? (
              <EmptyResolved />
            ) : (
              <>
                <div className="divide-y divide-white/[0.05]">
                  {resolvedSlice.map((inc) => (
                    <div
                      key={inc.id}
                      className="flex items-center gap-4 px-5 py-4 hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => router.push(`/dashboard/incidents/${inc.id}`)}
                    >
                      <Clock size={14} className="flex-none text-slate-600" aria-hidden="true" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-300 truncate">
                          {inc.title}
                        </p>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {formatDate(inc.startedAt)} · Lasted {formatDuration(inc.startedAt, inc.resolvedAt)}
                        </p>
                      </div>
                      <span className="flex-none text-xs text-slate-600">
                        {formatDate(inc.resolvedAt ?? inc.updatedAt)}
                      </span>
                    </div>
                  ))}
                </div>

                {hasMoreResolved && (
                  <div className="px-5 py-4 border-t border-white/[0.05]">
                    <button
                      type="button"
                      onClick={() => setResolvedPage((n) => n + 1)}
                      className="text-sm text-pulse-blue hover:underline cursor-pointer"
                    >
                      Show more
                    </button>
                  </div>
                )}
              </>
            )}
          </GlassCard>
        )}
      </div>

      <CreateIncidentModal
        open={modalOpen}
        monitors={monitors}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </DashboardLayout>
  )
}
