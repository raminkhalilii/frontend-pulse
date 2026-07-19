'use client'

import { useState, useEffect } from 'react'

interface StatusPageHeaderProps {
  title: string
  description: string | null
  logoUrl: string | null
  /** ISO timestamp of the most recent monitor check across all monitors on the page */
  lastCheckedAt: string | null
  isRefreshing: boolean
}

function timeAgo(iso: string | null): string {
  if (!iso) return 'Never'
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 10) return 'just now'
  if (diffSec < 60) return `${diffSec} seconds ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} minute${diffMin !== 1 ? 's' : ''} ago`
  const diffHr = Math.floor(diffMin / 60)
  return `${diffHr} hour${diffHr !== 1 ? 's' : ''} ago`
}

export function StatusPageHeader({
  title,
  description,
  logoUrl,
  lastCheckedAt,
  isRefreshing,
}: StatusPageHeaderProps) {
  // Tick every 30s so the "X minutes ago" stays accurate
  const [, setTick] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setTick((n) => n + 1), 30_000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="mb-8">
      {/* Logo */}
      {logoUrl && (
        <div className="mb-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={logoUrl}
            alt={`${title} logo`}
            className="h-10 max-w-[180px] object-contain"
            onError={(e) => {
              ;(e.currentTarget as HTMLImageElement).style.display = 'none'
            }}
          />
        </div>
      )}

      {/* Title */}
      <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">{title}</h1>

      {/* Description */}
      {description && (
        <p className="mt-1.5 text-base text-gray-500">{description}</p>
      )}

      {/* Last updated */}
      <p className="mt-3 text-sm text-gray-400">
        {isRefreshing ? (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-gray-500"
              aria-hidden="true"
            />
            Refreshing…
          </span>
        ) : (
          <>Last updated: {timeAgo(lastCheckedAt)}</>
        )}
      </p>
    </header>
  )
}
