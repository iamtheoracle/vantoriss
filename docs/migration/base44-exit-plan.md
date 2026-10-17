# VANTORIS Base44 Exit and UI Stabilization Plan

**Status:** Discovery and first UI reliability pass. No production backend cutover has been performed.

## Guardrails

- Keep the current Base44 backend active until the replacement passes data, security, and workflow verification.
- Never commit credentials, exported member records, banking details, or production data to Git.
- Treat a source-code export as a code backup, not a full application backup.
- Preserve original transaction dates and source provenance. Do not turn estimated/reassigned dates into verified bank history.
- Use a feature branch and reviewable pull request for changes; do not force-push or overwrite the production branch.
- Maintain an explicit rollback route throughout migration.

## Repository inventory (verified on `main`)

The inspected `iamtheoracle/vantoriss` repository contains the main React/Vite application and Base44-specific assets, including:

- `src/pages/`: 85 page files.
- `src/components/`: 185 component files.
- `base44/entities/`: 54 entity schema files.
- `base44/functions/`: 10 function entry points.
- `base44/agents/`: 17 agent definitions.
- `base44/connectors/`: 3 connector configurations.
- `src/api/base44Client.js`, `@base44/sdk`, and `@base44/vite-plugin` remain backend integration points.
- `base44/config.jsonc` and the README describe Base44's local development and publish workflow.

This inventory is based on the repository tree, not on a live export of the production database or the Base44 app settings. Entity schemas do not contain the live entity rows, user credentials, uploaded files, secrets, or remote integration state.

## Phase 0 — Preserve and verify the source of truth

1. Confirm the canonical application/repository and current production deployment.
2. Export or back up the complete source tree, Base44 entity schemas, functions, agents, connectors, auth configuration, app settings, secrets inventory (names only), and uploaded-file inventory.
3. Export every production data entity and its relationships using authorized Base44 tools; separately determine what can and cannot be migrated for user authentication.
4. Record row counts, identifiers, timestamps, references, and checksums where practical. Keep backups encrypted and outside Git.
5. Verify the backup can be read and restored into a non-production environment before any destructive action.

**Exit criterion:** a documented, recoverable backup exists for both code and data.

## Phase 1 — Backend dependency map

Create a dependency matrix for each SDK call and server-side function:

- Authentication, sessions, role and row-level access rules.
- All 54 entity schemas and their relationships.
- All 10 backend functions and their triggers/callers.
- Agent definitions, connector/OAuth setup, scheduled jobs, file storage, email/notifications, and realtime behavior.
- Frontend imports of the Base44 SDK and any generated/legacy SDK paths.
- Environment variables and deployment assumptions.

Classify each dependency as: replace, retain temporarily behind an adapter, retire with explicit approval, or external integration.

## Phase 2 — Choose and provision the replacement

Evaluate the target against actual requirements before committing to a vendor. A candidate stack is PostgreSQL (for example, Supabase), managed authentication, object storage, server-side functions, and a separately controlled frontend host.

Required design decisions:

- Map document-style entity schemas to relational tables and constraints without losing source IDs or relationships.
- Define least-privilege access policies and server-only privileged operations.
- Establish audit logging, idempotency keys, rate limits, backup/restore, secret rotation, monitoring, and disaster recovery.
- Replace Base44-specific SDK calls through a typed application data-access layer rather than scattering vendor-specific calls across pages.
- Do not put service-role credentials or privileged banking operations in browser code.

**Exit criterion:** the new environment and access model are tested in staging; production traffic is unchanged.

## Phase 3 — Data and identity migration

1. Import schema first, then parent records, child records, relationships, and file references in a deterministic order.
2. Make imports idempotent and resumable; maintain an import manifest with counts and per-record errors.
3. Compare counts, primary identifiers, totals, date ranges, nullability, and relationship integrity before and after import.
4. Do not assume password hashes or sessions are exportable. Select a supported identity migration or verified account-recovery process.
5. Reconcile account balances against authoritative records. Historical entries with estimated dates or amounts must remain marked unverified until source evidence is available.
6. Keep audit and compliance records immutable where required.

**Exit criterion:** reconciliation meets agreed tolerances, access controls pass negative tests, and unresolved differences are documented.

## Phase 4 — Replace backend behavior and verify UI

- Port functions and triggers to server-side services with authorization checks and structured audit events.
- Replace storage, notification, connector, agent, and realtime integrations or document their approved retirement.
- Add automated checks for authentication, role boundaries, account ownership, transaction history, imports, and failed-provider states.
- Run lint, typecheck, production build, and end-to-end smoke tests on representative desktop and mobile viewports.
- Preview the migration branch against staging data only. Never use production credentials in preview deployments.

Recent UI reliability work on `fix/dashboard-loading-and-error-ui` adds an explicit dashboard account-load error and retry state, partial-data warning, and direct links from quick actions to their intended money workflows. These changes still require a successful build and browser preview before they can be called verified.

## Phase 5 — Cutover and rollback

1. Schedule a controlled cutover and define a write-freeze or dual-write strategy with reconciliation.
2. Run final incremental export/import and compare record counts and financial totals.
3. Switch traffic only after health checks, auth, permissions, transactions, and audit logging pass.
4. Monitor errors and reconcile critical records after cutover.
5. Keep Base44 available for rollback until the agreed stabilization window has passed.
6. Disconnect and cancel Base44 only after explicit approval and verified recovery/retention obligations are satisfied.

## Current blockers and next actions

- The GitHub repository provides schemas and function source, but it does not prove that production data, credentials, files, or connector state have been backed up.
- No Vercel project matching “Vantoris” was found in the connected Vercel account, and no Base44 editor preview session is available here; a browser-based visual preview of this branch remains pending.
- The current `main` branch had no `.github/workflows/` CI workflow. This feature branch adds `.github/workflows/quality.yml` so validation can run on future pushes and pull requests.
- GitHub Actions on this branch: changed-UI-file ESLint passed; `npm run build` passed. Repository-wide lint reports 102 unused-import errors across the wider codebase. `npm run typecheck` reports 428 errors across 112 files; none of those reported errors point to the four UI files changed in this branch. The quality workflow therefore remains red until the existing repository-wide lint/typecheck debt is addressed.
- Next: obtain a safe visual preview environment and continue resolving baseline lint/typecheck debt; separately connect/export the canonical Base44 project and production data inventory before any backend cutover.

## Change log

- **2026-10-17:** Inspected repository metadata, app entry/routes, Home dashboard, Money page, account/transaction entity schemas, Base44 configuration, package scripts, and repository tree.
- **2026-10-17:** Added dashboard request-failure handling and retry UI; wired quick actions to send/request/add panels and account history; corrected card-data failure messaging and several MoveMoney type issues.
- **2026-10-17:** Added branch CI for changed-file lint, repository lint, typecheck, and production build. Changed-file lint and production build pass; full-repository lint and typecheck remain blocked by existing codebase-wide errors. Browser-based visual preview remains pending.
