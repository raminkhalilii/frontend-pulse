'use client'

import { useState, useEffect } from 'react'
import { getToken } from '@/lib/auth'

/**
 * Returns true once the client has confirmed a valid access token exists in
 * the cookie store. Initialises as false (unauthenticated) so server-rendered
 * HTML and the first client paint are consistent — no hydration mismatch.
 */
export function useAuthStatus(): boolean {
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    setAuthenticated(!!getToken())
  }, [])

  return authenticated
}
