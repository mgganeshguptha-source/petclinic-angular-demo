# Copilot Instructions — Angular Web (spring-petclinic-angular)

## 1. Repository Overview

- **Purpose:** Angular web frontend for the Spring PetClinic sample application (owners, pets, pet types, visits, vets, specialties). Consumes the Spring Boot REST API.
  - [TODO — MUST COMPLETE]: Confirm the intended business domain and primary users of this app. Confirm whether it handles PHI under HIPAA (the HIPAA guardrails apply to this repo), since the sample data model is a veterinary clinic, not a healthcare provider.
- **Tech Stack:**
  - Angular 19.2 (`@angular/*` 19.2.25), Angular CLI 19.2.27
  - Angular Material 19.2 / CDK 19.2 (with moment adapter)
  - RxJS `^6.3.1` (note: RxJS 6, not 7 — use the RxJS 6 APIs and `rxjs/operators`)
  - Bootstrap 3.3 and jQuery 3 (legacy styling)
  - moment `^2.29`, zone.js `~0.15`, TypeScript 5.8.3
  - Tests: Karma `~6.3` + Jasmine `~3.6` (`ng test`, `ng test --no-watch` headless)
  - Lint: ESLint 8 with `@angular-eslint` 19 and `@typescript-eslint` 7, Prettier plugin
- **Architecture:**
  - NgModule-based feature modules under `src/app/` (`owners`, `pets`, `pettypes`, `visits`, `vets`, `specialties`), each with its own `*-routing.module.ts`.
  - Shared parts in `src/app/parts/` (`welcome`, `page-not-found`) and `src/app/testing/` (test helpers).
  - Root `AppRoutingModule` in `src/app/app-routing.module.ts`; feature routes are lazy-loaded.
  - Mixed: a few components use the standalone `imports: [...]` form inside `@Component` (e.g. `owner-list.component.ts`) while their feature module still declares most components. See Section 5.

## 2. Application Structure

- Feature folder per domain entity: `<entity>/<entity>.ts` (model interface), `<entity>.service.ts` (HTTP), `<entity>-<action>/` folders for list/add/edit/detail components.
- Shared, cross-feature code: `src/app/error.service.ts` (`HttpErrorHandler`), `src/app/testing/`.
- Routing: feature routes lazy-loaded from `app-routing.module.ts`; resolvers exist for `vets` (`vet-resolver.ts`) and `specialties` (`spec-resolver.ts`).
- State management: none. No NgRx, Akita, or signal store. State is held in component fields and services; services return cold `Observable`s from `HttpClient`.
- Environment config: `src/environments/environment.ts` (dev) and `environment.prod.ts`. The base URL is `REST_API_URL` (dev: `http://localhost:9966/petclinic/api/`).

## 3. API Integration Conventions

- One `@Injectable()` service per resource (e.g. `OwnerService`, `PetService`, `VisitService`). Each service builds URLs from `environment.REST_API_URL + '<resource>'`.
- Always use `HttpClient` with typed generics (`get<Owner[]>`). Do not use raw `fetch` or `XMLHttpRequest`.
- Errors: every service wraps calls with `catchError(this.handlerError('<operation>', <fallback>))`. The handler is built from `HttpErrorHandler.createHandleError('<ServiceName>')` in `src/app/error.service.ts`. It logs via `console.error` and returns `throwError(message)`. Components subscribe with an error callback that sets `errorMessage`.
- Spring validation: `HttpErrorHandler` reads the `errors` response header (JSON array) and surfaces the first `errorMessage`. Keep this contract when changing the backend error format.
- Auth token attachment: [TODO — MUST COMPLETE]: No HTTP interceptor or auth token handling was found in `src/app`. Confirm whether the API requires authentication, how tokens (if any) are attached, and whether XSRF is used.
- Environment: the production URL is set in `environment.prod.ts`. [TODO — MUST COMPLETE]: Confirm the production API base URL uses `https://` (TLS 1.2+). The dev value is plain `http://localhost`, which is acceptable only for local development.
- Known gap: `OwnerService.updateOwner` and `deleteOwner` types are inconsistent (`Observable<{}>`). Prefer typed return values for new code.

## 4. Security Guidelines

- Never bypass Angular's sanitizer. Do not use `bypassSecurityTrustHtml`, `bypassSecurityTrustUrl`, or `innerHTML` with untrusted data. Use interpolation or `[property]` bindings.
- Do not store auth tokens or PHI in `localStorage`, `sessionStorage`, or IndexedDB.
- Use `HttpClient` for all state-changing calls (`POST`, `PUT`, `DELETE`) so Angular's built-in XSRF handling applies.
- Do not log PHI or full HTTP bodies. `HttpErrorHandler` currently logs the full `HttpErrorResponse` and the server body via `console.error`. Treat this as a known issue for any PHI-bearing endpoint and do not copy the pattern.
- Do not log request/response objects such as `owner`, `pet`, or `visit` objects (`console.log('... ' + this.owners)` appears in `owner-list.component.ts`; do not copy it).
- [TODO — MUST COMPLETE]: Confirm the project's CSP, authentication provider, and session/token strategy. These cannot be inferred from the code.

## 5. Design Patterns

- **Patterns in use:**
  - Service-per-resource with `HttpClient`, returning `Observable<T>`.
  - Route resolvers for pre-fetching (`vet-resolver.ts`, `spec-resolver.ts`).
  - Template-driven forms via `FormsModule` (`ngModel`) in list/search components.
  - Subscriptions in components via `subscribe(...)`; `finalize` is used to set loading flags (`owner-list.component.ts`).
- **Mixed (needs a decision):** Feature modules declare most components, but some components are standalone (`imports: [...]` in `@Component`). Observed: `owner-list.component.ts` is standalone and imported into `OwnersModule`.
  - [TODO — MUST COMPLETE]: Decide whether new components should be standalone or declared in NgModules going forward. Until decided, follow the existing module the feature belongs to.
- **Change detection:** `OnPush` is not used in the code reviewed. Default change detection is the current norm.
- **Subscription management:** The code reviewed uses manual `subscribe` with no `unsubscribe` or `takeUntil`. The `async` pipe is preferred for new template-bound data.
- **Forms:** Template-driven (`FormsModule`) is the observed style. Reactive forms are not used in the code reviewed.
  - [TODO — MUST COMPLETE]: Confirm whether reactive forms are the standard for new forms.

## 6. Unique Patterns For This Project

- [TODO — MUST COMPLETE]: Internationalization strategy. None was found (no `@angular/localize` or ngx-translate). Confirm whether the UI is English-only.
- [TODO — MUST COMPLETE]: Accessibility baseline (WCAG level targeted, ARIA and keyboard expectations). Not visible in code.
- [TODO — MUST COMPLETE]: Feature flag mechanism, if any. None was found.
- [TODO — MUST COMPLETE]: Date and locale handling. `moment` and `@angular/material-moment-adapter` are present; confirm the standard date format and time zone policy.
- [TODO — MUST COMPLETE]: Theming. Bootstrap 3 and `src/assets/css/petclinic.css` are in use alongside Angular Material. Confirm which is the source of truth for styling.

## 7. What To Avoid

- Business logic or HTTP calls inside components. Put them in the feature's `*.service.ts`.
- Nested `subscribe` calls. Use `switchMap`, `mergeMap`, or `concatMap`.
- Manual `subscribe` without teardown for long-lived streams. Prefer `async` pipe or `takeUntil`.
- `any` for API responses. Type responses with the model interfaces (`owner.ts`, `pet.ts`, etc.).
- `console.log` of domain objects or PHI in components (existing examples exist; do not add more).
- Mutating the `environment` object at runtime.
- Using RxJS 7-only APIs. This project is on RxJS 6.
- Adding new Bootstrap 3 or jQuery usage in new components. Prefer Angular Material.

## 8. Documentation Requirements

- Public service methods and model interfaces should have a short JSDoc comment. Existing service files carry an Apache license header and `@author` tag; keep the license header on files that already have it.
- Run and build instructions are in the repo README and `package.json` scripts (`start`, `build`, `test`, `test-headless`, `lint`).
- [TODO — MUST COMPLETE]: Team expectations for code documentation (Compodoc use, ADR location, minimum README content) are not visible in the code. Confirm before relying on this section.
