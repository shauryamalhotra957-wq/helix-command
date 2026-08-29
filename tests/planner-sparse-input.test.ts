import { describe, expect, it } from 'vitest'
import { analyzeMission } from '../src/engine/planner'
import type { Policy, Scenario } from '../src/engine/types'

const policy: Policy = {
  responseBias: 0.68,
  equityBias: 0.74,
  budgetGuardrail: 0.42,
  automationLevel: 0.71,
}

describe('planner sparse-input safety', () => {
  it('returns finite forecast metrics for an empty scenario', () => {
    const scenario: Scenario = {
      id: 'empty',
      name: 'Empty',
      tagline: '',
      briefing: '',
      pressure: '',
      seed: 1,
      objectives: [],
      sectors: [],
      resources: [],
      incidents: [],
    }
    const result = analyzeMission(scenario, policy)
    expect(result.forecast).toHaveLength(13)
    expect(result.forecast.every((point) => Object.values(point).every(Number.isFinite))).toBe(true)
    expect(result.scorecard.medianEta).toBe(0)
  })
})
