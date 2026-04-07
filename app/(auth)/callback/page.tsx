'use client'

import { useEffect } from 'react'
import { setToken } from '@/lib/auth'

export default function AuthCallbackPage() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('access_token')
    if (token) {
      setToken(token)
      // Remove the token from the URL bar before navigating
      window.history.replaceState({}, document.title, window.location.pathname)
    }
    window.location.replace('/dashboard')
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <p className="text-white/50 text-sm animate-pulse">Completing sign in…</p>
    </div>
  )
}
