export type IncidentKind =
  | 'grid'
  | 'medical'
  | 'flood'
  | 'cyber'
  | 'fire'
  | 'logistics'

export type ResourceKind =
  | 'power'
  | 'medical'
  | 'drone'
  | 'field'
  | 'cyber'
  | 'shelter'
  | 'logistics'

export type Capability =
  | 'restore-power'
  | 'triage'
  | 'evacuate'
  | 'survey'
  | 'contain-fire'
  | 'restore-network'
  | 'water-relief'
  | 'reroute'
  | 'shelter'
  | 'supply'

export interface Coordinate {
  x: number
  y: number
}

export interface SectorTelemetry {
  power: number
  medical: number
  mobility: number
  network: number
  water: number
  trust: number
}

export interface Sector {
  id: string
  name: string
  zone: string
  population: number
  criticality: number
  position: Coordinate
  dependencies: string[]
  telemetry: SectorTelemetry
}

export interface Incident {
  id: string
  title: string
  kind: IncidentKind
  sectorId: string
  severity: number
  urgency: number
  stability: number
  demand: number
  startedMinutesAgo: number
  requiredCapabilities: Capability[]
  description: string
}

export interface Resource {
  id: string
  name: string
  kind: ResourceKind
  homeSectorId: string
  position: Coordinate
  capabilities: Capability[]
  capacity: number
  speed: number
  reliability: number
  costPerMinute: number
  status: 'ready' | 'assigned' | 'offline'
}

export interface Policy {
  responseBias: number
  equityBias: number
  budgetGuardrail: number
  automationLevel: number
}

export interface Scenario {
  id: string
  name: string
  tagline: string
  briefing: string
  pressure: string
  place?: string
  dataMode?: string
  seed: number
  objectives: string[]
  sectors: Sector[]
  resources: Resource[]
  incidents: Incident[]
}

export interface Assignment {
  incidentId: string
  resourceId: string
  etaMinutes: number
  score: number
  matchedCapabilities: Capability[]
  riskReduced: number
  cost: number
  rationale: string
  impact: string
}

export interface SectorRisk {
  sectorId: string
  score: number
  drivers: string[]
}

export interface ForecastPoint {
  minute: number
  resilience: number
  openDemand: number
  operatingCost: number
  publicTrust: number
}

export interface Insight {
  id: string
  severity: 'info' | 'warning' | 'critical'
  title: string
  body: string
}

export interface MissionAnalysis {
  assignments: Assignment[]
  unassignedIncidents: Incident[]
  sectorRisks: SectorRisk[]
  forecast: ForecastPoint[]
  scorecard: {
    resilience: number
    coverage: number
    medianEta: number
    riskReduced: number
    operatingCost: number
    livesProtected: number
    confidence: number
  }
  insights: Insight[]
}
