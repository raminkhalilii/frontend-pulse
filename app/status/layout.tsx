import type { ReactNode } from 'react'

/**
 * Standalone layout for public status pages.
 *
 * This is a nested layout inside the root app/layout.tsx (which provides
 * <html>, <body>, fonts, and GA4). This layout wraps all /status/* pages
 * in a light-themed container, overriding the dark dashboard background.
 *
 * System font stack is applied here so the public page doesn't depend on
 * the Inter/JetBrains Mono Google Fonts load.
 */
export default function StatusLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100dvh',
        backgroundColor: '#f8fafc',
        color: '#111827',
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      {children}
    </div>
  )
}
