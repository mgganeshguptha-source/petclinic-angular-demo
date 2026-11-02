# Context: Show each visit's status on the owner detail page (PC-102)

Requires a new or changed contract from: petclinic-rest-api (attached `openapi.yml` after PC-101).

## What Are We Trying to Achieve
Clinic receptionists open an owner's page and must tell at a glance whether each
visit is scheduled, completed or cancelled. The backend now returns a `status` on
every visit; the owner detail page must show it as a readable label in the visit
table.

**New terms introduced by this story**
- *Visit status*: the optional status of a visit, one of `SCHEDULED`, `COMPLETED`, `CANCELLED` as sent by the API.
- *Status label*: the readable text shown for a status: "Scheduled", "Completed", "Cancelled", "Not set".

## Current Behaviour
The owner detail page lists each pet with its visits in a table with the columns
Visit Date, Description and Actions (Edit Visit, Delete Visit). No status is shown.
The owner response already nests each pet's visits, so no extra API call exists today.

## Expected Behaviour
The visit table on the owner detail page has a Status column between Description and
Actions. Each row shows the label for the visit's status. A missing or null status
shows "Not set". A status outside the three contract values is shown exactly as received.
The page renders for every visit whatever its status value. Visit date, description and
the Edit Visit / Delete Visit buttons are unchanged.

## Acceptance Criteria
- AC-1: THE visit data model SHALL define an optional `status` property whose type is exactly the three contract values `SCHEDULED`, `COMPLETED` and `CANCELLED`.
- AC-1.1: THE visit data model SHALL define those three values once, and THE status type SHALL be reused wherever a visit status is typed.
- AC-1.2: THE visit data model SHALL NOT repeat the status values as string literals in any other component.
- AC-2: WHEN the owner detail page renders a visit row, THE visit table SHALL show a column with the header "Status".
- AC-2.1: THE visit table SHALL place the Status column after the Description column and before the Actions column.
- AC-3.1: WHEN a visit's status is `SCHEDULED`, THE visit row SHALL display "Scheduled" in the Status column.
- AC-3.2: WHEN a visit's status is `COMPLETED`, THE visit row SHALL display "Completed" in the Status column.
- AC-3.3: WHEN a visit's status is `CANCELLED`, THE visit row SHALL display "Cancelled" in the Status column.
- AC-4.1: IF a visit has no `status` property or its status is null, THEN THE visit row SHALL display "Not set" in the Status column.
- AC-4.2: IF a visit's status is a value other than the three contract values, THEN THE visit row SHALL display that value unchanged in the Status column (example: `DONE` displays `DONE`).
- AC-4.3: IF a visit's status is missing, null or an unexpected value, THEN THE owner detail page SHALL render every visit row without an error.
- AC-4.4: IF a visit's status is missing, null or an unexpected value, THEN THE browser console SHALL NOT receive an error message caused by the status.
- AC-5.1: THE visit table SHALL show each visit's date in the Visit Date column with the same value as before this change.
- AC-5.2: THE visit table SHALL show each visit's description in the Description column with the same value as before this change.
- AC-5.3: THE visit table SHALL keep the Edit Visit and Delete Visit buttons on every visit row, with the same behaviour as before this change.
- AC-6: WHEN the command `npm install` followed by `npx ng build --configuration development` runs, THE build SHALL complete with exit code 0.
- AC-7: THE visit table on any page other than the owner detail page SHALL NOT display a Status column. (Basis: story Out of scope — "the visits list on any other page".)
- AC-8: THE owner detail page SHALL NOT make an additional API request to obtain visit status. (Basis: story — "no new API call is needed"; status arrives in the owner response.)
- AC-9: THE add-visit and edit-visit forms SHALL NOT gain a status input. (Basis: story Out of scope — setting or editing status.)

## Edge Cases
- Visit with status `SCHEDULED`, `COMPLETED` or `CANCELLED`: label shown (AC-3.x).
- Visit with status property absent: "Not set" (AC-4.1).
- Visit with status null: "Not set" (AC-4.1).
- Visit with status `DONE` (unrecognised string): `DONE` shown as received (AC-4.2).
- Visit with status as an empty string: see CL-1.
- Owner with a pet that has no visits: no visit rows; page renders (AC-4.3).
- Owner with a mix of visits with and without status in the same table: each row shows its own value (AC-3.x, AC-4.x).

## Constraints
- Angular 19 standalone components as the nearest feature uses; no new state library (no NgRx in this app).
- Label mapping lives in one place and is reused by every visit row (AC-1.1).
- No new HTTP call; the status comes from the existing owner response.
- Plain table cell; no styling beyond the existing table markup.
- Existing error-handling convention applies: no `console.log` added.
- Verification is build-only (`npm install` then `npx ng build --configuration development`); no unit tests in this story.
- Contract: `status` is optional on the visit and is an enum of three values; the API must not break existing consumers that do not read it.

## Out of Scope
- Setting or editing a visit's status in the add-visit or edit-visit forms.
- Visit lists on any other page (including the add-visit page's embedded visit table).
- Styling beyond a plain table cell (no badges, colours or icons).
- Backend changes.
- NgRx or any state store.
- Unit tests.

## Clarifications Needed
- [NEEDS CLARIFICATION]: CL-1 — Empty-string status value: (a) display "Not set" (b) display an empty cell, as an unexpected value shown unchanged

**How to answer:** answer each question in the story file on the story branch (the run's base),
preferably as a new acceptance criterion, quoting its ID (e.g. `CL-1: (c) —
map to UNKNOWN`). Then re-run the harness with resume=true. No tagging is
needed — the harness decides whether an answer is a rule for this service
(recorded for later stories) or a one-off. To override, add `[story-only]`,
`[service]`, `[toolkit-skill]` (this should never have been asked) or
`[toolkit-instruction]` (a rule for every service).

## Assumptions
None. Every acceptance criterion traces to the story, its Out of scope list, or the attached contract.

## Story Quality Score
| Dimension | Score | Basis |
|---|---|---|
| Clarity | 19/20 | Labels and enum values are literal; empty-string status left open (CL-1) |
| Testability | 17/20 | AC-6 is a build check only; visual column placement needs manual or later verification |
| Traceability | 20/20 | Every AC traces to the story, its out-of-scope list, or the attached contract; no [ASSUMED] |
| Atomicity | 19/20 | Compound criteria split (AC-4, AC-5); AC-1 defines the type only, reuse rules sit in AC-1.1 / AC-1.2 |
| Completeness | 18/20 | All sections substantive; no performance or accessibility target given by story |
| Edge coverage | 17/20 | Missing, null, unknown and mixed cases named; empty string left as CL-1 |
| **Total** | **109/120** | |

## Design trigger
**DESIGN REQUIRED: NO**
Triggers checked: no service boundary crossed (the contract is consumed from data already returned), no published contract changed by this repo, no new pattern, no data ownership or transaction change, no backward-compatibility concern (status is optional and additive). The change follows the existing visit table rendering pattern.

## Feasibility
**VERDICT: GO**
Basis: the visit table, the visit data model and the owner detail page that renders them all exist in this repo. The owner response already nests each pet's visits, so the status arrives without a new call. The attached contract defines `status` as an optional enum on the visit.

Data flow: API (petclinic-rest-api, contract attached, shape read from it) → owner response (`pets[].visits[]`) → visit data model (this repo) → visit table on owner detail page (this repo) → label mapping (this repo).
Note: the visit table component is also embedded on the add-visit page; AC-7 requires the Status column not appear there, so the column must be scoped to the owner detail page.
