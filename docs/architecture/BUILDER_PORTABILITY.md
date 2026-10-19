# Builder-Agnostic Portability Standard

Status: architecture target; migration is incomplete.

## Objective

VANTORIS and Vantoris X Money must be portable between compatible app builders and custom clients without rewriting the product's business rules, financial controls, identity model, or data model. A builder is a presentation and authoring environment, not the system of record.

"Works on any builder" means any builder that can render the required UI or host a web experience; make HTTPS requests to documented APIs; securely use the selected authentication flow; handle redirects, forms, errors, and asynchronous states; and support required accessibility and browser capabilities.

No architecture can guarantee pixel-identical UI or native feature parity on literally every builder. Differences belong in thin client adapters, not duplicated business logic.

## Required separation

1. **Experience layer** — routes, layouts, components, design tokens, form state, loading/empty/error/success states. Must not own financial rules or write authoritative records.
2. **Portable client SDK** — typed API methods, normalized errors, authentication-token injection, request IDs, timeout/cancellation, schema validation, and idempotency support. No builder SDK imports.
3. **Public API contract** — versioned HTTPS endpoints with OpenAPI documentation, stable JSON schemas, explicit status codes, pagination, idempotency semantics, and consistent error envelopes.
4. **Domain/service layer** — identity, authorization, KYC, accounts, ledger, payments, investment, HeroBox, statements, notifications, and audit rules.
5. **Persistence and integrations** — authoritative database, object storage, payment/payout rails, email, and notification outbox. These remain behind server-side interfaces.

## Non-negotiable financial/security requirements

- The client never sets the authoritative balance, ledger result, role, KYC decision, payout state, or audit outcome.
- All financial mutations execute on an authoritative server with atomic commit, revision/concurrency checks, idempotency, and audit persistence.
- Server secrets never use browser-exposed environment variables or ship in frontend bundles.
- Authentication is an explicit adapter; authorization is enforced by the server on every request.
- Upload URLs and document references are scoped to the authenticated owner and validated server-side.
- A failed or uncertain mutation is not shown as success. Retries reuse the same idempotency key.
- Provider absence or contract failure must fail closed.
- Data exports and historical imports preserve original transaction dates and must not alter live balances unless the user explicitly uses a verified live-ledger workflow.

## Builder adapter contract

Every builder-specific integration must implement a small adapter with these responsibilities:
- getAccessToken() and authenticated request handling, without exposing long-lived secrets;
- request(path, options) with method, body, idempotency key, and cancellation signal;
- normalized ApiError shape with code, message, requestId, and retryable fields;
- route/navigation bridge;
- file-upload bridge that returns a server-verifiable document reference;
- telemetry/error reporting bridge with sensitive data redaction.

Builder adapters must not implement domain authorization or mutate financial entities directly.

## Portability rules

- Prefer standard React, TypeScript/JavaScript, CSS, HTML, HTTPS, JSON, OAuth/OIDC where appropriate, and documented web APIs.
- Keep builder-generated files isolated from domain modules and portable components.
- Do not make product logic depend on builder-specific generated globals, proprietary entity CRUD, proprietary router state, or hidden runtime assumptions.
- Keep design tokens and reusable components in a documented shared package or stable source directory.
- Keep environment configuration explicit and validated at startup. Public configuration may be exposed; secrets may not.
- Use database migrations and versioned API schemas as the source of truth, not builder-generated schema snapshots.
- Use capability detection and graceful fallbacks for platform-specific functions.
- Avoid silently replacing unsupported security controls with weaker client-side behavior.

## Migration plan

### Phase 1 — inventory and contracts
- Inventory all builder SDK imports, generated runtime assumptions, entity CRUD calls, auth calls, upload APIs, navigation hooks, and environment variables.
- Define API contracts for every domain operation and publish an OpenAPI specification.
- Define stable domain schemas and a builder capability matrix.
- Add contract tests for authorization, idempotency, revision conflicts, error envelopes, and no-partial-commit behavior.

### Phase 2 — portable client boundary
- Introduce a typed, builder-independent API client and error model.
- Add a compatibility adapter for the current Base44 runtime so the existing experience can migrate incrementally.
- Route one feature at a time through the portable client; forbid new direct SDK/entity usage in UI code.
- Keep all server-side financial mutations behind the authoritative atomic mutation service.

### Phase 3 — decouple server runtime
- Move domain handlers behind standard HTTP/API contracts.
- Replace runtime-specific authentication and persistence dependencies with server adapters.
- Select a canonical identity provider, database, storage system, and deployment-independent secret-management approach.
- Keep Base44 as an optional adapter only if its behavior passes the same contract suite.

### Phase 4 — prove portability
- Build at least two independent clients against the same API contracts.
- Run the same API contract suite against each client and supported deployment target.
- Test login/logout/session expiry, account ownership, KYC, deposits/withdrawals, idempotent retries, history imports, uploads, audit, and failure recovery.
- Verify that switching clients does not create duplicate users, split account state, duplicate transactions, or bypass authorization.

## Current repository assessment

The current VANTORIS repository is still Base44-coupled: package.json includes @base44/sdk and @base44/vite-plugin; the README describes Base44 publishing and environment variables; and server functions use Base44 request authentication and entity interfaces. Adding this document does not make the application portable by itself.

Vantoris X Money is currently an incomplete shell and also declares Base44 SDK/plugin dependencies. Its README says the complete application tree is still missing. The repository's existing recovery instructions include force-push and direct production deploy commands; those must not be used as a portability migration strategy.

## Acceptance criteria

Portability is not complete until:
- no UI/domain module imports a builder SDK directly outside an approved adapter;
- all product operations have documented, versioned API contracts;
- the server independently enforces identity, roles, ownership, KYC, state transitions, and financial invariants;
- the same API contract tests pass for each supported backend/deployment adapter;
- two independent builder clients can execute the same core journeys against the same canonical data;
- the app builds and passes security, type, lint, accessibility, and end-to-end checks in each supported target;
- switching builders requires configuration and presentation adaptation, not rewriting business rules or migrating financial records.

## Immediate blockers

- The authoritative atomic mutation service is not configured or verified.
- The Vantoris X Money repository is missing src/App.jsx, src/main.jsx, and a lockfile, and repository write access has previously returned HTTP 403.
- The current Base44 server-function runtime is not yet portable to arbitrary serverless hosts.
- Full-repository lint and dependency-audit debt remain open in VANTORIS.

Do not claim "works on any builder" until the acceptance criteria are met. Keep migrations on a branch and pull request; do not merge or deploy without explicit approval.
