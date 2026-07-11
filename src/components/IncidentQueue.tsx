import {
  CloudRain,
  Flame,
  HeartPulse,
  LockKeyhole,
  Truck,
  Zap,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
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
  const assignmentCount = assignments.reduce<Record<string, number>>((counts, assignment) => {
    counts[assignment.incidentId] = (counts[assignment.incidentId] ?? 0) + 1
    return counts
  }, {})
  const riskBySector = new Map(risks.map((risk) => [risk.sectorId, risk.score]))

  return (
    <section className="panel incidents-panel" aria-label="Incident queue">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">Live incident queue</p>
          <h2>Priority stack</h2>
        </div>
        <strong>{scenario.incidents.length}</strong>
      </div>
      <div className="incident-list">
        {scenario.incidents.map((incident) => {
          const Icon = kindIcons[incident.kind]
          const sector = scenario.sectors.find((candidate) => candidate.id === incident.sectorId)
          const tone = severityTone(incident.severity)
          return (
            <button
              className={`incident-item ${selectedIncidentId === incident.id ? 'is-selected' : ''}`}
              type="button"
              key={incident.id}
              onClick={() => onSelectIncident(incident.id)}
            >
              <span className={`incident-item__icon incident-item__icon--${tone}`}>
                <Icon size={17} aria-hidden="true" />
              </span>
              <span className="incident-item__body">
                <span className="incident-item__title">{incident.title}</span>
                <span className="incident-item__meta">
                  {sector?.name} · S{incident.severity.toFixed(1)} · risk{' '}
                  {riskBySector.get(incident.sectorId)?.toFixed(0)}
                </span>
              </span>
              <span className="incident-item__badge">{assignmentCount[incident.id] ?? 0}</span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
