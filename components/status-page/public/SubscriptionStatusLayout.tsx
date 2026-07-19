import type { ReactNode } from 'react'

interface SubscriptionStatusLayoutProps {
  children: ReactNode
}

/**
 * Shared layout for token-based subscription pages:
 *   /status/:slug/confirm
 *   /status/:slug/unsubscribe
 *   /status/:slug/manage
 *
 * Renders a centred 480 px card with the Pulse logo above and a
 * "Powered by Pulse" footer below. Uses the same #f8fafc background
 * as the public status page.
 *
 * Intentionally a server component — the token is handled server-side
 * and must never reach client-side state or console.
 */
export function SubscriptionStatusLayout({ children }: SubscriptionStatusLayoutProps) {
  return (
    <div
      style={{ backgroundColor: '#f8fafc', minHeight: '100vh' }}
      className="flex flex-col items-center justify-center px-4 py-12"
    >
      {/* Card */}
      <div className="w-full max-w-[480px]">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <a
            href="/"
            className="flex items-center gap-2.5 no-underline"
            aria-label="Pulse home"
          >
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                boxShadow: '0 0 16px rgba(16,185,129,0.35)',
              }}
            >
              <span
                className="font-mono text-sm font-bold leading-none"
                style={{ color: '#05080f' }}
              >
                P
              </span>
            </div>
            <span className="text-xl font-bold text-gray-900">Pulse</span>
          </a>
        </div>

        {/* Content card */}
        <div className="rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
          {children}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-gray-400">
          Powered by{' '}
          <a
            href="https://pulsee.website"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Pulse
          </a>
        </p>
      </div>
    </div>
  )
}
