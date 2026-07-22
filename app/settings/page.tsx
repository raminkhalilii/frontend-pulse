'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut, Mail, ShieldAlert } from 'lucide-react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import GlassCard from '@/components/ui/GlassCard'
import Button from '@/components/ui/Button'
import { getToken, removeToken, parseJwtEmail } from '@/lib/auth'

// ─── Profile skeleton ──────────────────────────────────────────────────────────

function ProfileSkeleton() {
  return (
    <div className="flex animate-pulse items-center gap-4 py-1">
      <div className="h-11 w-11 flex-none rounded-full bg-white/[0.06]" />
      <div className="space-y-1.5">
        <div className="h-2.5 w-16 rounded bg-white/[0.05]" />
        <div className="h-3.5 w-48 rounded bg-white/[0.06]" />
      </div>
    </div>
  )
}

// ─── Page ───────────────────────────────────────────────────────────────────────
//
// Scope note: the backend currently exposes no `/users/me`, update-profile,
// change-password, or delete-account endpoints (user.controller.ts is an empty
// stub, and the JWT payload only carries `sub` + `email` — see AuthService.
// generateTokens). So this page can only show the signed-in email (decoded
// client-side from the access token, same trick DashboardLayout already uses)
// and let the user log out. Security / connected-accounts / danger-zone
// sections are intentionally omitted rather than faked — see the backend
// gaps called out in the PR description.

export default function SettingsPage() {
  const router = useRouter()

  // Deferred until after mount: getToken() reads document.cookie, which is
  // unavailable during SSR but present on the client's first hydration pass —
  // rendering it immediately would disagree with server-rendered HTML.
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const token = mounted ? getToken() : null
  const email = token ? parseJwtEmail(token) : null

  function handleLogout() {
    removeToken()
    router.push('/')
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">

        {/* ── Page header ── */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="mt-0.5 text-sm text-slate-500">Manage your account.</p>
        </div>

        <div className="space-y-6">

          {/* ── Profile ── */}
          <GlassCard hoverEffect={false} glowColor="none" className="p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-white">Profile</h2>
              <p className="mt-0.5 text-sm text-slate-500">Your account&apos;s basic info.</p>
            </div>

            {!mounted ? (
              <ProfileSkeleton />
            ) : email ? (
              <div className="flex items-center gap-4">
                <div
                  aria-hidden="true"
                  className="flex h-11 w-11 flex-none select-none items-center justify-center rounded-full border border-pulse-blue/30 bg-gradient-to-br from-pulse-blue/50 to-pulse-blue/20 text-sm font-bold text-white"
                >
                  {email[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                    Email
                  </p>
                  <p className="flex items-center gap-1.5 text-sm text-white">
                    <Mail size={13} className="text-slate-500" aria-hidden="true" />
                    {email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <ShieldAlert size={20} className="text-pulse-red" aria-hidden="true" />
                <p className="text-sm text-slate-400">
                  We couldn&apos;t read your account details from your session.
                </p>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  Log out and sign in again
                </Button>
              </div>
            )}

            {/* No update-profile endpoint exists yet, so there is nothing editable here. */}
            <p className="mt-4 text-[11px] text-slate-600">
              Profile fields aren&apos;t editable yet.
            </p>
          </GlassCard>

          {/* ── Session ── */}
          <GlassCard hoverEffect={false} glowColor="none" className="p-5 sm:p-6">
            <div className="mb-5">
              <h2 className="text-base font-semibold text-white">Session</h2>
              <p className="mt-0.5 text-sm text-slate-500">
                Sign out of Pulse on this device.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              leftIcon={<LogOut size={14} aria-hidden="true" />}
            >
              Log out
            </Button>
          </GlassCard>

        </div>
      </div>
    </DashboardLayout>
  )
}
