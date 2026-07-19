'use client'

import { Fragment } from 'react'

// ── Inline token types ────────────────────────────────────────────────────────

type Token =
  | { t: 'text';   v: string }
  | { t: 'bold';   v: string }
  | { t: 'italic'; v: string }
  | { t: 'code';   v: string }
  | { t: 'link';   v: string; href: string }

// ── Tokeniser ─────────────────────────────────────────────────────────────────

const RULES: [RegExp, (m: RegExpMatchArray) => Token][] = [
  [/^\*\*(.+?)\*\*/,           (m) => ({ t: 'bold',   v: m[1] })],
  [/^\*(.+?)\*/,               (m) => ({ t: 'italic', v: m[1] })],
  [/^`([^`]+)`/,                (m) => ({ t: 'code',   v: m[1] })],
  [/^\[([^\]]+)\]\(([^)]+)\)/, (m) => ({ t: 'link',   v: m[1], href: m[2] })],
]

function tokenise(text: string): Token[] {
  const tokens: Token[] = []
  let rest = text

  outer: while (rest.length > 0) {
    for (const [re, build] of RULES) {
      const m = rest.match(re)
      if (m) {
        tokens.push(build(m))
        rest = rest.slice(m[0].length)
        continue outer
      }
    }
    // Consume one character as plain text (merge with previous text token if possible)
    const last = tokens[tokens.length - 1]
    if (last?.t === 'text') {
      last.v += rest[0]
    } else {
      tokens.push({ t: 'text', v: rest[0] })
    }
    rest = rest.slice(1)
  }

  return tokens
}

// ── Token renderer ────────────────────────────────────────────────────────────

interface RendererProps {
  /**
   * 'light' → public status page (gray code bg, blue links)
   * 'dark'  → dashboard (translucent code bg, lighter blue links)
   */
  variant?: 'light' | 'dark'
  content: string
  className?: string
}

export function MarkdownRenderer({ content, variant = 'light', className = '' }: RendererProps) {
  const codeClass =
    variant === 'light'
      ? 'rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.8em] text-gray-700'
      : 'rounded bg-white/10 px-1 py-0.5 font-mono text-[0.8em] text-slate-300'

  const linkClass =
    variant === 'light'
      ? 'text-blue-600 underline underline-offset-2 hover:text-blue-800 transition-colors'
      : 'text-pulse-blue underline underline-offset-2 hover:text-blue-300 transition-colors'

  // Split on newlines — each line is rendered separately with inline tokens
  const lines = content.split('\n')

  return (
    <span className={className}>
      {lines.map((line, li) => {
        const tokens = tokenise(line)
        return (
          <Fragment key={li}>
            {li > 0 && <br />}
            {tokens.map((tok, ti) => {
              if (tok.t === 'bold')   return <strong key={ti}>{tok.v}</strong>
              if (tok.t === 'italic') return <em key={ti}>{tok.v}</em>
              if (tok.t === 'code')   return <code key={ti} className={codeClass}>{tok.v}</code>
              if (tok.t === 'link')
                return (
                  <a
                    key={ti}
                    href={tok.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    {tok.v}
                  </a>
                )
              return <Fragment key={ti}>{tok.v}</Fragment>
            })}
          </Fragment>
        )
      })}
    </span>
  )
}
