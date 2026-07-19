'use client'

import { useState, useEffect, useCallback } from 'react'
import { ExternalLink, RefreshCw } from 'lucide-react'
import GlassCard from '@/components/ui/GlassCard'
import type { StatusPageSettings } from '@/types/status-page'
import { previewStatusPage } from '@/lib/api/status-page'

interface StatusPagePreviewSectionProps {
  settings: StatusPageSettings
  /** Increment this to trigger a preview refresh from the parent */
  refreshKey?: number
}

export function StatusPagePreviewSection({
  settings,
  refreshKey = 0,
}: StatusPagePreviewSectionProps) {
  const [loading, setLoading] = useState(true)
  const [hasData, setHasData] = useState(false)
  const [manualRefreshKey, setManualRefreshKey] = useState(0)

  const effectiveKey = refreshKey + manualRefreshKey

  const checkData = useCallback(async () => {
    setLoading(true)
    try {
      const data = await previewStatusPage()
      setHasData(data !== null)
    } catch {
      setHasData(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    checkData()
  }, [checkData, effectiveKey])

  // In prod, NEXT_PUBLIC_STATUS_DOMAIN points at the status. subdomain.
  // Unset in local dev — falls back to this app's own /status/[slug] route.
  const publicUrl = process.env.NEXT_PUBLIC_STATUS_DOMAIN
    ? `${process.env.NEXT_PUBLIC_STATUS_DOMAIN}/${settings.slug}`
    : `${typeof window !== 'undefined' ? window.location.origin : ''}/status/${settings.slug}`

  /**
   * We use an iframe pointing at the actual /status/[slug] page for the preview.
   * This works even when isPublic is false because the iframe route is on our own
   * origin, and we use the /api/status-page/preview API to show a preview indicator.
   *
   * Scale: the preview is rendered at 60% scale using CSS transform so it fits in
   * the dashboard card while preserving the real layout.
   */
  const PREVIEW_WIDTH = 768
  const SCALE = 0.55

  return (
    <GlassCard hoverEffect={false} glowColor="none" className="p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Preview</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            This is how your status page looks to visitors right now.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setManualRefreshKey((k) => k + 1)}
            title="Refresh preview"
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-400 transition-all duration-200 hover:bg-white/[0.07] hover:text-slate-200"
          >
            <RefreshCw size={12} aria-hidden="true" />
            Refresh
          </button>
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-slate-400 transition-all duration-200 hover:bg-white/[0.07] hover:text-slate-200"
          >
            <ExternalLink size={12} aria-hidden="true" />
            Open full preview
          </a>
        </div>
      </div>

      {/* Preview container */}
      <div className="overflow-hidden rounded-xl border border-white/[0.06]">
        {loading ? (
          /* Loading skeleton */
          <div className="animate-pulse space-y-4 bg-white p-8">
            <div className="h-6 w-48 rounded bg-gray-100" />
            <div className="h-4 w-72 rounded bg-gray-100" />
            <div className="h-14 w-full rounded-xl bg-green-50" />
            <div className="h-40 w-full rounded-xl bg-gray-50" />
          </div>
        ) : !hasData ? (
          /* No monitors state */
          <div className="flex flex-col items-center justify-center bg-white py-14 text-center">
            <p className="text-sm font-medium text-gray-700">No monitors on this status page yet.</p>
            <p className="mt-1 text-xs text-gray-400">
              Add monitors in the section above to see a preview.
            </p>
          </div>
        ) : (
          /* Scaled iframe preview */
          <div
            style={{
              width: '100%',
              height: `${PREVIEW_WIDTH * SCALE * 0.8}px`,
              position: 'relative',
              overflow: 'hidden',
              backgroundColor: '#f8fafc',
            }}
          >
            <iframe
              key={effectiveKey}
              src={`/status/${settings.slug}`}
              title="Status page preview"
              scrolling="no"
              style={{
                width: `${PREVIEW_WIDTH}px`,
                height: `${PREVIEW_WIDTH * 0.8}px`,
                border: 'none',
                transformOrigin: 'top left',
                transform: `scale(${SCALE})`,
                pointerEvents: 'none', // read-only preview
                backgroundColor: '#f8fafc',
              }}
            />
            {/* Overlay to intercept clicks (makes it truly read-only) */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                cursor: 'default',
              }}
              aria-hidden="true"
            />
          </div>
        )}
      </div>

      {/* Not-public notice */}
      {!settings.isPublic && (
        <p className="mt-3 flex items-center gap-1.5 text-xs text-yellow-400">
          <span aria-hidden="true">⚠</span>
          Your status page is currently set to private. Visitors cannot see it until you make it
          public in the Settings section above.
        </p>
      )}
    </GlassCard>
  )
}
