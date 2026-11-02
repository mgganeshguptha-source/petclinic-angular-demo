# Plan for: Show each visit's status on the owner detail page

**Source:** .github/story-context-files/owner-visit-status-context-261102-074514.md + .github/copilot-instructions.md + attached openapi.yml (PC-101 contract)
**Stack:** frontend (Angular 19, NgModule feature `visits`; `VisitListComponent` is standalone)
**Total steps:** 10
**Unresolved clarifications:**
- **CL-A (visit-add reuse):** `VisitListComponent` is also embedded in `visit-add.component.html` (line ~93, `<app-visit-list [visits]="currentPet.visits">`). The Status column will therefore also appear on the Add Visit page. The story scopes the change to the owner detail page and says "the visits list on any other page" is out of scope. **Default assumed by this plan:** the column shows wherever `app-visit-list` renders (the component is the single source of the table). Developer must confirm before Step 7, or ask for an `@Input() showStatus = true` flag (not planned here).

---

## Acceptance criteria coverage

Context IDs are used (AC-1 … AC-17). Story-text AC numbers map as: story AC1→AC-1, AC2→AC-3, AC3→AC-4/5/6, AC4→AC-7/9/12, AC5→AC-13, AC6→AC-17, AC7 (CL-1)→AC-8.

| AC | Criterion (abbreviated) | Covered by |
|---|---|---|
| AC-1 | Visit model has optional `status` of the 3 contract values | Step 3, Step 4 |
| AC-2 | Values defined once, reused, no repeated literals in components | Step 3, Step 5, Step 6 |
| AC-3 | Status column header between Description and Actions | Step 7 |
| AC-4 | `SCHEDULED` shows "Scheduled" | Step 5 (verified Step 9) |
| AC-5 | `COMPLETED` shows "Completed" | Step 5 (verified Step 9) |
| AC-6 | `CANCELLED` shows "Cancelled" | Step 5 (verified Step 9) |
| AC-7 | Missing / null status shows "Not set" | Step 5 (verified Step 9) |
| AC-8 | Empty or whitespace-only status shows "Not set" | Step 5 (verified Step 9) |
| AC-9 | Unexpected non-empty status shown exactly as received | Step 5 (verified Step 9) |
| AC-10 | No case change or trimming before matching | Step 5 (verified Step 9) |
| AC-11 | Page renders every pet and visit for any status value | Step 5 (pipe never throws), Step 7, verified Step 9 |
| AC-12 | No browser console error caused by status | Step 5 (no logging, no throw), verified Step 9 |
| AC-13 | Date, description, Edit/Delete buttons unchanged | Step 7 (insert cell only), verified Step 9 |
| AC-14 | No additional API call | No step required — status is read from the owner response already loaded. Verified in Step 9 (network tab). |
| AC-15 | Status display never logs visit objects or status values | Step 5 (no console calls), verified Step 10 |
| AC-16 | Add/edit visit forms unchanged | No step required — no form file is in the Impacted Files. Verified in Step 9. |
| AC-17 | `npm install` + `npx ng build --configuration development` passes | Step 8 |

---

## Before you execute any step

1. Keep `owner-visit-status-context-261102-074514.md` (and the attached `openapi.yml`) in Copilot Chat context.
2. `.github/copilot-instructions.md` is auto-loaded; confirm it is applied.
3. Execute in one chat session where possible.
4. Confirm Copilot reads current file contents before editing (real names/imports must be referenced).
5. After Step 1, the Impacted Files block below is the canonical file set.

---

## Pre-flight

The plan assumes:

1. **Stack:** Angular 19 frontend. Owner detail page (`owner-detail`) → `app-pet-list` → `app-visit-list` (standalone component, `imports: [NgFor]`). The backend is petclinic-rest-api and is not changed here. No backend files are touched.
2. **Behaviour preservation:** Visit Date cell, Description cell, the `[hidden]="noVisits"` table behaviour, Edit Visit (`editVisit`) and Delete Visit (`deleteVisit`, `splice` + `noVisits`) are unchanged. Only one `<th>` and one `<td>` are inserted between Description and Actions.
3. **Non-functional handling:** No performance target applies (no new request, no list-size change). The repo is build-only: no unit tests are added or modified; specs are not compiled by `ng build`.
4. **Assumed criteria:** No assumed criteria. (`[ASSUMED]` markers: none.)
5. **Mechanism choice (decided here):** label mapping is a **standalone pure pipe** `visitStatusLabel` (not an inline method), so the template stays a simple expression and the mapping lives in one place. The pipe must be added to `VisitListComponent`'s `imports` array because the component is standalone.
6. **Typing:** the `VisitStatus` union describes contract values only. Runtime values (`DONE`, `null`, `''`) reach the pipe as `unknown`; the pipe handles them without a cast.
7. **Logging:** no `console.*` added (AC-15). The existing `console.log('delete success')` in `visit-list.component.ts` is unrelated and is left as is.
8. **License headers:** existing files keep their headers. New files copy the Apache header used by sibling files under `src/app/visits/`.

If any of these assumptions are wrong, stop and revise the context file or the plan before proceeding.

---

## Impacted Files

| ID | Path | Role |
|----|------|------|
| F1 | `src/app/visits/visit.ts` | `Visit` model: add optional `status?: VisitStatus` (modify) |
| F2 | `src/app/visits/visit-status.ts` | NEW: `VisitStatus` type, label map, "Not set" label — single source of truth |
| F3 | `src/app/visits/visit-status-label.pipe.ts` | NEW: standalone pure pipe `visitStatusLabel` |
| F4 | `src/app/visits/visit-list/visit-list.component.ts` | Add `VisitStatusLabelPipe` to `imports` (modify) |
| F5 | `src/app/visits/visit-list/visit-list.component.html` | Add Status `<th>` and `<td>` between Description and Actions (modify) |

> Read-only references (not modified): `src/app/pets/pet-list/pet-list.component.html`, `src/app/visits/visit-add/visit-add.component.html` (see CL-A), `.harness/attachments/01-openapi.yml` (`VisitStatus` at ~line 2286, `status` on `VisitFields` at ~line 2282).

## Signature changes

None — no existing public or interface method changes signature. (The pipe `transform` is new, not a change.)

## Contract usage

| Contract (attached file) | Element | Shape used | Read or written by (File ID) |
|----------|---------|------------|------------------------------|
| openapi.yml `VisitStatus` / `VisitFields.status` | `GET /api/owners/{ownerId}` → `pets[].visits[].status` | Optional string enum `'SCHEDULED' \| 'COMPLETED' \| 'CANCELLED'` (read as-is; no mapping in components) | F1 (type), F3 (read via pipe), F5 (template binding) |

---

## Step 1 — Confirm the file set and record the Impacted Files block

**Goal:** Confirm F1–F5 by reading the current files; check for any non-code file the change needs (none expected: no schema, seed or config changes) and check every `Visit` object literal in `visit-add` / `visit-edit` still type-checks with an optional field.
**Implements:** — (enabling step, no AC)
**Depends on:** —

**Suggested prompt:**

> Using `owner-visit-status-context-261102-074514.md` and `.github/copilot-instructions.md`, read `src/app/visits/visit.ts`, `src/app/visits/visit-list/visit-list.component.ts`, `src/app/visits/visit-list/visit-list.component.html`, and `src/app/pets/pet-list/pet-list.component.html`. Confirm the file set F1–F5 from the Impacted Files block. Report the path and a one-line role for each. Also report whether any other file constructs a `Visit` literal (grep `visit-add`, `visit-edit`) and whether a new optional property would break it. Do not propose edits yet.

**Review checkpoint:** Confirm the file set matches F1–F5 and that no schema, seed or config file is needed. If Copilot finds a new file, add it as F6+ (do not renumber). Confirm the list of `Visit` literals and that an optional property does not break them.

---

## Step 2 — Decide the label-mapping mechanism (design confirmation)

**Goal:** Confirm the design: standalone pure pipe (F3) backed by a constants module (F2), not inline logic in the component.
**Implements:** — (enabling step, no AC)
**Depends on:** Step 1

**Suggested prompt:**

> For the visit status label mapping, the chosen design is: (a) F2 `visit-status.ts` exports the `VisitStatus` union type and a `Map<string, string>` of the three labels plus the "Not set" text; (b) F3 `visit-status-label.pipe.ts` is a standalone pure pipe `visitStatusLabel` that uses F2. Do not write code yet. Confirm this fits the existing visits feature (the `VisitListComponent` is standalone; the pipe must be added to its `imports`). Name any conflict with the NgModule-based `visits.module.ts`.

**Review checkpoint:** Accept the design or record a change. A `Map` (not a plain object) is required so keys like `constructor` cannot match by prototype lookup. Resolve CL-A (visit-add reuse) now: the default is that the column shows in both places; if the developer says otherwise, stop and revise before Step 7.

---

## Step 3 — Define the status type and label map (F2)

**Goal:** Create the single source of truth for the status values and their labels.
**Implements:** AC-1 (type part), AC-2
**Depends on:** Step 2

**Suggested prompt:**

> Create F2 `src/app/visits/visit-status.ts`. Copy the Apache license header from a sibling file in `src/app/visits/`. Export:
> ```ts
> export type VisitStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
> export const VISIT_STATUS_LABELS: ReadonlyMap<string, string> = new Map<string, string>([
>   ['SCHEDULED', 'Scheduled'],
>   ['COMPLETED', 'Completed'],
>   ['CANCELLED', 'Cancelled'],
> ]);
> export const VISIT_STATUS_NOT_SET_LABEL = 'Not set';
> ```
> Do not add other values. Do not modify any other file yet.

**Review checkpoint:** Confirm the union has exactly the three contract values (match `openapi.yml` `VisitStatus` enum), the map is the only place the labels appear, and no comment is added unless it clarifies something. Loop back if values differ from the contract.

---

## Step 4 — Add the optional `status` to the Visit model (F1)

**Goal:** Extend the `Visit` interface with the optional, typed status.
**Implements:** AC-1
**Depends on:** Step 3

**Suggested prompt:**

> Edit F1 `src/app/visits/visit.ts`. Add `import {VisitStatus} from './visit-status';` and add the optional property `status?: VisitStatus;` to `Visit`, after `petId?`. Do not change `id`, `date`, `description`, or `pet`. Do not modify `visit-status.ts` or any component.

**Review checkpoint:** Only the import and the one new property are added. The property is optional and typed as `VisitStatus`, not `string`. No other property changed.

---

## Step 5 — Create the status label pipe (F3)

**Goal:** Implement the mapping rules (labels, "Not set" for missing/null/blank, raw value for unexpected) as a pure pipe with no logging.
**Implements:** AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-2 (reuse), AC-15
**Depends on:** Step 3

**Suggested prompt:**

> Create F3 `src/app/visits/visit-status-label.pipe.ts`. Copy the Apache license header from a sibling file. Implement exactly:
> ```ts
> import {Pipe, PipeTransform} from '@angular/core';
> import {VISIT_STATUS_LABELS, VISIT_STATUS_NOT_SET_LABEL} from './visit-status';
>
> @Pipe({name: 'visitStatusLabel', standalone: true})
> export class VisitStatusLabelPipe implements PipeTransform {
>   transform(value: unknown): string {
>     if (value === null || value === undefined) {
>       return VISIT_STATUS_NOT_SET_LABEL;
>     }
>     const text = String(value);
>     if (text.trim() === '') {
>       return VISIT_STATUS_NOT_SET_LABEL;
>     }
>     return VISIT_STATUS_LABELS.get(text) ?? text;
>   }
> }
> ```
> Do not trim or change case before the map lookup (AC-10). Do not add `console.*`. Do not throw. Do not change any other file.

**Review checkpoint:** Confirm: `null`/`undefined` → "Not set"; `''` and `'   '` → "Not set"; `SCHEDULED`/`COMPLETED`/`CANCELLED` map to labels; `'DONE'`, `'scheduled'`, `' SCHEDULED '` return the input unchanged; a number returns its string form; no `console` call; no `any`. If a lookup fails, loop back — do not weaken the rules.

---

## Step 6 — Register the pipe on the visit list component (F4)

**Goal:** Make the standalone `VisitListComponent` able to use the pipe.
**Implements:** AC-2 (reuse, no repeated literals in components)
**Depends on:** Step 5

**Suggested prompt:**

> Edit F4 `src/app/visits/visit-list/visit-list.component.ts`. Add `import {VisitStatusLabelPipe} from '../visit-status-label.pipe';` and change the component `imports` array from `[NgFor]` to `[NgFor, VisitStatusLabelPipe]`. Do not change the class body, the constructor, `editVisit`, `deleteVisit`, or the existing `console.log`. Do not modify the template yet.

**Review checkpoint:** Only the import line and the `imports` array change. No status literal or label string appears in the component. The existing `console.log('delete success')` is untouched.

---

## Step 7 — Add the Status column to the visit table (F5)

**Goal:** Insert the Status header and cell between Description and Actions, leaving all other cells and buttons unchanged.
**Implements:** AC-3, AC-11, AC-13
**Depends on:** Step 4, Step 6

**Suggested prompt:**

> Edit F5 `src/app/visits/visit-list/visit-list.component.html`. Insert `<th>Status</th>` after `<th>Description</th>` and before `<th>Actions</th>`. Insert `<td>{{ visit.status | visitStatusLabel }}</td>` after the description `<td>` and before the Actions `<td>`. Do not change the Visit Date cell, the Description cell, the Actions cell, the buttons, `[hidden]="noVisits"`, or the `*ngFor`. Use text interpolation only; no `innerHTML`.

**Review checkpoint:** Confirm the diff is exactly one `<th>` and one `<td>` inserted in the right order; the Edit Visit and Delete Visit buttons and their click handlers are unchanged; no `[innerHTML]` or sanitiser bypass. Reminder: this table is also used by `visit-add` (CL-A). If the developer chose a flag instead, loop back to Step 2.

---

## Step 8 — Build verification

**Goal:** Prove the app compiles, including template type-checking of the new pipe and the optional `status` property.
**Implements:** AC-17
**Depends on:** Step 7

**Suggested prompt:**

> In the `service` directory run `npm install` then `npx ng build --configuration development`. Report the full result. If it fails, identify the file and error, and fix only the change introduced by Steps 3–7. Do not add tests and do not edit unrelated files.

**Review checkpoint:** The build exits 0 with no template or type errors. Any error referencing F1–F5 is a bug in this plan's changes and must be fixed in the step that introduced it.

---

## Step 9 — Manual validation against acceptance criteria

**Goal:** Walk each AC against the running app (dev server with the backend returning `status`) and record a verdict per AC id.
**Implements:** — (verification step, no AC)
**Depends on:** Step 8

**Suggested prompt:**

> Produce a manual checklist, one row per AC id (AC-1 … AC-17). For each give the concrete check: for AC-4 to AC-10 use owner data with visits having `SCHEDULED`, `COMPLETED`, `CANCELLED`, missing `status`, `null`, `""`, `"   "`, `"DONE"`, `"scheduled"`, `" SCHEDULED "`; for AC-14 check the network tab shows no extra request; for AC-16 check the Add Visit and Edit Visit forms are unchanged; for AC-12 check the browser console has no status-related error. Do not run anything; give the checklist.

**Review checkpoint:** Record pass / fail / unclear per AC id. An unverifiable AC is `unclear`, not `pass`. A failure loops back to the step that produced it.

---

## Step 10 — Convention drift review

**Goal:** Check all changed files against `.github/copilot-instructions.md` and the Angular instruction files, without auto-fixing.
**Implements:** — (enabling step, no AC; AC-15 logging check is re-verified here)
**Depends on:** Step 9

**Suggested prompt:**

> Review F1–F5 (`visit.ts`, `visit-status.ts`, `visit-status-label.pipe.ts`, `visit-list.component.ts`, `visit-list.component.html`) against `.github/copilot-instructions.md` and `.github/instructions/angular-frontend/angular-conventions.instructions.md` and `logging-angular.instructions.md`. Check: no `console.*` added; no `any`; no string-literal status values outside F2; typed model; naming (`visitStatusLabel`, kebab-case file names); license headers kept. List drift only — do not fix.

**Review checkpoint:** Developer decides on each drift item. Confirm no `console.*` in F2, F3 or F5 (AC-15).

---

## Done criteria

Before opening a PR, confirm:
- AC-1: `Visit.status` is optional and typed `VisitStatus` (three contract values only).
- AC-2: The three values and labels exist only in `visit-status.ts`.
- AC-3: Status header sits between Description and Actions.
- AC-4 to AC-10: Label mapping matches the table in Step 5 (labels, "Not set" for missing/null/blank, raw value for unexpected, no trimming/case change).
- AC-11 and AC-12: The owner detail page renders every pet and visit with any status value and emits no status-related console error.
- AC-13: Date, description and Edit/Delete buttons behave as before.
- AC-14: No new API call.
- AC-15: No `console.*` added in the status code.
- AC-16: Add and edit visit forms unchanged.
- AC-17: `npm install && npx ng build --configuration development` passes.
- CL-A resolved and recorded (column on visit-add page: accepted or changed).
- No unit tests added or modified; no backend files changed.

---

## --- EXECUTION RECORD (appended by harness) ---
- timestamp: 2026-11-02T07:47:31
- phase: coding
- approved impacted files: ['src/app/visits/visit-list/visit-list.component.html', 'src/app/visits/visit-list/visit-list.component.ts', 'src/app/visits/visit-status-label.pipe.ts', 'src/app/visits/visit-status.ts', 'src/app/visits/visit.ts']
- actually touched: ['src/app/visits/visit-list/visit-list.component.html', 'src/app/visits/visit-list/visit-list.component.ts', 'src/app/visits/visit-status-label.pipe.ts', 'src/app/visits/visit-status.ts', 'src/app/visits/visit.ts']
- scope: matches approved plan (no additions)
- review status: APPROVED by human at 2026-11-02T07:47:31
