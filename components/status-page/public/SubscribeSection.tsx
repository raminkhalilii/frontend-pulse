'use client'

import { useActionState, useRef } from 'react'
import { subscribeAction, type SubscribeState } from '@/app/status/[slug]/_actions/subscribe'

interface SubscribeSectionProps {
  slug: string
}

const INITIAL_STATE: SubscribeState = { status: 'idle', message: '' }

/**
 * Email subscription form for the public status page.
 *
 * Uses React 19's useActionState + a server action so the form works
 * progressively — it functions without JavaScript via native form POST.
 *
 * States: idle → loading (isPending) → success / error / conflict / rate_limited
 */
export function SubscribeSection({ slug }: SubscribeSectionProps) {
  // Bind slug so the server action receives it as the first argument.
  // .bind() is the documented Next.js pattern for passing extra args to server actions.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const boundAction = (subscribeAction as any).bind(null, slug) as (
    prevState: SubscribeState,
    formData: FormData,
  ) => Promise<SubscribeState>

  const [state, formAction, isPending] = useActionState(boundAction, INITIAL_STATE)

  const inputRef = useRef<HTMLInputElement>(null)

  // Success — show confirmation message, no form
  if (state.status === 'success') {
    return (
      <div className="mt-10 border-t border-gray-200 pt-8">
        <div className="flex flex-col items-center gap-3 text-center">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
            style={{ backgroundColor: '#f0fdf4' }}
            aria-hidden="true"
          >
            ✉️
          </div>
          <h3 className="text-base font-semibold text-gray-900">Check your inbox</h3>
          <p className="max-w-xs text-sm text-gray-500">{state.message}</p>
        </div>
      </div>
    )
  }

  const isConflict   = state.status === 'conflict'
  const isRateLimited = state.status === 'rate_limited'
  const hasError     = state.status === 'error' || isConflict || isRateLimited

  return (
    <div className="mt-10 border-t border-gray-200 pt-8">
      <div className="flex flex-col items-center gap-4">
        {/* Heading */}
        <div className="text-center">
          <h3 className="text-sm font-semibold text-gray-900">
            Get notified about incidents
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            We&apos;ll email you when something goes wrong (or is resolved).
          </p>
        </div>

        {/* Form */}
        <form
          action={formAction}
          className="flex w-full max-w-sm flex-col gap-2 sm:flex-row"
        >
          <label htmlFor="subscribe-email" className="sr-only">
            Email address
          </label>
          <input
            ref={inputRef}
            id="subscribe-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            disabled={isPending}
            aria-invalid={hasError ? 'true' : undefined}
            aria-describedby={hasError ? 'subscribe-error' : undefined}
            className={[
              'flex-1 rounded-lg border px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400',
              'transition-colors duration-150 focus:outline-none',
              hasError && !isConflict
                ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                : isConflict
                  ? 'border-amber-400 bg-amber-50 focus:border-amber-500 focus:ring-2 focus:ring-amber-200'
                  : 'border-gray-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100',
            ].join(' ')}
          />

          <button
            type="submit"
            disabled={isPending}
            className={[
              'flex-none rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-offset-2',
              isPending
                ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                : 'cursor-pointer bg-gray-900 text-white hover:bg-gray-700 focus:ring-gray-900',
            ].join(' ')}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <svg
                  className="h-3.5 w-3.5 animate-spin"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12" cy="12" r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                  />
                </svg>
                Subscribing…
              </span>
            ) : (
              'Subscribe'
            )}
          </button>
        </form>

        {/* Inline error / warning */}
        {hasError && (
          <p
            id="subscribe-error"
            role="alert"
            className={[
              'text-center text-xs',
              isConflict || isRateLimited ? 'text-amber-700' : 'text-red-600',
            ].join(' ')}
          >
            {state.message}
          </p>
        )}

        <p className="text-[11px] text-gray-400">
          No spam. Unsubscribe any time.
        </p>
      </div>
    </div>
  )
}
