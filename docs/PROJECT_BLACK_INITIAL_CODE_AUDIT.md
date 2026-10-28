# Project Black — Initial Source Audit

**Scope:** Read-only review of selected source files in `vantoris-credit-union` and structural comparison with `vantoriss`.  
**Branch for planning artifacts:** `project-black/unified-inventory` in `iamtheoracle/vantoriss`.  
**Status:** Initial findings only; not a complete penetration test, runtime test, or production certification.

## Executive summary

The repositories already contain substantial product UI and domain concepts: account onboarding, account views, money requests, operator approvals, FX discovery, marketplace/service concepts, AI agents, connectors, workflows, audit screens, reporting, and operations dashboards.

The most important finding is that the visible account/transaction model is not yet a production-grade financial ledger architecture. The inspected schema stores a mutable numeric balance on an Account record and transaction records with numeric amounts and a `balance_after` field. The reviewed approval UI calculates a new balance in the client and then issues separate Account and Transaction updates. This is vulnerable to race conditions and partial failure unless protected by stronger server-side guarantees not demonstrated in the reviewed files. It does not show double-entry journal postings, currency-scoped ledger accounts, immutable entries, or atomic posting.

**Do not connect real customer funds to this path until the posting model is redesigned and independently reviewed.**

## Priority findings

### P0 — Financial posting is client-orchestrated
Evidence:
- [MoveMoney.jsx](https://github.com/iamtheoracle/vantoris-credit-union/blob/main/src/pages/MoveMoney.jsx) creates pending Transaction records directly through the Base44 client for deposit/send requests.
- [Approvals.jsx](https://github.com/iamtheoracle/vantoris-credit-union/blob/main/src/pages/operations/Approvals.jsx) computes a new account balance in the browser, calls `Account.update`, then calls `Transaction.update` separately.

Risks:
- Two approvals may read the same old balance and overwrite one another.
- Account update may succeed while transaction status update fails, or vice versa.
- The browser is coordinating a financially consequential state transition.
- The reviewed path does not show an atomic transaction, immutable journal, idempotency key, authoritative provider event, or reconciliation requirement.

Required correction:
- Route all posting decisions through a server-side command/function with strict actor/role/capability checks.
- Validate transaction state and account ownership/status server-side.
- Enforce idempotency and optimistic/serializable concurrency protection.
- Atomically append balanced debit/credit journal entries and update any derived balance projection in one database transaction.
- Make posted journal entries immutable; correct errors with reversal entries.
- Return an authoritative transaction state and notify only after persistence succeeds.
- Add concurrent-approval, duplicate-request, partial-failure, insufficient-funds, replay, and reversal tests.

### P0 — Current Account/Transaction schemas are insufficient as the authoritative ledger
Evidence:
- [Account.jsonc](https://github.com/iamtheoracle/vantoris-credit-union/blob/main/base44/entities/Account.jsonc) has a mutable `balance: number` field and account metadata.
- [Transaction.jsonc](https://github.com/iamtheoracle/vantoris-credit-union/blob/main/base44/entities/Transaction.jsonc) has `amount: number`, `balance_after`, a transaction type/status, and no visible debit/credit journal-line model or currency field.

Required correction:
- Treat existing records as a legacy application/transaction-request model until mapped and verified.
- Introduce ledger accounts and immutable journal entries with explicit currency, debit/credit direction, posting timestamp, source event, actor, idempotency key, correlation/provider reference, and reversal linkage.
- Keep available, pending, reserved, and settled funds distinct.
- Use decimal-safe integer minor units or a proven decimal type with currency-specific scale rules.
- Reconcile provider balances and statements; never infer settlement from UI status.

### P1 — Transaction export hardcodes success-like statuses
Evidence:
- [exportTransactionLedger/entry.ts](https://github.com/iamtheoracle/vantoris-credit-union/blob/main/base44/functions/exportTransactionLedger/entry.ts) sets exported `Status` to `completed` and `Approval Status` to `approved` for each exported transaction rather than deriving those values from the source record.

Risk:
- Reports can misrepresent pending, failed, declined, or reversed transactions as completed and approved.

Required correction:
- Export the actual validated source state.
- Fail closed or emit an explicit unknown state when source status is missing/invalid.
- Add fixtures for every transaction status and assert the export preserves the status exactly.
- Add export reconciliation checks against the underlying source records.

### P1 — Bulk import changes balances without an idempotency contract
Evidence:
- [bulkImportTransactions/entry.ts](https://github.com/iamtheoracle/vantoris-credit-union/blob/main/base44/functions/bulkImportTransactions/entry.ts) authenticates and checks `user.role === 'admin'`, then creates a Transaction and separately updates the Account balance for each imported row.

Risks to address:
- Re-importing the same file/rows may post duplicates if no upstream deduplication exists.
- A partial failure can leave some rows posted and later rows skipped, requiring a durable import batch and resumable state.
- The function uses the same mutable balance pattern and `number` arithmetic as the UI path.

Required correction:
- Use a durable import batch ID, row hash/source reference, duplicate detection, preview/approval, bounded batch sizes, and a resumable status model.
- Post each accepted row through the same authoritative ledger command.
- Make the import idempotent and produce a reconciliation report for created, skipped, rejected, and reversed rows.
- Review admin role mapping and capability-level permission checks server-side.

### P1 — Two near-duplicate application repositories require canonical selection
Evidence:
- [vantoris-credit-union](https://github.com/iamtheoracle/vantoris-credit-union) and [vantoriss](https://github.com/iamtheoracle/vantoriss) have closely overlapping Base44 entities, agents, connectors, workflows, libraries, and page architecture.
- The credit-union repo currently exposes additional files/routes such as FX/news discovery, a product shell, extra operator tooling, member actions, and Netlify functions that were not present in the equivalent top-level inventory of `vantoriss`.

Required correction:
- Compare the complete source trees, commit histories, Base44 app identity/configuration, entity permissions, backend functions, deployment settings, and runtime behavior.
- Select one canonical product repo only after that comparison.
- Keep the other repository intact and document the migration mapping; do not merge both blindly.

### P1 — The market-rate endpoint is reference data, not executable FX pricing
Evidence:
- [market.mjs](https://github.com/iamtheoracle/vantoris-credit-union/blob/main/netlify/functions/market.mjs) fetches ECB-derived rates via Frankfurter and business headlines from a public RSS feed.

Interpretation:
- Useful for indicative information and product discovery.
- It does not demonstrate executable customer quotes, provider liquidity, spread/fee disclosure, quote expiry, conversion execution, settlement, or FX reconciliation.

Required correction:
- Keep reference rates clearly labelled and timestamped.
- Build X FX Exchange with contracted provider adapters, executable quote IDs, expiry, transparent fees/spreads, idempotent conversion execution, provider event handling, and reconciliation.
- Keep X Markets' trading feed, order management, margin, and trade ledger separate.

### P2 — Financial product presentation must not overstate actual capabilities
Evidence:
- [American-Vanguard-credit-union README](https://github.com/iamtheoracle/American-Vanguard-credit-union/blob/main/README.md) explicitly labels that repository as a fictional local-only demo with sample data and no real bank connection or money movement.
- The Vantoris repositories use account/credit-union terminology and expose account and transaction interfaces; the actual licensed entity/provider arrangement was not established in this audit.

Required correction:
- Keep demo/sample data visually and technically separated from production.
- Do not claim chartered-credit-union status, deposit insurance, real balances, licensed payments, cards, or settlement without evidence.
- Confirm legal ownership and approved operating model before publishing regulated-product claims.

## Confirmed useful building blocks

- React/Vite/Base44 app surface and shared UI components.
- Member authentication context and protected-route patterns (must be reviewed for server-side enforcement).
- Operator approval, audit log, security/compliance, feature flags, system health, integration, and reporting screens.
- Base44 entities for users, organisations, accounts, transactions, verification, documents, notifications, recommendations, and cases.
- Agent definitions for command, communications, compliance, finance, intelligence, markets, operations, portfolio, risk, security, and support.
- Connectors currently listed for GitHub, Google Sheets, and Slack bot.
- Workflows for application/KYC notifications, discovery freshness, news monitoring, and transaction export.

These are building blocks, not proof that each integration or agent is production-ready.

## Next implementation sequence

1. **Freeze real-money activation** for paths relying on mutable account balances until the ledger correction is reviewed.
2. Compare the two repositories and identify the canonical codebase.
3. Map all direct writes to Account, Transaction, PaymentCard, WithdrawalRequest, InvestmentTransaction, and related financial entities.
4. Define the ledger schema, state machine, permissions, idempotency, concurrency, reversals, provider events, and reconciliation contract.
5. Implement one server-side posting command and migrate the approval/import flows to use it.
6. Correct exports so statuses reflect authoritative records.
7. Add automated tests for authorization, duplicate execution, concurrency, partial failure, balance invariants, and reconciliation.
8. Continue feature inventory for commerce, community, premium tiers, FX Exchange, professional Markets, and AI workflows.
9. Run build, lint, typecheck, and test suites from the chosen canonical repo; report actual results rather than assuming success.

## Audit limitation

This review is based on selected GitHub source files and repository listings. It did not run the application, query the live Base44 environment, inspect private runtime configuration, verify entity-level permissions in the hosted backend, execute tests, conduct a penetration test, or confirm any licence/provider contract. Findings identify concrete code patterns and required verification, not a certification of the full system.
