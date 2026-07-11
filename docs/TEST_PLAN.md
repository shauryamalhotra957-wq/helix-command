# Test Plan

## Automated Checks

Run:

```bash
npm test
npm run lint
npm run build
npm run audit
```

## Covered Today

- Planner assigns only ready resources with matching capabilities.
- Planner output is deterministic for the same scenario and policy.
- Stressed sectors rise to the top of the risk ranking.
- Forecasted resilience improves after assigned resources activate.
- Analysis includes scorecard, assignments, rationales, and insights.
- App renders command-center controls, planner output, and the digital twin mount.
- Scenario switching keeps the interface populated and avoids stale selected-incident crashes.
- Mission clock controls step and reset correctly.
- Planner degrades safely when no response resources are available.

## Manual QA

- Confirm all three scenarios can be selected.
- Confirm the default Mumbai Monsoon Drill appears with real-place/simulated-telemetry labels.
- Confirm policy sliders update metrics and dispatch cards.
- Confirm pause, step, and reset controls update the mission clock.
- Confirm the 3D canvas is nonblank at desktop and mobile widths.
- Confirm no panel text overflows on narrow screens.

## Known Tradeoffs

- The app uses a transparent heuristic planner instead of a learned optimizer.
- City geography is synthetic, not GIS-backed.
- Forecast values are calibrated for demonstration consistency, not real-world emergency accuracy.
