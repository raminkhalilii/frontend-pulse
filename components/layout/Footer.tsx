import Link from 'next/link'
import { ArchitectureButton } from '@/components/layout/ArchitectureButton'

// ─── Types ────────────────────────────────────────────────────────────────────

interface TechPill {
  label: string
  description: string
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TECH_STACK: TechPill[] = [
  { label: 'Next.js 16',  description: 'Frontend'       },
  { label: 'Nest.js',     description: 'API Gateway'    },
  { label: 'PostgreSQL',  description: 'Persistence'    },
  { label: 'Redis',       description: 'Queue / Cache'  },
  { label: 'BullMQ',      description: 'Job Engine'     },
  { label: 'Socket.io',   description: 'Real-time'      },
  { label: 'Docker',      description: 'Infrastructure' },
  { label: 'TypeScript',  description: 'Type Safety'    },
]

// ─── Social icons (neither is available in this version of lucide-react) ─────

function GithubIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0 1 12 6.836a9.59 9.59 0 0 1 2.504.337c1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.163 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  )
}

function LinkedInIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

// ─── Shared link class (matches original footer links exactly) ────────────────

const LINK_CLASS =
  'text-sm text-slate-500 hover:text-slate-200 transition-colors duration-200'

// ─── Component ────────────────────────────────────────────────────────────────

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-background border-t border-white/[0.05]">

      {/* ── Main grid ── */}
      <div className="max-w-7xl mx-auto px-6 lg:px-12 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">

          {/* ── Brand column (unchanged) ── */}
          <div className="col-span-2 lg:col-span-2 flex flex-col gap-5">
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

            <div className="flex items-center gap-2">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pulse-green opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-pulse-green" />
              </span>
              <span className="text-[11px] font-mono text-slate-600">All systems operational</span>
            </div>
          </div>

          {/* ── Live App ── */}
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-mono text-slate-600 tracking-widest uppercase">
              Live App
            </p>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link href="/dashboard" className={LINK_CLASS}>
                  Dashboard
                </Link>
              </li>
              <li>
                <Link href="/login" className={LINK_CLASS}>
                  Login
                </Link>
              </li>
              <li>
                {/* Client island — opens TechStackModal without making the
                    entire Footer a client component */}
                <ArchitectureButton />
              </li>
            </ul>
          </div>

          {/* ── Source Code ── */}
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-mono text-slate-600 tracking-widest uppercase">
              Source Code
            </p>
            <ul className="flex flex-col gap-2.5">
              <li>
                <a
                  href="https://github.com/raminkhalilii/pulse"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LINK_CLASS}
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                {/* TODO: Replace "#" with your Swagger UI path once confirmed
                    (NestJS typically serves it at /api or /api-docs in main.ts) */}
                <a
                  href="#"
                  className={LINK_CLASS}
                >
                  REST API Docs
                </a>
              </li>
            </ul>
          </div>

          {/* ── Connect ── */}
          <div className="flex flex-col gap-3">
            <p className="text-[11px] font-mono text-slate-600 tracking-widest uppercase">
              Connect
            </p>
            <ul className="flex flex-col gap-2.5">
              <li>
                <a
                  href="https://www.linkedin.com/in/raaminkhalili"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LINK_CLASS}
                >
                  LinkedIn
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/raminkhalilii"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={LINK_CLASS}
                >
                  GitHub Profile
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* ── Tech stack band (unchanged) ── */}
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

          {/* Social icon row */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/raminkhalilii"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub profile"
              className="text-slate-600 transition-all duration-200 hover:text-pulse-green hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.65)]"
            >
              <GithubIcon />
            </a>
            <a
              href="https://www.linkedin.com/in/raaminkhalili"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn profile"
              className="text-slate-600 transition-all duration-200 hover:text-pulse-green hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.65)]"
            >
              <LinkedInIcon />
            </a>
          </div>

        </div>
      </div>

    </footer>
  )
}
