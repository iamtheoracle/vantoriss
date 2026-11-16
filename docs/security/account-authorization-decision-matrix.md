# Account authorization decision matrix — founder review required

## Status and change boundary

- **Status:** proposal only; no authorization has been changed.
- **Source baseline:** `src/lib/operationsAccess.js` on PR #15 head `4e14fcb57b78f33b0113053f95c87adbcf21dedb`.
- **Related evidence:** `base44/entities/Account.jsonc`, `base44/functions/generateAccount/entry.ts`, `base44/functions/bulkImportTransactions/entry.ts`, and `docs/security/account-write-authorization-audit.md`.
- **No permission, RLS, entity, endpoint, data, automation, or deployment changes are included in this proposal.**
- Every candidate assignment below is a recommendation for founder decision, not an approved grant. Existing permissions remain unchanged until explicitly approved.

## 1. Existing role-to-capability baseline

The canonical matrix currently defines these role groups. This table summarizes the current matrix; it does not claim that the corresponding Base44 entity RLS matches it.

| Existing role | Current capability scope relevant to this review |
|---|---|
| `super_administrator` | All registered capabilities; super-admin exception authentication is documented for exclusive system capabilities. |
| `admin`, `administrator`, `executive` | Broad Management: customer, operations, KYC and compliance capabilities, including operational correction, withdrawal approval and adjustment management. |
| `operations_manager` | Customer view/manage; operations view/manage/review/correct; ordinary withdrawal approval. No adjustment-management capability in the current mapping. |
| `operations_officer`, `finance_officer` | Operations view/review and ordinary withdrawal approval. No general operations-manage, correction, or adjustment-management capability. |
| `treasury_officer` | Operations view/review, ordinary withdrawal approval and adjustment management. No general operations-manage capability. |
| `compliance_officer` | Compliance view/manage/escalate and KYC view/review/escalate. |
| `kyc_officer` | KYC view/review/approve/escalate. |
| `auditor` | Operations view/review, KYC view/review and compliance view. |
| `it_administrator` | Operations view/manage in the current matrix; no account-specific capability exists. |
| `risk_officer` | Operations view and compliance view. |
| `customer_support` | Support customer/case view, case management, communication and escalation. |
| `herobox_manager`, `volunteer_manager`, `shipping_manager` | HeroBox-specific catalog, order, fulfillment, destination and refund capabilities as defined per role. |
| `investment_manager`, `investment_officer` | Investment portfolio/transaction visibility and role-specific deposit/withdrawal review or approval; not general Management operations authority. |

## 2. Proposed operation-specific capability registry

The existing matrix does not define account discovery, sensitive-field visibility, account opening, transaction import, historical statement import, deposit posting, withdrawal posting, account-status control, or account-metadata maintenance as separate capabilities. Additions below are proposed identifiers only.

| Proposed capability | Intended server-enforced boundary | Explicitly not included |
|---|---|---|
| `management.accounts.discover` | Find accounts within an authorized operational purpose; return only minimal identifiers needed for that task. | Full account detail, balances, account numbers or routing identifiers. |
| `management.accounts.details.view` | View permitted account profile and member relationship fields. | Balance or full account/routing identifiers unless separately granted. |
| `management.accounts.balance.view` | View balance and permitted balance history for an authorized case/task. | Posting, adjustment or balance mutation. |
| `management.accounts.identifiers.view` | Reveal full account number and routing identifier only where operationally necessary, with access audit. | General account browsing or mutation. |
| `management.accounts.open` | Open an account for a verified eligible member under an approved application/admission workflow. | Non-zero opening balance, ledger posting, or approval of the user's own request. |
| `management.transactions.import` | Import transactions through a server-validated, idempotent and auditable import workflow. | Manual balance correction or approval of imported source data. |
| `management.statements.import` | Import historical statement/source records and linked transactions with deduplication and provenance. | Changing current account balance unless a separate approved reconciliation operation exists. |
| `management.deposits.post` | Post a deposit only after a verified approval/source-state transition. | Approving the deposit request or claiming external settlement. |
| `management.withdrawals.post` | Post an approved withdrawal using an idempotent server-side lifecycle. | Approving the withdrawal or claiming external payment execution. |
| `management.accounts.status.manage` | Freeze, unfreeze or close an account under an audited state transition. | Balance, ledger, owner or account-identifier mutation. |
| `management.accounts.metadata.manage` | Change explicitly permitted non-financial account metadata. | Owner reassignment, identifiers, balance, status or ledger entries. |
| `management.accounts.archive` | Controlled account/member archival with retention, legal-hold and immutable-history controls. | Physical deletion of financial history. |

**Separation-of-duties rule:** approval and posting are different actions. Review/view does not imply approval; approval does not imply posting; account management does not imply sensitive-field access. Financially consequential operations must have explicit authorization and approval controls, including dual approval where required by policy.

## 3. Candidate role-to-operation mapping for founder decision

Legend: **Candidate** = reasonable role to consider based on the existing capability domain; **Not proposed** = no grant recommended from current evidence; **Decision required** = current matrix does not resolve the assignment. None of these are active grants.

| Role group | Discover / details | Balance / identifiers | Open account | Transaction / statement import | Deposit / withdrawal posting | Status / metadata | Archive |
|---|---|---|---|---|---|---|---|
| `admin`, `administrator`, `executive` | Candidate, purpose-limited | Decision required; do not inherit automatically | Candidate | Candidate | Decision required; separate from approval | Candidate | Decision required |
| `operations_manager` | Candidate | Decision required | Candidate | Candidate | Decision required | Candidate | Decision required |
| `operations_officer` | Candidate, operational cases only | Decision required | Not proposed by default; current role lacks operations.manage | Decision required | Not proposed by default | Decision required | Not proposed |
| `finance_officer` | Candidate, finance cases only | Decision required | Not proposed by default; current role lacks operations.manage | Decision required | Decision required | Not proposed by default | Not proposed |
| `treasury_officer` | Candidate, treasury cases only | Decision required | Not proposed by default; current role lacks operations.manage | Decision required | Decision required; current adjustment capability is not posting authority | Decision required | Not proposed |
| `compliance_officer`, `kyc_officer` | Not proposed for general account access; use case-linked minimum fields only if approved | Not proposed | Not proposed | Not proposed | Not proposed | Not proposed | Not proposed |
| `auditor` | Candidate, read-only and purpose-limited | Decision required; masked by default | Not proposed | Not proposed | Not proposed | Not proposed | Not proposed |
| `risk_officer` | Not proposed for general account access; case-linked minimal view only if approved | Not proposed | Not proposed | Not proposed | Not proposed | Not proposed | Not proposed |
| `it_administrator` | Not proposed for member financial data | Not proposed | Not proposed | Not proposed | Not proposed | Not proposed | Not proposed |
| `customer_support` | Not proposed for general account access; support-case view only | Not proposed | Not proposed | Not proposed | Not proposed | Not proposed | Not proposed |
| HeroBox roles | Not proposed | Not proposed | Not proposed | Not proposed | Not proposed | Not proposed | Not proposed |
| Investment roles | Not proposed for Vantoris deposit-account data; investment data remains its own domain | Not proposed | Not proposed | Not proposed | Not proposed | Not proposed | Not proposed |
| `super_administrator` | Existing super-admin authority; still require purpose logging, MFA/exception authentication and audit | Sensitive access must be explicitly logged and justified | Candidate, subject to approval controls | Candidate, subject to approval controls | Never bypass approval, dual-control or idempotency safeguards | Candidate, subject to approval controls | Candidate, subject to retention/legal-hold controls |

### Why several cells remain undecided

The current role matrix has no account-specific capabilities. A broad role label or a related capability is insufficient evidence to grant access to member account details, balances, account numbers, routing identifiers, posting, or archival. In particular:

- Existing `management.operations.view` is not proof that a role should see full account numbers or balances.
- Existing `management.operations.manage` is not proof that a role should open accounts, import transactions, post deposits/withdrawals, or archive records.
- Existing `management.operations.correct` and `management.operations.adjustments.manage` do not automatically authorize deposit/withdrawal posting.
- Existing withdrawal approval must remain distinct from withdrawal posting.
- Domain membership in Support, HeroBox, Investment, KYC, Compliance, Risk or IT does not confer general access to member financial data.

## 4. Required enforcement design (not yet implemented)

1. Keep member-owned access isolated by verified server-side ownership; never trust client-supplied `user_id`, account ID, role, amount, status or capability.
2. Derive account ownership from the authoritative Account record on the server.
3. Replace broad static Account read/create/update role lists only after the approved capability model is representable in the platform's actual RLS/authz layer. If it is not, deny direct client writes and use authenticated, purpose-limited backend operations.
4. Mask account/routing identifiers by default; require the dedicated sensitive-identifier capability and audit each reveal.
5. Enforce capability, target ownership, allowed state transition, amount/sign, approval state, idempotency and audit attribution server-side.
6. Make multi-record financial operations atomic in a real supported transaction boundary, or use a documented recoverable state machine with failure-injection and idempotency tests.
7. Keep transaction ownership migration and Transaction RLS disabled until historical attribution is verified and all direct writers are migrated.
8. Replace client-side deletion with controlled archival/closure and retention/legal-hold handling.
9. Prove cross-member negative reads, field-level denials, forged actor/target IDs, replay/idempotency, approval separation and partial-failure recovery in staging before release.

## 5. Founder decisions requested

Please approve or revise the candidate role assignments in Section 3, particularly:

1. Which roles may discover accounts and view account details?
2. Which roles may view balances, and which (if any) may reveal full account/routing identifiers?
3. Which roles may open accounts?
4. Which roles may import transactions and historical statements?
5. Which roles may post deposits and withdrawals, separately from approving them?
6. Which roles may freeze/unfreeze/close accounts, maintain metadata, and archive records?
7. What dual-approval rule applies to account opening, posting, adjustments, closure and archival?

Until these decisions are approved, all existing permissions remain unchanged and the current PR's broad Account RLS is a release blocker, not an approved target state.

## Evidence and status

- Current source baseline reviewed from PR #15 head; the existing capability matrix is the source of truth for current role capabilities.
- Account entity RLS currently grants broad staff-role cross-member reads and create/update access that is not equivalent to that matrix.
- Account generation and transaction import still use separate role checks and non-atomic multi-call writes.
- **No code authorization changes, live permission changes, Base44 execution, staging test, merge or deployment performed.**
