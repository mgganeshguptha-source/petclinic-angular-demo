# Validation — PC-102

**Source:** Story text supplied in the harness prompt (story PC-102: "Show each visit's status on the owner detail page"). The context file directory `.github/story-context-files/` does not exist in this checkout, so the acceptance criteria were taken verbatim from the story.
**Criteria checked:** 7  (met 6 · not met 0 · unverifiable 1)

**VERDICT: INCONCLUSIVE**

## Per-criterion verdicts

### AC1 — MET
The `Visit` model has an optional `status` typed with exactly the three values from the attached contract (`'SCHEDULED' | 'COMPLETED' | 'CANCELLED'`), defined once and reused, not repeated as string literals across components.
**Evidence:** `src/app/visits/visit.ts` declares `status?: VisitStatus | null;`, importing `VisitStatus` from `src/app/visits/visit-status.ts`. That file defines `export type VisitStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';` once. Within `src/app`, the quoted literals appear only in that file; `visit-status-label.pipe.ts` and `visit-list.component.ts` reference the type, not literals.

### AC2 — MET
On the owner detail page, every visit row shows a Status column, placed between Description and Actions, with the header "Status".
**Evidence:** `src/app/visits/visit-list/visit-list.component.html` header row is `Visit Date`, `Description`, `Status`, `Actions`, and each `<tr *ngFor="let visit of visits">` renders `<td>{{ visit.status | visitStatusLabel }}</td>` between the description and actions cells. The owner page reaches this table via `owner-detail.component.html:55` (`app-pet-list`) → `pet-list.component.html:36` (`app-visit-list [visits]="pet.visits"`).

### AC3 — MET
A visit with `status: "SCHEDULED"` shows "Scheduled"; `"COMPLETED"` shows "Completed"; `"CANCELLED"` shows "Cancelled".
**Evidence:** `VISIT_STATUS_LABELS` in `visit-status.ts` maps each value to its label. `VisitStatusLabelPipe.transform` in `visit-status-label.pipe.ts` returns `VISIT_STATUS_LABELS[status]` when the key is an own property. No spec exercises this mapping; the evidence is code reading.

### AC4 — MET
A visit with no `status` (field missing or null) shows "Not set"; a visit with an unexpected value (e.g. `"DONE"`) shows that value unchanged. Neither causes an error in the browser console.
**Evidence:** `VisitStatusLabelPipe.transform` returns `'Not set'` when `typeof status !== 'string'`, which covers null, undefined and a missing field. For any other string not in the map, `hasOwnProperty` fails and the pipe returns `status` unchanged. The pipe contains no logging or throwing code, and `visit-list.component.ts` adds no logging on render. The only existing `console.log` is in `deleteVisit`, which is not on the render path.

### AC5 — MET
Visit dates, descriptions and the Edit Visit / Delete Visit buttons behave exactly as before.
**Evidence:** `visit-list.component.html` still renders `{{ visit.date }}` and `{{ visit.description }}`, and the two buttons call `editVisit(visit)` and `deleteVisit(visit)`. Both methods in `visit-list.component.ts` are unchanged in signature and body (navigate to `/visits/:id/edit`; delete via `visitService.deleteVisit`). No pre-change copy of the files was available to diff against, so "as before" is judged from the current bindings and handlers.

### AC6 — UNVERIFIABLE
`npm install … && npx ng build --configuration development` passes.
**Why:** Shell commands are not permitted in this validation phase, so the build could not be run. The existing `.harness/validation-report.txt` records a `npx ng build` with exit 0, but it is not shown to correspond to the current state of these files, so it is not counted as evidence.
**Would resolve it:** running `npm install --legacy-peer-deps && npx ng build --configuration development` on the current tree and confirming exit 0.

### AC7 — MET
A `status` that is an empty string or only spaces is treated as missing and shows "Not set".
**Evidence:** `VisitStatusLabelPipe.transform` tests `status.trim() === ''` and returns `'Not set'`. A value of `"   "` is trimmed to empty and takes that branch.

## Assumed criteria

None. The story carries no `[ASSUMED]` markers.

## Specification findings

None.

## Summary

All criteria with code evidence hold: the typed status, the Status column between Description and Actions, the label mapping, the "Not set" and pass-through behaviour, and the blank-string case. AC6 is UNVERIFIABLE because the build could not be run in this phase, so the verdict is INCONCLUSIVE rather than PASS. A human, or the next phase with shell access, should run `npm install --legacy-peer-deps && npx ng build --configuration development` to close AC6.
