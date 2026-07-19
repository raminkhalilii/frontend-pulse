import type { Metadata } from 'next'
import { SubscriptionStatusLayout } from '@/components/status-page/public/SubscriptionStatusLayout'
import type { ManagedSubscriber } from '@/types/subscriber'

export const metadata: Metadata = {
  title: 'Manage Subscription — Pulse',
}

interface ManagePageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * GET /status/:slug/manage?token=xxx
 *
 * Server component — displays masked subscription details and offers
 * an unsubscribe action. The token never reaches client-side JS.
 */
export default async function ManageSubscriptionPage({
  params,
  searchParams,
}: ManagePageProps) {
  const { slug } = await params
  const { token } = await searchParams

  if (!token) {
    return (
      <SubscriptionStatusLayout>
        <div className="text-center">
          <div className="mb-4 text-4xl" aria-hidden="true">🔗</div>
          <h1 className="text-lg font-semibold text-gray-900">Invalid link</h1>
          <p className="mt-2 text-sm text-gray-500">
            This management link is missing a required parameter.
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

  let subscriber: ManagedSubscriber | null = null
  let notFound = false
  let errorOccurred = false

  try {
    const res = await fetch(
      `${backendUrl}/api/status/${encodeURIComponent(slug)}/manage?token=${encodeURIComponent(token)}`,
      { cache: 'no-store' },
    )

    if (res.status === 404) {
      notFound = true
    } else if (!res.ok) {
      errorOccurred = true
    } else {
      subscriber = (await res.json()) as ManagedSubscriber
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
            This management link is invalid or has expired.
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

  if (errorOccurred || !subscriber) {
    return (
      <SubscriptionStatusLayout>
        <div className="text-center">
          <div className="mb-4 text-4xl" aria-hidden="true">⚠️</div>
          <h1 className="text-lg font-semibold text-gray-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-gray-500">
            We couldn&apos;t load your subscription details. Please try again later.
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

  const isUnsubscribed = !!subscriber.unsubscribedAt

  return (
    <SubscriptionStatusLayout>
      {/* Header */}
      <div className="mb-6 border-b border-gray-100 pb-5">
        <h1 className="text-xl font-bold text-gray-900">Manage Subscription</h1>
        {subscriber.statusPageTitle && (
          <p className="mt-1 text-sm text-gray-500">
            {subscriber.statusPageTitle}
          </p>
        )}
      </div>

      {/* Subscription details */}
      <dl className="space-y-4">
        {/* Email */}
        <div className="flex items-start justify-between gap-4">
          <dt className="text-sm font-medium text-gray-500">Email</dt>
          <dd className="text-sm text-gray-900 font-mono">{subscriber.email}</dd>
        </div>

        {/* Status */}
        <div className="flex items-start justify-between gap-4">
          <dt className="text-sm font-medium text-gray-500">Status</dt>
          <dd>
            {isUnsubscribed ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                Unsubscribed
              </span>
            ) : subscriber.isConfirmed ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                Pending confirmation
              </span>
            )}
          </dd>
        </div>

        {/* Subscribed since */}
        <div className="flex items-start justify-between gap-4">
          <dt className="text-sm font-medium text-gray-500">Subscribed</dt>
          <dd className="text-sm text-gray-900">{formatDate(subscriber.createdAt)}</dd>
        </div>

        {/* Confirmed at */}
        {subscriber.confirmedAt && (
          <div className="flex items-start justify-between gap-4">
            <dt className="text-sm font-medium text-gray-500">Confirmed</dt>
            <dd className="text-sm text-gray-900">{formatDate(subscriber.confirmedAt)}</dd>
          </div>
        )}

        {/* Unsubscribed at */}
        {subscriber.unsubscribedAt && (
          <div className="flex items-start justify-between gap-4">
            <dt className="text-sm font-medium text-gray-500">Unsubscribed</dt>
            <dd className="text-sm text-gray-900">{formatDate(subscriber.unsubscribedAt)}</dd>
          </div>
        )}
      </dl>

      {/* Actions */}
      <div className="mt-8 space-y-3 border-t border-gray-100 pt-6">
        {/* Back to status page */}
        <a
          href={`/status/${slug}`}
          className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          View status page
        </a>

        {/* Unsubscribe — only show when still active */}
        {!isUnsubscribed && (
          <a
            href={`/status/${slug}/unsubscribe?token=${encodeURIComponent(token)}`}
            className="flex w-full items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700"
          >
            Unsubscribe from notifications
          </a>
        )}

        {/* Re-subscribe — only show when unsubscribed */}
        {isUnsubscribed && (
          <a
            href={`/status/${slug}`}
            className="flex w-full items-center justify-center rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
          >
            Re-subscribe
          </a>
        )}
      </div>
    </SubscriptionStatusLayout>
  )
}
