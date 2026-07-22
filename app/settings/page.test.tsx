import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import SettingsPage from './page'

// Notes on scope: the backend has no `/users/me` or change-password endpoint,
// and the JWT payload carries only `sub` + `email` (no `provider` claim), so
// there is no way to distinguish a password account from an OAuth one. This
// suite tests what the page actually does — decode + display the email from
// the access token, and log out — rather than the OAuth-vs-password scenario
// from the original spec, which has no backing data.

const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}))

vi.mock('@/components/layout/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

const { getToken, removeToken } = vi.hoisted(() => ({
  getToken: vi.fn(),
  removeToken: vi.fn(),
}))

vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth')
  return { ...actual, getToken, removeToken }
})

function makeToken(payload: Record<string, unknown>) {
  const base64url = (obj: Record<string, unknown>) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_')
  return `${base64url({ alg: 'none' })}.${base64url(payload)}.sig`
}

describe('SettingsPage', () => {
  beforeEach(() => {
    pushMock.mockClear()
    getToken.mockReset()
    removeToken.mockReset()
  })

  it("renders the signed-in user's email decoded from the access token", async () => {
    getToken.mockReturnValue(makeToken({ sub: 'user-1', email: 'ramin@pulsee.website' }))
    render(<SettingsPage />)
    expect(await screen.findByText('ramin@pulsee.website')).toBeInTheDocument()
  })

  it('shows a recovery action when the token cannot be decoded', async () => {
    getToken.mockReturnValue('not-a-valid-jwt')
    render(<SettingsPage />)
    expect(await screen.findByText(/couldn.t read your account details/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /log out and sign in again/i })).toBeInTheDocument()
  })

  it('logs out and redirects to the landing page', async () => {
    getToken.mockReturnValue(makeToken({ sub: 'user-1', email: 'ramin@pulsee.website' }))
    render(<SettingsPage />)
    await screen.findByText('ramin@pulsee.website')

    fireEvent.click(screen.getByRole('button', { name: 'Log out' }))

    expect(removeToken).toHaveBeenCalled()
    expect(pushMock).toHaveBeenCalledWith('/')
  })
})
