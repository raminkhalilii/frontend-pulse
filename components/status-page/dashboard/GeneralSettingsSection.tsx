'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Copy, ExternalLink, Check } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import type { StatusPageSettings, UpdateStatusPagePayload, UptimePeriodDays } from '@/types/status-page'
import { updateMyStatusPage, checkSlugAvailability } from '@/lib/api/status-page'

// In prod, NEXT_PUBLIC_STATUS_DOMAIN points at the status. subdomain.
// Unset in local dev — falls back to this app's own /status/[slug] route.
function publicStatusPageUrl(slug: string): string {
  return process.env.NEXT_PUBLIC_STATUS_DOMAIN
    ? `${process.env.NEXT_PUBLIC_STATUS_DOMAIN}/${slug}`
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/status/${slug}`
}

const UPTIME_PERIODS: UptimePeriodDays[] = [30, 60, 90]
const SLUG_RE = /^[a-z0-9-]{3,40}$/

// ── Props ─────────────────────────────────────────────────────────────────────

interface GeneralSettingsSectionProps {
  settings: StatusPageSettings
  onSaved: (updated: StatusPageSettings) => void
  onToast: (msg: string, type?: 'success' | 'error') => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function GeneralSettingsSection({
  settings,
  onSaved,
  onToast,
}: GeneralSettingsSectionProps) {
  // ── Form state ────────────────────────────────────────────────────────────
  const [title, setTitle] = useState(settings.title)
  const [description, setDescription] = useState(settings.description ?? '')
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl ?? '')
  const [isPublic, setIsPublic] = useState(settings.isPublic)
  const [showUptimePct, setShowUptimePct] = useState(settings.showUptimePercentage)
  const [showResponseTime, setShowResponseTime] = useState(settings.showResponseTime)
  const [uptimePeriod, setUptimePeriod] = useState<UptimePeriodDays>(settings.uptimePeriodDays)
  const [slug, setSlug] = useState(settings.slug)

  // ── Slug validation state ─────────────────────────────────────────────────
  const [slugError, setSlugError] = useState('')
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null)
  const [checkingSlug, setCheckingSlug] = useState(false)
  const slugAbortRef = useRef<AbortController | null>(null)
  const slugDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Logo preview state ────────────────────────────────────────────────────
  const [logoPreviewOk, setLogoPreviewOk] = useState(false)

  // ── Save state ────────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false)

  // ── Copy state ────────────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false)

  // Re-sync if parent refreshes settings (e.g. after monitor save)
  useEffect(() => {
    setTitle(settings.title)
    setDescription(settings.description ?? '')
    setLogoUrl(settings.logoUrl ?? '')
    setIsPublic(settings.isPublic)
    setShowUptimePct(settings.showUptimePercentage)
    setShowResponseTime(settings.showResponseTime)
    setUptimePeriod(settings.uptimePeriodDays)
    setSlug(settings.slug)
  }, [settings])

  // ── Slug debounce + availability check ───────────────────────────────────
  const handleSlugChange = useCallback(
    (value: string) => {
      setSlug(value)
      setSlugAvailable(null)
      setSlugError('')

      if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current)
      if (slugAbortRef.current) slugAbortRef.current.abort()

      if (!value) return

      if (!SLUG_RE.test(value)) {
        setSlugError('Only lowercase letters, numbers, and hyphens (3–40 characters)')
        return
      }

      // Same as current slug → always available
      if (value === settings.slug) {
        setSlugAvailable(true)
        return
      }

      slugDebounceRef.current = setTimeout(async () => {
        const controller = new AbortController()
        slugAbortRef.current = controller
        setCheckingSlug(true)
        try {
          const available = await checkSlugAvailability(value, controller.signal)
          if (!controller.signal.aborted) setSlugAvailable(available)
        } finally {
          if (!controller.signal.aborted) setCheckingSlug(false)
        }
      }, 500)
    },
    [settings.slug],
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (slugDebounceRef.current) clearTimeout(slugDebounceRef.current)
      if (slugAbortRef.current) slugAbortRef.current.abort()
    }
  }, [])

  // ── Save ─────────────────────────────────────────────────────────────────
  async function handleSave() {
    if (slugError || (slug && !SLUG_RE.test(slug))) return
    setSaving(true)
    try {
      const payload: UpdateStatusPagePayload = {
        title: title.trim() || 'System Status',
        description: description.trim() || null,
        logoUrl: logoUrl.trim() || null,
        isPublic,
        showUptimePercentage: showUptimePct,
        showResponseTime,
        uptimePeriodDays: uptimePeriod,
        slug: slug.trim() || settings.slug,
      }
      const updated = await updateMyStatusPage(payload)
      onSaved(updated)
      onToast('Status page settings saved')
    } catch (err) {
      onToast(err instanceof Error ? err.message : 'Failed to save settings.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // ── Copy URL ──────────────────────────────────────────────────────────────
  async function handleCopy() {
    const url = publicStatusPageUrl(settings.slug)
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Fallback
      const el = document.createElement('input')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    onToast('URL copied to clipboard')
  }

  // ── Shared input class ────────────────────────────────────────────────────
  const inputClass =
    'w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder-slate-700 transition-all duration-200 focus:border-pulse-blue/50 focus:bg-white/[0.07] focus:outline-none focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]'

  const labelClass =
    'block text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500'

  const publicUrl = publicStatusPageUrl(settings.slug)

  return (
    <GlassCard hoverEffect={false} glowColor="none" className="p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-base font-semibold text-white">Status Page Settings</h2>
        <p className="mt-0.5 text-sm text-slate-500">
          Customise how your public status page appears to visitors.
        </p>
      </div>

      <div className="space-y-5">
        {/* Public URL display */}
        <div className="space-y-1.5">
          <label className={labelClass}>Public URL</label>
          <div className="flex items-center gap-2">
            <div className="flex-1 overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.02] px-4 py-2.5">
              <span className="truncate font-mono text-sm text-slate-400">{publicUrl}</span>
            </div>
            <button
              type="button"
              onClick={handleCopy}
              title="Copy URL"
              className="flex h-10 w-10 flex-none cursor-pointer items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-400 transition-all duration-200 hover:bg-white/[0.08] hover:text-slate-200"
            >
              {copied ? <Check size={14} className="text-pulse-green" /> : <Copy size={14} />}
            </button>
            <a
              href={publicUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Open in new tab"
              className="flex h-10 w-10 flex-none items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-slate-400 transition-all duration-200 hover:bg-white/[0.08] hover:text-slate-200"
            >
              <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Slug */}
        <div className="space-y-1.5">
          <label htmlFor="slug" className={labelClass}>
            URL Slug
          </label>
          <div className="flex items-center gap-0">
            <span className="flex-none rounded-l-lg border border-r-0 border-white/[0.08] bg-white/[0.02] px-3 py-2.5 text-sm text-slate-500">
              status.pulsee.website/
            </span>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => handleSlugChange(e.target.value.toLowerCase())}
              placeholder="your-slug"
              maxLength={40}
              className={[
                'flex-1 rounded-l-none rounded-r-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white',
                'placeholder-slate-700 transition-all duration-200',
                'focus:border-pulse-blue/50 focus:bg-white/[0.07] focus:outline-none focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]',
                slugError ? 'border-pulse-red/40' : '',
              ].join(' ')}
            />
          </div>
          {/* Validation feedback */}
          {slugError ? (
            <p className="mt-1 text-[11px] text-pulse-red">{slugError}</p>
          ) : checkingSlug ? (
            <p className="mt-1 text-[11px] text-slate-500">Checking availability…</p>
          ) : slugAvailable === true ? (
            <p className="mt-1 text-[11px] text-pulse-green">✓ Available</p>
          ) : slugAvailable === false ? (
            <p className="mt-1 text-[11px] text-pulse-red">✗ Already taken</p>
          ) : null}
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="sp-title" className={labelClass}>
              Page Title
            </label>
            <span className="text-[11px] text-slate-600">{title.length}/100</span>
          </div>
          <input
            id="sp-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 100))}
            placeholder="System Status"
            maxLength={100}
            className={inputClass}
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="sp-desc" className={labelClass}>
              Description{' '}
              <span className="normal-case text-slate-700">(optional)</span>
            </label>
            <span className="text-[11px] text-slate-600">{description.length}/500</span>
          </div>
          <textarea
            id="sp-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            placeholder="Live status and uptime for all our services."
            maxLength={500}
            rows={3}
            className={[
              inputClass,
              'resize-none leading-relaxed',
            ].join(' ')}
          />
        </div>

        {/* Logo URL */}
        <div className="space-y-1.5">
          <label htmlFor="sp-logo" className={labelClass}>
            Logo URL{' '}
            <span className="normal-case text-slate-700">(optional)</span>
          </label>
          <input
            id="sp-logo"
            type="url"
            value={logoUrl}
            onChange={(e) => {
              setLogoUrl(e.target.value)
              setLogoPreviewOk(false)
            }}
            placeholder="https://yourcompany.com/logo.png"
            className={inputClass}
          />
          {/* Live logo preview */}
          {logoUrl && (
            <div className="mt-2 flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={logoUrl}
                alt="Logo preview"
                className="h-8 max-w-[120px] rounded border border-white/[0.08] bg-white/[0.04] object-contain p-1"
                onLoad={() => setLogoPreviewOk(true)}
                onError={() => setLogoPreviewOk(false)}
                style={{ display: logoPreviewOk ? 'block' : 'none' }}
              />
              {!logoPreviewOk && (
                <span className="text-[11px] text-slate-600">
                  Preview will appear when the URL loads a valid image.
                </span>
              )}
            </div>
          )}
        </div>

        {/* Uptime history period */}
        <div className="space-y-2">
          <span className={labelClass}>Show uptime history for</span>
          <div className="flex gap-2">
            {UPTIME_PERIODS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setUptimePeriod(p)}
                className={[
                  'rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-150 cursor-pointer',
                  uptimePeriod === p
                    ? 'border-pulse-blue/50 bg-pulse-blue/10 text-pulse-blue'
                    : 'border-white/[0.08] bg-white/[0.03] text-slate-400 hover:bg-white/[0.06] hover:text-slate-200',
                ].join(' ')}
              >
                {p} days
              </button>
            ))}
          </div>
        </div>

        {/* Toggles */}
        <div className="space-y-3 border-t border-white/[0.05] pt-4">
          <Toggle
            id="show-uptime-pct"
            checked={showUptimePct}
            onChange={setShowUptimePct}
            label="Show uptime percentage on each monitor row"
            size="sm"
          />
          <Toggle
            id="show-response-time"
            checked={showResponseTime}
            onChange={setShowResponseTime}
            label="Show average response time on each monitor row"
            size="sm"
          />
          <Toggle
            id="sp-public"
            checked={isPublic}
            onChange={setIsPublic}
            label="Make status page public"
            size="sm"
          />
        </div>

        {/* Private warning */}
        {!isPublic && (
          <div className="flex items-start gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/[0.07] px-4 py-3">
            <span className="flex-none text-yellow-400" aria-hidden="true">⚠</span>
            <p className="text-sm text-yellow-300">
              Your status page is private and cannot be viewed by visitors.
            </p>
          </div>
        )}

        {/* Save */}
        <div className="pt-1">
          <Button
            variant="primary"
            size="md"
            onClick={handleSave}
            isLoading={saving}
            disabled={!!slugError || saving}
          >
            Save Settings
          </Button>
        </div>
      </div>
    </GlassCard>
  )
}
