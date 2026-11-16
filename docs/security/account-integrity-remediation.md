# Account integrity monitor — security remediation

## Current patch scope

This change set hardens the `reconcileAccountIntegrity` endpoint without changing financial records or enabling a production deployment:

- Requires an authenticated user who has the authoritative `management.operations.review` capability, resolved through `src/lib/operationsAccess.js`.
- Derives the IntegrityAlert reviewer role set from the same capability matrix; the role list is not an independent permission system.
- Accepts only an empty authenticated scheduled/manual sweep request.
- Rejects entity-event payloads. Base44 automation payloads do not prove the identity of the user who caused an entity event, and no verifiable trigger signature/identity contract has been established.
- All three automation declarations (Transaction create/update, Account update, and five-minute scheduled sweep) are now marked inactive in `function.jsonc`. They must remain inactive until a supported invocation identity contract and staging execution are proven.
- Uses the service role only inside the authorized backend function to read Account/Transaction records and create/update IntegrityAlert records. It does not write Account or Transaction records.
- Restricts IntegrityAlert reads to roles with the operations-review capability; direct client create/update/delete is disabled.

## Explicitly unresolved

1. `Account` RLS still grants broad staff read/create/update access. Narrowing update access safely requires moving account balance and metadata writes behind backend functions that enforce the exact existing capability and approval requirements. Entity-level role filters cannot distinguish a balance write from a harmless metadata update.
2. `Transaction` still has no owner field/RLS. A follow-up source inventory found direct client-side create/bulk-create/update/delete writers across admin account/member/application flows, withdrawal and verification workflows, adjustment tools, historical statement imports, and bulk imports. The exact inventory is recorded below. All writers must be migrated to server-side authorization and derive owner attribution from a server-verified Account record before transaction owner RLS can be enabled.
3. Existing Transaction rows need a controlled account-owner backfill. The current Transaction entity schema has no `user_id`/owner property and no RLS block. Some existing write paths send `user_id` but others do not, so existing values cannot be assumed complete or authoritative. Do not enable owner-only RLS before the backfill is completed and verified; doing so could hide members' historical activity.
4. Base44 live/staging deployment and runtime authorization tests have not been performed. The Base44 workspace sandbox tools were unavailable because the workspace had exhausted integration credits. The committed automation declarations are inactive; do not activate them until the scheduled service identity is proven to satisfy the endpoint authorization and event-trigger identity is cryptographically/platform verified.
5. The scheduled/manual sweep is not yet configured or verified in Base44. A scheduler must invoke it using a service identity whose account has the operations-review capability. Do not assume the creator identity is the initiating user's identity.

## Required next steps

- Move financial Account and Transaction writes to server-side functions with capability-specific authorization, immutable audit attribution, and idempotency where applicable.
- Add server-derived `user_id` attribution to every writer, then perform a reviewed, paginated backfill of historical Transaction rows from their Account owner.
- Verify no orphaned or conflicting account/transaction ownership remains; only then enable Transaction owner RLS.
- Add staging tests for member A/member B isolation, staff role boundaries, forged event data, revoked staff access, alert visibility, and scheduled automation execution.
- Align the IntegrityAlert entity role policy with `isSuperAdmin()` semantics. `src/lib/operationsAccess.js` grants capability to the configured super-admin email as well as the `super_administrator` role; the entity RLS role list cannot represent that email exception. Do not claim exact policy parity until this is resolved using a platform-supported condition.
- Establish a verifiable event-trigger identity/signature contract before re-enabling entity-triggered reconciliation. Until then, all entity and scheduled automation declarations remain inactive and event-triggered invocations remain rejected.
- Do not deploy or describe the monitor as operational until those checks pass.

## Evidence boundary

GitHub CI can validate the pure authorization and request-validation helpers. It cannot prove Base44 entity RLS, automation identity, deployed function behavior, or live member-data isolation.


## Transaction writer inventory (branch review)

The following write paths were found in the PR head source. This is a code inventory, not proof that each workflow is deployed or exercised in production.

| Path | Operations found | Ownership/security concern |
|---|---|---|
| `src/pages/admin/AdminAccounts.jsx` | Create, edit, recalculate/update multiple running balances, CSV-style import create | Client writes can choose `account_id` and mutate historical ledger rows/balance snapshots. |
| `src/pages/admin/AdminMembers.jsx` | Create opening-balance transaction; delete member transactions via `deleteMany` | Client-side historical deletion; opening transaction attribution varies. |
| `src/pages/admin/AdminApplications.jsx` | Create zero opening transaction on bulk approval; create opening transaction on approval | Client-side transaction creation tied to account/application flow. |
| `src/pages/admin/AdminWithdrawals.jsx` | Create withdrawal transaction | Client calculates balance and writes transaction directly. |
| `src/pages/operations/VerificationRequests.jsx` | Create deposit/opening-balance transaction | Client calculates balance and writes transaction directly. |
| `src/components/vantoris/QuickActionsMenu.jsx` | Create adjustment transaction and update Account balance | Client performs financial write pair without a single server transaction. |
| `src/components/vantoris/FloatingCommandDock.jsx` | Create adjustment transaction during account freeze flow | Account status and transaction writes are split client operations; purpose and zero-amount semantics need review. |
| `src/components/vantoris/HistoricalStatementImport.jsx` | Bulk-create historical transactions | Client bulk import; must preserve source document and account-owner mapping server-side. |
| `src/pages/operations/BulkTransactionImport.jsx` | Bulk-create transactions | Client bulk import; payload must not supply trusted ownership or running balances. |
| `src/lib/ledgerImport.js` | Bulk-create transactions; update Account closing balance | Shared client import helper writes ledger and account balance separately. |
| `base44/functions/bulkImportTransactions/entry.ts` | Service-role create Transaction and update Account balance | Backend route currently checks only `user.role === 'admin'`, lists only the latest 500 accounts, and does not explicitly derive/store a Transaction owner field. Requires capability-based authorization, pagination, input validation and atomicity review. |
| `base44/functions/generateAccount/entry.ts` | Creates Account, not Transaction | Account opening dependency; static role allowlist differs from capability matrix and should be reconciled separately. |

The source search also found that `Transaction.jsonc` defines `account_id`, transaction fields and required fields, but no owner property and no RLS policy. The current schema therefore does not enforce member ownership at the entity boundary.

## Required migration sequence for Transaction ownership

1. Define the canonical owner field and its immutability contract. Prefer a server-derived owner copied from the verified Account at creation; never accept the owner from client payloads.
2. Introduce one or more backend write functions with authenticated actor checks against the existing capability matrix. Separate operation capabilities where business duties differ (manual adjustment, withdrawal approval, deposit posting, import, historical correction); do not grant all staff a generic write capability.
3. Make each write atomic across Transaction, Account balance, audit attribution and idempotency key. If Base44 cannot provide a transaction boundary, document and implement a recoverable state machine rather than presenting separate writes as atomic.
4. Migrate every listed client writer to those functions. Remove direct client Transaction create/update/delete/bulkCreate and direct Account balance writes only after the corresponding server path and tests exist.
5. Backfill owner values from the authoritative Account.user_id relationship in bounded batches. Produce counts for matched, orphaned, conflicting, and already-attributed rows; stop on conflicts and preserve a reviewed recovery path.
6. Add negative tests for forged owner IDs, cross-member account IDs, client mutation of posted transactions, unauthorized roles, duplicate retries, partial failures, and historical import attribution.
7. Enable owner RLS only after backfill evidence and staging member-isolation tests pass. Keep privileged staff access capability-scoped and auditable.
