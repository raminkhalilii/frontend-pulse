'use client'

import { useState, useEffect } from 'react'

export function StatusPageFooter() {
  const [utcTime, setUtcTime] = useState<string>('')

  useEffect(() => {
    function tick() {
      setUtcTime(
        new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
          timeZone: 'UTC',
        }) + ' UTC',
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <footer className="mt-10 border-t border-gray-200 pt-6 pb-8">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
        {/* Left — powered by */}
        <a
          href="https://pulsee.website"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Powered by{' '}
          <span className="font-semibold text-gray-600">Pulse</span>
        </a>

        {/* Right — UTC clock */}
        <p className="font-mono text-sm text-gray-400" aria-live="off">
          {utcTime}
        </p>
      </div>
    </footer>
  )
}
