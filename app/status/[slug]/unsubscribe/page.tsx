import type { Metadata } from 'next'
import { SubscriptionStatusLayout } from '@/components/status-page/public/SubscriptionStatusLayout'

export const metadata: Metadata = {
  title: 'Unsubscribe — Pulse',
}

interface UnsubscribePageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}

/**
 * GET /status/:slug/unsubscribe?token=xxx
 *
 * Server component — calls the backend directly.
 * Idempotent: visiting twice is safe.
 * The token is consumed server-side and never surfaced to client JS.
 */
export default async function UnsubscribePage({
  params,
  searchParams,
}: UnsubscribePageProps) {
  const { slug } = await params
  const { token } = await searchParams

  if (!token) {
    return (
      <SubscriptionStatusLayout>
        <div className="text-center">
          <div className="mb-4 text-4xl" aria-hidden="true">🔗</div>
          <h1 className="text-lg font-semibold text-gray-900">Invalid link</h1>
          <p className="mt-2 text-sm text-gray-500">
            This unsubscribe link is missing a required parameter.
          </p>
          <a
            href={`/status/${slug}`}
            className="mt-6 inline-block text-sm font-medium text-gray-700 underline underline-offset-2 hover:text-gray-900"
          >
            Return to status page
          </a>
        </div>
      </SubscriptionStatusLayout>
    )
  }

  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3000'

  let unsubscribed = false
  let statusPageTitle = ''
  let notFound = false
  let errorOccurred = false

  try {
    const res = await fetch(
      `${backendUrl}/api/status/${encodeURIComponent(slug)}/unsubscribe?token=${encodeURIComponent(token)}`,
      { cache: 'no-store' },
    )

    if (res.status === 404) {
      notFound = true
    } else if (!res.ok) {
      errorOccurred = true
    } else {
      const data = (await res.json()) as {
        unsubscribed?: boolean
        statusPageTitle?: string
      }
      unsubscribed = !!data.unsubscribed
      statusPageTitle = data.statusPageTitle ?? ''
    }
  } catch {
    errorOccurred = true
  }

  if (notFound) {
    return (
      <SubscriptionStatusLayout>
        <div className="text-center">
          <div className="mb-4 text-4xl" aria-hidden="true">❌</div>
          <h1 className="text-lg font-semibold text-gray-900">Link not found</h1>
          <p className="mt-2 text-sm text-gray-500">
            This unsubscribe link is invalid or has already been used.
          </p>
          <a
            href={`/status/${slug}`}
            className="mt-6 inline-block text-sm font-medium text-gray-700 underline underline-offset-2 hover:text-gray-900"
          >
            Return to status page
          </a>
        </div>
      </SubscriptionStatusLayout>
    )
  }

  if (errorOccurred) {
    return (
      <SubscriptionStatusLayout>
        <div className="text-center">
          <div className="mb-4 text-4xl" aria-hidden="true">⚠️</div>
          <h1 className="text-lg font-semibold text-gray-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-gray-500">
            We couldn&apos;t process your request. Please try again later.
          </p>
          <a
            href={`/status/${slug}`}
            className="mt-6 inline-block text-sm font-medium text-gray-700 underline underline-offset-2 hover:text-gray-900"
          >
            Return to status page
          </a>
        </div>
      </SubscriptionStatusLayout>
    )
  }

  return (
    <SubscriptionStatusLayout>
      <div className="text-center">
        {/* Grey tick for a neutral / done action */}
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: '#f3f4f6' }}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#6b7280"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8"
            aria-hidden="true"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-gray-900">
          {unsubscribed ? 'Unsubscribed' : 'Already unsubscribed'}
        </h1>

        {statusPageTitle && (
          <p className="mt-2 text-sm text-gray-600">
            You will no longer receive notifications for{' '}
            <strong className="font-semibold text-gray-800">{statusPageTitle}</strong>.
          </p>
        )}

        <p className="mt-3 text-sm text-gray-500">
          You can resubscribe at any time from the status page.
        </p>

        <a
          href={`/status/${slug}`}
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Return to status page
        </a>
      </div>
    </SubscriptionStatusLayout>
  )
}
