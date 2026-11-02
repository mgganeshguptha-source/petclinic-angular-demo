# PC-103: Visits store with status summary, shared via host bridge

## Summary

Adds an NgRx feature store for visits so the clinic app keeps all visits and a count per status in one place. The state is published on the page as `window.petclinicHost.visits` and as a `petclinic-host:visits` browser event, so other front ends loaded alongside it (the front-desk panel, PC-104) can show the same numbers without calling the API.

## Changes

- **`src/app/store/visits/visits.actions.ts`** (new): `loadVisits`, `loadVisitsSuccess({visits})`, `loadVisitsFailure({error})`.
- **`src/app/store/visits/visits.reducer.ts`** (new): `VisitsState` (`visits`, `loading`, `error`), feature key `VISITS_FEATURE_KEY = 'visits'`, initial state empty / not loading / no error.
- **`src/app/store/visits/visits.effects.ts`** (new): on `loadVisits`, calls `VisitService.getVisits()` with `switchMap`, so a newer load cancels an in-flight one. On failure it dispatches `loadVisitsFailure` with the fixed text `"Could not load visits."`. The server's message is never stored or published.
- **`src/app/store/visits/visits.selectors.ts`** (new): selectors for visits, loading, error, and `statusCounts`. Counts use the existing `VisitStatus` values (`SCHEDULED`, `COMPLETED`, `CANCELLED`) plus `notSet` for missing, empty, whitespace, or unknown statuses.
- **`src/app/store/visits/visits-bridge.ts`** (new): `startVisitsBridge(store)` publishes `{visits, statusCounts, loading, error}` on every change. `visits` is trimmed to `id`, `date`, `status`, `petId` (no `description`). Exports `VisitsBridgeState`, `VisitsBridgeVisit`, and `VISITS_BRIDGE_EVENT`.
- **`src/app/visits/visits.module.ts`**: registers `StoreModule.forFeature('visits', ...)` and `EffectsModule.forFeature([VisitsEffects])`.
- **`src/app/app.component.ts`**: starts the bridge and dispatches `loadVisits()` on construction; unsubscribes the bridge in `ngOnDestroy`.

No changes to `VisitService`, `error.service.ts`, `package.json`, `src/main.ts`, or any UI.

## Contract dependency

Requires petclinic-rest-api `GET /api/visits` to return each visit with a `status` (`VisitStatus` enum in `stories/PC-103/openapi.yml`). The store keeps visits as the API returns them (no nested pet object).

## Security and privacy

- Error text on the bridge and in the store is fixed. Server response content is never stored or published.
- The bridge omits `description` (free-text clinical content) and publishes only the four fields above.
- Nothing is written to `localStorage`, `sessionStorage`, or logs.
- The `window.petclinicHost` object is readable by any script on the page. This is accepted for the same-page host bridge design, but it means any code loaded into the page can read visit IDs, dates, and pet IDs. Treat that as in scope for PHI review.

## Testing

- Build-only repo: `npm install && npx ng build` is the acceptance check (AC7). **Not run in this environment** because shell commands were disallowed for this step; run it before merging.
- No unit tests added (per story scope).
- Manual check after build: start the app, confirm `window.petclinicHost.visits` is set to `{visits, statusCounts, loading: false, error: null}` after load, and that the `petclinic-host:visits` event fires.

## Review notes

- Existing pages should behave as before (AC6). The only new runtime behaviour is one extra `GET /api/visits` at app start.
- `VisitsModule` is eagerly imported from `main.ts` (via `PetsModule`), so the `visits` feature exists before `AppComponent` dispatches.
