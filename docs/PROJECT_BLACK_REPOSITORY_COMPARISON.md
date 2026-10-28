# Project Black — Repository Comparison Report

**Compared:** `iamtheoracle/vantoris-credit-union` vs `iamtheoracle/vantoriss`  
**Comparison date:** 2026-10-28  
**Scope:** Git tree comparison, package manifests, recent commit history, and selected product/auth/payment/provider files. This is not a full runtime or security audit.

## Executive decision

**Recommended canonical starting repository: `vantoriss` — provisionally.**

Use `vantoriss` as the unified VANTORIS platform shell and selectively port useful, reviewed member-finance/product features from `vantoris-credit-union`. Do not merge blindly and do not activate real-money operations based on either repository's current account/transaction implementation.

Why:
- `vantoriss` is the older, broader Vantoris application base and is the more neutral product identity for the combined ecosystem.
- It has the slightly newer Base44 SDK/plugin versions in its package manifest.
- `vantoris-credit-union` contains valuable additional member-facing and operator features, but its recent commits explicitly reframe the app as a credit union. That brand and legal implication is not the agreed umbrella direction for VANTORIS X.
- Both repositories share most of their tree, so a full merge would create unnecessary conflict and duplicate work.
- The credit-union repo contains additional real-money-looking flows and operator approval UI, but the reviewed code still uses client-side mutable-balance posting patterns that must not be trusted for production money movement.

This is a provisional codebase recommendation, not a declaration that `vantoriss` is production-ready or that either Base44 app has the correct live deployment identity. Confirm Base44 app IDs, deployments, ownership and environment configuration before migration.

## 1. Measured repository overlap

GitHub recursive trees at `main` returned:

| Measure | `vantoris-credit-union` | `vantoriss` |
|---|---:|---:|
| Tracked tree entries | 540 | 505 |
| Shared paths | 497 | 497 |
| Paths with identical Git object SHA | 463 | 463 |
| Shared paths with differing SHA | 34 | 34 |
| Paths only in this repository | 43 | 8 |

The trees have **497 shared paths**; 463 of those have identical Git object SHAs. That is strong evidence of substantial copied/shared code, but not enough by itself to prove that the repositories have the same runtime backend, Base44 app identity, deployment or data.

### Paths found only in `vantoris-credit-union` (43)
- Netlify/server integrations: `netlify/functions/ask.mjs`, `netlify/functions/market.mjs`, `server/llm-proxy.mjs`
- Member and provider helpers: `src/lib/memberActions.js`, `src/lib/notifyOperators.js`, `src/lib/platformFulfill.js`, `src/lib/privateLlm.js`, `src/lib/providers/index.js`, `src/lib/superCommand.js`
- Product/discovery pages: `Discover.jsx`, `DiscoverFX.jsx`, `DiscoverFlights.jsx`, `DiscoverHousing.jsx`, `DiscoverMarketing.jsx`, `DiscoverNGO.jsx`, `DiscoverNews.jsx`, `Landing.jsx`, `MemberQR.jsx`, `Transactions.jsx`, `src/pages/product/*`
- Operations/member screens: `src/pages/operations/Approvals.jsx`, `HeroBoxFundsShipping.jsx`, plus other pages and brand assets.
- `.env.example` and Netlify configuration/deployment additions.

### Paths found only in `vantoriss` (8)
- `src/components/vantoris/ProviderUnavailableCard.jsx`
- `src/components/vantoris/home/DashboardModules.jsx`
- `src/components/vantoris/home/PrimaryActions.jsx`
- `src/lib/providers/registry.js`
- `src/pages/Cards.jsx`, `Homes.jsx`, `News.jsx`, `Travel.jsx`

### Important shared paths that differ (34)
The shared-but-different set includes `package.json`, `package-lock.json`, `src/App.jsx`, `src/lib/AuthContext.jsx`, `src/pages/MoveMoney.jsx`, `src/pages/Login.jsx`, `src/pages/Register.jsx`, navigation/layout components, provider components, and operations components. These require deliberate reconciliation rather than choosing whole files by filename.

## 2. Package and tooling comparison

- Both are Vite + React + Base44 SDK apps.
- `vantoris-credit-union`: `@base44/sdk ^0.8.52`, `@base44/vite-plugin ^1.0.44`; includes extra `llm` and `launch` scripts for its Node proxy.
- `vantoriss`: `@base44/sdk ^0.8.54`, `@base44/vite-plugin ^1.0.47`; has the simpler Vite scripts.
- Both define `build`, `lint`, and `typecheck` scripts.
- No build, lint, typecheck, or automated test suite was run as part of this remote source comparison. Package version numbers alone do not prove that the newer tree is more correct.

## 3. Functional comparison

### `vantoriss` strengths
- Broader neutral Vantoris application base and earlier history.
- Shared entity/agent/connector/workflow architecture.
- Existing provider registry that documents when product providers are unavailable.
- Slightly newer Base44 dependencies.
- Better starting identity for the larger ecosystem than a product specifically branded as a credit union.

### `vantoris-credit-union` strengths
- Additional member-facing discovery, FX/news/travel/housing, QR, transaction and product-shell pages.
- Extra operator approval and HeroBox operations surfaces.
- Member assistant command handling and helper functions.
- Explicit provider boundary comments, including acknowledgement that external payment rails are not connected.
- Additional Netlify and Node proxy functions that may be useful after review.

### Functional gaps in both
- Neither repo comparison proves that real banks, payment rails, card issuers, FX liquidity providers, trading venues, investment custodians, or marketplace settlement providers are connected.
- A provider marked “connected” may mean only that an internal Base44 entity exists; it does not establish that an external provider is live.
- Provider status labels should be evidence-based and consistent. Internal record storage must not be confused with external settlement.
- Full identity/permission testing, Base44 entity access rules, deployment identity, and environment variable validation remain outstanding.

## 4. Critical finance finding: do not migrate the balance-writing pattern

In `vantoris-credit-union/src/pages/operations/Approvals.jsx`, the reviewed approval path:
1. Reads a transaction and its account.
2. Calculates the next balance in the browser.
3. Calls `Account.update`.
4. Separately calls `Transaction.update`.

In `vantoris-credit-union/src/pages/MoveMoney.jsx`, deposit/send requests create pending Transaction records directly through the client. The user-facing message says approval is pending, but that is only a request/approval workflow; it is not evidence of external payment execution.

In `base44/entities/Account.jsonc` and `Transaction.jsonc`, the visible model uses a mutable numeric account balance and transaction amount/balance-after fields. The reviewed schema does not demonstrate an immutable double-entry journal with atomic postings.

**Required before production:**
- One server-authoritative posting command, with server-side capability checks.
- Immutable double-entry journal entries, explicit currency and decimal-safe amounts.
- Idempotency keys and concurrency/locking protection.
- Atomic posting and transaction state changes.
- Reversal entries rather than editing posted financial history.
- Clear separation of pending, available, reserved, settled, failed, reversed and disputed funds.
- Provider webhooks, settlement reconciliation and replay protection.
- Automated tests for duplicate, concurrent, partial-failure and unauthorized attempts.

Treat existing account/transaction records as legacy UI/application records until they are migrated and reconciled. Do not call them a production ledger merely because the UI displays balances.

## 5. Identity and legal presentation

- The repo named `vantoris-credit-union` is newly created in October 2026 and has recent commits titled “Rebuild as credit union membership and remove demo” and “Vantoris Credit Union membership build”.
- A repository name or interface does not prove that the operator is a chartered credit union, bank, deposit-taking institution, licensed payment institution, or that customer balances are protected by deposit insurance.
- Keep the unified VANTORIS X brand neutral until the legal entity and authorised operating model are confirmed.
- Keep demo/test data clearly labelled and technically isolated from production.
- Validate the identity model: immutable internal user ID, public username, authentication credential, financial account identifier, and organisation identity must be separate fields/concerns.

## 6. Migration plan

### Keep from `vantoriss`
- Existing shared app shell and neutral Vantoris branding, after reviewing route consistency.
- Base44 agent, connector, workflow, entity and registry definitions after permission/runtime validation.
- Its current provider-unavailable UI components and product screens, ensuring “connected” means the actual provider is available.

### Selectively port from `vantoris-credit-union`
- Discovery/product pages that fit the new roadmap.
- QR and transaction history UX.
- Member assistant parser/workflows, only after command authorization and server-side actions are hardened.
- Operator approval UI as a presentation layer only; replace client-side financial posting with a server-side command.
- Useful server/Netlify functions after reviewing secrets handling, authentication, rate limits, SSRF, CORS and deployment requirements.
- Provider truthfulness patterns and unavailable-state UX.

### Do not port unchanged
- Client-side account balance mutation.
- Exports that hardcode transaction status or approval state.
- Any “connected” status implying external financial connectivity without evidence.
- Any legal/marketing claim that implies a charter or licence not confirmed.
- Server proxy functions until authentication, authorization, origin controls, input validation, timeouts, abuse controls and secrets are reviewed.

## 7. Immediate implementation order

1. Verify the two repositories' Base44 app IDs and deployment relationships from non-secret configuration.
2. Create a route/file feature matrix and mark each route as shared-identical, shared-different, unique, UI-only, provider-backed, or unverified.
3. Establish the canonical branch and preserve the other repository as a read-only migration source.
4. Implement and test the authoritative ledger/posting boundary before enabling financial writes.
5. Correct status exports and transaction state transitions.
6. Port the highest-value discovery, commerce, member, and operations features in small reviewed commits.
7. Run `npm ci`, build, lint, typecheck, tests, and security scans in a controlled environment; document actual results.
8. Only then plan EU-first integrations and independent US/Asia launch gates.

## Evidence and limits

Public GitHub tree and source paths inspected:
- https://github.com/iamtheoracle/vantoris-credit-union
- https://github.com/iamtheoracle/vantoriss
- https://github.com/iamtheoracle/vantoris-credit-union/blob/main/src/pages/operations/Approvals.jsx
- https://github.com/iamtheoracle/vantoris-credit-union/blob/main/src/pages/MoveMoney.jsx
- https://github.com/iamtheoracle/vantoris-credit-union/blob/main/src/lib/providers/index.js
- https://github.com/iamtheoracle/vantoriss/blob/main/src/lib/providers/registry.js

This report is a repository-level comparison, not a live application test, Base44 backend inspection, penetration test, financial audit, or regulatory approval.
