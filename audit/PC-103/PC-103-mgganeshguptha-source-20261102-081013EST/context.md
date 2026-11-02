# Story Context: PC-103 — Visits NgRx store with status summary and host bridge

Generated in CI mode. Read-only exploration. No source files modified.
Timestamp note: the shell was unavailable, so the filename timestamp is a placeholder (`260517-000000`). Rename it to the actual generation time.

## 1. Story Summary

Add an NgRx feature store for visits in the Angular web app. It holds the visit list and a per-status count summary (SCHEDULED, COMPLETED, CANCELLED). A host bridge publishes that state to `window.petclinicHost.visits` and dispatches a `petclinic-host:visits` event on change.

## 2. Acceptance Criteria

Numbering follows the story (AC1–AC10). Criteria marked `[ASSUMED]` were added here and are not in the story.

- AC1: A visits feature store (`visits`) is registered from the visits feature. Its state holds the visit list, a load status, and a status-count summary.
- AC2: A load action triggers `VisitService.getVisits()` through an effect. Success dispatches a loaded action with the visits. Failure dispatches a failed action.
- AC3: Status counts cover the three `VisitStatus` values. A visit with a missing or unknown status is excluded from the counts and is not an error.
- AC4: The status type is reused from `src/app/visits/visit-status.ts`. No new status enum is created.
- AC5: Selectors expose the visit list, the counts, and the load status.
- AC6: The bridge publishes `{ visits: [...], counts: {...} }` to `window.petclinicHost.visits`. Published visit fields are limited to the minimum the host needs.
- AC7: On each state change the bridge dispatches a `CustomEvent` named `petclinic-host:visits`.
- AC8: Loads use `switchMap`, so the latest request wins. After a failed load the store keeps the visits from the last successful load.
- AC9: `VisitService` and `error.service.ts` are not changed.
- AC10: Unit tests cover reducer, selectors, effect, and bridge.
- `[ASSUMED]` The bridge starts once at app start from `AppComponent`, not per route.

## 3. Current Code (verified by reading)

- `src/app/visits/visit.service.ts`: `getVisits(): Observable<Visit[]>` uses `catchError(this.handlerError('getVisits', []))`. `HttpErrorHandler.handleError` returns `throwError(message)`, so the call re-throws. The fallback `[]` is never emitted. This matches AC8 and AC9.
- `src/app/error.service.ts`: `createHandleError('OwnerService')` is used by the visit service. The name is wrong but out of scope. `handleError` logs the full server body via `console.error`. The bridge must not depend on that path.
- `src/app/visits/visit-status.ts`: `type VisitStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED'` and `VISIT_STATUS_LABELS`. Matches the OpenAPI enum.
- `src/app/visits/visit.ts`: `Visit { id; date; description; status?: VisitStatus | null; pet: Pet; petId?: number }`. `pet` is required here.
- `src/app/visits/visits.module.ts`: NgModule importing standalone visit components and providing `VisitService`. No `StoreModule.forFeature` or `EffectsModule.forFeature` yet.
- `src/main.ts`: `bootstrapApplication` already calls `provideStore()` and `provideEffects()` with an empty root store, with a comment saying features register their own state. This confirms the story's premise.
- `src/app/app.component.ts`: standalone, empty class body, imports `RouterLink`, `RouterLinkActive`, `RouterOutlet`. Target for starting the bridge.
- `src/app/app-routing.module.ts`: `RouterModule.forRoot` with welcome and `**` routes. Visits routes are in `visits` feature modules.
- `package.json`: `@ngrx/store` and `@ngrx/effects` 19.2.1, Angular 19.2.25, RxJS `^6.3.1`. Use RxJS 6 APIs (`rxjs/operators`).
- No `src/app/store/` directory was found.
- No `petclinicHost` declaration was checked in this pass. Treat it as new unless grep shows otherwise.

## 4. Contract (OpenAPI attachment `.harness/attachments/01-openapi.yml`)

- `GET /visits` (`listVisits`, ~line 1093): returns an array of `Visit`.
- `VisitStatus` enum (~lines 2286–2294): `SCHEDULED`, `COMPLETED`, `CANCELLED`.
- `Visit` schema (~lines 2295–2331): required `id` (int), `petId` (int), `description` (string, 1–255 chars). Optional `date` (date) and `status` (VisitStatus).
- The contract has no nested `pet` object on `Visit`. The app model requires `pet: Pet`. This is a contract/model mismatch (see Section 8).

## 5. Data Flow

1. `AppComponent` (or the visits feature) dispatches `loadVisits`.
2. Effect calls `VisitService.getVisits()` with `switchMap`.
3. Success dispatches `loadVisitsSuccess` with `Visit[]`. Failure dispatches `loadVisitsFailure`.
4. Reducer stores visits and load status. Keeps the last good list on failure (AC8).
5. Selectors derive counts from `visits`, grouping on `status`. Missing or unknown statuses are skipped (AC3).
6. Bridge subscribes to the selectors, writes `window.petclinicHost.visits`, and dispatches `petclinic-host:visits` (AC6, AC7).

Boundary: the REST API (`petclinic-rest-api`) owns the contract. This repo consumes it and owns the store, effect, and bridge.

## 6. Design Trigger (Section 11 of story template)

Triggers that apply:
- Introduces a new global on `window` (`window.petclinicHost`). This is a new cross-boundary surface for host apps.
- Introduces NgRx feature state, which the repo does not use yet beyond the empty root store.
- Consumes an external contract (`GET /visits`) through an existing service.

Design review: YES. Named trigger: new global bridge surface on `window`. The host-facing shape is a published contract and needs a sign-off.

## 7. Quality Dimensions (scored)

| Dimension | Score | Note |
|---|---|---|
| Completeness | 3/5 | Bridge payload fields and first-load behavior need confirmation (Section 8). |
| Consistency | 4/5 | Reuses `VisitStatus` and `VisitService`. Store pattern is new to the repo. |
| Testability | 4/5 | Reducer, selector, and effect are pure or mockable. Bridge needs a `window` stub. |
| Security | 2/5 | Visit objects can carry `pet` data (PHI-adjacent: pet and owner). Publishing to a host global needs a field allowlist. |
| Feasibility | 4/5 | NgRx installed. Root store already provided. |
| Clarity | 3/5 | Contract/model mismatch on `pet`. |

## 8. Open Clarifications

- [NEEDS CLARIFICATION] Data shape: the app's `Visit` requires a nested `pet: Pet`, but the contract's `Visit` has only `petId`. Which shape should the bridge publish, and should the store hold the app model or the contract model?
- [NEEDS CLARIFICATION] Published fields: which fields of each visit (`id`, `date`, `description`, `status`, `petId`, `pet`) may be sent to `window.petclinicHost.visits`? Pet name and owner data would be PHI-adjacent. Name the exact allowlist.
- [NEEDS CLARIFICATION] Bridge before first load: what should `window.petclinicHost.visits` contain before the first successful load (empty list with zero counts, or undefined)?
- [NEEDS CLARIFICATION] Failure event: on a failed load, should the `petclinic-host:visits` event fire with the last good state, or only when the visible state changes?
- [NEEDS CLARIFICATION] CL-1 (round 1): the round-1 text said the service "catches HTTP errors and returns an empty list". The code re-throws (see Section 3). Confirm that the failure path is observed through the store's failed action, not an empty-list fallback.

## 9. Feasibility Verdict

GO, conditional on the Section 8 clarifications for the bridge payload and the `pet` shape. NgRx and the root store are in place. `VisitService.getVisits()` and `VisitStatus` can be reused without changes.

## 10. Risks

- Publishing nested pet/owner data on a global exposes PHI-adjacent fields to any host script. Mitigation: field allowlist (Section 8).
- `window` global typing needs a declaration file to avoid `any`.
- Mounting the bridge from `AppComponent` must be done once. Repeated mounts create duplicate event dispatches.
- RxJS 6 only. Do not use RxJS 7 operators.

## 11. Files Expected to Change (planning only)

- New: `src/app/visits/store/` (actions, reducer, selectors, effects) and `src/app/visits/store/*.spec.ts`
- New: `src/app/visits/host-bridge/` (bridge service and spec), plus a `window` typing declaration
- Changed: `src/app/visits/visits.module.ts` (`StoreModule.forFeature`, `EffectsModule.forFeature`)
- Changed: `src/app/app.component.ts` (dispatch load, start bridge once)
- Not changed: `visit.service.ts`, `error.service.ts`, `visit-status.ts`

## 12. Next Step

Resolve the Section 8 clarifications before implementation. The bridge payload allowlist is the blocker.
