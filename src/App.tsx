import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BrainCircuit,
  ClipboardList,
  Clock3,
  Crosshair,
  Gauge,
  MapPinned,
  Pause,
  Play,
  RefreshCcw,
  ShieldCheck,
  StepForward,
  Timer,
  Users,
} from 'lucide-react'
import { AgentPlan } from './components/AgentPlan'
import { ErrorBoundary } from './components/ErrorBoundary'
import { ForecastChart } from './components/ForecastChart'
import { IncidentQueue } from './components/IncidentQueue'
import { MetricCard } from './components/MetricCard'
import { PlanComparison } from './components/PlanComparison'
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

function formatPlace(scenario: Scenario) {
  return scenario.place ?? scenario.name
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

  const workflow = [
    {
      label: 'Situation',
      value: formatPlace(scenario),
      icon: MapPinned,
    },
    {
      label: 'Priority',
      value: selectedIncident.title,
      icon: Crosshair,
    },
    {
      label: 'Response',
      value: `${analysis.assignments.length} teams assigned`,
      icon: ShieldCheck,
    },
    {
      label: 'Projection',
      value: `${analysis.scorecard.resilience}% resilience`,
      icon: Gauge,
    },
  ]

  return (
    <div className="app-shell">
      <div className="helix-entry" aria-hidden="true">
        <div>
          <span>HELIX Command</span>
          <strong>Ops console waking</strong>
        </div>
      </div>
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            HX
          </span>
          <div>
            <h1>HELIX Command</h1>
            <p>Crisis response simulator</p>
          </div>
        </div>

        <div className="topbar__status" aria-label="Current operation">
          <span>{scenario.name}</span>
          <strong>{scenario.dataMode ?? 'Simulation'}</strong>
        </div>

        <div className="topbar__actions">
          <div className="mission-clock" aria-label="Mission clock">
            <Timer size={17} aria-hidden="true" />
            <span>T+{elapsedMinutes.toString().padStart(3, '0')}m</span>
          </div>
          <button
            className="control-button"
            type="button"
            title={autopilot ? 'Pause autopilot' : 'Resume autopilot'}
            aria-label={autopilot ? 'Pause autopilot' : 'Resume autopilot'}
            onClick={() => setAutopilot((current) => !current)}
          >
            {autopilot ? <Pause size={18} /> : <Play size={18} />}
            <span>{autopilot ? 'Pause' : 'Run'}</span>
          </button>
          <button
            className="control-button"
            type="button"
            title="Step mission clock"
            aria-label="Step mission clock"
            onClick={() => setElapsedMinutes((current) => Math.min(180, current + 15))}
          >
            <StepForward size={18} />
            <span>+15m</span>
          </button>
          <button
            className="control-button control-button--icon"
            type="button"
            title="Reset mission clock"
            aria-label="Reset mission clock"
            onClick={() => setElapsedMinutes(0)}
          >
            <RefreshCcw size={18} />
          </button>
        </div>
      </header>

      <main className="workspace">
        <section className="mission-overview" aria-label="Mission overview">
          <div className="mission-overview__brief">
            <p className="eyebrow">Live command room</p>
            <h2>{scenario.name}</h2>
            <div className="mission-meta" aria-label="Scenario data mode">
              {scenario.place && <span>{scenario.place}</span>}
              {scenario.dataMode && <span>{scenario.dataMode}</span>}
            </div>
            <p>{scenario.briefing}</p>
            <ul className="objective-list">
              {scenario.objectives.map((objective) => (
                <li key={objective}>
                  <ShieldCheck size={15} aria-hidden="true" />
                  {objective}
                </li>
              ))}
            </ul>
          </div>

          <div className="mission-overview__controls">
            <div className="scenario-switcher" aria-label="Choose drill">
              {scenarios.map((candidate) => (
                <button
                  className={`scenario-chip ${candidate.id === scenario.id ? 'is-selected' : ''}`}
                  type="button"
                  key={candidate.id}
                  onClick={() => {
                    setScenarioId(candidate.id)
                    setElapsedMinutes(18)
                  }}
                  aria-pressed={candidate.id === scenario.id}
                >
                  <strong>{candidate.name}</strong>
                  <small>{candidate.pressure}</small>
                </button>
              ))}
            </div>

            <div className="workflow-strip" aria-label="Mission flow">
              {workflow.map(({ label, value, icon: Icon }, index) => (
                <article className="workflow-step" key={label}>
                  <span>{index + 1}</span>
                  <Icon size={16} aria-hidden="true" />
                  <div>
                    <strong>{label}</strong>
                    <small>{value}</small>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="system-ribbon" aria-label="Mission system status">
          <article>
            <span>Autopilot</span>
            <strong>{autopilot ? 'Running' : 'Paused'}</strong>
          </article>
          <article>
            <span>Incident lock</span>
            <strong>{selectedIncident.title}</strong>
          </article>
          <article>
            <span>Confidence</span>
            <strong>{analysis.scorecard.confidence}%</strong>
          </article>
          <article>
            <span>Cost ceiling</span>
            <strong>{formatCost(analysis.scorecard.operatingCost)}</strong>
          </article>
        </section>

        <div className="command-grid">
          <aside className="left-rail">
            <IncidentQueue
              scenario={scenario}
              assignments={analysis.assignments}
              risks={analysis.sectorRisks}
              selectedIncidentId={selectedIncidentId}
              onSelectIncident={setSelectedIncidentId}
            />
            <PolicyPanel policy={policy} onChange={setPolicy} />
            <PlanComparison
              scenario={scenario}
              activePolicy={policy}
              activeAnalysis={analysis}
              onApply={setPolicy}
            />
          </aside>

          <section className="mission-core">
            <section className="selected-incident panel" aria-label="Selected incident">
              <div className="selected-incident__main">
                <p className="eyebrow">Selected priority</p>
                <h2>{selectedIncident.title}</h2>
                <p>{selectedIncident.description}</p>
              </div>
              <div className="selected-incident__stats">
                <span>{selectedSector.name}</span>
                <span>Severity {selectedIncident.severity.toFixed(1)}</span>
                <span>{selectedIncident.demand} demand</span>
              </div>
            </section>

            <ErrorBoundary
              fallbackTitle="3D map unavailable"
              fallbackBody="The planner is still active. This fallback appears if WebGL or the browser graphics context fails."
            >
              <Suspense
                fallback={
                  <section className="twin-fallback" role="status">
                    <BrainCircuit size={24} aria-hidden="true" />
                    <div>
                      <strong>Loading city map</strong>
                      <p>Preparing the simulation and response paths.</p>
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
                icon={Clock3}
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
        </div>
      </main>

      <footer className="app-footer">
        <div>
          <strong>HELIX Command</strong>
          <small>Scenario planner, 3D city twin, and policy comparator for crisis teams.</small>
        </div>
        <nav aria-label="Footer status">
          <span>Confidence {analysis.scorecard.confidence}%</span>
          <span>Risk removed {analysis.scorecard.riskReduced}</span>
          <span>Operating cost {formatCost(analysis.scorecard.operatingCost)}</span>
        </nav>
      </footer>
    </div>
  )
}

export default App
