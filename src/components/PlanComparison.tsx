import { Gauge, HandCoins, ShieldCheck, Timer } from 'lucide-react'
import { analyzeMission } from '../engine/planner'
import { defaultPolicy } from '../engine/scenarios'
import type { MissionAnalysis, Policy, Scenario } from '../engine/types'

interface PlanComparisonProps {
  scenario: Scenario
  activePolicy: Policy
  activeAnalysis: MissionAnalysis
  onApply: (policy: Policy) => void
}

const strategyPresets = [
  {
    id: 'balanced',
    name: 'Balanced command',
    cue: 'Keeps speed, residents, and cost in tension.',
    policy: defaultPolicy,
  },
  {
    id: 'speed',
    name: 'Speed-first',
    cue: 'Cuts ETA by accepting higher deployment pressure.',
    policy: {
      responseBias: 0.95,
      equityBias: 0.58,
      budgetGuardrail: 0.22,
      automationLevel: 0.78,
    },
  },
  {
    id: 'people',
    name: 'People-first',
    cue: 'Prioritizes population exposure and public trust.',
    policy: {
      responseBias: 0.72,
      equityBias: 0.96,
      budgetGuardrail: 0.38,
      automationLevel: 0.68,
    },
  },
  {
    id: 'cost',
    name: 'Cost-safe',
    cue: 'Protects budget while preserving core coverage.',
    policy: {
      responseBias: 0.58,
      equityBias: 0.62,
      budgetGuardrail: 0.92,
      automationLevel: 0.48,
    },
  },
] as const

function samePolicy(left: Policy, right: Policy) {
  return (
    left.responseBias === right.responseBias &&
    left.equityBias === right.equityBias &&
    left.budgetGuardrail === right.budgetGuardrail &&
    left.automationLevel === right.automationLevel
  )
}

function formatMoney(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${Math.round(value / 1_000)}K`
  return `$${value}`
}

function formatDelta(value: number, suffix = '') {
  if (value === 0) return `0${suffix}`
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}${suffix}`
}

export function PlanComparison({
  scenario,
  activePolicy,
  activeAnalysis,
  onApply,
}: PlanComparisonProps) {
  const current = activeAnalysis.scorecard
  const strategies = strategyPresets.map((preset) => ({
    preset,
    analysis: analyzeMission(scenario, preset.policy),
  }))

  return (
    <section className="panel strategy-panel" aria-label="Strategy comparison">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">Strategy compare</p>
          <h2>Choose the operating posture</h2>
        </div>
        <Gauge size={19} aria-hidden="true" />
      </div>
      <div className="strategy-list">
        {strategies.map(({ preset, analysis }) => {
          const scorecard = analysis.scorecard
          const selected = samePolicy(activePolicy, preset.policy)
          const resilienceDelta = scorecard.resilience - current.resilience
          const etaDelta = scorecard.medianEta - current.medianEta
          const costDelta = scorecard.operatingCost - current.operatingCost

          return (
            <button
              className={`strategy-option ${selected ? 'is-selected' : ''}`}
              type="button"
              key={preset.id}
              aria-label={`Apply ${preset.name}`}
              aria-pressed={selected}
              onClick={() => onApply(preset.policy)}
            >
              <span className="strategy-option__copy">
                <strong>{preset.name}</strong>
                <small>{preset.cue}</small>
              </span>
              <span className="strategy-metrics" aria-hidden="true">
                <span className={resilienceDelta >= 0 ? 'is-positive' : 'is-negative'}>
                  <ShieldCheck size={13} />
                  {scorecard.resilience}% ({formatDelta(resilienceDelta, '%')})
                </span>
                <span className={etaDelta <= 0 ? 'is-positive' : 'is-negative'}>
                  <Timer size={13} />
                  {scorecard.medianEta}m ({formatDelta(etaDelta, 'm')})
                </span>
                <span className={costDelta <= 0 ? 'is-positive' : 'is-negative'}>
                  <HandCoins size={13} />
                  {formatMoney(scorecard.operatingCost)}
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
