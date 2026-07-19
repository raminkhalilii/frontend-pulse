'use server'

export interface SubscribeState {
  status: 'idle' | 'success' | 'error' | 'conflict' | 'rate_limited'
  message: string
}

/**
 * Server action for the subscribe form.
 * Bound to a specific slug via Function.prototype.bind:
 *   const boundAction = subscribeAction.bind(null, slug)
 *
 * Calls the NestJS backend directly (bypassing the Next.js proxy) since
 * this runs server-side. The backend enforces Redis-based rate limiting.
 */
export async function subscribeAction(
  slug: string,
  _prevState: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  const email = ((formData.get('email') as string) ?? '').trim()

  // Basic client-side guard — the backend re-validates
  if (!email) {
    return { status: 'error', message: 'Please enter your email address.' }
  }
  if (!email.includes('@') || !email.includes('.')) {
    return { status: 'error', message: 'Please enter a valid email address.' }
  }

  const backendUrl = process.env.BACKEND_URL ?? 'http://localhost:3000'

  try {
    const res = await fetch(
      `${backendUrl}/api/status/${encodeURIComponent(slug)}/subscribe`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      },
    )

    if (res.ok) {
      return {
        status: 'success',
        message: 'Check your inbox to confirm your subscription.',
      }
    }

    if (res.status === 409) {
      return {
        status: 'conflict',
        message: 'This email is already subscribed to this status page.',
      }
    }

    if (res.status === 429) {
      return {
        status: 'rate_limited',
        message: 'Too many subscription attempts. Please try again in an hour.',
      }
    }

    const body = (await res.json().catch(() => null)) as { message?: string } | null
    const message =
      typeof body?.message === 'string'
        ? body.message
        : 'Something went wrong. Please try again.'

    return { status: 'error', message }
  } catch {
    return { status: 'error', message: 'Network error. Please try again.' }
  }
}
