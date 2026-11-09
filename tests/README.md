# Regression checks

Media/private-document checkpoint (09/11/2026), `fix/media-storage-boundaries`:
Node regression116/116 and `npx playwright test
--config=playwright.documents.config.ts`4/4 pass. New coverage distinguishes
unknown storage from genuinely absent documents, retries only the read,
validates the upload `{message}` acknowledgement, prevents automatic alternate
route upload replay, and checks successful write/failed preview refresh without
inventing approval state. Browser uses Next dev plus intercepted APIs; backend
separately runs real loopback HTTP/gRPC/JWT tests. See backend media-service README.
Standard typecheck still reports only the pre-existing place `showDistance`
props error; no place source or TypeScript bypass is changed.

Regulation checkpoint (07/11/2026), branch `fix/regulation-write-consistency`:
`npm run test:regression` passes110 tests. `npx playwright test
--config=playwright.regulations.config.ts` passes3 cases on the actual Next dev
server with intercepted APIs: complete decimal validation, one in-flight save,
version-conflict draft retention and explicit history outage. The SDK has a15s
abort deadline, validates successful shapes and never exposes backend bodies.
Real PostgreSQL concurrency/rollback and broker restart/return/replay are checked
separately by backend `docker/regulation-consistency-smoke.py` and its opt-in JPA
suite. See backend `regulations-service/README.md` for rollout dependencies.

`npx tsc --noEmit` still reports only the existing place-owned `showDistance`
props mismatch in `NearbyPlacesSection.tsx:161`. No place source, main production
build configuration or typecheck bypass changed in this checkpoint.

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


## Validation, coordinates and internal sessions (05/11/2026)

Public hotel map pins require verified hotel coordinate provenance and geographic
bounds. Place components, their distance labels, and nearby-place integration
remain at the existing baseline and are excluded from this review.

NextAuth credentials and custom login share the internal token/userId/role
contract. Google sign-in is disabled until a verified server-side exchange
exists; old Google cookies/storage cannot become an internal bearer session.
Custom login ends the cookie session before accepting another account; logout
revokes the internal token, ends the cookie session and clears synchronized
client state. localStorage is a compatibility cache, not an authorization source.

Browser auth-session cases call the real production-artifact NextAuth route,
CSRF/cookie/session callbacks, UI logout and account replacement. Playwright
starts a loopback-only synthetic auth upstream on3351; it never connects to a
real identity provider or database. This is distinct from the other intercepted
browser API fixtures and from native backend JWT checks. API_INTERNAL_URL points
to that test fixture only in playwright.config.ts, not production configuration.

Run `npm run test:regression`, `npm run build`, `npx tsc --noEmit` and
`npx playwright test`. Backend verified-clone harnesses are documented separately
in checkinn/docker/README.md. Native auth-session-smoke.py uses random-password
synthetic accounts and real backend login/JWT/revocation. It prepares verified
email/admin role only for generated fixtures; it does not certify actual OTP
mail delivery, OAuth or admin provisioning.


Search lifecycle/date regression (06/11/2026): search-lifecycle.spec.ts tests
same-component URL/back changes, empty destination clearing and delayed old
success/error/hotel redirect responses. It also checks detail-header province
identity, western timezone date preservation and invalid calendar inputs.
Date helpers treat stays as civil days and count nights across daylight saving,
not elapsed hours. All backend/map responses are synthetic browser fixtures.

## Review checkpoint (07/11/2026)

The final review supersedes the earlier checkpoint's green build claim after
place-related edits were rolled back. Current results: 103 Node regressions and
100 browser cases pass; the 15 affected amenity/unknown-room cases pass on rerun.
Standard build/typecheck remain blocked by the unchanged upstream place props
mismatch. Runtime testing used a temporary, uncommitted TypeScript bypass.
See [REVIEW_2026-11-07.md](REVIEW_2026-11-07.md) for scope, branch order and limits.

`inventory-review.spec.ts` covers owner sourced proposal without overwriting an
unsaved description/price/unknown stock, stale proposal, required admin reason,
failed review and queue outage. `inventory-review.test.mjs` checks strict nullable
state/evidence shape, verified-count consistency, source/revision payloads and
single-attempt errors. The backend `room-inventory-review-smoke.py` additionally
uses this actual TypeScript SDK through the verified test gateway for OWNER and
ADMIN calls; intercepted browser fixtures alone are not database verification.

Review the corresponding HOTEL SQL and backend authorization/transaction changes
together before deploying these screens. Actual legacy counts must be entered
and reviewed by humans; neither fixture counts nor old values such as10 are
automatically trusted. See the backend Docker README for migration/run details.

Revenue consistency checkpoint (07/11/2026): `npm run test:regression` passes106
tests. `npx playwright test --config=playwright.revenue.config.ts` passes6 browser
cases on the actual Next dev server with intercepted API fixtures: Vietnam/Los
Angeles calendar boundaries, signed cash refunds below zero, percentage units,
applied versus draft dates, inclusive one-day ranges and reconciliation errors.
The backend separately verifies actual transaction-date cash reports on cloned
PostgreSQL/RabbitMQ; browser interception is not provider/database verification.

`npm run build` and `npx tsc --noEmit` remain blocked by the existing
`components/NearbyPlacesSection.tsx:161` `showDistance` props mismatch. This batch
does not modify place-related code or use a TypeScript bypass. The dedicated
revenue Playwright config runs development mode; no production build pass is
claimed. Commission/net figures use the current authoritative rate and are
explicitly estimates, not historical settlement statements. Unknown financial
history returns a reconciliation error, never a fabricated zero chart.


Final revenue review: [REVIEW_REVENUE_2026-11-07.md](REVIEW_REVENUE_2026-11-07.md)
records current validation and the nonblocking baseline place build issue.


## Fresh review — 9 November 2026

Fresh selected User/Regulations unit suites passed; frontend 110 Node regressions
and three development-server browser cases passed. Typecheck still reports only
the unchanged place-owned showDistance mismatch. Docker has no running test stack;
the integration runner stopped at clone verification, so integration/runtime
checkpoint counts above were NOT rerun or certified by this review. No place code,
local IDE settings, production schema/data or deployment changed.

## Review history contract (9 November 2026)

Branch `fix/review-contract-consistency` requires the paired backend's authenticated
`GET /api/v1/reviews/me` before deployment. Account history now uses private stable
pagination instead of aggregating other guests' public hotel reviews. Failed
lookup/history is unknown and retryable; only successful absence permits a write
action. Bearer identity remains authoritative, SDK writes never auto-retry, and
the15s request deadline covers body consumption. Legacy200-null optional owner
response remains compatible. Rating update payloads map to the REST flat fields.

```powershell
npm run test:regression
npx playwright test --config=playwright.reviews.config.ts
npx tsc --noEmit
```

Node134 PASS; dedicated actual Next development browser4 PASS: private pagination,
history recovery, unknown review lookup on account reviews and booking history.
Browser APIs use intercepted fixtures, not live backend evidence. Backend clone
has separate PostgreSQL4/native HTTP+gRPC23 checks. Typecheck still fails only on
the unchanged place-owned NearbyPlacesSection.tsx:161 showDistance props; no build
bypass, production build pass or place change is claimed. Root plan section68 is
outside Git; backend `hotel-service/REVIEW_CONTRACT_2026-11-09.md` preserves rollout
and migration limitations for review/push.
