# Show each visit's status on the owner detail page

## Summary

Adds a **Status** column to the visit table on the owner detail page (`/owners/{id}`), placed between **Description** and **Actions**. Each visit now shows one of `Scheduled`, `Completed`, or `Cancelled`, so receptionists can see at a glance which visits are scheduled, done, or cancelled.

No new API call is needed. The status comes from the existing nested owner response (`GET /api/owners/{ownerId}` → `pets[].visits[]`).

## Contract dependency

Requires the `status` field from **petclinic-rest-api** (story PC-101). The allowed values are defined by the `VisitStatus` enum in `stories/PC-102/openapi.yml`:

- `SCHEDULED`
- `COMPLETED`
- `CANCELLED`

## Changes

- `src/app/visits/visit.ts`: add an optional `status` field typed as a single shared union type (`'SCHEDULED' | 'COMPLETED' | 'CANCELLED'`), defined once and reused.
- `src/app/visits/visit-list/visit-list.component.ts` and `.html`: add the Status column and a label mapping kept in one place (a small shared helper or pipe under `src/app/visits/`).

## Display rules

| Stored value | Displayed as |
|---|---|
| `SCHEDULED` | Scheduled |
| `COMPLETED` | Completed |
| `CANCELLED` | Cancelled |
| missing, `null`, or empty/whitespace-only string | Not set |
| any other value (e.g. `DONE`) | the raw value, unchanged |

The page must not fail to render because of the status, and unexpected values must not cause console errors.

## Out of scope

- Setting or editing the status. The add-visit and edit-visit forms are unchanged.
- The visits list on other pages.
- Styling beyond a plain table cell.
- Backend changes.
- NgRx (this app has no store).
- Unit tests. This repo runs build-only validation.

## Acceptance criteria

- **AC1:** `Visit` has an optional `status` typed with exactly the three contract values, defined once and reused.
- **AC2:** Every visit row on the owner detail page shows a Status column between Description and Actions, with the header "Status".
- **AC3:** `SCHEDULED`, `COMPLETED`, and `CANCELLED` map to "Scheduled", "Completed", and "Cancelled".
- **AC4:** A missing or null status shows "Not set". An unexpected value shows unchanged. Neither logs a browser console error.
- **AC5:** Visit dates, descriptions, and the Edit Visit / Delete Visit buttons behave as before.
- **AC6:** `npm install … && npx ng build --configuration development` passes.
- **AC7 (CL-1):** An empty or whitespace-only status is treated as missing and shows "Not set".

## Validation

- `npx ng build --configuration development`

## Notes for reviewers

- The status is displayed as received, so no client-side data is changed. Unknown values are shown raw by design.
- The Status column is read-only. Setting the status is a separate story.
