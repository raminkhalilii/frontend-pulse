import type { StatusPageMonitorData, StatusPageSettings } from '@/types/status-page'
import type { Incident } from '@/types/incident'
import { MonitorStatusRow } from './MonitorStatusRow'

interface MonitorStatusListProps {
  monitors: StatusPageMonitorData[]
  settings: Pick<StatusPageSettings, 'showUptimePercentage' | 'showResponseTime' | 'uptimePeriodDays'>
  /** Active incidents — used to highlight affected monitor rows */
  activeIncidents?: Incident[]
}

export function MonitorStatusList({ monitors, settings, activeIncidents = [] }: MonitorStatusListProps) {
  // Build a lookup: monitorId → first active incident that affects it
  const incidentByMonitor = new Map<string, Pick<Incident, 'id' | 'title' | 'impact'>>()
  for (const inc of activeIncidents) {
    for (const mid of inc.affectedMonitorIds) {
      if (!incidentByMonitor.has(mid)) {
        incidentByMonitor.set(mid, { id: inc.id, title: inc.title, impact: inc.impact })
      }
    }
  }

  if (monitors.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center">
        <p className="text-sm text-gray-500">No services are currently being monitored.</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="px-5 py-3 border-b border-gray-100">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-400">
          Services ({monitors.length})
        </h2>
      </div>

      <div className="px-5">
        {monitors.map((monitor) => (
          <MonitorStatusRow
            key={monitor.id}
            monitor={monitor}
            settings={settings}
            activeIncident={incidentByMonitor.get(monitor.id) ?? null}
          />
        ))}
      </div>
    </div>
  )
}
