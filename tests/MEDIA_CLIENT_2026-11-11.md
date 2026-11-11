# Media client write consistency — 11/11/2026

Branches: `fix/media-client-write-state` in both repositories. Frontend base
`b4e5bf0`; backend API-contract base `22627ba`. Only the frontend production code
changes in this batch. Two existing backend IDE edits are preserved. No commit/push.

## Verified causes and resulting behavior

- The shared media SDK had no deadline, trusted arbitrary200 payloads and logged
  upstream status/error text. It now uses one15s budget covering headers/body,
  safe typed errors, UUID/request checks, HTTP(S) URL checks, scalar shape checks,
  and acknowledgement binding to media ID/target/type/thumbnail/order. The optional
  legacy `type` field remains compatible; targetId/targetType model the real entity.
- Media DELETE must acknowledge the actual controller string `Deleted`; draft
  deletion must acknowledge the controller JSON message. A malformed200 is an
  unknown result. Draft404 never replays DELETE through a second route;409 gives
  actionable safe guidance about hotel status/remaining rooms. No raw body/logs.
- Hotel, room-edit and just-created-room galleries permitted overlapping writes
  and replaced state using old closures. They now share a synchronous gate per
  page and disable media controls while pending/unknown. Hotel content/lifecycle
  writes coordinate with that gate. Functional updates apply to the matching
  entity and preserve unrelated fields; append/thumbnail use canonical ACK fields.
- Delete ACK is applied immediately and order decrements match the backend rule.
  If the existing automatic thumbnail selection then fails, the deletion remains
  visible and the unconfirmed selection is reported separately. No false rollback.
- Unknown/conflicting writes require an explicit authoritative GET to the existing
  owner/admin `/medias/preview` endpoint. It also has a15s total budget, validates
  target-bound unique rows and distinguishes genuine[] from an outage. A failed
  read keeps writes blocked. A successful read changes ONLY images, retaining
  unsaved room form fields; no page reload, room creation or mutation replay.
- Hotel creation used a separate raw uploader and restarted from the first image
  after any partial batch failure. It now uses the same SDK plus MediaUploadBatch:
  serial uploads, no overlapping batch, no replay after failure/completion. Failed
  batches stop before approval and guide the owner to the existing draft. First-
  attempt errors retain the locally acknowledged hotel ID. Image selections freeze
  after upload/unknown result, preventing edits from implying an unsent change.
  The gallery input now has `multiple`, matching its existing copy and array handler.
- The hotel hero sorted the React state array in place and logged media URLs as
  console objects, including signed query data. Sorting now copies the array;
  that log is removed. The browser regression serializes console arguments, not
  just ConsoleMessage.text(), so nested objects cannot hide the marker.

## Files and evidence

Production: lib/api/{media-write,media-state,media-upload-batch}.ts; API wrappers in
lib/api/hotels.ts; components/host/MediaWriteNotice.tsx; four host pages (hotel detail,
room detail, room creation, hotel creation). No place/map/location source is edited.
Tests: tests/media-write.test.mjs, tests/media-state.test.mjs,
tests/browser/media-write.spec.ts; playwright.media-write.config.ts; regression script.

Fresh baseline: `npm run test:regression`164/164 PASS.
Red SDK:22 failures/23 cases before fixes. Initial gallery browser:8/8 failures.
Signed-log regression failed after correcting argument serialization. New-room
unknown recovery failed before its gallery fix; the single pending-upload case
already passed because its only input was disabled. Wizard replay risk was source-
confirmed (all uploads rerun while mediaUploaded remained false); new unit/browser
regressions verify stop-before-approval and opening the saved partial draft.

Final Node: `npm run test:regression` **211/211 PASS**.
Final media browser: `npx playwright test --config=playwright.media-write.config.ts`
**13/13 PASS**. All four affected routes actually compile/run in Next Webpack dev;
requests are intercepted synthetic fixtures, not real provider/backend writes.
Read-reconciliation failure + explicit retry retains unsaved fields and performs
only GETs; partial wizard upload stops after2 POSTs and makes0 approval calls.

Compatibility: content8/8 and amenities7/7 PASS on the same final source. The
first content run had7 pass/1 timeout at the unchanged host auth gate before the
modal. Full unchanged rerun8/8 passed; timing cause NOT_REPRODUCED, not attributed
to a source fix. Failed log retained. No retries/timeout increase/assertion change.
Total browser acceptance13+8+7=28 PASS across sequential runs.
Typecheck: `npx tsc --noEmit` still reports only the pre-existing out-of-scope
NearbyPlacesSection.tsx:161 showDistance/PlaceCardProps error. No bypass or production
frontend build/default Turbopack pass claimed. No fresh Maven/database/native-provider
verification in this frontend-only batch; previous backend evidence is plan72.

Ignored local logs are under `test-results/media-client-evidence/`, including
node-final.log, media-regression.log and typecheck.log. Full commands are reproducible;
these logs are not staged as project source. Git checkpoints/root plan retain results.
Harness notes: initial signature test used console.text and missed nested objects;
it was strengthened. A prior new-room navigation test saw2 Strict Mode mount reads;
final behavior performs one explicit gallery GET without remounting. Wizard setup
was corrected to use the full city-button accessible name and semantic file labels.
A missing `multiple` attribute was fixed in production, rather than bypassed in tests.

## Residual scope

No migrations, provider protocol, backend authorization or storage changes. HTTP
abort cannot undo a server commit. Live provider writes, crash/commit ambiguity,
reconciliation scheduling and provider idempotency remain unverified/separate work.
Other hotel SDK mutations (create/edit/approval etc.) are not implicitly standardized
by these media/draft adapters. Overall parent STD statuses remain scoped, not closed
for the whole system. No place files, global auth hook or unrelated tests were changed.


Final audit: git diff --check PASS in both repos; frontend16 pending paths,
backend3 (two original IDE edits plus checkpoint doc), zero place/OSRM paths.
No map/location source hunk was changed. Final typecheck-final.log repeats only
the place baseline. Playwright servers on3314/3315/3316 are torn down. No Docker
service/OS shutdown or backend/provider data mutation occurred. No commit/push.
