# Context: Visits store with a status summary, shared through a host bridge

**Story:** PC-103 — Visits store with a status summary, shared with other front ends through a host bridge
**Contract:** Requires a new or changed contract from `petclinic-rest-api` (attached `openapi.yml`, after PC-101)
**Layer:** Angular frontend (state and bridge only; no UI change)
**Story type:** New development

---

## 1. What Are We Trying to Achieve

The clinic app should keep all visits, and a count of visits per status, in one shared state container. Other front-end apps loaded alongside it (the front-desk panel, story PC-104) must be able to read the same numbers without calling the API themselves.

**New terms introduced by this story:**
- **Visits state** — the in-app store holding the visit list, a loading flag, and an error message.
- **Status counts** — an object with one number per visit status (`SCHEDULED`, `COMPLETED`, `CANCELLED`) plus `notSet`, for visits with no usable status.
- **Host bridge** — a publisher that copies the visits state onto the page for other front ends: it sets `window.petclinicHost.visits` and dispatches the browser event `petclinic-host:visits`.

## 2. Current Behaviour

N/A — new development. No shared visits state, status counts, or host bridge exists today. Each page loads visits on its own through the existing visit service.

## 3. Expected Behaviour

- On app start, the app requests the visit list once.
- The backend returns every visit with a `status` taken from the `VisitStatus` enum in the attached contract: `SCHEDULED`, `COMPLETED`, `CANCELLED`.
- The visits state holds that list, a loading flag, and an error message (null when there is none).
- A status-count selector returns the count per allowed status. Visits with no status, a null status, an empty or whitespace-only status, or any value outside the three allowed values are counted under `notSet`.
- Whenever the visits state changes, the host bridge publishes `{ visits, statusCounts, loading, error }` to `window.petclinicHost.visits` and dispatches `petclinic-host:visits` with the same object as `detail`.
- Existing pages look and behave as they do today.

## 4. Acceptance Criteria

Contract shape source: `openapi.yml`, schema `VisitStatus` (enum `SCHEDULED`, `COMPLETED`, `CANCELLED`) and the list operation `listVisits` returning `Visit[]`.

- AC-1: THE visits store folder SHALL contain the actions, reducer, effects, selectors, and host bridge files.
- AC-2: THE visits feature state SHALL be registered under the key `visits`.
- AC-3: WHEN a load-visits action is dispatched, THE visits effect SHALL call the existing visit list operation exactly once.
- AC-4: WHEN the visit list operation succeeds, THE visits state SHALL hold the returned visits, with loading set to false and error set to null.
- AC-5: IF the visit list operation fails, THEN THE visits state SHALL set loading to false and error to the failure message.
- AC-6: WHILE a load is in progress, THE visits state SHALL report loading as true.
- AC-7: THE visits selectors SHALL expose all visits, the loading flag, and the error message.
- AC-8: THE status-count selector SHALL return an object with exactly the keys `SCHEDULED`, `COMPLETED`, `CANCELLED`, and `notSet`, each holding a number.
- AC-9: WHEN a visit's status is one of the three allowed values, THE status-count selector SHALL increase the count for that status by one.
- AC-10: WHEN the visits list is empty, THE status-count selector SHALL return 0 for each of the four keys.
- AC-11: IF a visit's status is absent, null, an empty string, or only spaces, THEN THE status-count selector SHALL count that visit under `notSet`.
- AC-12: IF a visit's status is a value other than the three allowed values, THEN THE status-count selector SHALL count that visit under `notSet` and SHALL NOT raise an error.
- AC-13: THE status-count selector SHALL take its three allowed values from the existing visit status type and SHALL NOT repeat those string literals.
- AC-14: WHEN the application starts, THE application root SHALL dispatch a load-visits action once.
- AC-15: WHEN the application starts, THE application root SHALL start the host bridge once.
- AC-16: WHEN the visits state changes, THE host bridge SHALL set `window.petclinicHost.visits` to an object with exactly the keys `visits`, `statusCounts`, `loading`, and `error`.
- AC-17: WHEN the visits state changes, THE host bridge SHALL dispatch a browser event named `petclinic-host:visits` whose `detail` is the same object it set on `window.petclinicHost.visits`.
- AC-18: THE host bridge SHALL write only the `visits` key of `window.petclinicHost`, and SHALL create `window.petclinicHost` when it does not exist. Basis: the story requires setting `window.petclinicHost.visits`.
- AC-19: THE host bridge file SHALL export the TypeScript interface `VisitsBridgeState` and the event name as a constant.
- AC-20: THE owners, pets, visits, and vets pages SHALL show the same content, fields, and navigation as before this story.
- AC-21: THE visits store SHALL NOT add any HTTP request other than the existing visit list operation.
- AC-22: WHEN dependencies are installed and the project is built, THE build command SHALL complete without errors.

## 5. Edge Cases

- Visit list is empty: all four status counts are 0; the published `visits` is an empty array.
- Status values: `SCHEDULED`, `COMPLETED`, `CANCELLED` (counted); absent, null, `""`, `"   "` (notSet); `"scheduled"` lowercase, `" COMPLETED "` with padding, `"NO_SHOW"` (notSet).
- Load failure with a server error response: `loading` false, `error` holds the message, no exception escapes to the page.
- Load failure with a network error: same as above.
- Host object already present on `window` with other keys set by another front end: those keys are left unchanged.
- Another front end listens for `petclinic-host:visits` before the first load completes: see CL-1.

## 6. Constraints

- NgRx 19.2.1 is already installed; use its action, reducer, effect, and selector APIs. Do not modify the root store setup.
- The project uses RxJS 6 (`rxjs` `^6.3.1`): import operators from `rxjs/operators`, and use no RxJS 7-only APIs.
- Reuse the existing visit list operation and the existing visit status type. Do not add a second HTTP client.
- No `any` for visit data; type the bridge object with `VisitsBridgeState`.
- Do not log visit objects, the published state, or response bodies. Do not write visit data to `localStorage`, `sessionStorage`, or IndexedDB.
- The host object lives only in memory on `window`; no storage is used.
- Performance target: N/A — no latency or bundle target is stated in the story.
- Data flow trace: API (`petclinic-rest-api`) → visit service (this repo) → visits store (this repo) → host bridge (this repo) → `window.petclinicHost` and event (read by PC-104 in another repo; not changed by this story).

## 7. Out of Scope

- The front-desk panel and any reading of the bridge by other apps (story PC-104).
- Changes to `package.json` and `src/main.ts`.
- Any UI change, new page, or visible text.
- Backend or API changes.
- Unit tests (this repo verifies by build only).
- Stores for owners, pets, vets, or pet types.
- Server-side or persistent storage of visits.

## 8. Clarifications Needed

[NEEDS CLARIFICATION]: CL-1 — Host state published before the first load completes: (a) loading false, visits empty, error null (b) loading true, visits empty, error null
[NEEDS CLARIFICATION]: CL-2 — Visits held after a failed load: (a) keep the visits from the last successful load (b) reset visits to empty
[NEEDS CLARIFICATION]: CL-3 — Error value when a new load starts: (a) reset error to null when the load begins (b) keep the previous error until the load succeeds or fails again
[NEEDS CLARIFICATION]: CL-4 — Load-visits dispatched while a load is in flight: (a) cancel the in-flight request and keep only the latest result (b) start a request per dispatch, last response to arrive wins (c) ignore the new dispatch until the load ends
[NEEDS CLARIFICATION]: CL-5 — Visit fields published on the host bridge: (a) full visit objects as returned by the API, including nested pet data (b) only id, date, status, and petId

## 9. Assumptions

None. Every criterion traces to the story, its attached contract, or the existing repo conventions.

## 10. Story Quality Score

| Dimension | Score | Basis |
|---|---|---|
| Clarity | 16/20 | Allowed statuses and counting rules are concrete; failure-state and host-state semantics are open (CL-1 to CL-3) |
| Testability | 18/20 | Each AC has an observable outcome; AC-16 "when state changes" depends on CL-1 for the first publish |
| Traceability | 20/20 | Every AC traces to a story clause or the attached contract; no `[ASSUMED]` |
| Atomicity | 20/20 | Story bundles split into one behaviour per AC (AC-2 to AC-5, AC-8 to AC-12, AC-16 to AC-19) |
| Completeness | 16/20 | Bridge payload fields and concurrency undecided (CL-4, CL-5) |
| Edge coverage | 16/20 | Status and empty cases named; concurrent loads and partial failure undecided |
| **Total** | **106/120** | |

## 11. Design trigger

**DESIGN REQUIRED: YES**
Introduces a pattern the repo lacks: the first NgRx feature store (the repo has NgRx installed but no store). Also consumes a changed upstream contract into shared state, and publishes a global page contract (`window.petclinicHost`, `petclinic-host:visits`) that other front ends will depend on.

## 12. Feasibility

**VERDICT: GO**
Basis: the visit list operation, the visit status type, the visit model with `status`, NgRx 19.2.1 (`@ngrx/store`, `@ngrx/effects`), and the root store in the app bootstrap all exist. The visits module is imported eagerly at bootstrap, so its feature registration applies at app start.
Data flow: API (petclinic-rest-api, `visits` list) → visit service (this repo) → visits store (this repo) → host bridge (this repo) → `window.petclinicHost` and event (read by PC-104 in another repo; unchanged here).
Note (not a blocker): `package.json` pins `rxjs` `^6.3.1`. Confirm during the install that the NgRx 19.2.1 peer range accepts the resolved RxJS version.
Note (not a blocker): the story's `GET /api/visits` label is informal; the existing visit service builds the URL from the configured API base URL, and this story reuses that call unchanged.
