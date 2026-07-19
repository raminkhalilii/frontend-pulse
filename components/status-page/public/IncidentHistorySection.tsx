'use client'

import { useState } from 'react'
import type { Incident } from '@/types/incident'
import type { StatusPageMonitorData } from '@/types/status-page'
import { IncidentHistoryItem } from './IncidentHistoryItem'
import { getPublicIncidents } from '@/lib/api/incidents'

// ── Date grouping ─────────────────────────────────────────────────────────────

function formatDayHeader(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year:  'numeric',
    month: 'long',
    day:   'numeric',
  })
}

function groupByDay(incidents: Incident[]): { day: string; items: Incident[] }[] {
  const map = new Map<string, Incident[]>()
  for (const inc of incidents) {
    const day = formatDayHeader(inc.startedAt)
    const existing = map.get(day)
    if (existing) {
      existing.push(inc)
    } else {
      map.set(day, [inc])
    }
  }
  return Array.from(map.entries()).map(([day, items]) => ({ day, items }))
}

// ── Component ─────────────────────────────────────────────────────────────────

interface IncidentHistorySectionProps {
  slug: string
  /** Initially resolved incidents passed from the status page SSR data */
  initialIncidents: Incident[]
  monitors: StatusPageMonitorData[]
}

const PAGE_SIZE = 10

export function IncidentHistorySection({
  slug,
  initialIncidents,
  monitors,
}: IncidentHistorySectionProps) {
  const [incidents, setIncidents] = useState<Incident[]>(initialIncidents)
  const [offset, setOffset]       = useState(initialIncidents.length)
  const [loading, setLoading]     = useState(false)
  const [exhausted, setExhausted] = useState(false)

  if (incidents.length === 0) {
    return (
      <section className="mt-10" aria-labelledby="incident-history-heading">
        <h2
          id="incident-history-heading"
          className="mb-4 text-base font-semibold text-gray-900"
        >
          Past Incidents
        </h2>
        <p className="text-sm text-gray-400">
          No incidents reported in the last 14 days.
        </p>
      </section>
    )
  }

  async function loadMore() {
    setLoading(true)
    try {
      const more = await getPublicIncidents(slug, PAGE_SIZE, offset)
      if (more.length === 0) {
        setExhausted(true)
      } else {
        setIncidents((prev) => [...prev, ...more])
        setOffset((n) => n + more.length)
        if (more.length < PAGE_SIZE) setExhausted(true)
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }

  const groups = groupByDay(incidents)

  return (
    <section className="mt-10" aria-labelledby="incident-history-heading">
      <h2
        id="incident-history-heading"
        className="mb-4 text-base font-semibold text-gray-900"
      >
        Past Incidents
      </h2>

      <div className="rounded-xl border border-gray-200 bg-white px-5">
        {groups.map(({ day, items }) => (
          <div key={day}>
            {/* Day separator */}
            <div className="py-3 border-b border-gray-100">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {day}
              </span>
            </div>

            {items.map((inc) => (
              <IncidentHistoryItem
                key={inc.id}
                incident={inc}
                monitors={monitors}
              />
            ))}
          </div>
        ))}
      </div>

      {/* Load more */}
      {!exhausted && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? (
              <>
                <span
                  className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600"
                  aria-hidden="true"
                />
                Loading…
              </>
            ) : (
              'Load older incidents'
            )}
          </button>
        </div>
      )}
    </section>
  )
}
