/**
 * Client-side port of the backend QuietHoursService.
 *
 * Uses UTC exclusively — never local server time. All functions accept
 * an optional `now` date so tests and previews can pass a fixed time
 * without mocking the global Date object.
 *
 * This module is intentionally dependency-free (no React, no API calls)
 * so it can be imported in both UI components and pure-logic tests.
 */
import type { MonitorAlertSettings } from '@/types/alert-settings'

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseHHMM(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function toMinutes(hours: number, minutes: number): number {
  return hours * 60 + minutes
}

/**
 * Returns true if `current` falls inside the window [start, end).
 *
 *  Same-day  (start < end): simple range check
 *  Overnight (start > end): crosses midnight — quiet from start OR before end
 *  Equal     (start = end): all-day quiet
 */
function isInWindow(current: number, start: number, end: number): boolean {
  if (start === end) return true
  if (start < end) return current >= start && current < end
  return current >= start || current < end
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Returns true if the given moment (defaults to now UTC) falls inside the
 * monitor's configured quiet window.
 *
 * Mirrors backend QuietHoursService.isInQuietHours exactly.
 */
export function isInQuietHours(
  settings: Pick<
    MonitorAlertSettings,
    'quietHoursEnabled' | 'quietHoursStart' | 'quietHoursEnd' | 'quietHoursDays'
  >,
  now: Date = new Date(),
): boolean {
  if (!settings.quietHoursEnabled) return false
  if (!settings.quietHoursStart || !settings.quietHoursEnd) return false

  const currentDay = now.getUTCDay()
  const days = settings.quietHoursDays

  if (!Array.isArray(days) || !days.includes(currentDay)) return false

  const currentMins = toMinutes(now.getUTCHours(), now.getUTCMinutes())
  const startMins = parseHHMM(settings.quietHoursStart)
  const endMins = parseHHMM(settings.quietHoursEnd)

  return isInWindow(currentMins, startMins, endMins)
}

/**
 * Returns the next UTC DateTime when the quiet window ends and alerts resume.
 *
 * If the end time today is already in the past, it returns tomorrow's end time.
 */
export function getNextAlertTime(
  settings: Pick<MonitorAlertSettings, 'quietHoursEnd'>,
  now: Date = new Date(),
): Date {
  if (!settings.quietHoursEnd) return now

  const [endH, endM] = settings.quietHoursEnd.split(':').map(Number)
  const candidate = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), endH, endM, 0, 0),
  )

  if (candidate > now) return candidate

  candidate.setUTCDate(candidate.getUTCDate() + 1)
  return candidate
}

/**
 * Returns a human-readable description of the quiet-hours window for display
 * in the summary sentence below the time pickers.
 *
 * Examples:
 *  - "from 22:00 to 08:00 UTC every day"
 *  - "from 22:00 to 08:00 UTC on Monday, Tuesday, Wednesday"
 */
export function formatQuietHoursSummary(
  start: string,
  end: string,
  days: number[],
): string {
  const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const allDays = days.length === 7

  const dayStr = allDays
    ? 'every day'
    : `on ${days.map((d) => DAY_NAMES[d]).join(', ')}`

  return `from ${start} to ${end} UTC ${dayStr}`
}

/**
 * Returns true if the given start > end time (meaning the window crosses midnight).
 * e.g. start="22:00", end="08:00" → true
 *      start="14:00", end="18:00" → false
 */
export function isCrossMidnight(start: string, end: string): boolean {
  if (!start || !end) return false
  return parseHHMM(start) > parseHHMM(end)
}
