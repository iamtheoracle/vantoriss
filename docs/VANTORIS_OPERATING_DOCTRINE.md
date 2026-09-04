# Vantoris Operating Doctrine

This document is the shared source of truth for Vantoris engineering, Command, specialist agents, workers, and future integrations.

## Identity

Vantoris is **VANTORIS PIP · PRIVATE INVESTMENT & PAYMENTS**. The product combines banking/payment capabilities, investment and market intelligence, crypto/financial information, HeroBox, Discovery, communications, and operational tooling.

Do not describe Vantoris as a licensed bank, certified institution, military-certified system, or regulated provider unless that status is actually verified and configured. Product branding does not prove regulatory status.

## Truth hierarchy

1. Authenticated identity, role, permissions, and current session context.
2. Verified Vantoris database state.
3. Connected financial/provider state and provider webhooks.
4. Verified external intelligence with source/freshness information.
5. Approved application configuration and documentation.
6. Explicitly labelled demonstration state.

When sources conflict, preserve the conflict and use the higher-authority source. Never silently manufacture a reconciliation.

## No-fake rule

Never fabricate real balances, transactions, deposits, withdrawals, account numbers, routing numbers, cards, investments, crypto holdings, market prices, news, organizations, people, humanitarian needs, products, orders, provider responses, KYC decisions, or successful actions.

Demonstration state is permitted to demonstrate the user experience. It must be visibly identifiable as demonstration/simulation and must never be represented as real spendable money or real provider activity.

Allowed state vocabulary:

- LIVE
- DEMONSTRATION
- PENDING
- UNAVAILABLE
- REQUIRES_AUTHORIZATION
- REQUIRES_HUMAN_REVIEW
- FAILED

These states are not interchangeable.

## Identity model

A member identity and an operator/staff identity are separate.

A staff member does not automatically receive a membership account. If staff want a personal Vantoris membership, they create it separately with separate credentials and records.

Authentication should resolve the actor after login:

- member → member experience;
- authorized staff → operator experience;
- Super Administrator → operator experience with highest administrative scope.

Never merge accounts because the person, email address, device, or contact details are similar.

## Operator intelligence

Every operator session should carry:

- authenticated user ID;
- role;
- department;
- position;
- OperationalProfile role;
- actual capabilities;
- permitted Command divisions;
- current module and workflow.

Do not infer permissions solely from a title. The application's actual authorization state is authoritative.

## Vantoris Command

Command coordinates. Specialists specialize. Use minimum necessary intelligence and do not automatically invoke every division.

The 16 divisions are Command, Intelligence, Operations, Compliance, Security, Support, Logistics, Humanitarian, Reconnaissance, Finance, Markets, Portfolio, Risk, Navigation, Records, and Communications.

A recommendation is not a decision. A decision is not execution. Execution is not verified completion until the underlying system confirms success.

## Banking

Unit is the intended live banking provider integration.

Real accounts must be provider-created and provider-confirmed. Never invent production account or routing numbers. Never claim an account exists until the provider confirms it and Vantoris stores the provider identifiers.

Provider webhooks are authoritative for provider-owned events. Use idempotency, provider IDs, audit records, and reconciliation.

The old concept of generating arbitrary account numbers/routing numbers for a live account is obsolete. `generateAccount` must not be used to fabricate production banking.

If provider credentials, approval, or connectivity are unavailable, report the state as unavailable/pending. Do not simulate a successful provider operation.

## Cards

A card is real only when a real card/provider record exists. Demonstration cards must be explicitly labelled demonstration. Never fabricate live card authorization or settlement.

## Crypto and markets

Bitcoin, Ethereum, TON, USDT and other approved assets may be displayed using verified live market sources.

Market data is not equivalent to user-owned assets. Show freshness where practical. Never invent prices, percentage changes, volume, holdings, portfolio performance, or trading results.

Investment analysis is not a guarantee. Execution requires a connected provider and authorization.

## Home

Home should feel like a modern financial/crypto platform: premium balance and account surfaces, verified market information, crypto market cards, financial pulse, recent activity, Vantoris Brief, Discovery, HeroBox and approved actions.

A lively UI must come from real connected data or clearly labelled demonstration state, never fabricated activity.

## Discovery

Discovery is a living intelligence system.

Lifecycle:

DISCOVER → DEDUPLICATE → VERIFY → CORROBORATE → CLASSIFY → RISK CHECK → REVIEW → APPROVE → PUBLISH → REFRESH → CLOSE/ARCHIVE.

Maintain source URL, source type, discovery time, publication time when available, verification time, freshness, confidence, evidence, corroborating/conflicting sources, responsible division, next verification, and change history where supported.

Discovery is intelligence, not authorization.

News must distinguish confirmed from developing/unverified information. Stale, conflicting, suspicious, duplicate, or unavailable sources must be flagged.

## Humanitarian intelligence

Do not invent people, emergencies, diagnoses, organizations, campaigns, beneficiaries, urgency, or needs. Medical claims must be explicitly supported. Respect privacy and consent. Organizations serving children are verified at organization level and are not automatically published as verified.

## HeroBox

HeroBox is an integrated product, not a donation placeholder.

Approved package identities are exactly:

HEARTH, HAVEN, VITALIS, PROVISION, SIGNAL, SOLACE, VANGUARD, SOVEREIGN.

Current catalog pricing, availability, fulfillment, and retailer data must come from a connected provider or verified catalog state. Never hardcode fabricated live prices. Historical orders preserve immutable snapshots. Donor intent must never be silently changed.

## Security and compliance

Never leak PII across accounts. Never bypass RBAC. Never bypass KYC/AML/compliance. Never modify balances outside legitimate financial workflows. Sensitive actions must be authorized and auditable.

Super Administrator exception authentication is required only for exclusive system-level actions such as changing protected application behavior, providers/APIs, AI configuration, Command architecture, authorization/security architecture, role definitions, or destructive emergency controls.

The exception credential is never entered into ordinary chat, never placed in AI context, never logged, and never stored in an audit record. Only a safe authorization result is exposed to the agent.

## Workers and agents

When configured, workers should proactively maintain useful state: discovery freshness, market freshness, provider synchronization, KYC/application changes, operational exceptions, security anomalies, HeroBox changes, and notifications requiring attention.

Workers must be idempotent, auditable, timestamped, failure-aware, and conservative. They must never generate fake activity merely to make Vantoris appear alive.

## Failure doctrine

If a dependency is missing or an operation fails, preserve the true state. Use PENDING, UNAVAILABLE, REQUIRES_AUTHORIZATION, REQUIRES_HUMAN_REVIEW, or FAILED as appropriate.

Never convert an unavailable integration into a successful-looking demo result unless the UI explicitly identifies the entire state as demonstration.

## Final principle

Vantoris should feel alive because its systems, providers, intelligence sources, workers, and agents are actually working — never because the agents pretend that something happened.
