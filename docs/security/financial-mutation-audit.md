# Financial Mutation Security Audit

**Status:** Security boundary added; successful financial writes remain intentionally disabled until a transactional mutation service is configured and verified. This is not release-ready.

## Verified repository and dependency state

- Repository: `iamtheoracle/vantoriss` (full VANTORIS application).
- Work branch: `security/financial-mutation-boundary-2026-10-17`, based on `main`.
- `package.json` dependency and devDependency ranges exactly match `package-lock.json`'s root package entries at audit time. No lockfile rewrite is justified; `npm ci` is the reproducible restore command and must be used for validation.
- Base44 server functions use `createClientFromRequest`; current application and transaction entities are accessed through entity CRUD methods.
- The Base44 SDK calls found in this repository do not expose a documented compare-and-swap operation or multi-entity database transaction. Sequential writes therefore cannot honestly guarantee concurrency safety across application/account/transaction/audit records.

## Implemented boundary in this branch

### Application review

- New `base44/functions/reviewApplication/entry.ts` is POST-only and authenticates through Base44 server-side identity.
- Only explicit operations roles are accepted; browser route guards are not trusted as authorization.
- It accepts only `approved` or `rejected` decisions and passes the expected `pending` state, caller's `updated_date`, and required approved-KYC state to the atomic service. The service must enforce all three against authoritative records inside its transaction; the Base44 wrapper does not treat a preflight read as concurrency protection.
- Applicant roles with operational/admin privileges are rejected.
- Operator-entered positive opening balances are blocked. Account approval must not create money without verified funding evidence.
- It delegates the actual state transition, account creation, audit event, and notification outbox to the atomic mutation service. If that service is missing or does not confirm a matching idempotency key and audit record, the endpoint fails closed and does not report success.

### Transaction-date correction

- New `base44/functions/correctTransactionDate/entry.ts` is POST-only and server-authenticated.
- Only explicit operations roles are accepted.
- It requires a valid calendar date, idempotency UUID, expected `updated_date`, expected account identity, and expected transaction state (`completed` or `reversed`). The atomic service must compare all expected values to authoritative records inside the transaction.
- It sends a narrowly scoped command that can change only `transaction_date`; amounts, account balances, posting dates, status, reference, and description are not in the mutation contract.
- The atomic service must re-check the expected revision and state inside the transaction and persist the change and audit event together.

### Atomic service contract

The application-review, date-correction, funding-review, withdrawal-processing, bulk-import, account-status, account-provisioning, withdrawal-initiation, manual transaction, and historical statement import endpoints use `base44/shared/financialMutationGateway.ts`; all eight fail closed when the provider is unavailable and do not perform financial entity writes themselves. Configuration requires server-only environment variables:

- `VANTORIS_ATOMIC_MUTATION_URL` — HTTPS endpoint for the service that owns the authoritative records and can commit state plus audit atomically.
- `VANTORIS_ATOMIC_MUTATION_SECRET` — server-only bearer credential for that service.

The service must enforce idempotency, re-check the supplied revision/state inside its own transaction, and persist the business mutation and audit record in the same commit. It must return `success: true`, `audit_recorded: true`, and `operation_id` equal to the supplied idempotency key. A successful-looking response without those fields is treated as a contract violation.

**Important blocker:** these environment variables are not configured or verified in the repository context. Until the transactional service is implemented and configured against the same authoritative records, all eight endpoints return 503 without applying changes. The optimistic preflight check is not presented as concurrency protection on its own.

Blocked operations are recorded as `financial_mutation_blocked` when the audit write succeeds. Audit-write failure is surfaced in the response.

## UI changes

- `src/pages/admin/AdminApplications.jsx` now routes approve/reject and bulk decisions through `reviewApplication`; direct browser writes to Application, Account, and Transaction for these decisions were removed.
- Application approval no longer accepts an arbitrary positive opening balance. It displays the requirement to use the separately verified funding workflow.
- `src/pages/admin/AdminAccounts.jsx` now routes transaction date corrections through `correctTransactionDate`; the edit dialog is date-only and no longer changes amount/type/description/reference or recomputes balances.
- `src/pages/operations/BulkTransactionImport.jsx` fingerprints the normalized import payload, reuses the same idempotency key for retries, verifies the returned operation ID and audit confirmation, and clears the key only after a confirmed success. The import UI now permits deposits and withdrawals only; adjustments and opening balances remain blocked pending separate verified workflows.

These UI actions will show an explicit unavailable/error state until the atomic service is configured. No production function invocation or data mutation was performed by this change.

## Source-wide privileged/financial mutation inventory

| Location | Observed risk | Status |
|---|---|---|
| `src/pages/admin/AdminApplications.jsx` | Account + opening transaction + application status were separate client writes; audit was best-effort | Routed through server endpoint; successful path awaits atomic service |
| `src/pages/admin/AdminAccounts.jsx` | Manual ledger entries, account freeze/unfreeze, and CSV import previously performed separate browser writes | Date correction uses `correctTransactionDate`; manual deposit/withdrawal uses `createAdminTransaction`; freeze/unfreeze uses `setAccountStatus`; CSV uses all-or-nothing `bulkImportTransactions`. Adjustments/opening balances are disabled pending dedicated verified workflows. |
| `src/pages/operations/VerificationRequests.jsx` | Transaction create, account balance update, request status, notification/email, and audit were separate writes | Routed through `reviewFundingRequest`; authoritative request lookup, evidence verification, pending-state/revision check, ledger/account mutation, audit, and notification outbox are delegated to one atomic service command. Client no longer writes financial records or sends transaction email as a separate side effect; success remains unavailable until provider configuration is verified. |
| `src/pages/admin/AdminWithdrawals.jsx` | Withdrawal transaction, balance update, and request status were separate writes | Routed through `processWithdrawalRequest`; authoritative request lookup, pending-state/revision checks, sufficient-funds validation, payout confirmation, ledger mutation, audit, and notification outbox are delegated to one atomic service command. Client no longer writes balances/transactions or sends transaction email as a separate side effect; successful settlement requires explicit provider payout confirmation. |
| `base44/functions/bulkImportTransactions/entry.ts` | Previously performed service-role transaction create and balance update as separate writes | **Routed to atomic service:** server authenticates and authorizes the operator, validates/normalizes every row, restricts types to deposits/withdrawals, requires idempotency, and delegates all-or-nothing posting. It performs no entity CRUD writes; success remains unavailable unless the authoritative service is configured and confirms the audited commit. |
| `src/components/vantoris/QuickActionsMenu.jsx` | Client-side balance adjustment/freeze operations | Freeze/unfreeze routed through `setAccountStatus`; direct balance adjustment removed from the menu until a separately verified atomic adjustment workflow exists |
| `src/components/vantoris/FloatingCommandDock.jsx` | Client-side account freeze plus transaction write | Member self-freeze routed through `setAccountStatus`; client no longer changes account state, creates zero-value transactions, sends notifications separately, or writes audit separately |
| `src/components/vantoris/herobox/SponsorFlow.jsx` | Sponsor flow writes transaction and balance from client | Outstanding; verify whether this is a real financial workflow and move server-side |
| `src/pages/admin/AdminMembers.jsx` | Account provisioning and member deletion | Account creation now routes through `createMemberAccount` with zero opening balance, server-generated account number, idempotency, audit, and notification outbox requirements; direct member deletion is disabled pending a retention-safe atomic workflow |
| `src/pages/admin/AdminKYC.jsx`, `src/pages/ApplyKYC.jsx` | KYC status/document updates are client initiated | Outstanding; distinguish member submission from operator decisions and enforce policy server-side |
| `src/pages/operations/InvestmentDeposits.jsx`, `src/pages/operations/InvestmentWithdrawals.jsx` | Investment request approval writes transactions and portfolio state from client | Outstanding; require provider-backed atomic ledger and role checks |
| `src/pages/AccountDetail.jsx` | Member withdrawal creation and account freeze/unfreeze were client initiated | Freeze/unfreeze uses `setAccountStatus`; withdrawal initiation now uses `createWithdrawalRequest` with member authentication, revision/idempotency checks, provider-enforced ownership/KYC/active status/available funds/limits, and an atomic audit + notification outbox. Historical statement import remains to be verified separately. |
| `src/pages/admin/AdminAccounts.jsx` add transaction/import flows | Transaction create and account balance update were separate client writes; imported rows could partially apply | Routed to revision-checked `createAdminTransaction` and idempotent all-or-nothing `bulkImportTransactions`; provider remains required and fail-closed |

This inventory is based on repository code search and targeted source inspection, not a claim that every path is reachable in production or that every listed flow has been fully reviewed. Continue the audit until all privileged mutation call sites are either server-backed or explicitly disabled.

## Validation

Run in a clean checkout with Node 20+ and Deno 2:

```sh
npm ci
npm run test:financial-mutations
npx eslint src/pages/admin/AdminApplications.jsx src/pages/admin/AdminAccounts.jsx src/pages/operations/BulkTransactionImport.jsx src/pages/operations/VerificationRequests.jsx src/pages/admin/AdminWithdrawals.jsx --quiet
deno lint base44/shared/financialMutationRules.mjs base44/shared/financialMutationGateway.ts base44/functions/reviewApplication/entry.ts base44/functions/correctTransactionDate/entry.ts base44/functions/bulkImportTransactions/entry.ts base44/functions/reviewFundingRequest/entry.ts base44/functions/processWithdrawalRequest/entry.ts base44/functions/setAccountStatus/entry.ts base44/functions/createMemberAccount/entry.ts base44/functions/createWithdrawalRequest/entry.ts base44/functions/createWithdrawalRequest/entry.ts
deno check base44/functions/reviewApplication/entry.ts base44/functions/correctTransactionDate/entry.ts base44/functions/bulkImportTransactions/entry.ts base44/functions/reviewFundingRequest/entry.ts base44/functions/processWithdrawalRequest/entry.ts base44/functions/setAccountStatus/entry.ts base44/functions/createMemberAccount/entry.ts base44/functions/createWithdrawalRequest/entry.ts base44/functions/createWithdrawalRequest/entry.ts
npm run build
npm run lint
npm audit --audit-level=high
```

The completed workflow run `39009653505` verified `npm ci`, all 11 financial-mutation tests, changed-file ESLint, Deno lint, Deno type-check, and the Vite production build. It also confirmed that full-repository lint still reports **102 errors** and `npm audit --audit-level=high` reports **34 advisories (1 low, 13 moderate, 20 high)**. Those two steps were initially warning-only so the other checks could finish; the current workflow now makes both blocking quality gates. Do not treat the earlier green workflow conclusion as a clean-repository result. The latest blocking run `39009819380` reran the tests, targeted lint, Deno lint/type-check, and production build successfully, then failed at the final gate exactly because the full lint and dependency audit findings remain unresolved. Workflow run `39014701041` validated the bulk-import boundary at commit `e0ea70a2753265192354221873ee181e75096e96`: `npm ci`, all **13/13 tests**, changed-file ESLint, Deno lint, Deno type-check, and the Vite production build passed. The final quality gate still failed because full-repository lint reports **102 errors** and the dependency audit reports **34 advisories (1 low, 13 moderate, 20 high)**. The earlier run `39014607421` caught six Deno type errors in the new endpoint; those were corrected and the subsequent run passed type-check.

### Funding review boundary follow-up (2026-10-17)

- Added `base44/functions/reviewFundingRequest/entry.ts`, a POST-only authenticated endpoint for approval/rejection. It does not accept client-supplied amounts or balances; the atomic service must resolve the request, amount, account, funding method, and evidence from authoritative records. Approval requires verified funding evidence, enforces pending state/revision in the provider transaction, prevents negative balances, and requires an audit record plus notification outbox.
- `src/pages/operations/VerificationRequests.jsx` now calls the endpoint for individual and bulk decisions. Idempotency scope is fingerprinted, the same key is reused for retries, and the key is cleared only after the response confirms request ID, final state, operation ID, and audit record. Bulk requests are individually atomic; the UI reports partial success rather than claiming the whole batch succeeded.
- The provider remains unconfigured, so the endpoint returns a fail-closed unavailable response until the authoritative transactional service is provisioned. Opening contributions must be backed by verified evidence; the UI cannot assert that evidence exists.

### Withdrawal processing boundary follow-up (2026-10-17)

- Added `base44/functions/processWithdrawalRequest/entry.ts`, a POST-only authenticated endpoint for paying or rejecting pending withdrawal requests. The endpoint accepts no amount or balance fields; the atomic provider must load authoritative request/account state, enforce expected revision and pending status, verify sufficient funds, and confirm payout before returning a `paid` state. It must persist ledger/request/audit updates and notification outbox atomically.
- `src/pages/admin/AdminWithdrawals.jsx` now routes single and bulk pay/reject operations through the server endpoint with a fingerprinted idempotency scope. A paid response is accepted only when the same operation ID and audit confirmation are returned and `payout_confirmed` is true. Non-financial triage actions retain their existing audit path; they do not process ledger state.
- The provider remains unconfigured. Successful settlement remains blocked until an authoritative transactional service and payout-confirmation contract are provisioned and verified.

### Account status mutation boundary follow-up (2026-10-17)

- Added `base44/functions/setAccountStatus/entry.ts` for account freeze/unfreeze. It authenticates the caller, requires a UUID idempotency key and expected revision, and delegates the state transition, audit, and notification outbox to the atomic service. The provider must resolve the account authoritatively and enforce the expected status/revision within its transaction.
- Operators with an allowed financial-review role may freeze or unfreeze accounts. A member may only request a freeze; the provider must verify account ownership and reject member unfreeze attempts. Browser-supplied account ownership is not trusted.
- `QuickActionsMenu.jsx` now routes freeze/unfreeze through the endpoint. Its direct balance-adjustment action was removed rather than leave separate transaction/account writes in the browser. `FloatingCommandDock.jsx` now routes member self-freeze through the same endpoint and no longer writes account status, zero-value transactions, notifications, or audit events separately.
- The provider remains unconfigured, so successful status changes are blocked until its atomic account-status contract is provisioned and verified.


### Member withdrawal initiation boundary follow-up (2026-10-17)

- Added `base44/functions/createWithdrawalRequest/entry.ts`, a POST-only authenticated endpoint restricted to member-role actors. It validates a positive cent-precise amount, a supported withdrawal method, bounded notes, a revision token, and UUID idempotency key.
- The endpoint delegates to the atomic service, which must authoritatively verify account ownership, active status, approved KYC, current revision, available funds including pending withdrawal reservations, applicable withdrawal limits, and supported method. The provider must create the pending request and persist audit plus notification outbox in one transaction.
- `src/pages/AccountDetail.jsx` no longer creates withdrawal requests or notifications directly from the browser. It accepts success only when the operation ID, audit confirmation, member/account identity, amount, method, pending state, and updated revision match. The idempotency key is retained on errors/uncertain outcomes; after confirmed success, the UI refreshes best-effort without misreporting a committed request as failed.
- The endpoint fails closed while the atomic provider is unavailable. This change does not claim a successful production withdrawal request or verify provider behavior.


### Member account provisioning boundary follow-up (2026-10-17)

- Added `base44/functions/createMemberAccount/entry.ts`. The endpoint requires authentication, a permitted financial-review role, an idempotency envelope, a target-member revision, a supported account type, and a bounded account name. It delegates account creation to the atomic service; the provider must verify the target is a current member, generate a unique account number server-side, create the account with exactly zero balance, and commit audit plus notification outbox atomically.
- `src/pages/admin/AdminMembers.jsx` now invokes the endpoint instead of creating accounts, opening-balance transactions, notifications, emails, and audit records as separate browser operations. Positive opening balances are removed from the UI; all new accounts start at zero and funding must use the verified funding workflow. The client accepts success only after operation ID, audit confirmation, target user, account type, zero balance, account number, and revision are validated.
- Direct browser-side member deletion was disabled. The previous loop deleted transaction history and accounts before deleting the user, creating irreversible partial-deletion risk and potentially destroying records needed for financial reconciliation and compliance. Re-enable deletion only through an explicitly approved retention-safe archival/deletion workflow with authoritative checks and atomic audit.
- The atomic provider remains unconfigured; account provisioning therefore fails closed with no account created until the provider contract is implemented and verified.
- `src/pages/AccountDetail.jsx` now uses `setAccountStatus` for admin freeze/unfreeze instead of direct `Account.update`. It checks current status/revision, reuses a fingerprinted idempotency key, requires server confirmation of the resulting status and audit record, and does not report a failed mutation solely because refreshing the page fails.

### Admin account mutation follow-up (2026-10-17)

- Added `base44/functions/createAdminTransaction/entry.ts` for operator-initiated deposits/withdrawals. The provider must check account revision and active status, verify deposit funding evidence, enforce sufficient funds for withdrawals, compute the resulting balance server-side, and commit transaction + account state + audit + notification outbox atomically.
- `src/pages/admin/AdminAccounts.jsx` no longer creates transactions, updates account balances, creates notifications, or writes its own audit/email side effects for manual ledger entries. It validates the provider response and retains the idempotency key unless the result is confirmed.
- Account freeze/unfreeze now uses `setAccountStatus` with the expected status, revision, and idempotency key.
- CSV imports now validate rows and use `bulkImportTransactions` instead of sequential browser-side transaction creation. The UI accepts only deposit/withdrawal rows; adjustments/opening balances are explicitly rejected until a dedicated verified workflow exists. CSV quoted commas are parsed, malformed rows fail the whole client-side validation, and provider-side import semantics remain all-or-nothing.
- Added a regression test and included the endpoint in CI Deno lint/type-check coverage. These changes remain fail-closed until the atomic provider is configured.

### Latest validation status

- Workflow run [39059354189](https://github.com/iamtheoracle/vantoriss/actions/runs/39059354189), at commit `92d315385ffdb46e6c56809211f919d3966f5e99`, passed **22/22 financial-mutation tests**, changed-UI ESLint, Deno lint, Deno type-check, the full-repository lint, and the Vite production build.
- The run failed only the final repository quality gate because `npm audit --audit-level=high` still reports **34 advisories (1 low, 13 moderate, 20 high)**. The 91 unused-import lint errors reported in the prior run have been removed; full-repository lint now passes.
- A subsequent dependency-remediation change must update the locked dependency tree without using force upgrades, then rerun the complete audit, tests, lint, type-check, and production build. The current lockfile has not been changed as part of this lint cleanup.
- The atomic mutation provider remains unconfigured. All successful financial mutations are therefore blocked until the provider is implemented, configured, and verified. No production financial mutation was executed and PR #8 remains draft/unmerged.
