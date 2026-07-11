# Demo Script

## 30-Second Pitch

HELIX Command is an agentic digital twin for crisis response. It simulates a city under compound stress, assigns resources using an explainable planner, forecasts resilience over the next three hours, and visualizes the whole operation in 3D.

## Three-Minute Walkthrough

1. Start on Monsoon Surge.
   - Point to the 3D towers and incident pulses.
   - Explain that tower height and color encode sector risk.
   - Show that resources are already moving toward assigned incidents.

2. Open the incident queue.
   - Select "Harbor flood gates at limit."
   - Show the selected incident panel and the right-side dispatch logic.
   - Read one rationale: it includes capability coverage, reliability, and ETA.

3. Change policy.
   - Push "Population equity" higher.
   - Lower "Cost guardrail."
   - Note the planner now tolerates more expensive assignments when residents and critical sectors are at risk.

4. Switch to Cyber Blackout.
   - Show that the same engine handles a different domain without changing code.
   - Point out network recovery, rerouting, and hospital system degradation.

5. Finish on the forecast.
   - Resilience, open demand, public trust, and cost all update from the plan.
   - Emphasize that this is not a static dashboard; it is a decision simulator.

## Professor-Friendly Questions

**Is this calling an LLM?**  
No. The current version is deterministic and offline so it can be audited and tested. An LLM could be added later for natural-language briefings, but the planner does not depend on one.

**What is the algorithm?**  
A transparent heuristic planner. It scores every resource/incident pair using capability match, ETA, risk, reliability, cost, and policy weights, then selects assignments while preventing duplicate resource allocation.

**Why a digital twin?**  
Because it links physical sectors, dependencies, incidents, resources, and forecasts in one inspectable model.

**What would make this production-grade?**  
Real telemetry ingestion, live GIS data, operator auth, audit logs, model calibration, uncertainty intervals, and integration with incident-management systems.

## Resume Bullets

- Built an offline agentic digital-twin simulator in React, TypeScript, and Three.js for crisis-resource planning and explainable dispatch.
- Implemented deterministic risk scoring, resource assignment, 180-minute forecasting, policy tuning, and tested planner behavior with Vitest.
- Designed a dense operational interface with 3D visualization, scenario switching, live metrics, event traces, and explainable AI-style recommendations.
