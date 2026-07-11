import { describe, expect, it } from 'vitest'
import { analyzeMission, assignResources, computeSectorRisks, forecastMission, getIncident, getResource } from './planner'
import { defaultPolicy, scenarios } from './scenarios'
import type { Scenario } from './types'

function scenarioAt(index: number): Scenario {
  const scenario = scenarios[index]
  if (!scenario) throw new Error(`Missing fixture scenario ${index}`)
  return scenario
}

describe('mission planner', () => {
  it('assigns ready resources that match incident capabilities', () => {
    const scenario = scenarioAt(0)
    const assignments = assignResources(scenario, defaultPolicy)

    expect(assignments.length).toBeGreaterThanOrEqual(scenario.incidents.length)
    for (const assignment of assignments) {
      const incident = getIncident(scenario, assignment.incidentId)
      const resource = getResource(scenario, assignment.resourceId)
      expect(resource.status).toBe('ready')
      expect(assignment.matchedCapabilities.length).toBeGreaterThan(0)
      expect(
        assignment.matchedCapabilities.every((capability) =>
          incident.requiredCapabilities.includes(capability),
        ),
      ).toBe(true)
    }
  })

  it('is deterministic for the same scenario and policy', () => {
    const scenario = scenarioAt(1)

    expect(assignResources(scenario, defaultPolicy)).toEqual(assignResources(scenario, defaultPolicy))
  })

  it('puts directly stressed sectors at the top of the risk ranking', () => {
    const scenario = scenarioAt(2)
    const risks = computeSectorRisks(scenario)
    const incidentSectorIds = new Set(scenario.incidents.map((incident) => incident.sectorId))

    const topRisk = risks[0]
    expect(topRisk).toBeDefined()
    expect(incidentSectorIds.has(topRisk?.sectorId ?? '')).toBe(true)
    expect(topRisk?.score).toBeGreaterThan(80)
  })

  it('forecasts improving resilience once assigned resources activate', () => {
    const scenario = scenarioAt(0)
    const assignments = assignResources(scenario, defaultPolicy)
    const forecast = forecastMission(scenario, assignments, defaultPolicy)
    const first = forecast[0]
    const last = forecast.at(-1)

    expect(forecast).toHaveLength(13)
    expect(first).toBeDefined()
    expect(last).toBeDefined()
    expect(last?.resilience).toBeGreaterThan(first?.resilience ?? 0)
    expect(last?.openDemand).toBeLessThan(first?.openDemand ?? Number.POSITIVE_INFINITY)
  })

  it('produces a complete scorecard and explainable plan', () => {
    const analysis = analyzeMission(scenarioAt(1), defaultPolicy)

    expect(analysis.scorecard.coverage).toBeGreaterThanOrEqual(75)
    expect(analysis.scorecard.confidence).toBeGreaterThan(60)
    expect(analysis.assignments[0]?.rationale).toMatch(/ETA/)
    expect(analysis.insights.length).toBeGreaterThanOrEqual(3)
  })

  it('degrades safely when no resources are available', () => {
    const scenario = {
      ...scenarioAt(0),
      resources: [],
    }

    const analysis = analyzeMission(scenario, defaultPolicy)

    expect(analysis.assignments).toHaveLength(0)
    expect(analysis.unassignedIncidents).toHaveLength(scenario.incidents.length)
    expect(analysis.scorecard.coverage).toBe(0)
    expect(analysis.scorecard.medianEta).toBe(0)
    expect(analysis.insights.length).toBeGreaterThan(0)
  })
})
