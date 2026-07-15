# HELIX Command

HELIX Command is a browser-based crisis response simulator for city-scale operations. It simulates a living city, ranks sector risk, assigns response resources, forecasts resilience, and explains every dispatch decision without needing external APIs or keys.

The project is designed as a final-year showcase piece: it has a serious technical thesis, a polished real-time interface, deterministic simulation logic, tests, and presentation-ready documentation.

## Project Snapshot

| Area | Detail |
| --- | --- |
| Experience | City-scale crisis response simulator with a 3D digital twin |
| Core system | Scenario engine, dispatch planner, policy comparison, resilience forecast |
| Design signal | Operator cockpit with incident context, strategy controls, and explanatory panels |
| Quality signal | Vitest, Testing Library, oxlint, production build, npm audit |

## What Makes It Different

- 3D city digital twin rendered with Three.js, including sector towers, dependency lines, live incident pulses, and moving response resources.
- Explainable planning engine that weighs capability match, ETA, sector criticality, population equity, resource reliability, cost, and policy settings.
- Human-friendly operator cockpit with scenario cards, an incident queue, priority sliders, selected incident context, and dispatch reasoning in one screen.
- Strategy comparison panel that runs balanced, speed-first, people-first, and cost-safe policies through the planner before applying one.
- Mumbai real-place drill plus three high-pressure synthetic crisis modes: Monsoon Surge, Cyber Blackout, and Heatfire Cascade.
- Forecast model projecting resilience, open demand, operating cost, and public trust across a 180-minute horizon.
- Policy console that lets reviewers change the planner's priorities and immediately see a different dispatch plan.
- Automated coverage for the planner and the top-level interface.

## Quick Start

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.

## Operating The App

1. Choose a drill from the scenario cards at the top.
2. Select an incident from **What needs attention**.
3. Compare operating postures in **Strategy compare** and apply one.
4. Adjust **Decision weights** to fine-tune what the planner values.
5. Read **Why these teams** to explain the dispatch, ETA, risk reduction, and cost.
6. Use the city map and recovery forecast to show how the response changes over time.

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

> "HELIX Command is a browser-based crisis response simulator that plans, explains, and visualizes recovery across a simulated city."

Use this three-part walkthrough:

1. Pick a scenario from the top cards and show the selected priority.
2. Compare strategy presets, apply one, and show how assignments and forecasts update.
3. Fine-tune the sliders and show that every dispatch has ETA, risk reduction, cost, and rationale.

The default scenario is **Mumbai Monsoon Drill**, a real-place simulated run using Mumbai district and infrastructure names with synthetic telemetry.

## Important Note

HELIX Command is a simulation and portfolio project. It is not emergency-response software and should not be used for real operational decisions.

## Experience Design

The spatial command surface follows the [HELIX design system](design-system/helix-command/MASTER.md), combining modular bento composition with strong keyboard focus, reliable touch targets, responsive panels, and optional motion.
