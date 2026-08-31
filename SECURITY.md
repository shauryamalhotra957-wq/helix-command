# Security policy

HELIX Command is an interactive decision-support prototype.

- Treat seeded scenarios and any future live feeds as separate trust domains.
- Do not commit credentials, private operational data, or unreviewed external-feed payloads.
- Validate external inputs before they reach scoring, rendering, exports, or command actions.
- Keep generated briefings clearly labeled as synthetic or verified, and review them before operational use.
- Respect reduced-motion, privacy, and access-control boundaries when adding integrations.

Report authentication bypasses, injection, sensitive-data exposure, or unsafe export behavior privately to the repository owner with sanitized reproduction steps.
