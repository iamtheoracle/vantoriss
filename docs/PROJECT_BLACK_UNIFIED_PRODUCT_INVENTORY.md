# Project Black — Unified Product Inventory

**Status:** Working master blueprint; repository audit in progress  
**Branch:** `project-black/unified-inventory`  
**Product vision:** Vantorix Limited + X Money + Vantoris Platform + Vanguards United + VANTORIS X FX + premium commerce and intelligence  
**Launch strategy:** EU-first, with US and Asia prepared in parallel and enabled independently only after legal, partner, security, operational, and settlement gates are satisfied.

> This document records a proposed product architecture and an initial repository discovery. It does not claim that a financial licence, regulated relationship, production integration, or legal affiliation exists. Product and legal ownership must be confirmed before public launch.

## 1. Brand and product hierarchy

- **Vantorix Limited** — proposed corporate/holding and product-development layer, subject to confirmation of legal ownership and company structure.
- **VANTORIS X** — proposed unified product ecosystem.
- **Vantoris Platform** — shared digital workspace and platform shell.
- **Vanguards United** — community, verified professional network, and opportunity-discovery layer.
- **X Money** — payments, accounts, transfers, merchant collections, payouts, and financial activity interfaces, delivered only through an approved operating model.
- **X FX Exchange** — real-money currency conversion, international payments, and business FX.
- **X Markets** — separate professional FX trading product with independent permissions, risk, execution, and accounting boundaries.
- **X Commerce** — marketplace for physical products, digital products, services, subscriptions, wholesale, and business-to-business procurement.
- **X Wealth** — financial education, analytics, treasury insights, and investment access through appropriately authorised providers.
- **X Intelligence** — scoped AI agents, business intelligence, fraud signals, support, and approved workflow automation.
- **VANTORIS Privé / Black / Signature** — proposed premium tiers; names and benefits require brand and commercial review before launch.

Names such as “Vantorix” and “Vantoris” are intentionally retained as supplied by the project owner. Do not silently normalise spelling or represent separate legal entities as affiliated without confirmation.

## 2. Product principles

1. One coherent experience, not a collection of unrelated dashboards.
2. One identity layer with immutable internal IDs, while keeping public usernames, sign-in credentials, financial account identifiers, and business identities distinct.
3. Shared navigation, design system, notifications, preferences, and integration framework.
4. Separate financial ledger, payment execution, FX conversion, trading/order management, investment records, and compliance case records.
5. Every money-moving action must be authorised server-side, idempotent, risk-checked, recorded, and reconciled.
6. A provider acceptance message is not proof of settlement. Show pending, accepted, settled, failed, reversed, and disputed states accurately.
7. AI may explain, draft, classify, and recommend. It must not invent balances, bypass permissions, approve its own high-risk actions, or write directly to authoritative ledger balances.
8. Premium access must not bypass identity verification, AML/sanctions screening, customer eligibility, suitability, or other mandatory controls.
9. Regional feature flags must be backed by legal-entity, provider, eligibility, and operational checks—not by UI hiding alone.
10. Do not claim “best rate,” “instant,” “insured,” “licensed,” “guaranteed,” or “institutional-grade” unless the statement is substantiated.

## 3. Unified product inventory

### A. Vanguards United — network and opportunities
- Individual, professional, merchant, and business profiles.
- Identity/business verification indicators with explicit status and evidence provenance.
- Search and discovery for people, companies, services, partners, and opportunities.
- Messaging, introductions, collaboration spaces, referrals, and private communities.
- Block, report, mute, moderation, anti-impersonation, and reputation controls.
- Role-aware access for users, business teams, operators, and approved partners.

### B. Vantoris Platform — shared operating environment
- Personal and business workspaces.
- Teams, tasks, documents, calendar, notifications, and messaging.
- Common design system, navigation, accessibility standards, and responsive layouts.
- Connector/plugin registry with permission scopes, health status, and audit trail.
- Workflow builder with approval steps, retries, idempotency, and run history.
- Consumer, merchant, operator, compliance, administrator, and executive experiences.
- API and SDK foundation for approved external integrations.

### C. X Money — payment and account experiences
- Personal/business account views and provider-backed balances.
- Payment initiation, transfers, payment links, QR/payment requests, collections, invoices, and payouts.
- Multi-currency views only where supported and legally appropriate.
- Transaction history, receipts, statements, fee disclosure, and status tracking.
- Refunds, reversals, disputes, payout scheduling, and reconciliation.
- Cards only through an approved issuer/programme and with appropriate card-data scope controls.
- No fake balances or local-only transaction simulations in production paths.

### D. X FX Exchange — real-money conversion
- Currency-pair and jurisdiction eligibility matrix.
- Indicative vs executable quotes, provider timestamps, quote expiry, fees/spread, source amount, target amount, and settlement expectation.
- Provider adapter contracts, health checks, pair/size/country support, liquidity and exposure limits.
- Quote comparison and routing based on eligible executable price, fees, settlement, reliability, and counterparty exposure.
- Explicit quote acceptance, idempotent execution, state machine, provider references, refunds/reversals, and reconciliation.
- Decimal/fixed-point monetary representation; never use binary floating point for authoritative money calculations.

### E. X Markets — professional FX trading
- Separate onboarding, customer classification, permissions, disclosures, and eligibility.
- Market data with timestamp, source, entitlement, and stale-data controls.
- Order management, fills, cancellations, positions, margin, exposure, P&L, statements, and surveillance.
- Separate trading/collateral subledger and clear distinction between collateral, withdrawable funds, realised P&L, and unrealised P&L.
- No silent conversion of a currency-exchange request into a leveraged trade.
- Feature activation only after applicable authorisation or a documented approved partner model.

### F. X Commerce — selling and buying
- Merchant onboarding, verified storefronts, listings, catalogue, inventory, pricing, tax/shipping settings where applicable.
- Physical goods, digital goods, services, subscriptions, wholesale, and B2B procurement.
- Search, curated discovery, saved collections, cart, checkout, orders, fulfilment, returns, refunds, disputes, and seller payouts.
- Premium/curated marketplace with seller eligibility, authenticity policies, prohibited-item rules, clear fees, and buyer protection.
- Commerce settlement must reconcile to payment-provider events and the financial ledger.

### G. X Wealth — financial insights and authorised access
- Budgeting, cash-flow summaries, spending categorisation, business treasury, and currency exposure reports.
- Financial education and scenario tools with assumptions clearly labelled.
- Portfolio analytics and investment access only through the appropriate authorised provider and customer eligibility flow.
- No promises of returns and no personalised regulated recommendations unless the required permissions and controls are in place.

### H. X Intelligence — agents and automation
- Finance, commerce, FX, research, support, fraud-review, and operations agents.
- Each agent has a declared purpose, scoped tools, allowed data, action limits, human-approval requirements, logs, and kill switch.
- High-risk actions require step-up authentication or independent approval.
- Agents may not approve their own fraud cases, change ledger entries directly, reveal data across tenants, or claim external actions succeeded before authoritative confirmation.
- Evaluation, prompt-injection protection, redaction, cost/latency limits, and incident review are release requirements.

### I. Premium tiers — service differentiation
- **Core:** safe essential features.
- **Plus:** advanced personal analytics, organisation tools, and improved support where commercially sustainable.
- **Privé / Black:** optional invitation or eligibility-based premium service, concierge, priority support, curated listings, and enhanced analytics.
- **Signature / Enterprise:** dedicated account management, organisation controls, custom integrations, reporting, support SLAs, and eligible treasury capabilities.
- Premium tier rules, pricing, cancellation, and benefits must be transparent. Premium status never removes regulatory or security requirements.

## 4. Shared platform capabilities

- Identity, authentication, MFA/passkeys, session/device controls, recovery, and immutable internal user IDs.
- Organisations, memberships, roles, scoped permissions, delegation, and separation of duties.
- Double-entry ledger with immutable journal entries, account/currency dimensions, reversals, idempotency keys, and audit history.
- Payments orchestration, provider adapters, webhooks, reconciliation, and settlement reporting.
- Risk and compliance case management, KYC/KYB status, AML/sanctions controls, complaints, retention, and evidence records.
- Feature flags by jurisdiction, legal entity, provider, product, and customer eligibility.
- Notifications, documents, exports, customer support, observability, incident response, backups, and disaster recovery.
- API gateway, rate limits, request signing where appropriate, API versioning, webhook signatures, replay protection, and developer documentation.
- Regional data and deployment boundaries determined by legal analysis; one authoritative ledger per financial account, not conflicting multi-writer ledgers.

## 5. Initial repository discovery — findings, not final audit

### Candidate repositories inspected at a high level

1. [vantoris-credit-union](https://github.com/iamtheoracle/vantoris-credit-union)
   - Vite/React app using the Base44 SDK.
   - Current tree includes member authentication and onboarding, accounts, Move Money, transactions, disputes, KYC, messaging, discovery, FX discovery, product pages, administrative pages, operations pages, integrations, audit logs, approvals, security/compliance, finance, and reporting.
   - This is a broad existing application surface, but the presence of a page does not prove the backend flow is production-safe or connected to a real provider.
   - Repository README describes a Base44 workflow; further code and backend-function audit is required.

2. [vantoriss](https://github.com/iamtheoracle/vantoriss)
   - Also a Vite/React/Base44 app with many overlapping routes, components, and governance documents.
   - Appears closely related to the credit-union repository, but no merge or equivalence conclusion should be made from filenames alone.
   - Must compare commits, source files, Base44 app IDs/configuration, backend functions, and deployment ownership before selecting a canonical codebase.

3. [American-Vanguard-credit-union](https://github.com/iamtheoracle/American-Vanguard-credit-union)
   - README explicitly describes a fictional, local-only banking demo with sample data, no sign-in, no backend, no bank connection, and no real money movement.
   - Useful as a UI/prototype reference only; not a financial ledger or production banking foundation.

4. [oracle-control](https://github.com/iamtheoracle/oracle-control)
   - README describes a restricted administrative control plane for privileged access, security monitoring, permission governance, sensitive-action approvals, audit trails, incident response, and secure recovery.
   - Potential reference for privileged control-plane patterns; independence and integration boundaries must be preserved.

5. [oracle-investment-platform](https://github.com/iamtheoracle/oracle-investment-platform)
   - README describes a separate investment/contribution management platform with independent authentication, financial records, investor statements, valuation history, reconciliation, and reporting.
   - Keep separate from general platform navigation and payment execution unless a reviewed architecture explicitly defines limited integrations.

6. [the-arc-space-](https://github.com/iamtheoracle/the-arc-space-)
   - README says architecture documentation exists, while framework, backend, authentication, database, tests, and deployment have not yet been implemented or verified.
   - Treat as a design reference, not a working subsystem, until validated.

7. [arc-project-one](https://github.com/iamtheoracle/arc-project-one)
   - README describes a secure development foundation; source-level audit is still required before reusing code.

### Initial risks to investigate
- Two closely related Base44 apps may contain duplicate or diverging work.
- Credit-union language, account names, and UI may imply a regulated institution. Do not present the product as a chartered credit union or deposit-taking institution unless that is factually and legally true.
- UI pages may be prototypes, partially connected, or use demo data; audit every critical action path.
- Financial product pages do not establish that a double-entry ledger, settlement, reconciliation, KYC, fraud monitoring, or payment-provider integration is implemented correctly.
- No confirmed production FX liquidity provider, trading venue, bank/payment provider, or regional permission has been established in this initial review.
- Public GitHub access can reveal repository contents but cannot prove control over external legal entities or production credentials.

## 6. Canonical repository decision

Do not merge repositories blindly. Before choosing a canonical repo:

1. Compare file trees and commit history of `vantoriss` and `vantoris-credit-union`.
2. Identify each Base44 app ID, backend functions/entities, auth model, deployment target, environment variable names, and current production status without exposing secrets.
3. Map routes/components to real workflows and mark each as: implemented and tested, implemented but unverified, UI-only, stubbed, duplicated, broken, or missing.
4. Review test/lint/build results and inspect authentication, account balance, transfers, KYC, approvals, audit, and admin routes first.
5. Select the canonical repo based on ownership, freshest complete work, deployment relationship, and maintainability. Preserve the other repos until a tested migration is approved.

## 7. Target technical boundaries

Start with a modular monolith and dedicated background workers; split services only when reliability, scale, security, or regulatory boundaries justify it.

Suggested modules:
- `identity-access`
- `organisations`
- `ledger-accounting`
- `payments-orchestration`
- `fx-pricing`
- `fx-conversion`
- `markets-order-management`
- `commerce-catalog-orders`
- `marketplace-settlement`
- `trust-compliance`
- `notifications-documents`
- `ai-agent-runtime`
- `connectors-integrations`
- `admin-control-plane`
- `analytics-reporting`

Do not put privileged administration, trading execution, or authoritative ledger mutation inside a general-purpose AI agent.

## 8. EU-first, US/Asia-parallel rollout

### Workstream 1 — EU launch
- Choose the initial EU country, legal entity, target customer type, and exact funds-flow model.
- Obtain legal assessment for payment/e-money activities, FX conversion, marketplace seller funds, investment/wealth activities, privacy, AML/sanctions, operational resilience, and customer disclosures.
- Decide whether services are directly authorised or provided through contracted authorised partners.
- Integrate providers in sandbox first; production enablement requires partner approval, settlement/reconciliation tests, security review, support readiness, and accountable sign-off.

### Workstream 2 — United States preparation
- Map federal and state requirements to each exact money flow and product.
- Assess applicable money-transmission, AML, consumer-protection, card, and trading requirements.
- Identify state-by-state provider/partner coverage; do not assume a single permission covers all states or products.

### Workstream 3 — Asia preparation
- Use Singapore as a candidate market for detailed discovery, not as permission to operate throughout Asia.
- Map each product to local payment, cross-border transfer, FX, trading, data, and consumer requirements.
- Select additional countries only after partner, regulatory, settlement, and operational review.

### Launch gates for each product/region
- Legal entity and approved operating model.
- Required authorisation or written approved-partner arrangement.
- Provider/venue contracts and production access.
- Customer eligibility, KYC/KYB, sanctions, fraud, complaints, and disclosures.
- Ledger, accounting, settlement, refunds, and reconciliation signed off.
- Security assessment, penetration testing, incident response, backup restoration, and recovery exercise.
- Customer support, monitoring, ownership, runbooks, and incident escalation.
- Formal business, finance, security, and compliance approval.

## 9. Implementation roadmap

### Phase 0 — Discovery and audit
- Compare candidate repositories and map all routes, entities, functions, integrations, and deployments.
- Create feature inventory and evidence-based implementation status.
- Identify duplicate code, broken flows, secrets/configuration risks, and legal/product misrepresentation risks.

### Phase 1 — Foundation
- Select canonical repository and establish branch protections, CI, test conventions, and architecture decisions.
- Standardise identity, role model, organisations, design system, logging, audit events, and feature flags.
- Define API conventions, event contracts, idempotency, and provider adapter interfaces.

### Phase 2 — Money and commerce integrity
- Validate or implement ledger, payment state machine, provider webhooks, reconciliation, refunds, disputes, and marketplace settlement.
- Keep test/demo environments unmistakably separate from production.
- Build end-to-end tests with provider sandboxes and failure/replay cases.

### Phase 3 — FX Exchange
- Build quote contracts, provider adapters, pricing/routing rules, quote expiry, conversion execution, reconciliation, and transparent disclosures.
- Add currencies and corridors only when supported by provider, legal, and operational coverage.

### Phase 4 — Commerce and network
- Complete seller onboarding, catalog, checkout, order lifecycle, payouts, buyer protection, verified profiles, messaging, reporting, and moderation.
- Premium marketplace features must include trust, dispute, and prohibited-listing controls.

### Phase 5 — Intelligence and premium
- Add scoped agents, tool permissions, evaluation, audit, human approvals, workflow automation, premium entitlements, and service-level monitoring.
- AI may support financial workflows but never bypass the authoritative financial systems.

### Phase 6 — Markets and wealth
- Keep professional trading and investment access in non-production until the product-specific legal model, providers/venues, risk controls, client eligibility, accounting, and authorisations are approved.
- Build test harnesses and partner integration work independently from X Exchange.

### Phase 7 — Regional rollout
- EU pilot first, then independently enable US and selected Asian markets only when their own gates pass.
- Monitor reliability, fraud/loss rates, reconciliation breaks, support load, conversion quality, and unit economics before scaling.

## 10. Acceptance criteria

A feature is not “done” because its screen exists. Mark a feature production-ready only when:
- It has a defined owner and requirements.
- Access control is enforced server-side.
- Inputs, state transitions, failure cases, retries, and idempotency are tested.
- Audit events and monitoring exist.
- Sensitive data handling and retention are reviewed.
- External provider status is authoritative where relevant.
- Reconciliation and rollback/reversal paths are defined for financial workflows.
- Automated checks pass and an accountable reviewer approves the release.
- Regional eligibility and product permissions are enforced at the API/service layer.

## 11. Immediate next actions

1. Finish a source-level comparison of `vantoriss` and `vantoris-credit-union`.
2. Audit critical paths: authentication/user identity, onboarding/KYC, accounts/balances, Move Money, transaction status, admin approvals, audit logs, provider integrations, and environment configuration.
3. Create a file-by-file feature matrix with evidence and severity.
4. Recommend a canonical repo with reasons; do not merge until confirmed and migration-tested.
5. Implement the first high-priority corrections on a dedicated branch and validate with available tests.

**Current confidence:** high confidence in the repository-level observations above; incomplete confidence in actual backend behavior, production readiness, legal permissions, and provider integration until source-level and environment-aware tests are completed.
