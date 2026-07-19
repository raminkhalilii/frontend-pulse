import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { StatusPageData } from '@/types/status-page'
import { StatusPageClient } from './StatusPageClient'

// ── Server-side data fetch ────────────────────────────────────────────────────

/**
 * Fetches the public status page data directly from the NestJS backend.
 * Called on the server during SSR — does NOT go through the Next.js proxy.
 */
async function fetchStatusPageData(slug: string): Promise<StatusPageData | null> {
  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3000'
  try {
    const res = await fetch(`${backendUrl}/api/status/${encodeURIComponent(slug)}`, {
      // Revalidate every 30 seconds — matches the backend Cache-Control header
      next: { revalidate: 30 },
    })
    if (res.status === 404) return null
    if (!res.ok) return null
    return (await res.json()) as StatusPageData
  } catch {
    return null
  }
}

// ── Metadata generation ───────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const data = await fetchStatusPageData(slug)

  if (!data) {
    return { title: 'Status Page Not Found' }
  }

  const { title, description } = data.statusPage

  return {
    title: `${title} — Status`,
    description: description ?? `Live status and uptime for ${title}`,
    openGraph: {
      title: `${title} — Status`,
      description: description ?? `Live status and uptime for ${title}`,
      type: 'website',
    },
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StatusPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const initialData = await fetchStatusPageData(slug)

  if (!initialData) {
    notFound()
  }

  return <StatusPageClient slug={slug} initialData={initialData} />
}
