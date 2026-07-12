import { Gauge, HandCoins, Scale, Waypoints } from 'lucide-react'
import type { Policy } from '../engine/types'

interface PolicyPanelProps {
  policy: Policy
  onChange: (policy: Policy) => void
}

const sliders = [
  {
    key: 'responseBias',
    label: 'Move faster',
    helper: 'Favors nearby teams and shorter ETAs.',
    icon: Gauge,
    minLabel: 'careful',
    maxLabel: 'urgent',
  },
  {
    key: 'equityBias',
    label: 'Protect people',
    helper: 'Pushes resources toward higher population exposure.',
    icon: Scale,
    minLabel: 'assets',
    maxLabel: 'residents',
  },
  {
    key: 'budgetGuardrail',
    label: 'Control cost',
    helper: 'Penalizes expensive deployments.',
    icon: HandCoins,
    minLabel: 'flexible',
    maxLabel: 'strict',
  },
  {
    key: 'automationLevel',
    label: 'Let planner act',
    helper: 'Raises confidence in automatic dispatch.',
    icon: Waypoints,
    minLabel: 'manual',
    maxLabel: 'agent',
  },
] as const

export function PolicyPanel({ policy, onChange }: PolicyPanelProps) {
  return (
    <section className="panel policy-panel" aria-label="Decision weights">
      <div className="panel__heading">
        <div>
          <p className="eyebrow">Priorities</p>
          <h2>Decision weights</h2>
        </div>
      </div>
      <div className="policy-list">
        {sliders.map(({ key, label, helper, icon: Icon, minLabel, maxLabel }) => (
          <label className="policy-control" key={key}>
            <span className="policy-control__top">
              <span>
                <Icon size={16} aria-hidden="true" />
                {label}
              </span>
              <strong>{Math.round(policy[key] * 100)}%</strong>
            </span>
            <small className="policy-control__helper">{helper}</small>
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
