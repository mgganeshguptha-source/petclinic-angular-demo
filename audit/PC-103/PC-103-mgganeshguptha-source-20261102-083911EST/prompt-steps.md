# Plan for: Visits store with a status summary, shared with other front ends through a host bridge (PC-103)

**Source:** `.github/story-context-files/visits-host-bridge-context-261102-130116.md` (newest context file on disk) + harness story text + `.harness/attachments/01-openapi.yml` (petclinic-rest-api, PC-101 state) + `.github/copilot-instructions.md`
**Stack:** Frontend only (Angular 19.2, NgRx 19.2.1 installed, RxJS 6 per project rules, NgModule feature modules, standalone `AppComponent`)
**Total steps:** 10
**Unresolved clarifications:** None. CL-1 and CL-2 are resolved below.

---

## Resolutions of context clarifications (verified in code)

- **CL-1 (failure observability): RESOLVED, no service change.** `HttpErrorHandler.handleError` (`src/app/error.service.ts`) ends in `return throwError(message)`. `VisitService.getVisits()` wraps it with `catchError(this.handlerError('getVisits', []))`, and `catchError` with a handler that returns `throwError(...)` still errors. The error therefore reaches the effect. The context file's claim that the service "returns an empty list" is incorrect. `VisitService` and `error.service.ts` stay unchanged, as the story requires.
- **CL-2 (visits after a failed load): RESOLVED by story AC8.** Keep the visits from the last successful load. Failure only sets `loading: false` and the fixed error text.
- **AC-7 `[ASSUMED]` is now requested.** Story AC8 explicitly says "Load visits sets loading true and error null". Treat AC-7 as a confirmed criterion, not an assumption.

---

## Acceptance criteria coverage

Ids are the context file's AC-1 to AC-28. The story's own AC1 to AC10 are mapped in the last column.

| AC | Criterion (abbreviated) | Covered by | Story AC |
|---|---|---|---|
| AC-1 | Feature registered under key `visits` | Step 3 (`VISITS_FEATURE_KEY`), Step 7 (`StoreModule.forFeature`) | AC1 |
| AC-2 | Separate actions, reducer, effects, selectors, bridge files | Steps 2, 3, 4, 5, 6 (one file each) | AC1 |
| AC-3 | Load-visits calls `getVisits()` once | Step 4 (`ofType` → `switchMap` → `getVisits()`) | AC2 |
| AC-4 | Load-visits sets `loading` true | Step 3 | AC2, AC8 |
| AC-5 | Success holds returned visits | Step 3 | AC2 |
| AC-6 | Success sets `loading` false, `error` null | Step 3 | AC2 |
| AC-7 | Load-visits sets `error` null | Step 3 | AC8 |
| AC-8 | Failure sets `loading` false | Steps 3, 4 | AC2 |
| AC-9 | Failure sets `error` to "Could not load visits." | Steps 2 (constant), 4 (catch), 3 (store) | AC2, AC9 |
| AC-10 | No server response content in error | Steps 2, 3, 4 (effect never passes the server message) | AC9 |
| AC-11 | Visits held as the API returns them | Step 3 (stored as-is), Step 6 (bridge maps only on publish) | AC10 |
| AC-12 | Count selector returns exactly SCHEDULED, COMPLETED, CANCELLED, notSet as numbers | Step 5 | AC3 |
| AC-13 | Known status counted under its key | Step 5 | AC3 |
| AC-14 | No visits gives 0 for every key | Step 5 | AC3 |
| AC-15 | Null, absent, empty, whitespace status counted as notSet | Step 5 | AC3 |
| AC-16 | Unknown status counted as notSet without throwing | Step 5 | AC3 |
| AC-17 | Case-sensitive match (`scheduled` is notSet) | Step 5 | AC3 |
| AC-18 | Status keys derived from existing `VisitStatus` type, no new literals | Step 5 (keys from `VISIT_STATUS_LABELS`) | AC4 |
| AC-19 | App dispatches load-visits once at start | Step 8 | AC1 (story) |
| AC-20 | Bridge sets `window.petclinicHost.visits` to `{visits, statusCounts, loading, error}` | Steps 6, 8 | AC5 |
| AC-21 | Bridge dispatches `petclinic-host:visits` with the same object as `detail` | Step 6 | AC5 |
| AC-22 | Bridge publishes only `id`, `date`, `status`, `petId` | Step 6 | AC10 |
| AC-23 | Bridge never publishes `description` | Step 6 | AC10 |
| AC-24 | After load, bridge shows `loading` false, `error` null | Steps 8, 10 (validation) | AC5 |
| AC-25 | Failed load publishes `error` "Could not load visits." | Steps 4, 6 | AC9 |
| AC-26 | Export `VisitsBridgeState` and the event-name constant | Step 6 | AC5 |
| AC-27 | No UI change on existing pages | No step required: no template or component UI file is in scope. Verified in Step 10. | AC6 |
| AC-28 | `ng build` passes | Step 10 | AC7 |

**Story-only requirements (not in context ACs), delivered and verified:**
- Initial state is visits `[]`, `loading` false, `error` null. Step 3 defines it. It is also the first value the bridge publishes (Step 6, Step 10).
- Load-visits while a load is in flight cancels the older request (`switchMap`). Step 4. Verified in Step 10.

---

## Before you execute any step

1. Keep the context file and the story's attached `01-openapi.yml` in view. Steps refer to the contract's `Visit` and `VisitStatus` schemas.
2. Do not add packages. Do not edit `package.json` or `src/main.ts`.
3. Do not edit `visit.service.ts`, `visit.ts`, `visit-status.ts`, or `error.service.ts`.
4. Build-only repo. Do not add unit tests (story out of scope).
5. Fill the Impacted Files block after Step 1 if the file set changes.

---

## Pre-flight

The plan assumes:

1. **Stack:** Angular 19 with NgModule feature modules (`VisitsModule` provides `VisitService`) and a standalone `AppComponent`. NgRx 19.2.1 (`@ngrx/store`, `@ngrx/effects`) is already installed, and the root store is provided in `src/main.ts` via `provideStore()` and `provideEffects()`. `VisitsModule` is imported eagerly through `importProvidersFrom`, so its feature registration runs at bootstrap.
2. **Behaviour preservation:** Owners, pets, visits, and vets pages are unchanged. `VisitService` is unchanged, so existing `getVisits()` callers see the same behaviour. `HttpErrorHandler` still logs the server body with `console.error`; this is existing behaviour and is not changed here.
3. **Non-functional handling:** No performance or accessibility target is stated. None is added. The bridge publishes a snapshot object on each state change, not a live store reference.
4. **Assumed criteria:** No criteria remain `[ASSUMED]`. AC-7 is requested by story AC8 (see resolutions).
5. **RxJS version:** The `package.json` range is RxJS `^6.3.1`. NgRx 19 peers on RxJS 6.5.3+ and 7.4+. Step 10 must confirm that the installed RxJS satisfies the NgRx peer range (`npm ls rxjs`). If it does not, stop and report. Do not change the package.
6. **Status keys:** There is no runtime array for the `VisitStatus` union. The runtime key list is `Object.keys(VISIT_STATUS_LABELS)`, typed as `VisitStatus[]`. `VISIT_STATUS_LABELS` is `Record<VisitStatus, string>`, so the compiler keeps the list in sync with the union. Status matching is exact (case-sensitive, no trimming). Membership is checked with `Object.prototype.hasOwnProperty.call`, so inherited names like `constructor` count as notSet.
7. **Known typing gap (out of scope):** `Visit` in `src/app/visits/visit.ts` declares `pet: Pet` as required. The contract has no nested pet, and the store holds the API shape as returned. The store uses the existing `Visit` type as `VisitService` returns it. Do not change `visit.ts`.
8. **HIPAA:** Visit dates and `petId` are identifiers tied to individuals. The bridge publishes them to `window`, and any script on the page can read them. The story requires this publish. Each new PHI-touching method carries a `TODO HIPAA` audit marker. The developer must confirm the publish is acceptable (see Step 6).

If any of these assumptions are wrong, stop and revise the context file or the plan before proceeding.

---

## Impacted Files

| ID | Path | Role |
|----|------|------|
| F1 | `src/app/store/visits/visits.actions.ts` (new) | Load-visits, load-success and load-failure actions; fixed error text constant |
| F2 | `src/app/store/visits/visits.reducer.ts` (new) | `VisitsState` interface, `VISITS_FEATURE_KEY = 'visits'`, `initialVisitsState`, `visitsReducer` |
| F3 | `src/app/store/visits/visits.effects.ts` (new) | `VisitsEffects`: calls `VisitService.getVisits()` and maps to success or failure |
| F4 | `src/app/store/visits/visits.selectors.ts` (new) | Feature selectors and `countVisitsByStatus` (pure) plus `VisitStatusCounts` type |
| F5 | `src/app/store/visits/visits-bridge.ts` (new) | `VisitsBridgeState`, `PETCLINIC_HOST_VISITS_EVENT`, `startVisitsBridge(store)` |
| F6 | `src/app/visits/visits.module.ts` (edit) | Register `StoreModule.forFeature` and `EffectsModule.forFeature` |
| F7 | `src/app/app.component.ts` (edit) | Dispatch load-visits once; start bridge; unsubscribe on destroy |

**Read-only references (do not edit):**

| ID | Path | Used for |
|----|------|----------|
| R1 | `src/app/visits/visit.service.ts` | `getVisits(): Observable<Visit[]>` |
| R2 | `src/app/visits/visit.ts` | `Visit` type (see pre-flight 7) |
| R3 | `src/app/visits/visit-status.ts` | `VisitStatus` union and `VISIT_STATUS_LABELS` |
| R4 | `src/app/error.service.ts` | Confirms `throwError` propagation (no change) |
| R5 | `.harness/attachments/01-openapi.yml` | `Visit`, `VisitFields`, `VisitStatus` schemas |

**API changes:** None in this repo. The contract is owned by petclinic-rest-api and is consumed unchanged.

## Signature changes

None. No existing public or interface method changes signature. `VisitService` is not modified.

## Contract usage

| Contract (attached file) | Element | Shape used | Read or written by |
|----------|---------|------------|------------------------------|
| `openapi.yml` `GET /visits` → `Visit[]` | `id`, `date`, `description`, `status`, `petId` | One shape: the `Visit` type (`Visit[]` from `VisitService.getVisits()`), held as returned | Read by F3 (effect, via R1), held by F2 |
| `openapi.yml` `VisitStatus` | `SCHEDULED`, `COMPLETED`, `CANCELLED` | The `VisitStatus` union (R3) | Read by F4 (keys), F5 (type) |

Notes:
- `description` is held in the store (it is part of the API response) but never published by F5.
- Upstream shape is mapped in one place, F5, when it is published. There is no other mapping.

---

## Step 1 — Confirm file set and the error path

**Goal:** Confirm the file set above, confirm that `VisitService.getVisits()` re-throws HTTP errors (R1 and R4), and confirm `VisitsModule` is eagerly imported in `src/main.ts`. Make no edits.
**Implements:** — (enabling step, no AC)
**Depends on:** —

**Suggested prompt:**

> Using `.github/copilot-instructions.md` and the attached context file, read `src/app/visits/visit.service.ts`, `src/app/error.service.ts`, `src/app/visits/visit-status.ts`, `src/app/visits/visit.ts`, `src/app/visits/visits.module.ts`, `src/app/app.component.ts`, and `src/main.ts`. Do not edit anything. Report: (a) whether `handleError` returns `throwError`, so that `getVisits()` errors reach a caller; (b) whether `src/app/store/` exists; (c) the exact import line for `VISIT_STATUS_LABELS`. Confirm the file set F1 to F7 and tell me if any other file must change.

**Review checkpoint:** Confirm the report says the error propagates, `src/app/store/` does not exist, and only F1 to F7 change. If the error does not propagate, stop: AC-8, AC-9, and AC-25 cannot be met without a service change, which needs a new decision.

---

## Step 2 — Actions and fixed error text (F1)

**Goal:** Create the three actions and the fixed error message constant.
**Implements:** AC-2, AC-9, AC-10
**Depends on:** Step 1

**Suggested prompt:**

> Create F1 `src/app/store/visits/visits.actions.ts`. Use the Apache license header and `@author` style of the other files in `src/app/`. Use NgRx `createAction` and `props`. Add these exports:
>
> ```ts
> export const VISITS_LOAD_ERROR_MESSAGE = 'Could not load visits.';
> export const loadVisits = createAction('[Visits] Load visits');
> export const loadVisitsSuccess = createAction('[Visits] Load visits success', props<{ visits: Visit[] }>());
> export const loadVisitsFailure = createAction('[Visits] Load visits failure', props<{ error: string }>());
> ```
>
> Import `Visit` from `../../visits/visit`. Do not add other actions. Do not touch any other file.

**Review checkpoint:** Confirm the constant text is exactly `Could not load visits.`, the three actions exist, the failure action carries only `error: string`, and nothing else changed.

---

## Step 3 — Reducer, state, and feature key (F2)

**Goal:** Define the state shape, initial state, feature key, and the reducer.
**Implements:** AC-1, AC-2, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-11
**Depends on:** Step 2

**Suggested prompt:**

> Create F2 `src/app/store/visits/visits.reducer.ts`. Use the same license header style. Add:
>
> ```ts
> export const VISITS_FEATURE_KEY = 'visits';
> export interface VisitsState { visits: Visit[]; loading: boolean; error: string | null; }
> export const initialVisitsState: VisitsState = { visits: [], loading: false, error: null };
> export const visitsReducer = createReducer(
>   initialVisitsState,
>   on(loadVisits, state => ({ ...state, loading: true, error: null })),
>   on(loadVisitsSuccess, (state, { visits }) => ({ ...state, visits, loading: false, error: null })),
>   on(loadVisitsFailure, (state, { error }) => ({ ...state, loading: false, error }))
> );
> ```
>
> Store `visits` exactly as received. No mapping, no nested pet handling. Keep the existing `visits` on failure (story AC8). Import the actions from `./visits.actions`. Do not add any other field.

**Review checkpoint:** Confirm: failure does not clear `visits`; `visits` is stored without mapping; the feature key is the literal `'visits'` through the constant; `loading` true and `error` null on load-visits.

---

## Step 4 — Effect (F3)

**Goal:** Call `VisitService.getVisits()` once per load-visits, cancel any in-flight request, and map to success or failure with the fixed text.
**Implements:** AC-3, AC-8, AC-9, AC-10, AC-25
**Depends on:** Step 2

**Suggested prompt:**

> Create F3 `src/app/store/visits/visits.effects.ts`. Add an `@Injectable()` class `VisitsEffects` with constructor `(private actions$: Actions, private visitService: VisitService)`. Import `Actions`, `createEffect`, `ofType` from `@ngrx/effects`. Use `switchMap` and `map` from `rxjs/operators` (RxJS 6), `catchError` from `rxjs/operators`, and `of` from `rxjs`. Define:
>
> ```ts
> loadVisits$ = createEffect(() =>
>   this.actions$.pipe(
>     ofType(loadVisits),
>     switchMap(() =>
>       this.visitService.getVisits().pipe(
>         map(visits => loadVisitsSuccess({ visits })),
>         // TODO HIPAA: emit audit event (actor, action, resource, timestamp)
>         catchError(() => of(loadVisitsFailure({ error: VISITS_LOAD_ERROR_MESSAGE })))
>       )
>     )
>   )
> );
> ```
>
> The `catchError` is inside the inner observable so a failure does not end the outer stream. Do not read or pass the thrown value to the action. Do not add other effects.

**Review checkpoint:** Confirm: `getVisits()` is called once per dispatch; `switchMap` is used (an older request is cancelled by a newer load); the failure action carries only the constant; `catchError` is inside the inner pipe; the HIPAA TODO is present. Loop back to Step 2 if the constant is passed through another path.

---

## Step 5 — Selectors and status counts (F4)

**Goal:** Feature selectors and a pure `countVisitsByStatus` function. Keys come from the existing `VisitStatus` type.
**Implements:** AC-2, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17, AC-18
**Depends on:** Step 3

**Suggested prompt:**

> Create F4 `src/app/store/visits/visits.selectors.ts`. Import `VISIT_STATUS_LABELS` and `VisitStatus` from `../../visits/visit-status`, and `VISITS_FEATURE_KEY`, `VisitsState` from `./visits.reducer`. Add:
>
> ```ts
> export type VisitStatusCounts = Record<VisitStatus, number> & { notSet: number };
> const STATUSES = Object.keys(VISIT_STATUS_LABELS) as VisitStatus[];
> export function countVisitsByStatus(visits: ReadonlyArray<{ status?: string | null }>): VisitStatusCounts {
>   const counts = { SCHEDULED: 0, COMPLETED: 0, CANCELLED: 0, notSet: 0 } as VisitStatusCounts; // replace literal init with a loop over STATUSES
>   ...
> }
> ```
>
> Build the initial object from `STATUSES` (every key 0) plus `notSet: 0`, not from new string literals. For each visit: if `status` is a string and `Object.prototype.hasOwnProperty.call(VISIT_STATUS_LABELS, status)`, add 1 to that key; otherwise add 1 to `notSet`. Exact match only: no trimming, no case folding. Export `selectVisitsState = createFeatureSelector<VisitsState>(VISITS_FEATURE_KEY)`, `selectVisits`, `selectVisitsLoading`, `selectVisitsError`, and `selectVisitStatusCounts = createSelector(selectVisits, countVisitsByStatus)`. Add only the comment needed to explain the hasOwnProperty check.

**Review checkpoint:** Confirm: no status string literal appears outside `visit-status.ts`; the output has exactly four keys; null, absent, empty, whitespace, lowercase, and unknown values count as `notSet`; no throw on unknown values. Note: the initial-object example above uses literals for illustration only. The final code must build keys from `STATUSES`.

---

## Step 6 — Host bridge (F5)

**Goal:** Publish a snapshot of the visits state to `window.petclinicHost.visits` and dispatch `petclinic-host:visits` on every state change. Publish only `id`, `date`, `status`, `petId`.
**Implements:** AC-2, AC-11, AC-20, AC-21, AC-22, AC-23, AC-24, AC-25, AC-26
**Depends on:** Step 3, Step 5

**Suggested prompt:**

> Create F5 `src/app/store/visits/visits-bridge.ts`. Export:
>
> ```ts
> export const PETCLINIC_HOST_VISITS_EVENT = 'petclinic-host:visits';
> export interface BridgeVisit { id: number; date: string; status?: VisitStatus | null; petId?: number; }
> export interface VisitsBridgeState { visits: BridgeVisit[]; statusCounts: VisitStatusCounts; loading: boolean; error: string | null; }
> declare global { interface Window { petclinicHost?: { visits?: VisitsBridgeState } } }
> export function startVisitsBridge(store: Store<object>): Subscription { ... }
> ```
>
> `startVisitsBridge` selects from the store using `selectVisits`, `selectVisitsLoading`, `selectVisitsError`, `selectVisitStatusCounts` (combine them, or select the state and derive), with `distinctUntilChanged` on the whole snapshot. For each emission, build a NEW object: `visits` mapped to `{ id, date, status, petId }` (never `description`), plus `statusCounts`, `loading`, and `error`. Then set `window.petclinicHost = window.petclinicHost || {}` and `window.petclinicHost.visits = state`, and call `window.dispatchEvent(new CustomEvent(PETCLINIC_HOST_VISITS_EVENT, { detail: state }))` with the same object. Emit the initial state on start (AC-8). Add `// TODO HIPAA: emit audit event (actor, action, resource, timestamp)` above the publish. Add one comment that the publish exposes visit dates and petIds to any script on the page. The story requires it, so the developer must confirm.

**Review checkpoint:** Confirm: the mapped visit objects never have `description`; the same object is set on `window` and passed as `detail`; the event name is the exported constant; the interface and constant are exported; the initial state is published on start. Loop back to Step 5 if the counts are not derived from the selector.

---

## Step 7 — Register the feature in VisitsModule (F6)

**Goal:** Register the visits feature state and effects so the root store picks them up.
**Implements:** AC-1
**Depends on:** Step 3, Step 4

**Suggested prompt:**

> Edit F6 `src/app/visits/visits.module.ts`. Import `StoreModule` from `@ngrx/store`, `EffectsModule` from `@ngrx/effects`, `VISITS_FEATURE_KEY`, `visitsReducer` from `../store/visits/visits.reducer`, and `VisitsEffects` from `../store/visits/visits.effects`. Add `StoreModule.forFeature(VISITS_FEATURE_KEY, visitsReducer)` and `EffectsModule.forFeature([VisitsEffects])` to the `imports` array. Change nothing else in the module. Do not add providers. `VisitService` stays provided by this module.

**Review checkpoint:** Confirm only the two imports and the two `imports` entries were added. `VisitsEffects` must be the same class used by Step 4. The key must come from the constant, not a literal.

---

## Step 8 — Dispatch on start and start the bridge (F7)

**Goal:** Dispatch load-visits once at app start, start the host bridge once, and unsubscribe on destroy.
**Implements:** AC-19, AC-20, AC-24
**Depends on:** Step 2, Step 6, Step 7

**Suggested prompt:**

> Edit F7 `src/app/app.component.ts`. Keep the standalone component and its `imports` array unchanged. Add `OnDestroy`. Inject `Store` (constructor injection, `private store: Store`). In the constructor, call `this.store.dispatch(loadVisits())` once, then `this.bridgeSub = startVisitsBridge(this.store)`. Implement `ngOnDestroy()` to call `this.bridgeSub.unsubscribe()`. Import `Store` from `@ngrx/store`, `loadVisits` from `./store/visits/visits.actions`, `startVisitsBridge` from `./store/visits/visits-bridge`, and `Subscription` from `rxjs`. Do not change the template or styles.

**Review checkpoint:** Confirm: `loadVisits()` is dispatched exactly once; the bridge starts once; `ngOnDestroy` unsubscribes; no template or style changes; the `imports` array is unchanged.

---

## Step 9 — Convention drift review

**Goal:** Check every changed file against `.github/copilot-instructions.md` and `src/app` conventions. Report only. Do not fix.
**Implements:** — (enabling step, no AC)
**Depends on:** Steps 2 to 8

**Suggested prompt:**

> Review F1 to F7 (only) against `.github/copilot-instructions.md` and the conventions in `.github/instructions/angular-frontend/angular-conventions.instructions.md`, `logging-angular.instructions.md`, and `angular-security.instructions.md`. Check: RxJS 6 imports from `rxjs/operators`; no nested `subscribe`; no `any`; typed payloads; no `console.log` of visits or domain objects; no `innerHTML` or bypass; the `TODO HIPAA` markers are present; no new Bootstrap or jQuery. List drift as file, line, and rule. Do not edit files.

**Review checkpoint:** Decide for each drift item whether to fix it now. Fixes are the developer's call. Loop back to the owning step if a fix is needed.

---

## Step 10 — Build and manual validation

**Goal:** Install, build, and check every AC by ID. This is the verification step.
**Implements:** AC-28 (build), plus the verification of all other ACs
**Depends on:** Step 9

**Suggested prompt:**

> From the repo root, run `npm install` and then `npx ng build`. Run `npm ls rxjs @ngrx/store @ngrx/effects` and report the installed versions and whether RxJS satisfies the NgRx peer range. Report the build result. Then give me a verification checklist with one row per AC id (AC-1 to AC-28) with the concrete check: for store behaviour, the unit-free check is a code read and a build; for bridge behaviour, the check is opening the app in a browser and running `window.petclinicHost.visits` and listening for `petclinic-host:visits` in the devtools console. Include AC-27 (no UI change: no template changes) and the story's initial-state and `switchMap` requirements. Do not edit files.

**Review checkpoint:** Record pass, fail, or unclear per AC id, not one verdict for the story:

| AC | Verdict | Note |
|---|---|---|
| AC-28 | | `npx ng build` result |
| AC-24 | | After load: `window.petclinicHost.visits.loading === false`, `error === null` |
| AC-25 | | Force a failed load (e.g. stop the API): `error === "Could not load visits."` |
| AC-27 | | Owners, pets, visits, vets pages unchanged |

If any AC fails, loop back to the step that owns it (see the coverage matrix), not a patch at the end. If the RxJS peer check fails, stop and report.

---

## Done criteria

Before opening a PR, confirm:
- Files F1 to F7 are the only changes. No edits to `package.json`, `src/main.ts`, `visit.service.ts`, `visit.ts`, `visit-status.ts`, or `error.service.ts`.
- `npx ng build` passes (AC-28), and the installed RxJS satisfies the NgRx peer range.
- Feature key `visits` is registered from `VisitsModule` (AC-1).
- Load behaviour matches AC-3 to AC-9, including initial state and `switchMap` cancellation.
- Status counts match AC-12 to AC-18 with exactly the four keys, and the keys come from `VISIT_STATUS_LABELS`.
- The bridge publishes `{ visits, statusCounts, loading, error }` to `window.petclinicHost.visits`, dispatches `petclinic-host:visits` with the same object, publishes only `id`, `date`, `status`, `petId`, and exports `VisitsBridgeState` and the event constant (AC-20 to AC-26).
- Existing pages are unchanged (AC-27).
- The HIPAA publish is confirmed by the developer (pre-flight 8).

---

## --- EXECUTION RECORD (appended by harness) ---
- timestamp: 2026-11-02T13:14:28
- phase: coding
- approved impacted files: ['.harness/attachments/01-openapi.yml', 'src/app/app.component.ts', 'src/app/error.service.ts', 'src/app/store/visits/visits-bridge.ts', 'src/app/store/visits/visits.actions.ts', 'src/app/store/visits/visits.effects.ts', 'src/app/store/visits/visits.reducer.ts', 'src/app/store/visits/visits.selectors.ts', 'src/app/visits/visit-status.ts', 'src/app/visits/visit.service.ts', 'src/app/visits/visit.ts', 'src/app/visits/visits.module.ts']
- actually touched: ['src/app/app.component.ts', 'src/app/visits/visits.module.ts']
- scope: matches approved plan (no additions)
- review status: APPROVED by human at 2026-11-02T13:14:28

## --- EXECUTION RECORD (appended by harness) ---
- timestamp: 2026-11-02T13:15:10
- phase: coding
- approved impacted files: ['.harness/attachments/01-openapi.yml', 'src/app/app.component.ts', 'src/app/error.service.ts', 'src/app/store/visits/visits-bridge.ts', 'src/app/store/visits/visits.actions.ts', 'src/app/store/visits/visits.effects.ts', 'src/app/store/visits/visits.reducer.ts', 'src/app/store/visits/visits.selectors.ts', 'src/app/visits/visit-status.ts', 'src/app/visits/visit.service.ts', 'src/app/visits/visit.ts', 'src/app/visits/visits.module.ts']
- actually touched: ['src/app/app.component.ts']
- scope: matches approved plan (no additions)
- review status: APPROVED by human at 2026-11-02T13:15:10

## --- EXECUTION RECORD (appended by harness) ---
- timestamp: 2026-11-02T13:15:56
- phase: coding
- approved impacted files: ['.harness/attachments/01-openapi.yml', 'src/app/app.component.ts', 'src/app/error.service.ts', 'src/app/store/visits/visits-bridge.ts', 'src/app/store/visits/visits.actions.ts', 'src/app/store/visits/visits.effects.ts', 'src/app/store/visits/visits.reducer.ts', 'src/app/store/visits/visits.selectors.ts', 'src/app/visits/visit-status.ts', 'src/app/visits/visit.service.ts', 'src/app/visits/visit.ts', 'src/app/visits/visits.module.ts']
- actually touched: (none)
- scope: matches approved plan (no additions)
- review status: APPROVED by human at 2026-11-02T13:15:56

## --- EXECUTION RECORD (appended by harness) ---
- timestamp: 2026-11-02T13:33:19
- phase: coding
- approved impacted files: ['.harness/attachments/01-openapi.yml', 'src/app/app.component.ts', 'src/app/error.service.ts', 'src/app/store/visits/visits-bridge.ts', 'src/app/store/visits/visits.actions.ts', 'src/app/store/visits/visits.effects.ts', 'src/app/store/visits/visits.reducer.ts', 'src/app/store/visits/visits.selectors.ts', 'src/app/visits/visit-status.ts', 'src/app/visits/visit.service.ts', 'src/app/visits/visit.ts', 'src/app/visits/visits.module.ts']
- actually touched: ['src/app/store/visits/visits-bridge.ts', 'src/app/store/visits/visits.actions.ts', 'src/app/store/visits/visits.effects.ts', 'src/app/store/visits/visits.reducer.ts', 'src/app/store/visits/visits.selectors.ts']
- scope: matches approved plan (no additions)
- review status: APPROVED by human at 2026-11-02T13:33:19

## --- EXECUTION RECORD (appended by harness) ---
- timestamp: 2026-11-02T13:33:53
- phase: coding
- approved impacted files: ['.harness/attachments/01-openapi.yml', 'src/app/app.component.ts', 'src/app/error.service.ts', 'src/app/store/visits/visits-bridge.ts', 'src/app/store/visits/visits.actions.ts', 'src/app/store/visits/visits.effects.ts', 'src/app/store/visits/visits.reducer.ts', 'src/app/store/visits/visits.selectors.ts', 'src/app/visits/visit-status.ts', 'src/app/visits/visit.service.ts', 'src/app/visits/visit.ts', 'src/app/visits/visits.module.ts']
- actually touched: ['src/app/store/visits/visits.selectors.ts']
- scope: matches approved plan (no additions)
- review status: APPROVED by human at 2026-11-02T13:33:53
