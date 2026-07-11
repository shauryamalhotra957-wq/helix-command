# Ship Checklist

Run the full gate:

```bash
npm run verify
```

Manual review:

- App opens on desktop and mobile.
- 3D twin renders as a nonblank canvas.
- Scenario switching does not crash or leave stale incident state.
- Policy sliders update scores and plans.
- Mission clock pause, step, and reset controls work.
- No horizontal mobile overflow.
- Browser console has no errors.
- Security headers are present in `public/_headers` or configured on the hosting platform.

Current verified state:

- Unit/component tests: passing
- Lint: passing
- Production build: passing
- npm audit: clean
- Desktop visual QA: passed
- Mobile visual QA: passed
