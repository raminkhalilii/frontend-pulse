'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Check, ChevronRight, Pencil } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import { UpdateTimeline } from '@/components/incidents/UpdateTimeline'
import { PostUpdateForm } from '@/components/incidents/PostUpdateForm'
import { IncidentDetailsSidebar } from '@/components/incidents/IncidentDetailsSidebar'
import { useToast, ToastContainer } from '@/components/ui/Toast'
import { getIncident, postIncidentUpdate, updateIncident } from '@/lib/api/incidents'
import { getMonitors } from '@/lib/api'
import type { Incident, IncidentImpact, PostIncidentUpdatePayload } from '@/types/incident'
import type { Monitor } from '@/types'
import {
  IMPACT_LABEL,
  STATUS_LABEL,
  IMPACT_BADGE_DARK,
  STATUS_BADGE_DARK,
} from '@/types/incident'

// ── Skeleton ──────────────────────────────────────────────────────────────────

function DetailSkeleton() {
  return (
    <div className="lg:grid lg:grid-cols-3 lg:gap-8">
      <div className="lg:col-span-2 space-y-4">
        {([120, 320, 160] as const).map((h, i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.02]"
            style={{ height: h }}
          />
        ))}
      </div>
      <div className="mt-8 lg:mt-0 space-y-4">
        {([140, 120, 160] as const).map((h, i) => (
          <div
            key={i}
            className="animate-pulse rounded-2xl border border-white/[0.05] bg-white/[0.02]"
            style={{ height: h }}
          />
        ))}
      </div>
    </div>
  )
}

// ── Inline title editor ───────────────────────────────────────────────────────

interface InlineTitleProps {
  value:   string
  onSave:  (title: string) => Promise<void>
}

function InlineTitle({ value, onSave }: InlineTitleProps) {
  const [editing, setEditing] = useState(false)
  const [draft,   setDraft]   = useState(value)
  const [saving,  setSaving]  = useState(false)
  const inputRef              = useRef<HTMLInputElement>(null)

  // Sync draft whenever the parent value changes (e.g. optimistic update reverted)
  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  async function commit() {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === value) {
      setEditing(false)
      setDraft(value)
      return
    }
    setSaving(true)
    try {
      await onSave(trimmed)
    } catch {
      setDraft(value) // revert draft on error
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => { setDraft(value); setEditing(true) }}
        className="group flex items-start gap-2 text-left max-w-full"
        title="Click to edit title"
      >
        <h1 className="text-xl font-bold text-white group-hover:text-pulse-blue transition-colors leading-tight">
          {value}
        </h1>
        <Pencil
          size={13}
          className="mt-1 flex-none text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-hidden="true"
        />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 w-full">
      <input
        ref={inputRef}
        type="text"
        maxLength={200}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter')  { e.preventDefault(); void commit() }
          if (e.key === 'Escape') { setEditing(false); setDraft(value) }
        }}
        disabled={saving}
        className="flex-1 min-w-0 text-xl font-bold bg-transparent border-b border-pulse-blue/50 text-white focus:outline-none focus:border-pulse-blue pb-0.5 transition-colors"
      />
      {saving && (
        <span className="flex-none text-xs text-slate-500">Saving…</span>
      )}
    </div>
  )
}

// ── Impact selector (badge + dropdown) ───────────────────────────────────────

const IMPACT_OPTIONS: IncidentImpact[] = ['CRITICAL', 'MAJOR', 'MINOR', 'NONE']

interface ImpactSelectorProps {
  value:    IncidentImpact
  disabled: boolean
  onChange: (impact: IncidentImpact) => Promise<void>
}

function ImpactSelector({ value, disabled, onChange }: ImpactSelectorProps) {
  const [open, setOpen] = useState(false)
  const ref             = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onOutsideClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutsideClick)
    return () => document.removeEventListener('mousedown', onOutsideClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        title={disabled ? undefined : 'Click to change impact'}
        className={[
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-opacity',
          IMPACT_BADGE_DARK[value],
          disabled ? 'cursor-default' : 'cursor-pointer hover:opacity-80',
        ].join(' ')}
      >
        {IMPACT_LABEL[value]}
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1.5 z-20 min-w-[140px] rounded-xl border border-white/[0.1] bg-[#0c1018] shadow-xl py-1">
          {IMPACT_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={async () => {
                setOpen(false)
                if (opt !== value) await onChange(opt)
              }}
              className={[
                'flex w-full items-center gap-2 px-3 py-2 text-xs transition-colors',
                opt === value
                  ? 'bg-white/[0.06] text-white'
                  : 'text-slate-400 hover:bg-white/[0.04] hover:text-white',
              ].join(' ')}
            >
              <span
                className={[
                  'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                  IMPACT_BADGE_DARK[opt],
                ].join(' ')}
              >
                {IMPACT_LABEL[opt]}
              </span>
              {opt === value && (
                <Check size={11} className="ml-auto text-pulse-blue flex-none" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function IncidentDetailPage() {
  const params     = useParams()
  const router     = useRouter()
  const { toasts, toast, dismiss } = useToast()

  const incidentId = typeof params.id === 'string'
    ? params.id
    : (params.id as string[])[0]

  const [incident, setIncident] = useState<Incident | null>(null)
  const [monitors, setMonitors] = useState<Monitor[]>([])
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState('')

  // ── Load ──────────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [inc, mons] = await Promise.all([
        getIncident(incidentId),
        getMonitors(),
      ])
      setIncident(inc)
      setMonitors(mons)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load incident.')
    } finally {
      setLoading(false)
    }
  }, [incidentId])

  useEffect(() => { loadData() }, [loadData])

  // ── Handlers ──────────────────────────────────────────────────────────────

  /** Called by PostUpdateForm — throws on error so the form can show inline err */
  async function handlePostUpdate(payload: PostIncidentUpdatePayload) {
    if (!incident) return
    const updated = await postIncidentUpdate(incident.id, payload)
    setIncident(updated)
    toast(payload.status === 'RESOLVED' ? 'Incident resolved' : 'Update posted')
  }

  async function handleTitleSave(newTitle: string) {
    if (!incident) return
    try {
      const updated = await updateIncident(incident.id, { title: newTitle })
      setIncident(updated)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update title.', 'error')
      throw err // let InlineTitle revert its draft
    }
  }

  async function handleImpactChange(newImpact: IncidentImpact) {
    if (!incident) return
    try {
      const updated = await updateIncident(incident.id, { impact: newImpact })
      setIncident(updated)
      toast('Impact updated')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update impact.', 'error')
    }
  }

  function handleDeleted() {
    router.push('/dashboard/incidents')
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const isResolved = incident?.status === 'RESOLVED'

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="px-6 py-8 max-w-6xl mx-auto">

        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
          <button
            type="button"
            onClick={() => router.push('/dashboard/incidents')}
            className="flex cursor-pointer items-center gap-1.5 text-slate-500 transition-colors hover:text-slate-300"
          >
            <ArrowLeft size={13} className="flex-none" aria-hidden="true" />
            Incidents
          </button>
          <ChevronRight size={13} className="flex-none text-slate-700" aria-hidden="true" />
          <span className="truncate max-w-[20rem] text-slate-400">
            {loading
              ? '…'
              : (incident?.title ?? 'Incident')}
          </span>
        </nav>

        {/* Error */}
        {error && (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <p className="text-sm text-pulse-red">{error}</p>
            <Button variant="outline" size="sm" onClick={loadData}>
              Retry
            </Button>
          </div>
        )}

        {/* Loading */}
        {loading && <DetailSkeleton />}

        {/* Content */}
        {!loading && !error && incident && (
          <>
            {/* Page header ─── badges + inline-editable title */}
            <div className="mb-8">
              {/* Badge row */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <ImpactSelector
                  value={incident.impact}
                  disabled={isResolved}
                  onChange={handleImpactChange}
                />

                <span
                  className={[
                    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                    STATUS_BADGE_DARK[incident.status],
                  ].join(' ')}
                >
                  {STATUS_LABEL[incident.status]}
                </span>

                {incident.autoCreated && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/[0.05] px-2.5 py-0.5 text-xs text-slate-500">
                    ⚡ Auto-generated
                  </span>
                )}
              </div>

              {/* Inline-editable title */}
              <InlineTitle
                value={incident.title}
                onSave={handleTitleSave}
              />
            </div>

            {/* Two-column grid ─── timeline left, sidebar right */}
            <div className="lg:grid lg:grid-cols-3 lg:gap-8 lg:items-start">

              {/* Left column (2/3): timeline + post-update form */}
              <div className="lg:col-span-2">
                <GlassCard hoverEffect={false} glowColor="none" className="p-5">
                  <p className="mb-5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Timeline
                  </p>
                  <UpdateTimeline
                    updates={incident.updates}
                    isAutoCreated={incident.autoCreated}
                    scrollToBottom
                  />
                </GlassCard>

                <PostUpdateForm
                  currentStatus={incident.status}
                  isResolved={isResolved}
                  onSubmit={handlePostUpdate}
                />
              </div>

              {/* Right column (1/3): details sidebar */}
              <div className="mt-8 lg:mt-0">
                <IncidentDetailsSidebar
                  incident={incident}
                  monitors={monitors}
                  statusPageSlug={null}
                  onIncidentUpdated={setIncident}
                  onDeleted={handleDeleted}
                />
              </div>
            </div>
          </>
        )}
      </div>

      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </DashboardLayout>
  )
}
