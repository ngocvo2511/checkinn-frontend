# Revenue UI review — 7 November 2026

Branch: `fix/revenue-reporting-consistency`, based directly on `main`.
Requires the companion backend event/cash-reporting contract and its migrations;
notification delivery and amenity search are independent backend PRs.

Use the Vietnam business calendar for default/report/chart dates in any browser
zone, retain negative refund values and apply date labels consistently. Display
commission as a fraction converted to percent, with current-rule estimates clearly
labelled. Reject malformed cash points and show reconciliation/outage errors rather
than fabricated zero reports. No place-related files or build bypass were changed.

Fresh checks: 106 Node regression tests passed; six dedicated report browser cases
passed on the actual Next dev server with synthetic APIs in Vietnam and Los Angeles
timezones. Cases cover month boundaries, refund charts, commission units, draft vs
applied date ranges, inclusive single days and reconciliation failure. No new lint
errors or warnings relative to main; two existing explicit-any catch annotations
and an unused catch variable were removed.

```powershell
npm run test:regression
npx playwright test --config=playwright.revenue.config.ts
npx tsc --noEmit
npm run build
```

Standard typecheck/build still fail only on main's unchanged
NearbyPlacesSection.tsx:161 passing showDistance to PlaceCard. Per the agreed
ownership boundary, this known baseline issue is recorded and does not make this
PR Draft. Browser tests use development mode without a typecheck bypass; they are
not a production-build or live database/provider verification claim. No production
deployment is included. Backend PostgreSQL/RabbitMQ evidence is documented in its
`docker/REVIEW_EVENTS_2026-11-07.md`.
