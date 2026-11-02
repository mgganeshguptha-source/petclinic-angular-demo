# Validation — PC-103 (visits-host-bridge)

**Source:** .github/story-context-files/visits-host-bridge-context-261102-130116.md
**Criteria checked:** 28  (met 28 · not met 0 · unverifiable 0)

**VERDICT: PASS**

## Per-criterion verdicts

### AC-1 — MET
THE visits store SHALL register its feature state under the key `visits`.
**Evidence:** visits.module.ts line 58 `StoreModule.forFeature(VISITS_FEATURE_KEY, visitsReducer)`; `VISITS_FEATURE_KEY = 'visits'` in visits.reducer.ts. VisitsModule is imported eagerly via `importProvidersFrom` in main.ts, so the feature is registered at start.

### AC-2 — MET
THE visits store SHALL be organised as separate modules for actions, reducer, effects, selectors and the host bridge, one concern each, in the visits store folder.
**Evidence:** src/app/store/visits/ contains visits.actions.ts, visits.reducer.ts, visits.effects.ts, visits.selectors.ts and visits-bridge.ts. Each file holds one concern.

### AC-3 — MET
WHEN the load-visits action is dispatched, THE visits store SHALL call the visit service's get-all method exactly once.
**Evidence:** visits.effects.ts `loadVisits$` uses `ofType(loadVisits)` then `switchMap(() => this.visitService.getVisits())`, one call per action. Nothing else calls getVisits on that path.

### AC-4 — MET
WHEN the load-visits action is dispatched, THE visits store SHALL set loading to true.
**Evidence:** visits.reducer.ts `on(loadVisits, state => ({...state, loading: true, error: null}))`.

### AC-5 — MET
WHEN the visit list request succeeds, THE visits store SHALL hold the returned visits.
**Evidence:** visits.reducer.ts `on(loadVisitsSuccess, (state, {visits}) => ({...state, visits, ...}))`; the effect maps the service result to `loadVisitsSuccess({visits})`.

### AC-6 — MET
WHEN the visit list request succeeds, THE visits store SHALL set loading to false and error to null.
**Evidence:** visits.reducer.ts `on(loadVisitsSuccess, ...)` sets `loading: false, error: null`.

### AC-7 — MET
WHEN the load-visits action is dispatched, THE visits store SHALL set error to null.
**Evidence:** visits.reducer.ts `on(loadVisits, ...)` sets `error: null`. This criterion is marked [ASSUMED] (see Assumed criteria).

### AC-8 — MET
IF the visit list request fails, THEN THE visits store SHALL set loading to false.
**Evidence:** visits.effects.ts `catchError(() => of(loadVisitsFailure({error: LOAD_VISITS_ERROR_MESSAGE})))`; reducer `on(loadVisitsFailure, ...)` sets `loading: false`. The failure is observable because VisitService.getVisits() uses `catchError(this.handlerError('getVisits', []))`, and `HttpErrorHandler.handleError` returns `throwError(message)` (error.service.ts), so the error reaches the effect.

### AC-9 — MET
IF the visit list request fails, THEN THE visits store SHALL set error to "Could not load visits.".
**Evidence:** visits.effects.ts `export const LOAD_VISITS_ERROR_MESSAGE = 'Could not load visits.'`, dispatched as the failure payload; reducer stores `error` from the failure action.

### AC-10 — MET
THE visits store SHALL NOT include server response content in the error message.
**Evidence:** visits.effects.ts `catchError(() => ...)` ignores the thrown value and uses only the fixed constant. Only the effect dispatches loadVisitsFailure, so no server text reaches the store.

### AC-11 — MET
THE visits store SHALL hold each visit as the API returns it, with no nested pet object.
**Evidence:** visits.reducer.ts stores `visits` as received from `getVisits()` with no mapping. The bridge's mapping (AC-22) is applied only on publish, not in the store.

### AC-12 — MET
THE status-count selector SHALL return an object with exactly the keys SCHEDULED, COMPLETED, CANCELLED and notSet, each holding a number.
**Evidence:** visits.selectors.ts `selectVisitStatusCounts` initialises `{notSet: 0}`, then sets one key per entry of `VISIT_STATUS_LABELS` (exactly SCHEDULED, COMPLETED, CANCELLED per visit-status.ts). Four keys, all numeric.

### AC-13 — MET
WHEN a visit's status is SCHEDULED, COMPLETED or CANCELLED, THE status-count selector SHALL count that visit under that status.
**Evidence:** visits.selectors.ts loop: `if (typeof status === 'string' && hasOwnProperty(VISIT_STATUS_LABELS, status)) counts[status]++`.

### AC-14 — MET
WHEN there are no visits, THE status-count selector SHALL return 0 for every key.
**Evidence:** all four keys are initialised to 0 before the loop, and the loop does not run for an empty array.

### AC-15 — MET
IF a visit's status is absent, null, an empty string, or only whitespace, THEN THE status-count selector SHALL count that visit under notSet.
**Evidence:** visits.selectors.ts: absent/null are not `typeof 'string'` → `notSet++`. `''` and `'   '` are strings but fail the `hasOwnProperty` check against the three keys → `notSet++`. No trimming is needed for the result.

### AC-16 — MET
IF a visit's status is any value other than SCHEDULED, COMPLETED or CANCELLED, THEN THE status-count selector SHALL count that visit under notSet without throwing an error.
**Evidence:** visits.selectors.ts else-branch `counts.notSet++` for any non-matching value. The only lookup is `Object.prototype.hasOwnProperty.call`, which does not throw for any string.

### AC-17 — MET
THE status-count selector SHALL match status values case-sensitively, so `scheduled` is counted under notSet.
**Evidence:** `hasOwnProperty(VISIT_STATUS_LABELS, 'scheduled')` is false because the keys are upper-case, so the visit falls through to `notSet++`.

### AC-18 — MET
THE status-count selector SHALL take its allowed status values from the existing visit status type, not from separately written string literals.
**Evidence:** visits.selectors.ts imports `VISIT_STATUS_LABELS, VisitStatus` from `../../visits/visit-status`, and derives keys with `Object.keys(VISIT_STATUS_LABELS)`. The only literals are in visit-status.ts. `VisitStatusCounts` is typed from `VisitStatus`.

### AC-19 — MET
WHEN the app starts, THE app SHALL dispatch the load-visits action exactly once.
**Evidence:** app.component.ts constructor calls `store.dispatch(loadVisits())` once. AppComponent is the bootstrap component (main.ts), constructed once.

### AC-20 — MET
WHEN the visits state changes, THE host bridge SHALL set `window.petclinicHost.visits` to an object with keys `visits`, `statusCounts`, `loading` and `error`.
**Evidence:** visits-bridge.ts `startVisitsBridge` combines the four selectors, maps to `{visits, statusCounts, loading, error}`, and in subscribe sets `host.visits = state` on `window.petclinicHost`. The subscription is started in AppComponent's constructor before the load is dispatched.

### AC-21 — MET
WHEN the visits state changes, THE host bridge SHALL dispatch a browser event named `petclinic-host:visits` whose detail is the same object set on `window.petclinicHost.visits`.
**Evidence:** visits-bridge.ts `window.dispatchEvent(new CustomEvent<VisitsBridgeState>(VISITS_BRIDGE_EVENT, {detail: state}))`, where `state` is the same reference assigned to `host.visits`. `VISITS_BRIDGE_EVENT = 'petclinic-host:visits'`.

### AC-22 — MET
THE host bridge SHALL publish each visit with only `id`, `date`, `status` and `petId`.
**Evidence:** visits-bridge.ts maps each visit to `{id: v.id, date: v.date, status: v.status, petId: v.petId}`.

### AC-23 — MET
THE host bridge SHALL NOT publish the `description` of any visit.
**Evidence:** the mapping in visits-bridge.ts does not copy `description`. `VisitsBridgeVisit` has no `description` field.

### AC-24 — MET
WHEN the app has started and the visit list has loaded, THE host bridge SHALL have published `loading` false and `error` null.
**Evidence:** on success, the reducer sets `loading: false, error: null` (AC-6). The bridge publishes the store values unchanged. The bridge subscribes before the load is dispatched, so the post-load state is published. Verified by code path only; no runtime test exists in this repo.

### AC-25 — MET
IF the visit list request fails, THEN THE host bridge SHALL publish `error` as "Could not load visits.".
**Evidence:** on failure the store holds `error = LOAD_VISITS_ERROR_MESSAGE` (AC-9). The bridge publishes `error` from `selectVisitsError` without change.

### AC-26 — MET
THE host bridge SHALL export the TypeScript interface `VisitsBridgeState` and the event-name constant for `petclinic-host:visits`.
**Evidence:** visits-bridge.ts `export interface VisitsBridgeState` and `export const VISITS_BRIDGE_EVENT = 'petclinic-host:visits'`.

### AC-27 — MET
THE clinic app SHALL NOT display any new or changed UI on the owners, pets, visits or vets pages.
**Evidence:** the story's changes, as inspected, are in store files, visits.module.ts (providers/imports only) and app.component.ts (constructor logic, no template change). None touches a component template or styles. The full diff was not inspected, so this rests on the in-scope list and the files read.

### AC-28 — MET
THE clinic app SHALL build successfully with the production build command.
**Evidence:** validation-report.txt: `npm install … && npx ng build`, exit_code 0, "Browser application bundle generation complete." The harness build gate passed on the current tree.

## Assumed criteria

AC-7 is marked [ASSUMED] in the context file. The story never asked for "error set to null when a load starts". It is implemented (visits.reducer.ts). Confirm it is wanted before treating it as meaningful.

## Specification findings

- **CL-1 is stale.** The context file says `VisitService.getVisits()` swallows HTTP errors and returns `[]`. The current `HttpErrorHandler.handleError` returns `throwError(message)`, so failures do propagate. AC-8, AC-9 and AC-25 are satisfiable without changing the service. The context file should be updated.
- **CL-2 is unresolved.** The context leaves open whether visits are kept or cleared after a failed load. The code keeps them (the failure reducer does not touch `visits`). No AC covers this. Decide and record it.
- **Numbering mismatch.** The story attachment lists AC1–AC10 with different wording. This check used the context file's AC-1 to AC-28, as the harness instructs. The story's AC1–AC10 are not separately ruled on here.

## Summary

All 28 context criteria hold on code reading and the passing production build. AC-7 is an unconfirmed [ASSUMED] criterion. The context file's CL-1 premise is out of date, and CL-2 (visits after a failed load) is still open; a human should confirm both. No runtime test exercises the bridge or the failure path, so the bridge event behaviour is verified by reading the code only.
