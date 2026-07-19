import type { Metadata } from 'next'
import { SubscriptionStatusLayout } from '@/components/status-page/public/SubscriptionStatusLayout'

export const metadata: Metadata = {
  title: 'Confirm Subscription — Pulse',
}

interface ConfirmPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}

/**
 * GET /status/:slug/confirm?token=xxx
 *
 * Server component — the token is consumed server-side and never reaches
 * the client bundle or browser console.
 */
export default async function ConfirmSubscriptionPage({
  params,
  searchParams,
}: ConfirmPageProps) {
  const { slug } = await params
  const { token } = await searchParams

  if (!token) {
    return (
      <SubscriptionStatusLayout>
        <div className="text-center">
          <div className="mb-4 text-4xl" aria-hidden="true">🔗</div>
          <h1 className="text-lg font-semibold text-gray-900">Invalid link</h1>
          <p className="mt-2 text-sm text-gray-500">
            This confirmation link is missing a required parameter.
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

  let confirmed = false
  let statusPageTitle = ''
  let errorOccurred = false

  try {
    const res = await fetch(
      `${backendUrl}/api/status/${encodeURIComponent(slug)}/confirm?token=${encodeURIComponent(token)}`,
      { cache: 'no-store' },
    )
    const data = (await res.json()) as {
      confirmed?: boolean
      statusPageTitle?: string
      error?: string
    }
    confirmed = !!data.confirmed
    statusPageTitle = data.statusPageTitle ?? ''
  } catch {
    errorOccurred = true
  }

  if (errorOccurred) {
    return (
      <SubscriptionStatusLayout>
        <div className="text-center">
          <div className="mb-4 text-4xl" aria-hidden="true">⚠️</div>
          <h1 className="text-lg font-semibold text-gray-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-gray-500">
            We couldn&apos;t process your confirmation. Please try again later.
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

  if (!confirmed) {
    return (
      <SubscriptionStatusLayout>
        <div className="text-center">
          <div className="mb-4 text-4xl" aria-hidden="true">❌</div>
          <h1 className="text-lg font-semibold text-gray-900">Link expired or invalid</h1>
          <p className="mt-2 text-sm text-gray-500">
            This confirmation link has expired or has already been used.
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
        {/* Green tick */}
        <div
          className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: '#f0fdf4' }}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#16a34a"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-8 w-8"
            aria-hidden="true"
          >
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-gray-900">You&apos;re subscribed!</h1>

        {statusPageTitle && (
          <p className="mt-2 text-sm text-gray-600">
            You&apos;ll receive email notifications for{' '}
            <strong className="font-semibold text-gray-800">{statusPageTitle}</strong>.
          </p>
        )}

        <p className="mt-3 text-sm text-gray-500">
          We&apos;ll send you an email when an incident is created or resolved.
          You can unsubscribe at any time using the link at the bottom of each email.
        </p>

        <a
          href={`/status/${slug}`}
          className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-700"
        >
          View status page
        </a>
      </div>
    </SubscriptionStatusLayout>
  )
}
