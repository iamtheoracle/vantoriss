# Account write authorization audit

## Scope and evidence

Reviewed the PR #15 head `7c939a64ef46870fa562b6305f032d80cf4f0822` in:

- `base44/entities/Account.jsonc`
- `base44/functions/generateAccount/entry.ts`
- `base44/functions/bulkImportTransactions/entry.ts`
- `src/lib/operationsAccess.js`
- `src/lib/ledgerImport.js`

This is a source review only. No Base44 runtime, staging, production data, or live entity policy was exercised.

## Findings

### 1. Account entity create/update policy is broader than the capability matrix

The Account entity RLS create and update clauses enumerate these staff roles:

`admin`, `administrator`, `super_administrator`, `operations_officer`, `operations_manager`, `compliance_officer`, `executive`, `finance_officer`, `kyc_officer`, `treasury_officer`, `investment_officer`, `investment_manager`, `auditor`, `risk_officer`, `it_administrator`, `customer_support`, `herobox_manager`, `volunteer_manager`, and `shipping_manager`.

The canonical matrix in `src/lib/operationsAccess.js` does not grant all these roles account/operations management capabilities. For example, customer support, HeroBox, shipping, risk, and investment roles have no `management.operations.manage` capability. Several listed management roles have view/review capabilities but not general operations management. The static RLS allowlist therefore does not enforce capability-level least privilege.

The same static policy also cannot express the configured super-admin email exception in `isSuperAdmin(user)`. Policy parity is not proven.

### 2. Account-generation endpoint uses a separate role allowlist

`generateAccount/entry.ts` allows `admin`, `administrator`, `super_administrator`, `operations_officer`, `operations_manager`, `finance_officer`, and `treasury_officer`.

That list is not derived from the permission matrix. In particular, `operations_officer` and `finance_officer` do not have `management.operations.manage`; `treasury_officer` has adjustment and withdrawal-approval capabilities but not general operations management. There is no dedicated account-opening capability in the current registry. Do not silently map account opening to a broader capability; define and approve the intended capability and role assignment before changing this endpoint.

The endpoint verifies the target member, restricts account types, rejects non-zero opening balances, and checks an optional approved application. However:
- Account-number collision checking inspects only the latest 500 accounts.
- The code does not demonstrate a database uniqueness constraint or atomic collision retry.
- Account creation, notification creation, and audit creation are separate writes; partial completion can leave an account without its notification or audit record.
- It hardcodes routing number `021000021` and describes it as the Vantoris institutional routing number. No evidence in this repository review establishes that this number is assigned to Vantoris. Treat this as an unverified institutional identifier; do not represent it as live or valid without authoritative allocation evidence.

### 3. Bulk transaction import has authorization, attribution, and consistency gaps

`bulkImportTransactions/entry.ts` checks only `user.role === 'admin'`, rather than a capability derived from the canonical matrix. It fetches only 500 recent accounts, accepts account numbers from the import rows, calculates balances in application code, and writes each Transaction and Account balance in separate service-role calls. A failure after transaction creation but before Account update can leave inconsistent records. The created Transaction does not explicitly store a server-derived owner field. The audit write occurs after the loop and is also separate.

No dedicated transaction-import capability currently exists. Do not widen access by substituting a generic operations capability without an explicit permission decision.

### 4. Historical ledger import remains a direct client write path

`src/lib/ledgerImport.js` creates the statement, bulk-creates transactions, updates the Account closing balance, and writes an audit entry as separate client-side operations. The flow is not atomic and does not establish a server-verified owner attribution at the Transaction boundary.

## Required decisions and remediation order

1. Define explicit, operation-specific capabilities for account opening, transaction import, historical statement import, manual adjustment, deposit posting, withdrawal posting, and account metadata maintenance. Confirm role assignments against separation of duties; do not infer them from broad domain membership.
2. Replace static Account RLS staff allowlists with a platform-supported least-privilege policy. If Base44 cannot express capability-level or field-level authorization in entity RLS, move sensitive writes behind authenticated backend functions and restrict direct entity writes accordingly.
3. Verify the institutional routing identifier from authoritative allocation evidence before exposing it. Until verified, do not claim the hardcoded value is Vantoris's live routing number.
4. Enforce account-number uniqueness at the authoritative persistence layer and make generation collision-safe across the full account population.
5. Make account creation, notification intent, and audit attribution recoverable and idempotent; do not claim a multi-call sequence is atomic.
6. Move all Transaction and Account balance writers behind server-side authorization, derive owner from the verified Account record, and use an atomic transaction boundary or documented recoverable state machine.
7. Add negative tests for every role/capability boundary, forged member/account identifiers, duplicate account-number retries, and partial failures. Test Base44 entity RLS and backend behavior in staging before deployment.

## Status

- **Current:** source-level findings above; existing PR CI validates the configured repository checks.
- **Not verified:** Base44 RLS evaluation, account-number uniqueness constraint, routing-number allocation, transactional guarantees, runtime authorization, and staging/member-isolation behavior.
- **Deferred:** code changes to role mappings, Account RLS, account generation, and import writers pending explicit operation-capability definitions and platform transaction/RLS evidence.
- **No deployment or live permission changes:** none performed.


## Follow-up source inventory — direct Account and Transaction mutation paths

Reviewed the current PR branch implementations for the following paths. These findings do not establish whether Base44 RLS permits each call at runtime.

| Path | Direct mutation found | Security / integrity consequence |
|---|---|---|
| `src/pages/admin/AdminMembers.jsx` | Client creates Account with caller-supplied opening balance, then creates an opening-balance Transaction; member deletion attempts `Transaction.deleteMany`, `Account.delete`, then `User.delete`. | Separate writes can partially succeed. Permanent financial-history deletion is attempted from a client workflow; Account delete policy is currently false, but actual denial and partial-failure behavior are untested. Replace with controlled archival/deactivation and immutable financial records. |
| `src/pages/admin/AdminApplications.jsx` | Client creates Accounts and opening Transactions in application approval flows. | Account-opening authority and initial ledger posting are enforced in client code rather than one server-authorized workflow. |
| `src/pages/AccountDetail.jsx` | Client attempts to update Account status when freezing/unfreezing. | Status changes share the broad Account update policy with balance/metadata changes; field-level distinction and member-side authorization are unverified. |
| `src/pages/admin/AdminAccounts.jsx` | Client creates/edits accounts and updates balance snapshots after creating transactions. | Multiple writes can partially succeed; client can directly mutate Account state. |
| `src/pages/admin/AdminWithdrawals.jsx` | Client creates withdrawal Transaction, updates Account balance, and updates WithdrawalRequest status in separate calls. | A failure between calls can leave ledger, balance, and request state inconsistent. |
| `src/pages/operations/VerificationRequests.jsx` | Client creates deposit/opening Transaction, updates Account balance, and updates VerificationRequest status in separate calls. | Approval and posting need one server-controlled lifecycle. |
| `src/components/vantoris/QuickActionsMenu.jsx` | Client creates adjustment Transaction, updates Account balance, and sends notification separately. | Consequential adjustment has no single atomic server boundary in this path. |
| `src/components/vantoris/FloatingCommandDock.jsx` | Client updates Account status and creates a Transaction during the freeze flow. | Freeze action and transaction record are split; do not invent a financial movement for a status-only event. |
| `src/components/vantoris/HistoricalStatementImport.jsx` | Client creates HistoricalStatement and bulk-creates historical Transactions using the selected account ID; it intentionally does not update current Account balance. | Server must verify actor access, derive owner from Account, preserve source-document linkage, and prevent duplicate imports. |
| `src/pages/operations/BulkTransactionImport.jsx` | Client bulk-creates Transaction rows. | Bypasses a central server-side validation and attribution boundary. |
| `src/lib/ledgerImport.js` | Client creates HistoricalStatement, bulk-creates Transactions, updates Account closing balance, then writes AuditLog. | Separate writes can partially complete; ownership and audit attribution need server verification. |

### Additional required controls

- Do not use client-side cascading deletion for member financial records. Define member closure/deactivation, account closure, retention, legal hold, and audit-preserving archival as separate authorized lifecycle operations.
- Treat account status changes, account metadata changes, and balance changes as separate capabilities and server-side operations.
- For every migrated operation, verify actor, capability, target account/member, transaction status, amount/sign, idempotency key, and approval state on the server. Derive account owner from the verified Account record.
- Add failure-injection tests at every multi-step boundary and prove retries cannot double-post or leave an untraceable partial state.
- Until these paths are migrated and staging-tested, Account create/update RLS and Transaction client write access remain unresolved security boundaries.
