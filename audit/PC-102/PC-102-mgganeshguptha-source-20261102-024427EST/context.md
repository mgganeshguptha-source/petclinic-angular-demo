# Context: Show each visit's status on the owner detail page

Requires a new or changed contract from: petclinic-rest-api (attached `openapi.yml`, after PC-101; defines `VisitStatus` and the `status` property on `VisitFields` / `Visit`).

## What Are We Trying to Achieve
Clinic receptionists need to see at a glance whether each visit on an owner's page is scheduled, completed or cancelled. The backend now returns a `status` on every visit; this story makes the owner detail page display it. No new API call is involved.

**New terms introduced by this story**
- *Visit status label*: the readable text shown for a status value (`SCHEDULED` → "Scheduled", `COMPLETED` → "Completed", `CANCELLED` → "Cancelled").
- *Not set*: the text shown when a visit has no usable status.

## Current Behaviour
The owner detail page lists each pet with its visits. The visit table has three columns: Visit Date, Description, Actions (Edit Visit, Delete Visit). No status is shown. The Visit model has no `status` field.

## Expected Behaviour
The visit table on the owner detail page has a **Status** column between Description and Actions. Each row shows a readable label for the visit's status. A missing, null or blank status shows "Not set". A non-empty status outside the three contract values is shown exactly as received. The page renders in every case. Visit Date, Description, Edit Visit and Delete Visit behave as before.

Data flow and ownership (traced from the code and the attached contract):
- API: petclinic-rest-api (owned by another repo; unchanged by this story) → `GET /api/owners/{ownerId}` → `pets[].visits[]` including `status`.
- Frontend: owner response read as-is by this repo → pet's `visits` → visit table → Status cell. Only this repo changes.

## Acceptance Criteria
- AC-1: THE Visit model SHALL declare an optional `status` whose type is exactly `'SCHEDULED' | 'COMPLETED' | 'CANCELLED'`.
- AC-2: THE status values SHALL be defined once and referenced by the Visit model and the label mapping, with no repeated string literals in components.
- AC-3: WHEN the owner detail page displays a visit table, THE visit table SHALL show a column with the header "Status" placed between the Description and Actions columns.
- AC-4: WHEN a visit has status `SCHEDULED`, THE visit table SHALL display "Scheduled" in that visit's Status cell.
- AC-5: WHEN a visit has status `COMPLETED`, THE visit table SHALL display "Completed" in that visit's Status cell.
- AC-6: WHEN a visit has status `CANCELLED`, THE visit table SHALL display "Cancelled" in that visit's Status cell.
- AC-7: IF a visit has no `status` field or a `null` status, THEN THE visit table SHALL display "Not set" in that visit's Status cell.
- AC-8: IF a visit's status is an empty string or contains only whitespace, THEN THE visit table SHALL display "Not set" in that visit's Status cell.
- AC-9: IF a visit's status is non-empty and is not one of the three contract values, THEN THE visit table SHALL display the status exactly as received.
- AC-10: THE visit table SHALL NOT normalise a status by changing its case or trimming its whitespace before matching the three contract values. (Resolves by elimination: the story says to use only the three values, so a padded or lower-case value is unexpected and shown raw.)
- AC-11: IF a visit has any status value, including missing, null, blank or unexpected, THEN THE owner detail page SHALL render every pet and visit.
- AC-12: IF a visit has any status value, THEN THE owner detail page SHALL NOT emit a browser console error caused by the status.
- AC-13: THE visit table SHALL keep the Visit Date and Description cells and the Edit Visit and Delete Visit buttons behaving exactly as before.
- AC-14: THE owner detail page SHALL NOT make any additional API call to obtain visit status.
- AC-15: THE status display SHALL NOT log visit objects or status values to the console. (Basis: logging and HIPAA instruction files, not the story.)
- AC-16: THE add-visit and edit-visit forms SHALL NOT gain a status input or change in any way.
- AC-17: WHEN `npm install` followed by `npx ng build --configuration development` is run, THE build SHALL complete successfully.

## Edge Cases
- `status` key absent from a visit: "Not set".
- `status: null`: "Not set".
- `status: ""` and `status: "   "`: "Not set".
- `status: "DONE"`: shown as `DONE`.
- `status: "scheduled"` (lower case) and `status: " SCHEDULED "` (padded): shown as received, not as "Scheduled".
- Non-string `status` (for example a number): rendered as text without error and without changing the rest of the row.
- Owner with pets that have no visits: no change to the existing hidden-table behaviour.
- Visit deleted via Delete Visit: the row and its status disappear with it; other rows keep their status.

## Constraints
- Build-only verification in this repo: `npm install` then `npx ng build --configuration development` (AC-17). No unit tests are added.
- Angular 19 with the existing NgModule-based visits feature; follow the module the visit list already belongs to.
- Typed model: no `any` for visit data.
- No `innerHTML` or sanitiser bypass; render status as text interpolation.
- No change to the API contract consumed by this repo.
- No new state management; status is read from the owner response already held in component state.
- Keep existing license headers on files that already have them.
- Performance target: N/A (no new request, no list-size change; the existing visit table is rendered as today).

## Out of Scope
- Setting or editing a visit's status in the add-visit or edit-visit forms.
- Status shown in the visits list on any other page.
- Status filtering, sorting or badge/colour styling beyond a plain table cell.
- NgRx or any new store.
- Backend changes (owned by petclinic-rest-api, PC-101).
- Unit or end-to-end tests.
- Localisation of the status labels.

## Clarifications Needed
None. Every candidate question is answered by the story (for example, whitespace-only status is "Not set", unexpected values are shown raw) or is a mechanism choice left to later phases (helper versus pipe, where the mapping lives inside the visits feature).

## Assumptions
None. No criterion is marked [ASSUMED]. AC-15 is traced to the logging and HIPAA instruction files.

## Story Quality Score
| Dimension | Score | Basis |
|---|---|---|
| Clarity | 20/20 | Every label and fallback is an exact string; no vague quantifiers |
| Testability | 17/20 | Build-only repo: console and render behaviour must be checked manually in the browser |
| Traceability | 20/20 | Every AC traces to the story, the attached contract, or an instruction file |
| Atomicity | 19/20 | AC-10 is a negative rule that sits beside AC-9's display rule; kept together because the story's raw-value rule depends on it |
| Completeness | 18/20 | Status cell has no specified alignment or width; left as plain cell per Out of Scope |
| Edge coverage | 19/20 | Null, absent, blank, unexpected, case, padding and non-string named; no visit-count boundary |
| **Total** | **113/120** | |

## Design trigger
**DESIGN REQUIRED: NO**
Trigger check: no row fires. The contract is consumed as published (no change to a contract this repo publishes); the visits already arrive nested in the owner response (no new service boundary); no pattern is introduced; no data ownership or transaction change; the change adds one optional field and one column, which is backward compatible. Choosing a helper or pipe for the label mapping is a mechanism choice and does not fire the structural-answer trigger. Precedent: the existing visit table already renders visit fields directly in its template.

## Feasibility
**VERDICT: GO**
Basis: the Visit model, the visit list component and its template, and the pet's `visits: Visit[]` already exist and are wired from the owner detail page through the pet list. The contract's `VisitStatus` enum and `status` property are present in the attached `openapi.yml`.
Data flow: API (petclinic-rest-api, unchanged) → owner response `pets[].visits[]` (read as-is) → pet `visits` → visit table Status cell (this repo).
Note (not a blocker): the three-value union type will not describe runtime values such as `DONE`. The display path must render unexpected strings as text without a type cast that hides them.
