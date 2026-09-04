# Real Banking Provider Integration Design

## Goal
Replace Vantoris's internally generated banking identifiers and simulated payment outcomes with a real regulated banking-infrastructure integration, while keeping the existing Vantoris member experience.

## Provider decision
Use Unit as the primary embedded-banking provider for the first production integration. Unit exposes real deposit accounts with routing/account numbers, real-time transaction-derived balances, payments, cards, and customer/account primitives. Unit documents separate Sandbox and Live environments and requires a live API bearer token for live API access.

Zelle remains a separate network-partnership requirement. Zelle's official documentation states that Zelle is delivered through participating financial institutions and that partner financial institutions handle enrollment and payment issues. Vantoris must not claim native Zelle settlement until Vantoris has an approved Zelle financial-institution/network relationship. The existing Zelle UI will therefore remain enrollment-aware and must not create or imply settlement.

## Architecture
The Base44 backend function layer is the server-side provider boundary. Provider credentials remain server-side environment secrets. Vantoris entities become a synchronized application view of provider-owned financial state; provider IDs are persisted and used as the source-of-truth references. Financial operations are initiated only through the provider function and are reported successful only after a confirmed provider response.

The current generated-account path is unsafe for production because it creates arbitrary account numbers and a fixed routing number. It will be removed from production account creation and replaced by Unit-backed account creation.

## Hard constraints
- No fake/demo balances, accounts, routing numbers, cards, transfers, or payment successes in production UX.
- No sandbox data presented as live data.
- No provider credentials in frontend code, Git, logs, chat, or AuditLog.
- If live provider credentials are absent, the feature fails closed with an explicit unavailable state.
- Provider IDs and confirmed provider responses are required before local financial records are marked active/successful.
- Existing Vantoris navigation and premium member UX remain intact.
- Netlify deployment is not triggered by this change.

## Provider requirements
The integration must support, where enabled for Vantoris's approved program:
- Customer identity/onboarding linkage.
- Deposit account creation and account numbers.
- Account balance and transaction synchronization.
- ACH and supported real-time payment rails.
- Card issuance through the provider's supported card program.
- Provider webhooks/events for asynchronous status changes.
- Idempotency for money movement.

## Zelle boundary
Vantoris will not manufacture a Zelle API. Zelle requires a participating financial-institution relationship. Until that relationship exists, Vantoris may display enrollment/profile information that is genuinely stored in Vantoris, but send/request actions must not settle funds or report a completed Zelle transfer.

## Migration
Existing Vantoris Account records must not be silently rewritten as real bank accounts. New provider-backed records carry provider metadata. Existing records without provider identifiers are treated as legacy/unverified and are not allowed to represent live external banking balances.
