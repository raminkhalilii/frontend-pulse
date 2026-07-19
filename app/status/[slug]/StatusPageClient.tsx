'use client'

import { useState, useEffect, useCallback } from 'react'
import type { StatusPageData } from '@/types/status-page'
import { getPublicStatusPage } from '@/lib/api/status-page'
import { StatusPageHeader }        from '@/components/status-page/public/StatusPageHeader'
import { OverallStatusBanner }     from '@/components/status-page/public/OverallStatusBanner'
import { IncidentCard }            from '@/components/status-page/public/IncidentCard'
import { MonitorStatusList }       from '@/components/status-page/public/MonitorStatusList'
import { IncidentHistorySection }  from '@/components/status-page/public/IncidentHistorySection'
import { StatusPageFooter }        from '@/components/status-page/public/StatusPageFooter'
import { SubscribeSection }        from '@/components/status-page/public/SubscribeSection'

const REFRESH_INTERVAL_MS = 60_000

interface StatusPageClientProps {
  slug:        string
  initialData: StatusPageData
}

/**
 * Client component that:
 *  1. Renders the public status page using SSR initial data immediately
 *  2. Polls the API every 60 seconds for fresh data (incidents included)
 *  3. Shows a "Refreshing…" indicator during background fetches
 *  4. Keeps existing data visible during refresh — no layout shift
 */
export function StatusPageClient({ slug, initialData }: StatusPageClientProps) {
  const [data,         setData]         = useState<StatusPageData>(initialData)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Derive last-checked-at: most recent timestamp across all monitors
  const lastCheckedAt =
    data.monitors
      .map((m) => m.lastCheckedAt)
      .filter((t): t is string => t !== null)
      .sort()
      .at(-1) ?? null

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const fresh = await getPublicStatusPage(slug)
      if (fresh) setData(fresh)
    } catch {
      // Silently ignore refresh errors — existing data stays visible
    } finally {
      setIsRefreshing(false)
    }
  }, [slug])

  useEffect(() => {
    const id = setInterval(refresh, REFRESH_INTERVAL_MS)
    return () => clearInterval(id)
  }, [refresh])

  const { statusPage, overallStatus, monitors, activeIncidents, recentIncidents } = data

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <StatusPageHeader
        title={statusPage.title}
        description={statusPage.description}
        logoUrl={statusPage.logoUrl}
        lastCheckedAt={lastCheckedAt}
        isRefreshing={isRefreshing}
      />

      <OverallStatusBanner overallStatus={overallStatus} />

      {/* Active incidents banner — shown between status banner and monitor list */}
      {activeIncidents.length > 0 && (
        <div className="mb-6 space-y-3">
          {activeIncidents.map((inc) => (
            <IncidentCard key={inc.id} incident={inc} monitors={monitors} />
          ))}
        </div>
      )}

      <MonitorStatusList
        monitors={monitors}
        settings={{
          showUptimePercentage: statusPage.showUptimePercentage,
          showResponseTime:     statusPage.showResponseTime,
          uptimePeriodDays:     statusPage.uptimePeriodDays,
        }}
        activeIncidents={activeIncidents}
      />

      {/* Incident history — shown below the monitor list */}
      <IncidentHistorySection
        slug={slug}
        initialIncidents={recentIncidents}
        monitors={monitors}
      />

      <SubscribeSection slug={slug} />

      <StatusPageFooter />
    </div>
  )
}
