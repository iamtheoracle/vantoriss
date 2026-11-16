# Account integrity monitor — security remediation

## Current patch scope

This change set hardens the reconcileAccountIntegrity endpoint without changing financial records or enabling a production deployment:

- Requires an authenticated user whose role has the existing management.operations.review capability.
- Accepts only Transaction create/update and Account update event metadata, or an empty scheduled invocation.
- Re-fetches Transaction records with the service role by the platform event's entity ID; it does not trust the event's client-supplied data object for account attribution.
- Restricts IntegrityAlert reads and alert notifications to the same operations-review roles.
- Keeps the monitor read-only with respect to Account and Transaction records. It may create/update IntegrityAlert records and notifications.

The accepted reviewer roles mirror the existing capability matrix in src/lib/operationsAccess.js: admin, administrator, super_administrator, executive, operations_manager, operations_officer, finance_officer, treasury_officer and auditor.

## Explicitly unresolved

1. Account RLS still grants broad staff read/create/update access. Narrowing update access safely requires moving account balance and metadata writes behind backend functions that enforce the exact existing capability and approval requirements. Entity-level role filters cannot distinguish a balance write from a harmless metadata update.
2. Transaction still has no owner field/RLS. The source inventory found client-side create, bulk-create and update writers in admin account/member/application flows, withdrawal and verification workflows, adjustment tools, historical imports, and bulk imports. All writers must derive owner attribution from a server-verified Account record before transaction owner RLS can be enabled.
3. Existing Transaction rows need a controlled account-owner backfill. Do not enable owner-only RLS before the backfill is completed and verified; doing so could hide members' historical activity.
4. Base44 live/staging deployment and runtime authorization tests have not been performed. The Base44 workspace sandbox tools were unavailable because the workspace had exhausted integration credits.

## Required next steps

- Move financial Account and Transaction writes to server-side functions with capability-specific authorization, immutable audit attribution, and idempotency where applicable.
- Add server-derived user_id attribution to every writer, then perform a reviewed, paginated backfill of historical Transaction rows from their Account owner.
- Verify no orphaned or conflicting account/transaction ownership remains; only then enable Transaction owner RLS.
- Add staging tests for member A/member B isolation, staff role boundaries, forged event data, revoked staff access, alert visibility, and scheduled automation execution.
- Verify the Base44 automation creator identity and event delivery contract in staging. The endpoint's role check authorizes the configured automation creator for scheduled/entity triggers; it does not prove the identity of the user whose entity change caused an automation to run.
- Do not deploy or describe the monitor as operational until those checks pass.

## Evidence boundary

GitHub CI can validate the pure authorization and event-parsing helpers. It cannot prove Base44 entity RLS, automation identity, deployed function behavior, or live member-data isolation.
