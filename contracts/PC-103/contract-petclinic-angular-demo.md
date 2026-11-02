<!-- sdlc-harness-contract v1
repo: petclinic-angular-demo
feature_id: PC-103
run_id: 41454814514
commit: 2430a32e9796373a76eb68c046e5e56f3797935e
base: story/PC-103
generated_at: 2026-11-02T13:42:16Z
files:
  - src/app/store/visits/visits-bridge.ts
  - src/app/store/visits/visits.actions.ts
  - src/app/store/visits/visits.effects.ts
  - src/app/store/visits/visits.reducer.ts
  - src/app/store/visits/visits.selectors.ts
  - stories/PC-102/openapi.yml
  - stories/PC-103/openapi.yml
-->

# Contract: visits NgRx store and host bridge (window.petclinicHost.visits)

## What changed

- Added NgRx feature `visits` (state: `visits`, `loading`, `error`).
- Added actions: `loadVisits`, `loadVisitsSuccess({visits})`, `loadVisitsFailure({error})`.
- Added selectors: `selectVisitsState`, `selectAllVisits`, `selectVisitsLoading`, `selectVisitsError`, `selectVisitStatusCounts`.
- Status counts: `{ SCHEDULED, COMPLETED, CANCELLED, notSet }` (`VisitStatusCounts`).
- Added bridge `startVisitsBridge(store)` and exports `VisitsBridgeState` and `VISITS_BRIDGE_EVENT` (`'petclinic-host:visits'`).
- Published shape: `window.petclinicHost.visits = { visits, statusCounts, loading, error }`. Each visit has `id`, `date`, `status`, `petId` only.

## Rules for the consumer

- Read visit data only through the bridge (`window.petclinicHost.visits`) or the `petclinic-host:visits` event `detail`. Both carry the same object.
- `error` is either `null` or the fixed text `"Could not load visits."`. Do not expect server message content.
- `status` is `"SCHEDULED" | "COMPLETED" | "CANCELLED"`, or `null`/absent. Count missing or unknown statuses under `statusCounts.notSet`.
- `description` is not published. Do not rely on it.
- Visits are as last loaded successfully. After a failed load, the previous list remains.

## Example (mocked values)

```json
{
  "visits": [{ "id": 1, "date": "2026-01-01", "status": "SCHEDULED", "petId": 7 }],
  "statusCounts": { "SCHEDULED": 1, "COMPLETED": 0, "CANCELLED": 0, "notSet": 0 },
  "loading": false,
  "error": null
}
```
