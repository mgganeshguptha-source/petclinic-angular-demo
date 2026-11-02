# PC-103: Visits store with a status summary and host bridge

## Summary

The clinic app keeps all visits and a count per status in an NgRx feature store
(`visits`). The store publishes its state to other front ends on the same page
through `window.petclinicHost.visits` and a `petclinic-host:visits` browser event.

## Files

| File | Purpose |
|---|---|
| `src/app/store/visits/visits.actions.ts` | `loadVisits`, `loadVisitsSuccess`, `loadVisitsFailure` |
| `src/app/store/visits/visits.reducer.ts` | `VisitsState` (`visits`, `loading`, `error`), feature key `visits` |
| `src/app/store/visits/visits.effects.ts` | Calls `VisitService.getVisits()` with `switchMap`; maps failures to the fixed message |
| `src/app/store/visits/visits.selectors.ts` | Visits, loading, error, and `selectVisitStatusCounts` |
| `src/app/store/visits/visits-bridge.ts` | `startVisitsBridge`, `VisitsBridgeState`, `VISITS_BRIDGE_EVENT` |
| `src/app/visits/visits.module.ts` | Registers the reducer and effects |
| `src/app/app.component.ts` | Starts the bridge and dispatches `loadVisits` on start |

## Behaviour

- **Initial state:** visits `[]`, `loading` false, `error` null.
- **Load visits:** sets `loading` true and `error` null. `switchMap` cancels an in-flight request when a new one starts.
- **Success:** stores the visits as the API returns them; `loading` false, `error` null.
- **Failure:** `loading` false, `error` is `"Could not load visits."`. Visits from the last successful load are kept. The server's message is never stored or published.
- **Status counts:** keys `SCHEDULED`, `COMPLETED`, `CANCELLED` (from the `VisitStatus` type) plus `notSet`. A null, empty, whitespace-only, or unknown status counts as `notSet`.
- **Bridge:** on every state change it sets `window.petclinicHost.visits` to `{ visits, statusCounts, loading, error }` and dispatches `petclinic-host:visits` with the same object as `detail`. Each visit is published as `id`, `date`, `status`, `petId` only; `description` is never published.

## Verification

- Build: `npm install && npx ng build` (AC7). **Not run in this session**, because shell commands were not permitted. Run it before merging.
- Unit tests are out of scope (this repo runs build-only).

## Open questions

- CL-1 (failure observability) and CL-2 (visits after a failed load) were raised in an earlier round with no recorded answer. The implementation follows AC8 and AC9 as written: the error propagates to the store, and visits from the last successful load are kept.
