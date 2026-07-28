import {
  CloudRain,
  Flame,
  HeartPulse,
  LockKeyhole,
  Truck,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useState } from 'react'
import type { Assignment, Incident, Scenario, SectorRisk } from '../engine/types'

interface IncidentQueueProps {
  scenario: Scenario
  assignments: Assignment[]
  risks: SectorRisk[]
  selectedIncidentId: string
  onSelectIncident: (incidentId: string) => void
}

const kindIcons: Record<Incident['kind'], LucideIcon> = {
  grid: Zap,
  medical: HeartPulse,
  flood: CloudRain,
  cyber: LockKeyhole,
  fire: Flame,
  logistics: Truck,
}

type IncidentFilter = 'all' | 'priority' | 'critical'

const incidentFilters: Array<{
  id: IncidentFilter
  label: string
  minimumSeverity: number
}> = [
  { id: 'all', label: 'All', minimumSeverity: 0 },
  { id: 'priority', label: 'Priority', minimumSeverity: 8 },
  { id: 'critical', label: 'Critical', minimumSeverity: 8.5 },
]

function severityTone(severity: number) {
  if (severity >= 8.5) return 'critical'
  if (severity >= 7.5) return 'warning'
  return 'info'
}

export function IncidentQueue({
  scenario,
  assignments,
  risks,
  selectedIncidentId,
  onSelectIncident,
}: IncidentQueueProps) {
  const [filter, setFilter] = useState<IncidentFilter>('all')
  const assignmentCount = assignments.reduce<Record<string, number>>((counts, assignment) => {
    counts[assignment.incidentId] = (counts[assignment.incidentId] ?? 0) + 1
    return counts
  }, {})
  const riskBySector = new Map(risks.map((risk) => [risk.sectorId, risk.score]))
  const minimumSeverity =
    incidentFilters.find((candidate) => candidate.id === filter)?.minimumSeverity ?? 0
  const visibleIncidents = scenario.incidents.filter(
    (incident) => incident.severity >= minimumSeverity,
  )

  const applyFilter = (nextFilter: (typeof incidentFilters)[number]) => {
    setFilter(nextFilter.id)
    const nextIncidents = scenario.incidents.filter(
      (incident) => incident.severity >= nextFilter.minimumSeverity,
    )
    const firstNextIncident = nextIncidents[0]
    if (
      firstNextIncident &&
      !nextIncidents.some((incident) => incident.id === selectedIncidentId)
    ) {
      onSelectIncident(firstNextIncident.id)
    }
  }

  return (
    <section className="panel incidents-panel" aria-label="Incident queue">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">Incident queue</p>
          <h2>What needs attention</h2>
        </div>
        <strong className="panel-count" aria-live="polite">
          {visibleIncidents.length} of {scenario.incidents.length}
        </strong>
      </div>
      <div className="incident-filters" role="group" aria-label="Filter incident queue">
        {incidentFilters.map((candidate) => (
          <button
            className="incident-filter"
            type="button"
            key={candidate.id}
            aria-label={`Show ${candidate.label.toLowerCase()} incidents`}
            aria-pressed={filter === candidate.id}
            onClick={() => applyFilter(candidate)}
          >
            {candidate.label}
          </button>
        ))}
      </div>
      <div className="incident-list">
        {visibleIncidents.map((incident) => {
          const Icon = kindIcons[incident.kind]
          const sector = scenario.sectors.find((candidate) => candidate.id === incident.sectorId)
          const tone = severityTone(incident.severity)
          return (
            <button
              className={`incident-item ${selectedIncidentId === incident.id ? 'is-selected' : ''}`}
              type="button"
              key={incident.id}
              onClick={() => onSelectIncident(incident.id)}
              aria-pressed={selectedIncidentId === incident.id}
            >
              <span className={`incident-item__icon incident-item__icon--${tone}`}>
                <Icon size={17} aria-hidden="true" />
              </span>
              <span className="incident-item__body">
                <span className="incident-item__title">{incident.title}</span>
                <span className="incident-item__meta">
                  {sector?.name} | Severity {incident.severity.toFixed(1)} | risk{' '}
                  {riskBySector.get(incident.sectorId)?.toFixed(0)}
                </span>
              </span>
              <span className="incident-item__badge" aria-label={`${assignmentCount[incident.id] ?? 0} teams`}>
                {assignmentCount[incident.id] ?? 0}
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
