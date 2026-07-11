# HELIX Command

HELIX Command is an agentic digital-twin command center for city-scale crisis response. It simulates a living city, ranks sector risk, assigns response resources, forecasts resilience, and explains every dispatch decision without needing external APIs or keys.

The project is designed as a final-year showcase piece: it has a serious technical thesis, a polished real-time interface, deterministic simulation logic, tests, and presentation-ready documentation.

## What Makes It Different

- 3D city digital twin rendered with Three.js, including sector towers, dependency lines, live incident pulses, and moving response resources.
- Explainable planning engine that weighs capability match, ETA, sector criticality, population equity, resource reliability, cost, and policy settings.
- Scenario theatre with a Mumbai real-place drill plus three high-pressure synthetic crisis modes: Monsoon Surge, Cyber Blackout, and Heatfire Cascade.
- Forecast model projecting resilience, open demand, operating cost, and public trust across a 180-minute horizon.
- Policy console that lets reviewers change the planner's priorities and immediately see a different dispatch plan.
- Automated coverage for the planner and the top-level interface.

## Quick Start

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Verification

```bash
npm test
npm run lint
npm run build
npm run audit
```

Current status: tests, lint, and production build pass.

For the full gate:

```bash
npm run verify
```

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Three.js
- lucide-react
- Vitest + Testing Library
- oxlint

## Project Structure

```text
src/engine/          Deterministic crisis simulation and planning logic
src/components/      Command-center UI, 3D twin, charts, panels
src/App.tsx          Scenario state, policy controls, mission layout
docs/                Architecture, demo script, test plan, research notes
```

## Research Thesis

The project sits at the intersection of three 2026 signals:

- Agentic AI is becoming a real hiring and product category, not just a chatbot wrapper.
- Production AI systems need observability, deterministic controls, and explainable decision paths.
- Digital twins are moving from passive visualization toward intervention and autonomous management.

See [docs/RESEARCH_NOTES.md](docs/RESEARCH_NOTES.md) for sources.

## Security

See [docs/SECURITY.md](docs/SECURITY.md) and [docs/SHIP_CHECKLIST.md](docs/SHIP_CHECKLIST.md).

## Demo Positioning

Use this one-liner:

> "HELIX Command is a browser-based agentic digital twin that plans, explains, and visualizes crisis response across a simulated city."

Use this three-part walkthrough:

1. Pick a scenario and show the 3D twin reacting to active incidents.
2. Change planner policy sliders and point out how assignments and forecasts update.
3. Open the explainable plan and show that every action has ETA, capability match, risk reduction, and cost.

The default scenario is **Mumbai Monsoon Drill**, a real-place simulated run using Mumbai district and infrastructure names with synthetic telemetry.

## Important Note

HELIX Command is a simulation and portfolio project. It is not emergency-response software and should not be used for real operational decisions.
