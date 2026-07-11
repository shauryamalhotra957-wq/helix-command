import { clamp, distance, hashString, median, mulberry32, round, sigmoid } from './math'
import type {
  Assignment,
  Capability,
  ForecastPoint,
  Incident,
  Insight,
  MissionAnalysis,
  Policy,
  Resource,
  Scenario,
  Sector,
  SectorRisk,
} from './types'

const capabilityLabels: Record<Capability, string> = {
  'restore-power': 'power restoration',
  triage: 'medical triage',
  evacuate: 'evacuation',
  survey: 'aerial survey',
  'contain-fire': 'fire containment',
  'restore-network': 'network recovery',
  'water-relief': 'water relief',
  reroute: 'rerouting',
  shelter: 'shelter capacity',
  supply: 'supply movement',
}

const incidentWeights: Record<Incident['kind'], Partial<Record<Capability, number>>> = {
  grid: { 'restore-power': 1.35, survey: 1.1, 'restore-network': 0.75 },
  medical: { triage: 1.35, evacuate: 1.15, shelter: 0.8 },
  flood: { 'water-relief': 1.25, evacuate: 1.15, survey: 1.05, shelter: 0.85 },
  cyber: { 'restore-network': 1.35, reroute: 1.15, survey: 0.9 },
  fire: { 'contain-fire': 1.45, evacuate: 1.15, survey: 1.05, 'water-relief': 0.75 },
  logistics: { reroute: 1.25, supply: 1.15, evacuate: 0.8, survey: 0.75 },
}

const resourceKindAffinity: Record<Incident['kind'], Partial<Record<Resource['kind'], number>>> = {
  grid: { power: 1.25, drone: 0.5, cyber: 0.25, logistics: 0.1 },
  medical: { medical: 1.25, shelter: 0.6, logistics: 0.35, drone: 0.2 },
  flood: { drone: 1.1, shelter: 0.9, logistics: 0.65, medical: 0.35, power: 0.25, field: -0.45 },
  cyber: { cyber: 1.35, drone: 0.55, logistics: 0.25, medical: -0.2 },
  fire: { field: 1.35, drone: 0.75, medical: 0.45, shelter: 0.3, power: 0.15 },
  logistics: { logistics: 1.25, drone: 0.6, shelter: 0.35, cyber: 0.2, field: 0.1 },
}

export function getSector(scenario: Scenario, sectorId: string) {
  const sector = scenario.sectors.find((candidate) => candidate.id === sectorId)
  if (!sector) throw new Error(`Missing sector ${sectorId}`)
  return sector
}

export function getIncident(scenario: Scenario, incidentId: string) {
  const incident = scenario.incidents.find((candidate) => candidate.id === incidentId)
  if (!incident) throw new Error(`Missing incident ${incidentId}`)
  return incident
}

export function getResource(scenario: Scenario, resourceId: string) {
  const resource = scenario.resources.find((candidate) => candidate.id === resourceId)
  if (!resource) throw new Error(`Missing resource ${resourceId}`)
  return resource
}

export function travelTime(resource: Resource, sector: Sector) {
  const terrainPenalty = sector.zone === 'Residential' ? 1.18 : sector.zone === 'Supply' ? 1.08 : 1
  return Math.max(4, (distance(resource.position, sector.position) / resource.speed) * terrainPenalty)
}

function matchedCapabilities(resource: Resource, incident: Incident) {
  return resource.capabilities.filter((capability) =>
    incident.requiredCapabilities.includes(capability),
  )
}

function coverageValue(resource: Resource, incident: Incident) {
  const matches = matchedCapabilities(resource, incident)
  const weighted = matches.reduce(
    (total, capability) => total + (incidentWeights[incident.kind][capability] ?? 1),
    0,
  )
  const expected = incident.requiredCapabilities.reduce(
    (total, capability) => total + (incidentWeights[incident.kind][capability] ?? 1),
    0,
  )
  return expected === 0 ? 0 : weighted / expected
}

export function computeSectorRisks(scenario: Scenario): SectorRisk[] {
  return scenario.sectors
    .map((sector) => {
      const incidents = scenario.incidents.filter((incident) => incident.sectorId === sector.id)
      const telemetry = sector.telemetry
      const infrastructureGap =
        (100 - telemetry.power) * 0.18 +
        (100 - telemetry.medical) * 0.15 +
        (100 - telemetry.mobility) * 0.14 +
        (100 - telemetry.network) * 0.14 +
        (100 - telemetry.water) * 0.14 +
        (100 - telemetry.trust) * 0.1
      const incidentPressure = incidents.reduce(
        (total, incident) =>
          total +
          incident.severity * 4.8 +
          incident.urgency * 3.2 +
          (1 - incident.stability) * 18 +
          incident.demand * 0.16,
        0,
      )
      const dependencyPressure = sector.dependencies.reduce((total, dependencyId) => {
        const dependencyIncident = scenario.incidents.find(
          (incident) => incident.sectorId === dependencyId,
        )
        return total + (dependencyIncident ? dependencyIncident.severity * 2.6 : 0)
      }, 0)
      const populationPressure = Math.log10(sector.population) * 3.5
      const score = clamp(
        infrastructureGap + incidentPressure + dependencyPressure + populationPressure + sector.criticality * 16,
      )
      const drivers = [
        incidents.length > 0 ? `${incidents.length} active incident${incidents.length > 1 ? 's' : ''}` : '',
        telemetry.power < 70 ? 'power telemetry below threshold' : '',
        telemetry.mobility < 70 ? 'mobility degradation' : '',
        telemetry.network < 70 ? 'network degradation' : '',
        telemetry.water < 70 ? 'water stress' : '',
        telemetry.trust < 70 ? 'public trust erosion' : '',
        dependencyPressure > 0 ? 'critical dependency under stress' : '',
      ].filter(Boolean)
      return { sectorId: sector.id, score: round(score, 1), drivers }
    })
    .sort((a, b) => b.score - a.score)
}

function pairScore(
  scenario: Scenario,
  incident: Incident,
  resource: Resource,
  policy: Policy,
  sectorRisk: number,
) {
  const sector = getSector(scenario, incident.sectorId)
  const eta = travelTime(resource, sector)
  const coverage = coverageValue(resource, incident)
  if (coverage === 0 || resource.status !== 'ready') return null

  const priority =
    incident.severity * 2.3 +
    incident.urgency * 2.6 +
    (1 - incident.stability) * 14 +
    sector.criticality * 10 +
    (sector.population / 250000) * policy.equityBias * 8 +
    (sectorRisk / 100) * 12
  const speedValue = Math.max(0, 36 - eta) * policy.responseBias
  const capabilityValue = coverage * 52
  const affinityValue = (resourceKindAffinity[incident.kind][resource.kind] ?? 0) * 14
  const reliabilityValue = resource.reliability * 15
  const capacityValue = (resource.capacity / Math.max(incident.demand, 1)) * 10
  const costPenalty = resource.costPerMinute * policy.budgetGuardrail * 0.18
  const randomness = mulberry32(hashString(`${scenario.seed}:${incident.id}:${resource.id}`))() * 2.2
  const score =
    priority +
    speedValue +
    capabilityValue +
    affinityValue +
    reliabilityValue +
    capacityValue -
    costPenalty +
    randomness

  return {
    eta,
    score,
    coverage,
    matches: matchedCapabilities(resource, incident),
  }
}

function incidentSatisfied(incident: Incident, assignedCapabilities: Set<Capability>, count: number) {
  const mandatoryCoverage = incident.requiredCapabilities.every((capability) =>
    assignedCapabilities.has(capability),
  )
  const minimumTeam = incident.severity >= 8.5 ? 2 : 1
  return mandatoryCoverage && count >= minimumTeam
}

export function assignResources(scenario: Scenario, policy: Policy): Assignment[] {
  const risks = new Map(computeSectorRisks(scenario).map((risk) => [risk.sectorId, risk.score]))
  const pairs = scenario.incidents.flatMap((incident) =>
    scenario.resources
      .map((resource) => {
        const scored = pairScore(scenario, incident, resource, policy, risks.get(incident.sectorId) ?? 0)
        if (!scored) return null
        return { incident, resource, ...scored }
      })
      .filter((pair): pair is NonNullable<typeof pair> => pair !== null),
  )

  const assignedResourceIds = new Set<string>()
  const assignedCounts = new Map<string, number>()
  const assignedCapabilityMap = new Map<string, Set<Capability>>()
  const selected: Assignment[] = []

  for (const pair of pairs.sort((a, b) => b.score - a.score)) {
    if (assignedResourceIds.has(pair.resource.id)) continue
    const assignedCapabilities =
      assignedCapabilityMap.get(pair.incident.id) ?? new Set<Capability>()
    const count = assignedCounts.get(pair.incident.id) ?? 0
    if (incidentSatisfied(pair.incident, assignedCapabilities, count)) continue

    pair.matches.forEach((capability) => assignedCapabilities.add(capability))
    assignedCapabilityMap.set(pair.incident.id, assignedCapabilities)
    assignedCounts.set(pair.incident.id, count + 1)
    assignedResourceIds.add(pair.resource.id)

    const riskReduced =
      pair.coverage *
      pair.incident.severity *
      pair.resource.capacity *
      pair.resource.reliability *
      (0.16 + policy.automationLevel * 0.08)
    const cost = pair.resource.costPerMinute * Math.max(20, pair.eta * 1.9)
    const matchedText = pair.matches.map((capability) => capabilityLabels[capability]).join(', ')
    selected.push({
      incidentId: pair.incident.id,
      resourceId: pair.resource.id,
      etaMinutes: round(pair.eta, 1),
      score: round(pair.score, 1),
      matchedCapabilities: pair.matches,
      riskReduced: round(riskReduced, 1),
      cost: round(cost),
      rationale: `${pair.resource.name} covers ${matchedText} with ${Math.round(
        pair.resource.reliability * 100,
      )}% reliability and a ${round(pair.eta, 1)} minute ETA.`,
      impact: `Expected to remove ${round(riskReduced, 1)} risk points from ${pair.incident.title.toLowerCase()}.`,
    })
  }

  return selected.sort((a, b) => b.riskReduced - a.riskReduced)
}

export function forecastMission(
  scenario: Scenario,
  assignments: Assignment[],
  policy: Policy,
): ForecastPoint[] {
  const initialRisks = computeSectorRisks(scenario)
  const initialRisk = initialRisks.reduce((total, risk) => total + risk.score, 0) / initialRisks.length
  const initialDemand = scenario.incidents.reduce((total, incident) => total + incident.demand, 0)
  const initialTrust =
    scenario.sectors.reduce((total, sector) => total + sector.telemetry.trust, 0) /
    scenario.sectors.length

  return Array.from({ length: 13 }, (_, index) => {
    const minute = index * 15
    const mitigation = assignments.reduce((total, assignment) => {
      const arrival = assignment.etaMinutes
      const activation = sigmoid((minute - arrival) / 18)
      return total + assignment.riskReduced * activation
    }, 0)
    const spread = scenario.incidents.reduce(
      (total, incident) =>
        total + incident.severity * (1 - incident.stability) * Math.log1p(minute + 1) * 0.34,
      0,
    )
    const operatingCost = assignments.reduce((total, assignment) => {
      const activeMinutes = Math.max(0, minute - assignment.etaMinutes + 12)
      const resource = getResource(scenario, assignment.resourceId)
      return total + activeMinutes * resource.costPerMinute
    }, 0)
    const openDemand = Math.max(
      0,
      initialDemand +
        spread * 1.6 -
        assignments.reduce((total, assignment) => {
          const resource = getResource(scenario, assignment.resourceId)
          return total + resource.capacity * sigmoid((minute - assignment.etaMinutes) / 18)
        }, 0),
    )
    const riskNow = clamp(initialRisk + spread - mitigation / scenario.sectors.length)
    const resilience = clamp(100 - riskNow + policy.automationLevel * 4)
    const publicTrust = clamp(
      initialTrust - spread * 0.15 + mitigation * 0.09 - operatingCost / 50000,
    )
    return {
      minute,
      resilience: round(resilience, 1),
      openDemand: round(openDemand, 1),
      operatingCost: round(operatingCost),
      publicTrust: round(publicTrust, 1),
    }
  })
}

function buildInsights(
  scenario: Scenario,
  assignments: Assignment[],
  unassignedIncidents: Incident[],
  risks: SectorRisk[],
  forecast: ForecastPoint[],
): Insight[] {
  const topRisk = risks[0]
  const finalForecast = forecast.at(-1)
  if (!topRisk || !finalForecast) {
    return [
      {
        id: 'insufficient-data',
        severity: 'critical',
        title: 'Mission model needs data',
        body: 'At least one sector and one forecast point are required to generate operational insights.',
      },
    ]
  }
  const topSector = getSector(scenario, topRisk.sectorId)
  const totalRiskReduced = assignments.reduce((total, assignment) => total + assignment.riskReduced, 0)
  const unassignedCapabilityPressure = unassignedIncidents.flatMap(
    (incident) => incident.requiredCapabilities,
  )
  const capabilityCounts = unassignedCapabilityPressure.reduce<Record<string, number>>(
    (counts, capability) => {
      counts[capability] = (counts[capability] ?? 0) + 1
      return counts
    },
    {},
  )
  const missingCapability = Object.entries(capabilityCounts).sort((a, b) => b[1] - a[1])[0]

  const insights: Insight[] = [
    {
      id: 'risk-frontier',
      severity: topRisk.score > 88 ? 'critical' : 'warning',
      title: `${topSector.name} is the risk frontier`,
      body: `${topRisk.drivers.slice(0, 3).join(', ') || 'Compound dependencies'} drive a ${topRisk.score}/100 sector risk score.`,
    },
    {
      id: 'mission-delta',
      severity: totalRiskReduced > 180 ? 'info' : 'warning',
      title: `${round(totalRiskReduced, 0)} risk points removed`,
      body: `The planner favors assignments that arrive fast, cover required capabilities, and protect high-criticality sectors.`,
    },
    {
      id: 'forecast-delta',
      severity: finalForecast.resilience >= 62 ? 'info' : 'warning',
      title: `${finalForecast.resilience}% resilience at T+180`,
      body: `Projected open demand falls to ${finalForecast.openDemand} while trust stabilizes at ${finalForecast.publicTrust}%.`,
    },
  ]

  if (missingCapability) {
    insights.push({
      id: 'capability-gap',
      severity: 'critical',
      title: `Capability gap: ${capabilityLabels[missingCapability[0] as Capability]}`,
      body: `${missingCapability[1]} unresolved incident requirement${missingCapability[1] > 1 ? 's' : ''} still needs dedicated capacity.`,
    })
  }

  return insights
}

export function analyzeMission(scenario: Scenario, policy: Policy): MissionAnalysis {
  const sectorRisks = computeSectorRisks(scenario)
  const assignments = assignResources(scenario, policy)
  const assignedIncidentIds = new Set(assignments.map((assignment) => assignment.incidentId))
  const unassignedIncidents = scenario.incidents.filter(
    (incident) => !assignedIncidentIds.has(incident.id),
  )
  const forecast = forecastMission(scenario, assignments, policy)
  const finalForecast = forecast.at(-1)
  if (!finalForecast) throw new Error('Mission forecast did not produce any points.')
  const riskReduced = assignments.reduce((total, assignment) => total + assignment.riskReduced, 0)
  const coverage = scenario.incidents.length === 0 ? 100 : (assignedIncidentIds.size / scenario.incidents.length) * 100
  const etaValues = assignments.map((assignment) => assignment.etaMinutes)
  const operatingCost = finalForecast.operatingCost
  const confidence = clamp(
    62 +
      assignments.reduce((total, assignment) => {
        const resource = getResource(scenario, assignment.resourceId)
        return total + resource.reliability * 3.2
      }, 0) -
      unassignedIncidents.length * 8 -
      Math.max(0, 60 - finalForecast.resilience) * 0.35,
  )
  const livesProtected = Math.round(
    riskReduced *
      (scenario.sectors.reduce((total, sector) => total + sector.population, 0) / 950000) *
      4.7,
  )

  return {
    assignments,
    unassignedIncidents,
    sectorRisks,
    forecast,
    scorecard: {
      resilience: finalForecast.resilience,
      coverage: round(coverage, 1),
      medianEta: round(median(etaValues), 1),
      riskReduced: round(riskReduced, 1),
      operatingCost,
      livesProtected,
      confidence: round(confidence, 1),
    },
    insights: buildInsights(scenario, assignments, unassignedIncidents, sectorRisks, forecast),
  }
}
