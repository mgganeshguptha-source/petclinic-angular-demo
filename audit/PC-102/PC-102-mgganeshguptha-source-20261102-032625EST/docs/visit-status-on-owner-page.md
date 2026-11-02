# Visit status on the owner detail page (PC-102)

## Summary

The owner detail page (`/owners/{id}`) shows a **Status** column for each visit in the visit table. The status comes from the backend `status` field added in PC-101 and is shown as a readable label.

## Contract

Source: `stories/PC-102/openapi.yml` (petclinic-rest-api after PC-101).

- `VisitStatus` enum: `SCHEDULED`, `COMPLETED`, `CANCELLED`.
- `status` is optional on `Visit`. It may be missing or `null` from older backends.
- No new API call. Visits arrive nested in `GET /api/owners/{ownerId}` as `pets[].visits[]`.

## Changes

| File | Change |
|---|---|
| `src/app/visits/visit-status.ts` | Defines the `VisitStatus` type (`'SCHEDULED' \| 'COMPLETED' \| 'CANCELLED'`) and `VISIT_STATUS_LABELS` (the single place for label text). |
| `src/app/visits/visit.ts` | `Visit` gets `status?: VisitStatus \| null`. |
| `src/app/visits/visit-status-label.pipe.ts` | `visitStatusLabel` pipe. Maps known values to labels, returns "Not set" for missing, `null`, or blank/whitespace-only values, and passes unknown values through unchanged. |
| `src/app/visits/visit-list/visit-list.component.ts` | Imports `VisitStatusLabelPipe`. |
| `src/app/visits/visit-list/visit-list.component.html` | Adds a **Status** header between **Description** and **Actions**, and a cell rendering `{{ visit.status \| visitStatusLabel }}`. |

## Label mapping

| `status` value | Displayed |
|---|---|
| `SCHEDULED` | Scheduled |
| `COMPLETED` | Completed |
| `CANCELLED` | Cancelled |
| missing, `null`, `""`, whitespace only | Not set |
| any other value (e.g. `DONE`) | the value unchanged |

## Out of scope

- Setting or editing status in the add/edit visit forms.
- Status on other visit lists.
- Backend changes.
- Unit tests (this repo runs build-only).

## Verification

- Build: `npm install` then `npx ng build --configuration development` (AC6). Not run as part of this document.
- Manual check: open `/owners/{id}` for an owner with visits in each status, a visit without status, and a visit with an unexpected value.

UNCONFIRMED: whether `VisitStatusLabelPipe` is declared in `VisitsModule` or only imported as a standalone dependency of `VisitListComponent`. Confirm before relying on this in another module.
