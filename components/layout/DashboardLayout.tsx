'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Activity, Settings, LogOut, ChevronRight } from 'lucide-react'
import { removeToken, getToken } from '@/lib/auth'

// ─── Nav items ────────────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Monitors', icon: Activity },
  { href: '/settings',  label: 'Settings',  icon: Settings  },
] as const

// ─── Breadcrumb label map ─────────────────────────────────────────────────────

const PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Monitors',
  '/settings':  'Settings',
}

// ─── JWT display helper (client-side decode only — no security guarantees) ────

function parseJwtEmail(token: string | null): string | null {
  if (!token) return null
  try {
    // Base64url → Base64 → JSON
    const segment = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(segment)) as Record<string, unknown>
    return typeof payload.email === 'string' ? payload.email : null
  } catch {
    return null
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const router   = useRouter()

  const email        = parseJwtEmail(getToken())
  const avatarLetter = email ? email[0].toUpperCase() : 'U'
  const pageLabel    = PAGE_LABELS[pathname] ?? 'Page'

  function handleLogout() {
    removeToken()
    router.push('/login')
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">

      {/* ── Sidebar ───────────────────────────────────────────────────────── */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-60 md:flex-col border-r border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-white/[0.02] backdrop-blur-xl">

        {/* Logo */}
        <div className="flex h-14 flex-none items-center border-b border-white/[0.05] px-5">
          <Link href="/dashboard" className="group flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-pulse-green to-emerald-400 shadow-[0_0_14px_rgba(16,185,129,0.40)] transition-shadow duration-300 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.60)]">
              <span className="font-mono text-xs font-bold leading-none text-background">P</span>
            </div>
            <span className="font-bold tracking-tight text-white">Pulse</span>
          </Link>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600">
            Navigation
          </p>

          <ul className="space-y-0.5">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive =
                pathname === href || pathname.startsWith(`${href}/`)

              return (
                <li key={href}>
                  <Link
                    href={href}
                    className={[
                      'flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'border-pulse-blue bg-pulse-blue/10 text-pulse-blue'
                        : 'border-transparent text-slate-500 hover:border-white/10 hover:bg-white/[0.04] hover:text-slate-300',
                    ].join(' ')}
                  >
                    <Icon size={16} className="flex-none" aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="flex-none border-t border-white/[0.05] px-3 py-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 text-sm font-medium text-slate-500 transition-all duration-150 hover:border-pulse-red/50 hover:bg-pulse-red/[0.06] hover:text-pulse-red"
          >
            <LogOut size={16} className="flex-none" aria-hidden="true" />
            Log out
          </button>
        </div>
      </aside>

      {/* ── Right column ──────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col md:ml-60">

        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-14 flex-none items-center justify-between border-b border-white/[0.06] bg-background/85 px-6 backdrop-blur-xl">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
            <span className="text-slate-600">Dashboard</span>
            <ChevronRight size={13} className="flex-none text-slate-700" aria-hidden="true" />
            <span className="font-medium text-slate-300">{pageLabel}</span>
          </nav>

          {/* User badge */}
          <div className="flex items-center gap-2.5">
            {email && (
              <span className="hidden font-mono text-xs text-slate-500 sm:block">
                {email}
              </span>
            )}
            <div
              aria-label="User avatar"
              className="flex h-7 w-7 select-none items-center justify-center rounded-full border border-pulse-blue/30 bg-gradient-to-br from-pulse-blue/50 to-pulse-blue/20 text-[11px] font-bold text-white"
            >
              {avatarLetter}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-[#05080F] pb-16 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] md:pb-0">
          {children}
        </main>
      </div>

      {/* ── Mobile bottom tab bar ──────────────────────────────────────────── */}
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-stretch border-t border-white/[0.06] bg-background/95 backdrop-blur-xl md:hidden"
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(`${href}/`)
          return (
            <Link
              key={href}
              href={href}
              className={[
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors',
                isActive ? 'text-pulse-blue' : 'text-slate-500',
              ].join(' ')}
            >
              <Icon size={20} aria-hidden="true" />
              {label}
            </Link>
          )
        })}
        <button
          onClick={handleLogout}
          className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium text-slate-500 transition-colors hover:text-pulse-red"
        >
          <LogOut size={20} aria-hidden="true" />
          Log out
        </button>
      </nav>
    </div>
  )
}
