import { BrainCircuit, CheckCircle2, Clock3, Route, ShieldAlert } from 'lucide-react'
import type { Assignment, Incident, Insight, Resource, Scenario } from '../engine/types'

interface AgentPlanProps {
  scenario: Scenario
  assignments: Assignment[]
  insights: Insight[]
  selectedIncidentId: string
}

function formatCost(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function lookup<T extends Incident | Resource>(items: T[], id: string) {
  const item = items.find((candidate) => candidate.id === id)
  if (!item) throw new Error(`Missing item ${id}`)
  return item
}

export function AgentPlan({ scenario, assignments, insights, selectedIncidentId }: AgentPlanProps) {
  const selectedAssignments = assignments.filter(
    (assignment) => assignment.incidentId === selectedIncidentId,
  )
  const visibleAssignments = selectedAssignments.length > 0 ? selectedAssignments : assignments.slice(0, 4)

  return (
    <aside className="right-rail">
      <section className="panel plan-panel" aria-label="Agent plan">
        <div className="panel__heading">
          <div>
            <p className="eyebrow">Explainable agent plan</p>
            <h2>Dispatch logic</h2>
          </div>
          <BrainCircuit size={19} aria-hidden="true" />
        </div>
        <div className="assignment-list">
          {visibleAssignments.map((assignment) => {
            const incident = lookup(scenario.incidents, assignment.incidentId)
            const resource = lookup(scenario.resources, assignment.resourceId)
            return (
              <article className="assignment-item" key={`${assignment.incidentId}-${assignment.resourceId}`}>
                <div className="assignment-item__top">
                  <strong>{resource.name}</strong>
                  <span>score {assignment.score}</span>
                </div>
                <p>{incident.title}</p>
                <div className="assignment-item__stats">
                  <span>
                    <Clock3 size={13} aria-hidden="true" />
                    {assignment.etaMinutes}m ETA
                  </span>
                  <span>
                    <ShieldAlert size={13} aria-hidden="true" />
                    -{assignment.riskReduced}
                  </span>
                  <span>
                    <Route size={13} aria-hidden="true" />
                    {formatCost(assignment.cost)}
                  </span>
                </div>
                <small>{assignment.rationale}</small>
              </article>
            )
          })}
        </div>
      </section>
      <section className="panel insights-panel" aria-label="Planner insights">
        <div className="panel__heading">
          <div>
            <p className="eyebrow">Risk intelligence</p>
            <h2>What changed</h2>
          </div>
          <CheckCircle2 size={19} aria-hidden="true" />
        </div>
        <div className="insight-list">
          {insights.map((insight) => (
            <article className={`insight insight--${insight.severity}`} key={insight.id}>
              <strong>{insight.title}</strong>
              <p>{insight.body}</p>
            </article>
          ))}
        </div>
      </section>
    </aside>
  )
}
