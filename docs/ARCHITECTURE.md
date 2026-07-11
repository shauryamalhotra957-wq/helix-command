# Architecture

HELIX Command separates the project into a pure planning engine and a reactive visualization shell.

## Core Flow

```text
Scenario data
  -> sector risk scoring
  -> resource-to-incident scoring
  -> dispatch assignment
  -> 180-minute forecast
  -> insights and explainability
  -> React + Three.js command center
```

## Engine

The engine lives in `src/engine`.

- `scenarios.ts` defines sectors, incidents, resources, objectives, and default policy. It includes a Mumbai real-place drill with named city infrastructure and synthetic telemetry.
- `planner.ts` computes sector risk, resource assignments, forecasts, scorecards, and insights.
- `math.ts` contains deterministic helpers such as distance, median, seeded randomness, and clamping.
- `types.ts` defines the domain model.

The planner is deterministic. Given the same scenario and policy, it produces the same assignments. That makes it demo-safe and testable.

## Assignment Model

Every resource/incident pair is scored using:

- Capability coverage
- ETA based on sector distance and resource speed
- Incident severity, urgency, instability, and demand
- Sector criticality and population
- Policy settings for response speed, equity, budget, and autonomy
- Reliability and operating cost

The engine greedily selects high-value assignments while avoiding duplicate resource allocation and ensuring severe incidents receive multi-resource coverage.

## Forecast Model

The forecast projects the next 180 minutes in 15-minute steps. It models:

- Risk spread from unstable incidents
- Mitigation activation after assigned resources arrive
- Open incident demand
- Operating cost
- Public trust recovery or decline
- Final resilience score

This is intentionally transparent rather than black-box. A reviewer can inspect exactly how values are produced.

## Interface

The UI is designed as a dense operations tool:

- Left rail: scenario selection, policy controls, incident queue
- Center: briefing, metrics, 3D city twin, selected incident, forecast, event log
- Right rail: explainable agent plan and risk insights

`DigitalTwin.tsx` uses Three.js directly. Sector tower height/color represents risk, dependency lines show infrastructure coupling, pulses mark incidents, and moving cones show response resources.
