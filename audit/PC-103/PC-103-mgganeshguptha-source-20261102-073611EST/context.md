# Context: Visits store with a status summary, shared through a host bridge

Generated: 2026-11-02 12:36:28 UTC · Mode: non-interactive (CI) · Story: PC-103
Contract: petclinic-rest-api (attached OpenAPI file, after PC-101)

## What Are We Trying to Achieve
Keep all visits and a count per visit status in one shared, in-page place, so that
other front-end apps loaded alongside this app (the front-desk panel, story PC-104)
can show the same numbers without calling the API themselves. Story type: new
development (shared state and a page-level bridge; no visible UI change).

New terms introduced by this story:
- **Visits store** — the shared state holding the visit list, a loading flag, and an error message.
- **Status counts** — an object with a number for each of SCHEDULED, COMPLETED, CANCELLED, plus `notSet`.
- **notSet** — the count bucket for visits whose status is missing, null, empty, whitespace-only, or not one of the three allowed values.
- **Host bridge** — publishes the visits state to other front ends via `window.petclinicHost.visits` and a browser event named `petclinic-host:visits`.

## Current Behaviour
The app has an existing visit fetch that returns the visit list from the API and
rethrows its failure. No shared visits state exists. The root store is provided
with no feature states or effects. No host bridge exists.

## Expected Behaviour
At app start, one "load visits" request runs. While it is in flight, loading is true.
On success, the visits and loading false are stored. On failure, loading false and
an error message are stored, and the last successful visits are kept. Status counts
are derived from the visits. After every state change, the host bridge publishes
`{ visits, statusCounts, loading, error }` to the window object and dispatches the
`petclinic-host:visits` event with the same object. Existing pages are unchanged.

## Acceptance Criteria
Traced to the story and the attached contract unless marked `[ASSUMED]`.

**Store shape and registration**
- AC-1: THE visits feature SHALL register its state under the feature key `visits`.
- AC-2: THE visits state SHALL have exactly three fields: visits, loading, and error.
- AC-3: THE initial visits state SHALL have visits empty, loading false, and error null.

**Load behaviour**
- AC-4: WHEN "load visits" is dispatched, THE visits feature SHALL request the visit list through the existing visit fetch exactly once.
- AC-5: WHEN "load visits" is dispatched, THE visits feature SHALL set loading to true.
- AC-6: WHEN "load visits" is dispatched, THE visits feature SHALL set error to null.
- AC-7: WHEN the visit list request succeeds, THE visits feature SHALL store the returned visits.
- AC-8: WHEN the visit list request succeeds, THE visits feature SHALL set loading to false.
- AC-9: IF the visit list request fails, THEN THE visits feature SHALL set loading to false.
- AC-10: IF the visit list request fails, THEN THE visits feature SHALL store the failure message as error. (Message text: see CL-3.)
- AC-11: IF the visit list request fails, THEN THE visits feature SHALL keep the visits from the last successful load.
- AC-12: WHEN "load visits" is dispatched while a request is in flight, THE visits feature SHALL cancel the in-flight request.
- AC-13: WHEN "load visits" is dispatched while a request is in flight, THE visits feature SHALL apply only the result of the latest request.
- AC-14: WHEN the application starts, THE application SHALL dispatch "load visits" exactly once.

**Selectors**
- AC-15: THE visits selectors SHALL return the visits, the loading flag, and the error message from the visits state without modification.
- AC-16: THE status-count selector SHALL return an object with exactly the keys SCHEDULED, COMPLETED, CANCELLED, and notSet, each holding a number.
- AC-17: WHEN a visit's status is SCHEDULED, COMPLETED, or CANCELLED, THE status-count selector SHALL count that visit under that same key.
- AC-18: IF a visit has no status or a null status, THEN THE status-count selector SHALL count that visit under notSet.
- AC-19: IF a visit has an empty status or a status made only of whitespace, THEN THE status-count selector SHALL count that visit under notSet.
- AC-20: IF a visit has a status other than the three allowed values, THEN THE status-count selector SHALL count that visit under notSet.
- AC-21: IF a visit has a status other than the three allowed values, THEN THE status-count selector SHALL NOT throw an error.
- AC-22: THE status-count selector SHALL count each visit under exactly one key, so the four counts sum to the number of visits.
- AC-23: WHILE there are no visits, THE status-count selector SHALL return zero for each of the four keys.
- AC-24: THE status-count selector SHALL take its three allowed status values from the app's existing visit status definition, not from new string literals.

**Host bridge**
- AC-25: WHEN the application starts, THE host bridge SHALL publish the initial visits state to the window object as `{ visits, statusCounts, loading, error }`.
- AC-26: WHEN the visits state changes, THE host bridge SHALL set the window object's `petclinicHost.visits` to `{ visits, statusCounts, loading, error }` built from the new state, creating `petclinicHost` when it does not exist.
- AC-27: WHEN the visits state changes, THE host bridge SHALL dispatch a browser event named `petclinic-host:visits`.
- AC-28: THE `petclinic-host:visits` event SHALL carry, as its detail, the same object assigned to `petclinicHost.visits`.
- AC-29: THE host bridge file SHALL export the TypeScript interface `VisitsBridgeState` and the event-name constant for `petclinic-host:visits`.
- AC-30: [ASSUMED] WHEN the visits state changes, THE host bridge SHALL leave any other keys already present on `petclinicHost` unchanged. Basis: the story names only the `visits` key and says nothing about other host keys; overwriting the whole object would be an unstated side effect. Confirm or delete before building.
- AC-31: WHEN the host bridge publishes visits, THE host bridge SHALL include each visit object exactly as the visit fetch returned it. Pending CL-2 (payload scope).

**Non-functional and regression**
- AC-32: THE existing owners, pets, visits, and vets pages SHALL render and behave as before this change.
- AC-33: THE build command SHALL complete without errors.

## Edge Cases
- Visit with status absent, null, `""`, or `"   "`: counted under notSet (AC-18, AC-19).
- Visit with status `"scheduled"` (lower case) or `"SCHEDULED "` (trailing space): not one of the three exact values, so counted under notSet (AC-20). Matching is exact and case-sensitive.
- Visit with a status value the contract does not define: counted under notSet, no exception (AC-20, AC-21).
- Empty visit list: all four counts are zero (AC-23).
- Load dispatched twice while the first is in flight: first request cancelled; only the second result applied (AC-12, AC-13).
- Failure after an earlier success: loading false, error set, visits from the earlier success kept (AC-9 to AC-11).
- Failure on the first load with no prior success: visits remain empty (AC-3, AC-11).
- Network or server error: error message published on the bridge with the state (AC-26).
- Visit with no nested pet object: the contract's `Visit` has `petId` and no nested `pet` (see CL-1).

## Constraints
- Angular 19.2, NgRx 19.2.1 (`@ngrx/store`, `@ngrx/effects`) already installed. Do not change `package.json` or the root store setup in the entry point.
- RxJS 6 APIs only (`rxjs`, `rxjs/operators`). Use `switchMap` for cancel-previous semantics (AC-12, AC-13).
- Typed generics for every API payload; no `any`.
- Reuse the app's existing visit status type; do not add new status literals (AC-24).
- Window property and event name must be typed (AC-29) and must not mutate the `environment` object.
- Do not write visit data to `localStorage`, `sessionStorage`, or IndexedDB.
- Do not `console.log` visit or pet objects.
- Compliance: visit objects carry pet and owner-linked data and this app processes PHI under HIPAA. Publishing them on a page-global object is the story's explicit requirement; see CL-2 for the scope decision.
- Non-functional targets: none stated in the story; none added.

## Out of Scope
- Front-desk panel (story PC-104) — the bridge is only the producer side.
- Changes to `package.json` and to the root store setup in the entry point.
- Any visible UI change on any page.
- Backend or contract changes; the attached contract is used as-is.
- Unit tests — this repository runs build verification only.
- Server-side counting, filtering, pagination, and sorting of visits.
- Write operations (add, update, delete visits) through the store.

## Clarifications Needed
- [NEEDS CLARIFICATION]: CL-1 — Nested pet data in visit objects: (a) follow the attached contract, where `Visit` carries `petId` and no nested pet object, so the bridge publishes what that contract returns (b) the contract is wrong and a changed contract that includes nested pet data must be attached before the bridge can publish it. Story AC8 says "including nested pet data"; the attachment does not define it.
- [NEEDS CLARIFICATION]: CL-2 — Bridge payload scope (blocks AC-31): (a) publish each visit object as the API returns it (story AC8), which may include owner-linked and pet-identifying data on a page-global object (b) publish only the minimum fields the front-desk panel needs (for example id, date, status, petId), per the minimum-necessary rule for PHI.
- [NEEDS CLARIFICATION]: CL-3 — Failure message text stored as error and published on the bridge: (a) the message produced by the shared HTTP error handler, which can include the server response body (b) a fixed generic message that never includes server response content.

**How to answer:** reply to each CL-n item with a choice (a, b, or other) and the reviewer's name.

## Assumptions
- AC-30 — other keys on the host object. Assumed they are preserved. Basis: the story names only the `visits` key; overwriting the whole host object is not requested. Confirm or replace before building.

## Story Quality Score
| Dimension | Score | Basis |
|---|---|---|
| Clarity | 18/20 | Status-count rules and state fields are concrete; deducted for the nested-pet conflict (CL-1) and the undefined failure message (CL-3) |
| Testability | 18/20 | Every AC has an observable state or window outcome; AC-31 is blocked on CL-2 |
| Traceability | 19/20 | One [ASSUMED] criterion (AC-30), basis stated |
| Atomicity | 18/20 | Every AC is one response with at most two preconditions; AC-31 bundles a payload scope still open |
| Completeness | 16/20 | Payload scope and error text unresolved; no performance target (none requested) |
| Edge coverage | 17/20 | Null, empty, whitespace, unknown value, cancellation, and failure-after-success named; no case for a malformed response body |
| **Total** | **106/120** | |

## Design trigger
**DESIGN REQUIRED: YES**
Triggers fired: "Consumes a changed upstream contract into shared state" (the contract line names petclinic-rest-api and the visit shape reaches the new store, so the mapping point must be decided once) and "Introduces a pattern the repo lacks" (the first NgRx feature store and the first page-level bridge that publishes state to other front ends). Also a new published contract for other front ends (window object and event name).

## Feasibility
**VERDICT: GO**
Basis: the visit fetch already returns the typed visit list and rethrows failures with a message; the visit status type already exists; NgRx 19.2.1 is installed; the root store is already provided; the visits feature module and the app component exist. The store, actions, reducer, effects, selectors, and bridge are all created by this story, so no missing dependency is required.
Data flow: API (petclinic-rest-api, changed contract attached) → visit fetch (this repo, reads as-is) → visits store (this repo) → host bridge (this repo) → other front ends (PC-104, read-only consumer, out of scope).
Note (not a blocker): the app's current visit model declares a required nested `pet`, while the attached contract declares `petId`. This is the subject of CL-1 and does not block the store, whose logic does not depend on the nested object.
