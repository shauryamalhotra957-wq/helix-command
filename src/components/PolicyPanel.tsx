import { Gauge, HandCoins, Scale, Waypoints } from 'lucide-react'
import type { Policy } from '../engine/types'

interface PolicyPanelProps {
  policy: Policy
  onChange: (policy: Policy) => void
}

const sliders = [
  {
    key: 'responseBias',
    label: 'Response speed',
    icon: Gauge,
    minLabel: 'deliberate',
    maxLabel: 'immediate',
  },
  {
    key: 'equityBias',
    label: 'Population equity',
    icon: Scale,
    minLabel: 'critical assets',
    maxLabel: 'people first',
  },
  {
    key: 'budgetGuardrail',
    label: 'Cost guardrail',
    icon: HandCoins,
    minLabel: 'spend freely',
    maxLabel: 'strict',
  },
  {
    key: 'automationLevel',
    label: 'Autonomy level',
    icon: Waypoints,
    minLabel: 'human-led',
    maxLabel: 'agent-led',
  },
] as const

export function PolicyPanel({ policy, onChange }: PolicyPanelProps) {
  return (
    <section className="panel policy-panel" aria-label="Planner policy">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">Planner policy</p>
          <h2>Tradeoff console</h2>
        </div>
      </div>
      <div className="policy-list">
        {sliders.map(({ key, label, icon: Icon, minLabel, maxLabel }) => (
          <label className="policy-control" key={key}>
            <span className="policy-control__top">
              <span>
                <Icon size={16} aria-hidden="true" />
                {label}
              </span>
              <strong>{Math.round(policy[key] * 100)}%</strong>
            </span>
            <input
              aria-label={label}
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={policy[key]}
              onChange={(event) => onChange({ ...policy, [key]: Number(event.target.value) })}
            />
            <span className="policy-control__scale">
              <small>{minLabel}</small>
              <small>{maxLabel}</small>
            </span>
          </label>
        ))}
      </div>
    </section>
  )
}
