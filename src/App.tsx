import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  ClipboardList,
  Pause,
  Play,
  RefreshCcw,
  ShieldCheck,
  Siren,
  StepForward,
  Timer,
  Users,
} from 'lucide-react'
import { AgentPlan } from './components/AgentPlan'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ForecastChart } from './components/ForecastChart'
import { IncidentQueue } from './components/IncidentQueue'
import { MetricCard } from './components/MetricCard'
import { PolicyPanel } from './components/PolicyPanel'
import { analyzeMission, getIncident, getResource, getSector } from './engine/planner'
import { defaultPolicy, scenarios } from './engine/scenarios'
import type { Incident, Policy, Scenario } from './engine/types'
import './App.css'

const DigitalTwin = lazy(() =>
  import('./components/DigitalTwin').then((module) => ({ default: module.DigitalTwin })),
)

function requireInitialScenario(): Scenario {
  const scenario = scenarios[0]
  if (!scenario) {
    throw new Error('HELIX Command requires at least one scenario.')
  }
  return scenario
}

const initialScenario = requireInitialScenario()

function getFirstIncident(scenario: Scenario): Incident {
  const incident = scenario.incidents[0]
  if (!incident) throw new Error(`Scenario ${scenario.id} does not include incidents.`)
  return incident
}

function getFirstIncidentId() {
  const incident = initialScenario.incidents[0]
  if (!incident) throw new Error('HELIX Command requires every scenario to include incidents.')
  return incident.id
}

function formatCost(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${value}`
}

function App() {
  const [scenarioId, setScenarioId] = useState(initialScenario.id)
  const [policy, setPolicy] = useState<Policy>(defaultPolicy)
  const [elapsedMinutes, setElapsedMinutes] = useState(24)
  const [autopilot, setAutopilot] = useState(true)
  const [selectedIncidentId, setSelectedIncidentId] = useState(getFirstIncidentId)

  const scenario = useMemo(
    () => scenarios.find((candidate) => candidate.id === scenarioId) ?? initialScenario,
    [scenarioId],
  )
  const analysis = useMemo(() => analyzeMission(scenario, policy), [scenario, policy])
  const selectedIncident = useMemo(
    () =>
      scenario.incidents.find((incident) => incident.id === selectedIncidentId) ??
      getFirstIncident(scenario),
    [scenario, selectedIncidentId],
  )
  const selectedSector = useMemo(
    () => getSector(scenario, selectedIncident.sectorId),
    [scenario, selectedIncident],
  )

  useEffect(() => {
    if (!scenario.incidents.some((incident) => incident.id === selectedIncidentId)) {
      setSelectedIncidentId(getFirstIncident(scenario).id)
    }
  }, [scenario, selectedIncidentId])

  useEffect(() => {
    if (!autopilot) return undefined
    const timer = window.setInterval(() => {
      setElapsedMinutes((current) => (current >= 180 ? 0 : current + 3))
    }, 900)
    return () => window.clearInterval(timer)
  }, [autopilot])

  const eventLog = useMemo(
    () =>
      analysis.assignments.slice(0, 5).map((assignment, index) => {
        const incident = getIncident(scenario, assignment.incidentId)
        const resource = getResource(scenario, assignment.resourceId)
        return {
          id: `${assignment.incidentId}-${assignment.resourceId}`,
          time: `T+${Math.round(assignment.etaMinutes + index * 4)}m`,
          title: `${resource.name} -> ${incident.title}`,
          body: assignment.impact,
        }
      }),
    [analysis.assignments, scenario],
  )

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            HC
          </span>
          <div>
            <h1>HELIX Command</h1>
            <p>Agentic resilience twin</p>
          </div>
        </div>
        <div className="mission-clock" aria-label="Mission clock">
          <Timer size={17} aria-hidden="true" />
          <span>T+{elapsedMinutes.toString().padStart(3, '0')}m</span>
        </div>
        <div className="topbar__actions">
          <button
            className="icon-button"
            type="button"
            title={autopilot ? 'Pause autopilot' : 'Resume autopilot'}
            aria-label={autopilot ? 'Pause autopilot' : 'Resume autopilot'}
            onClick={() => setAutopilot((current) => !current)}
          >
            {autopilot ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            className="icon-button"
            type="button"
            title="Step mission clock"
            aria-label="Step mission clock"
            onClick={() => setElapsedMinutes((current) => Math.min(180, current + 15))}
          >
            <StepForward size={18} />
          </button>
          <button
            className="icon-button"
            type="button"
            title="Reset mission clock"
            aria-label="Reset mission clock"
            onClick={() => setElapsedMinutes(0)}
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </header>

      <main className="command-grid">
        <aside className="left-rail">
          <section className="panel scenario-panel" aria-label="Scenario selection">
            <div className="panel__heading">
              <div>
                <p className="eyebrow">Scenario theatre</p>
                <h2>Active crisis</h2>
              </div>
              <Siren size={19} aria-hidden="true" />
            </div>
            <div className="scenario-list">
              {scenarios.map((candidate) => (
                <button
                  className={`scenario-option ${candidate.id === scenario.id ? 'is-selected' : ''}`}
                  type="button"
                  key={candidate.id}
                  onClick={() => {
                    setScenarioId(candidate.id)
                    setElapsedMinutes(18)
                  }}
                  aria-pressed={candidate.id === scenario.id}
                >
                  <span>
                    <strong>{candidate.name}</strong>
                    <small>{candidate.pressure}</small>
                  </span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              ))}
            </div>
          </section>
          <PolicyPanel policy={policy} onChange={setPolicy} />
          <IncidentQueue
            scenario={scenario}
            assignments={analysis.assignments}
            risks={analysis.sectorRisks}
            selectedIncidentId={selectedIncidentId}
            onSelectIncident={setSelectedIncidentId}
          />
        </aside>

        <section className="mission-core">
          <section className="mission-brief">
            <div>
              <p className="eyebrow">Current operation</p>
              <h2>{scenario.name}</h2>
              <div className="mission-meta" aria-label="Scenario data mode">
                {scenario.place && <span>{scenario.place}</span>}
                {scenario.dataMode && <span>{scenario.dataMode}</span>}
              </div>
              <p>{scenario.briefing}</p>
            </div>
            <ul className="objective-list">
              {scenario.objectives.map((objective) => (
                <li key={objective}>
                  <ShieldCheck size={15} aria-hidden="true" />
                  {objective}
                </li>
              ))}
            </ul>
          </section>

          <ErrorBoundary
            fallbackTitle="3D twin unavailable"
            fallbackBody="The planner is still active. This fallback appears if WebGL or the browser graphics context fails."
          >
            <Suspense
              fallback={
                <section className="twin-fallback" role="status">
                  <BrainCircuit size={24} aria-hidden="true" />
                  <div>
                    <strong>Loading digital twin</strong>
                    <p>Preparing the city simulation and response paths.</p>
                  </div>
                </section>
              }
            >
              <DigitalTwin
                scenario={scenario}
                analysis={analysis}
                elapsedMinutes={elapsedMinutes}
                selectedIncidentId={selectedIncidentId}
              />
            </Suspense>
          </ErrorBoundary>

          <div className="metric-grid">
            <MetricCard
              icon={Activity}
              label="Resilience"
              value={`${analysis.scorecard.resilience}%`}
              detail="T+180 projection"
              tone="green"
            />
            <MetricCard
              icon={ClipboardList}
              label="Coverage"
              value={`${analysis.scorecard.coverage}%`}
              detail="incidents assigned"
              tone="cyan"
            />
            <MetricCard
              icon={Timer}
              label="Median ETA"
              value={`${analysis.scorecard.medianEta}m`}
              detail="first-wave response"
              tone="amber"
            />
            <MetricCard
              icon={Users}
              label="Protected"
              value={analysis.scorecard.livesProtected.toLocaleString()}
              detail="modeled residents"
              tone="red"
            />
          </div>

          <section className="selected-incident panel" aria-label="Selected incident">
            <div className="selected-incident__main">
              <p className="eyebrow">Selected incident</p>
              <h2>{selectedIncident.title}</h2>
              <p>{selectedIncident.description}</p>
            </div>
            <div className="selected-incident__stats">
              <span>{selectedSector.name}</span>
              <span>S{selectedIncident.severity.toFixed(1)}</span>
              <span>{selectedIncident.demand} demand</span>
            </div>
          </section>

          <ForecastChart points={analysis.forecast} />

          <section className="panel event-panel" aria-label="Mission event log">
            <div className="panel__heading">
              <div>
                <p className="eyebrow">Execution trace</p>
                <h2>Next moves</h2>
              </div>
              <BrainCircuit size={19} aria-hidden="true" />
            </div>
            <div className="event-list">
              {eventLog.map((event) => (
                <article className="event-item" key={event.id}>
                  <time>{event.time}</time>
                  <div>
                    <strong>{event.title}</strong>
                    <p>{event.body}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </section>

        <AgentPlan
          scenario={scenario}
          assignments={analysis.assignments}
          insights={analysis.insights}
          selectedIncidentId={selectedIncidentId}
        />
      </main>

      <footer className="app-footer">
        <span>Confidence {analysis.scorecard.confidence}%</span>
        <span>Risk removed {analysis.scorecard.riskReduced}</span>
        <span>Operating cost {formatCost(analysis.scorecard.operatingCost)}</span>
      </footer>
    </div>
  )
}

export default App
