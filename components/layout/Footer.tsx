import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────

interface NavLink {
  label: string
  href: string
}

interface TechPill {
  label: string
  description: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const NAV_GROUPS: { title: string; links: NavLink[] }[] = [
  {
    title: 'Product',
    links: [
      { label: 'Dashboard',    href: '/dashboard' },
      { label: 'Monitors',     href: '/dashboard' },
      { label: 'Incidents',    href: '/dashboard' },
      { label: 'Status Pages', href: '/dashboard' },
    ],
  },
  {
    title: 'Developers',
    links: [
      { label: 'REST API',       href: '#' },
      { label: 'WebSocket Docs', href: '#' },
      { label: 'OpenAPI Spec',   href: '#' },
      { label: 'Changelog',      href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About',    href: '#' },
      { label: 'Blog',     href: '#' },
      { label: 'Security', href: '#' },
      { label: 'Privacy',  href: '#' },
    ],
  },
]

const TECH_STACK: TechPill[] = [
  { label: 'Next.js 16',    description: 'Frontend' },
  { label: 'Nest.js',       description: 'API Gateway' },
  { label: 'PostgreSQL',    description: 'Persistence' },
  { label: 'Redis',         description: 'Queue / Cache' },
  { label: 'BullMQ',        description: 'Job Engine' },
  { label: 'Socket.io',     description: 'Real-time' },
  { label: 'Docker',        description: 'Infrastructure' },
  { label: 'TypeScript',    description: 'Type Safety' },
]

// ─── Component ────────────────────────────────────────────────────────────────

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-background border-t border-white/[0.05]">
      {/* ── Main grid ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">

          {/* Brand column */}
          <div className="col-span-2 lg:col-span-2 flex flex-col gap-5">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center gap-2.5 group w-fit">
              <div className="relative w-7 h-7 flex-none">
                <div className="absolute inset-0 rounded-full bg-pulse-green/20 blur-sm group-hover:blur-md transition-all duration-300" />
                <div className="relative w-7 h-7 rounded-full border border-pulse-green/40 flex items-center justify-center bg-pulse-green/5">
                  <span className="w-2 h-2 rounded-full bg-pulse-green shadow-[0_0_8px_#10B981]" />
                </div>
              </div>
              <span className="font-mono text-sm font-semibold tracking-[0.18em] text-white">
                PULSE
              </span>
            </Link>

            <p className="text-sm text-slate-500 leading-relaxed max-w-xs">
              SaaS-grade uptime monitoring with real-time WebSocket alerts,
              distributed workers, and zero-config setup.
            </p>

            {/* Status indicator */}
            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pulse-green opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-pulse-green" />
              </span>
              <span className="text-[11px] font-mono text-slate-600">All systems operational</span>
            </div>
          </div>

          {/* Nav groups */}
          {NAV_GROUPS.map(group => (
            <div key={group.title} className="flex flex-col gap-3">
              <p className="text-[11px] font-mono text-slate-600 tracking-widest uppercase">
                {group.title}
              </p>
              <ul className="flex flex-col gap-2.5">
                {group.links.map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-500 hover:text-slate-200 transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tech stack band ── */}
      <div className="border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-3">
            <span className="text-[10px] font-mono text-slate-700 tracking-widest uppercase mr-1 flex-none">
              Architecture
            </span>
            {TECH_STACK.map(tech => (
              <div
                key={tech.label}
                title={tech.description}
                className="group flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 opacity-40 hover:opacity-100 transition-opacity duration-300 cursor-default"
              >
                <span className="text-[11px] font-mono text-slate-400 group-hover:text-slate-200 transition-colors duration-200">
                  {tech.label}
                </span>
                <span className="text-[9px] text-slate-700 group-hover:text-slate-600 transition-colors duration-200 hidden sm:block">
                  · {tech.description}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] font-mono text-slate-700">
            © {year} Pulse. Built with precision.
          </p>
          <div className="flex items-center gap-5">
            {(['Terms', 'Privacy', 'Security'] as const).map(item => (
              <Link
                key={item}
                href="#"
                className="text-[11px] font-mono text-slate-700 hover:text-slate-500 transition-colors duration-200"
              >
                {item}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
