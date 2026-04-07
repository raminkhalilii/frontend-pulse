'use client'

import { Suspense, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { setToken } from '@/lib/auth'

/**
 * OAuth callback handler.
 *
 * The backend redirects here after a successful Google/GitHub login with
 * `?access_token=<jwt>` in the query string. We persist the token in the
 * `pulse_access_token` cookie (so middleware + API client can read it) and
 * then push the user into the dashboard.
 */
function CallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const processed = useRef(false) // Prevents React Strict Mode double-firing

  useEffect(() => {
    if (processed.current) return

    const token = searchParams.get('access_token')

    if (token) {
      processed.current = true

      // setToken is sync (writes document.cookie) but wrap in Promise.resolve
      // so a future async refactor (e.g. server-set httpOnly cookie) Just Works.
      Promise.resolve(setToken(token)).then(() => {
        // Strip the token from the URL so it doesn't sit in browser history
        window.history.replaceState({}, document.title, window.location.pathname)
        router.replace('/dashboard')
      })
    } else {
      // Someone hit /auth/callback without a token — bounce back to login
      router.replace('/login')
    }
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <p className="text-white/50 text-sm animate-pulse">Completing sign in…</p>
    </div>
  )
}

export default function AuthCallbackPage() {
  // useSearchParams() must be wrapped in <Suspense> in the App Router
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
          <p className="text-white/50 text-sm animate-pulse">Completing sign in…</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  )
}
