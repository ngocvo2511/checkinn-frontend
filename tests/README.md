# Regression checks

```powershell
npm run test:regression
npx tsc --noEmit
npm run build
npm run test:browser
```

`test:points` runs the quote adapter, scoped proxy and asynchronous replacement/
clear/error tests alone. The browser suite requires Microsoft Edge on this
Windows workspace. It starts the generated standalone server on loopback port 3300
and copies public/static assets only into ignored `.next/standalone` output.

Browser cases use a synthetic user and intercepted responses for all backend
requests. They verify the actual booking UI, server-provided rate/capped points,
submitted points and pending/error/stale-response behavior. They never persist
a booking, contact a payment provider or establish a real settlement test.
Use `checkinn/docker/loyalty-preview-smoke.py` separately for direct/gateway
authorization and quote behavior on the verified database clone.

Point previews do not reserve a balance or bind a durable rate version. The
booking service rechecks points when creating a booking; reservation/recovery
remains tracked in the workspace standardization plan.


Search regression (04/11/2026): `npm run test:regression` includes
`search-errors.test.mjs` and `search-filters.test.mjs`. Tests cover stable HTTP,
network/deadline/malformed errors, the canonical offer adapter, shared budget
and URL round-trips. `tests/browser/search-errors.spec.ts` covers search errors,
retry, both autocomplete widgets, canonical offer prices, stable destination
IDs, province selection and filter reload/back/reset/zero behavior. All browser
backend responses are intercepted synthetic data.

The backend must expose `GET /hotels/offers` (gateway:
`/api/hotel/hotels/offers`) before publishing this frontend. There is no fallback
to legacy browser price/capacity/inventory matching. Accommodation-type filtering is implemented by FEAT-ACCOMMODATION-TYPE below;
existing hotels are not assigned a fabricated HOTEL category.


Accommodation type (04/11/2026): `accommodation-type.test.mjs` checks repeated
query parameters, URL preservation/clearing, catalog failure/shape and review
mutation conflicts without retries. `tests/browser/accommodation-type.spec.ts`
covers required new selection, catalog retry without default, create payload and
selection retained on error, host proposals with unchanged public type, legacy
NULL/direct draft save/reload, admin approve/reject/stale conflicts and authorized
admin preview, initial hotel approval revision/reload, public label/NULL and
search reload/back/forward/clear. Backend requests, media/geocoder calls and
sessions are intercepted; this is production-artifact UI testing, not full-stack
browser E2E. Use the backend's verified-clone smoke separately for real database
constraints, authorization and concurrent transactions.

Deploy schema and compatible backend before these forms/search. The backend is
the catalog/label source; catalog errors are visible with retry and never choose
a default. The admin queue is `/admin/pending`, with type review details under
`/admin/accommodation-types/{hotelId}`. Owner type editing is a separate panel on
`/host/hotels/{hotelId}` so unrelated legacy edits need no forced classification.
See the workspace accommodation plan and backend Docker README for release and
schema-preserving rollback requirements.

## Booking and hotel review (05/11/2026)

Booking creation retries reuse one command key per unchanged mounted form.
Payment checks require an absolute server deadline. Onsite reservation status,
host cash receipts, no-show handling and collected-money totals are tested
separately. Public hotel tests cover complete amenity labels, unknown guest
ratings, review dependency failures and plain room-description round trips.

Validation after excluding all place-service integration changes:

- `npm run test:regression`: 62 passed.
- `npx tsc --noEmit` and the standard `npm run build` are blocked by the
  unchanged upstream `NearbyPlacesSection.tsx:161` passing `showDistance` to
  `PlaceCard`, whose upstream props do not declare it. This is outside this PR's
  scope and is intentionally left for the place-service owner.
- Browser suite: 51 passed, one existing coordinate/place regression failed
  (`public hotel never uses city coordinates as an exact hotel pin`). Its test,
  hotel-coordinate calculation and nearby-place wiring match `origin/main`.
- To exercise booking/hotel runtime behavior despite that separate type error,
  the browser artifact was built with a temporary `typescript.ignoreBuildErrors`
  setting. The config was restored byte-for-byte before testing and is not part
  of the commit. This is runtime coverage, not a passing production-build claim.

Place components, place API/types, hotel nearby-place wiring and backend
place-service are unchanged by this PR. Browser API responses are synthetic;
see the companion backend's Docker validation for real database/HTTP tests.
