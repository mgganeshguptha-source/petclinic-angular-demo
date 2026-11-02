# Context: Visits store with status summary, shared through a host bridge

Story: PC-103 — Visits store with a status summary, shared with other front ends through a host bridge.
Contract: petclinic-rest-api (attached OpenAPI file, PC-101 state).
Story type: Enhancement (adds shared state; no visible UI change).
Layer: Frontend (Angular 19, NgRx 19.2.1 already installed; root store already provided).

---

## 1. What Are We Trying to Achieve

The clinic app keeps all visits and a count of visits per status in one shared state holder. Other front-end apps loaded on the same page (the front-desk panel, story PC-104) read the same numbers from the page without calling the API themselves.

**New terms introduced by this story:**
- **Visits store** — the NgRx feature state holding the visit list, a loading flag and an error message for visits.
- **Status counts** — an object with one number per visit status (`SCHEDULED`, `COMPLETED`, `CANCELLED`) plus `notSet`.
- **notSet** — the count of visits whose status is absent, null, empty, whitespace-only, or any value outside the three allowed statuses.
- **Host bridge** — a publisher that copies the visits state onto the page for other front ends (`window.petclinicHost.visits` and the `petclinic-host:visits` browser event).

**Basis for the visit shape:** the store keeps visits as the API returns them, per the attached contract (`id`, `petId`, `date`, `description`, `status`). The contract `Visit` has no nested `pet` object, so the store does not carry one.

## 2. Current Behaviour

- No visits store exists. The app's visits are loaded per page through the visit service.
- No status summary exists anywhere in the app.
- No value is published on the page for other front ends.
- The NgRx packages are installed. The root store is provided (empty). No feature state or effects are registered.

## 3. Expected Behaviour

- The visits list comes from the visits endpoint of the attached contract, through the existing visit service's get-all call.
- Loading visits updates one visits state: the list, a loading flag, and an error message (null when there is none).
- Visits are held exactly as the API returns them.
- A status-count selector summarises the visits by status, including `notSet`.
- At app start, the app requests the visits once.
- When the visits state changes, the host bridge publishes `{ visits, statusCounts, loading, error }` to `window.petclinicHost.visits` and dispatches a `petclinic-host:visits` event whose detail is the same object. The published visits carry only `id`, `date`, `status` and `petId`.
- On failure, the error is the fixed text "Could not load visits." in both the store and the bridge. Server response content is never published.
- Existing pages show no visible change.

## 4. Acceptance Criteria

Rules applied: EARS phrasing; one response per criterion; stable identifiers; `[ASSUMED]` marks criteria the story did not ask for.

**Store structure**
- AC-1: THE visits store SHALL register its feature state under the key `visits`.
- AC-2: THE visits store SHALL be organised as separate modules for actions, reducer, effects, selectors and the host bridge, one concern each, in the visits store folder.

**Loading visits**
- AC-3: WHEN the load-visits action is dispatched, THE visits store SHALL call the visit service's get-all method exactly once.
- AC-4: WHEN the load-visits action is dispatched, THE visits store SHALL set loading to true.
- AC-5: WHEN the visit list request succeeds, THE visits store SHALL hold the returned visits.
- AC-6: WHEN the visit list request succeeds, THE visits store SHALL set loading to false and error to null.
- AC-7: [ASSUMED] WHEN the load-visits action is dispatched, THE visits store SHALL set error to null.
  Basis: the story defines error as null "when there is none"; a new load starting with a previous error still set would report a stale failure. Not stated in the story. Confirm or delete.
- AC-8: IF the visit list request fails, THEN THE visits store SHALL set loading to false.
- AC-9: IF the visit list request fails, THEN THE visits store SHALL set error to "Could not load visits.".
- AC-10: THE visits store SHALL NOT include server response content in the error message.
- AC-11: THE visits store SHALL hold each visit as the API returns it, with no nested pet object.

**Status counts**
- AC-12: THE status-count selector SHALL return an object with exactly the keys SCHEDULED, COMPLETED, CANCELLED and notSet, each holding a number.
- AC-13: WHEN a visit's status is SCHEDULED, COMPLETED or CANCELLED, THE status-count selector SHALL count that visit under that status.
- AC-14: WHEN there are no visits, THE status-count selector SHALL return 0 for every key.
- AC-15: IF a visit's status is absent, null, an empty string, or only whitespace, THEN THE status-count selector SHALL count that visit under notSet.
- AC-16: IF a visit's status is any value other than SCHEDULED, COMPLETED or CANCELLED, THEN THE status-count selector SHALL count that visit under notSet without throwing an error.
- AC-17: THE status-count selector SHALL match status values case-sensitively, so `scheduled` is counted under notSet.
- AC-18: THE status-count selector SHALL take its allowed status values from the existing visit status type, not from separately written string literals.

**App start and host bridge**
- AC-19: WHEN the app starts, THE app SHALL dispatch the load-visits action exactly once.
- AC-20: WHEN the visits state changes, THE host bridge SHALL set `window.petclinicHost.visits` to an object with keys `visits`, `statusCounts`, `loading` and `error`.
- AC-21: WHEN the visits state changes, THE host bridge SHALL dispatch a browser event named `petclinic-host:visits` whose detail is the same object set on `window.petclinicHost.visits`.
- AC-22: THE host bridge SHALL publish each visit with only `id`, `date`, `status` and `petId`.
- AC-23: THE host bridge SHALL NOT publish the `description` of any visit.
- AC-24: WHEN the app has started and the visit list has loaded, THE host bridge SHALL have published `loading` false and `error` null.
- AC-25: IF the visit list request fails, THEN THE host bridge SHALL publish `error` as "Could not load visits.".
- AC-26: THE host bridge SHALL export the TypeScript interface `VisitsBridgeState` and the event-name constant for `petclinic-host:visits`.
- AC-27: THE clinic app SHALL NOT display any new or changed UI on the owners, pets, visits or vets pages.
- AC-28: THE clinic app SHALL build successfully with the production build command.

## 5. Edge Cases

- Empty visit list: every count is 0, `notSet` is 0, bridge publishes `visits: []`.
- Visit with status null, absent, `""`, `"   "`: counted under notSet.
- Visit with status `"scheduled"` (wrong case) or `"DONE"`: counted under notSet, nothing throws.
- Visit with `description` containing markup or sensitive text: not present in any published value.
- Request fails at app start: state ends with loading false, error "Could not load visits.", and the bridge publishes the same. Visits value depends on CL-2.
- Server returns a visit without `petId`: published with `petId` absent, nothing else added. (Contract marks `petId` required; the store does not repair data.)

## 6. Constraints

- Use the existing visit status type and the existing visit service's get-all call. Do not add new status string literals.
- NgRx 19.2.1 is already installed; use it for state, actions, reducer, effects and selectors. Do not add packages.
- Root store is already provided in the app entry point. Register feature state and effects from the visits module.
- Start the bridge once at app start.
- Published data is a snapshot object; do not publish live store references.
- Compatibility: RxJS version in the repo must satisfy the peer range of NgRx 19.2.1. Confirm during analysis (note only, not a blocker).
- Build validation only (no new unit tests in this repo). Build command: `npm install` then `npx ng build`.
- Non-functional targets: none stated in the story. None added.

## 7. Out of Scope

- The front-desk panel and its reading of the bridge (story PC-104).
- Any UI change on existing pages.
- Backend or API changes.
- Changes to `package.json` and the app entry point.
- Creating, updating or deleting visits through the store.
- Persisting visits state across page loads.
- Unit tests (this repo runs build validation only).

## 8. Clarifications Needed

- [NEEDS CLARIFICATION]: CL-1 — Failure observability: the visit service's get-all call catches HTTP errors and returns an empty list, so the store cannot see a failure through it, and AC-8, AC-9 and AC-25 cannot be met as written. Options: (a) keep the service unchanged; a failed request ends with loading false, error null, visits empty (b) change the service so the error propagates to the store; this changes an existing service outside the story's in-scope list and may change existing pages' behaviour
- [NEEDS CLARIFICATION]: CL-2 — Visits held after a failed load: (a) keep the previously loaded visits (b) clear visits to an empty list

## 9. Assumptions

- AC-7 — error reset when a new load starts. Assumed error is set to null on load start.
  Basis: the story defines error as null when there is none; no stated rule for a new load. Confirm or replace before building.

## 10. Story Quality Score

| Dimension | Score | Basis |
|---|---|---|
| Clarity | 18/20 | Terms defined; CL-1 shows the failure path is not yet observable |
| Testability | 16/20 | AC-8, AC-9, AC-25 depend on CL-1 |
| Traceability | 19/20 | One [ASSUMED] criterion (AC-7), basis stated |
| Atomicity | 20/20 | Each AC is one response with at most one precondition |
| Completeness | 17/20 | Behaviour after failed reload not stated (CL-2); no non-functional target |
| Edge coverage | 16/20 | Null, empty, wrong-case, unknown status and failure covered; missing petId case covered but outcome not stated by story |
| **Total** | **106/120** | |

## 11. Design trigger

**DESIGN REQUIRED: YES**
Consumes a changed upstream contract into shared state: the visits shape from petclinic-rest-api reaches a new NgRx store and a page-level bridge, so the mapping must be decided once. The repo has no feature store today, so NgRx state and effects are a pattern the repo lacks.

## 12. Feasibility

**VERDICT: GO**
Basis: the visit service's get-all call, the visit status type, the visits module, the installed NgRx 19.2.1 packages and the app's root store all exist in this repo. No story-introduced dependency is missing.
Data flow: API (petclinic-rest-api, visits list) → visit service (this repo) → visits store (this repo) → host bridge (this repo) → `window.petclinicHost.visits` and `petclinic-host:visits` event → front-desk panel (PC-104, other repo; read-only consumer, unchanged by this story).
Note: CL-1 concerns whether the story's failure criteria can be met without changing the visit service. This is a behavioural clarification, not a blocker; no blocker class applies.
