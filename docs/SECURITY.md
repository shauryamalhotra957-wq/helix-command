# Security Notes

HELIX Command is a static, offline-first simulation. It does not collect credentials, send telemetry, store personal data, call external APIs, or expose a backend service.

## Current Threat Model

- No authentication surface.
- No database.
- No user-generated HTML.
- No `dangerouslySetInnerHTML`, `eval`, browser storage, or network fetch calls in application code.
- Synthetic scenario data only.
- Production deploy headers are included in `public/_headers` for hosts that support that convention.

## Implemented Hardening

- Strict TypeScript enabled for app code.
- `npm audit --audit-level=moderate` added to `npm run verify`.
- Content Security Policy blocks external scripts, object embeds, framing, external connections, and unnecessary browser permissions.
- 3D/WebGL surface is isolated behind lazy loading and an error boundary so a graphics failure does not take down the planner.
- Planner has deterministic behavior and tests for normal operation plus an empty-resource failure mode.

## Deployment Checklist

Before a public deploy:

```bash
npm run verify
```

If deployed outside a host that reads `public/_headers`, configure equivalent headers manually:

- `Content-Security-Policy`
- `Referrer-Policy: no-referrer`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Permissions-Policy` denying camera, microphone, geolocation, payment, USB, and Bluetooth

## Non-Goals

This is not emergency-response software. It is a portfolio-grade simulation and should not be connected to real operational systems without authentication, authorization, audit logging, telemetry validation, human approval workflows, and formal safety review.
