# Account integrity monitor — security remediation

## Current patch scope

This change set hardens the `reconcileAccountIntegrity` endpoint without changing financial records or enabling a production deployment:

- Requires an authenticated user who has the authoritative `management.operations.review` capability, resolved through `src/lib/operationsAccess.js`.
- Derives the IntegrityAlert reviewer role set from the same capability matrix; the role list is not an independent permission system.
- Accepts only an empty authenticated scheduled/manual sweep request.
- Rejects entity-event payloads. Base44 automation payloads do not prove the identity of the user who caused an entity event, and no verifiable trigger signature/identity contract has been established.
- Uses the service role only inside the authorized backend function to read Account/Transaction records and create/update IntegrityAlert records. It does not write Account or Transaction records.
- Restricts IntegrityAlert reads to roles with the operations-review capability; direct client create/update/delete is disabled.

## Explicitly unresolved

1. `Account` RLS still grants broad staff read/create/update access. Narrowing update access safely requires moving account balance and metadata writes behind backend functions that enforce the exact existing capability and approval requirements. Entity-level role filters cannot distinguish a balance write from a harmless metadata update.
2. `Transaction` still has no owner field/RLS. The source inventory found client-side create, bulk-create and update writers in admin account/member/application flows, withdrawal and verification workflows, adjustment tools, historical imports, and bulk imports. All writers must derive owner attribution from a server-verified Account record before transaction owner RLS can be enabled.
3. Existing Transaction rows need a controlled account-owner backfill. Do not enable owner-only RLS before the backfill is completed and verified; doing so could hide members' historical activity.
4. Base44 live/staging deployment and runtime authorization tests have not been performed. The Base44 workspace sandbox tools were unavailable because the workspace had exhausted integration credits.
5. The scheduled/manual sweep is not yet configured or verified in Base44. A scheduler must invoke it using a service identity whose account has the operations-review capability. Do not assume the creator identity is the initiating user's identity.

## Required next steps

- Move financial Account and Transaction writes to server-side functions with capability-specific authorization, immutable audit attribution, and idempotency where applicable.
- Add server-derived `user_id` attribution to every writer, then perform a reviewed, paginated backfill of historical Transaction rows from their Account owner.
- Verify no orphaned or conflicting account/transaction ownership remains; only then enable Transaction owner RLS.
- Add staging tests for member A/member B isolation, staff role boundaries, forged event data, revoked staff access, alert visibility, and scheduled automation execution.
- Establish a verifiable event-trigger identity/signature contract before re-enabling entity-triggered reconciliation. Until then, event-triggered invocations remain rejected.
- Do not deploy or describe the monitor as operational until those checks pass.

## Evidence boundary

GitHub CI can validate the pure authorization and request-validation helpers. It cannot prove Base44 entity RLS, automation identity, deployed function behavior, or live member-data isolation.
