# Atchison Village Credit Union

The unified Atchison Village Credit Union application combines the full member and protected operations experience with the recovered interface and backend improvements from the Vantoris X Money recovery work.

## Application boundaries

- **Member portal:** personal accounts, cards, activity, service requests, documents, investments and AVA.
- **Operations workspace:** a separate role-protected environment for member servicing, applications, KYC, card programme oversight, approvals, reports, audit and system administration.
- **Shared platform services:** authenticated identity, policy enforcement, audit, model gateway, workflow orchestration and provider integrations.
- Member and operations dashboards remain separate. Shared branding and backend services do not grant members access to staff routes or staff data.

## AI architecture

- **AVA** is the new Atchison Village Assistant and the member-facing AI experience.
- **Oracle** coordinates the authenticated request pipeline.
- **Guardian** enforces explicit capability grants and deny-by-default policy.
- **Nexus** routes work to the appropriate specialist.
- **Spark** performs model-backed reasoning through the server-side model service.
- **Orbit** handles deferred jobs.
- **Classic Assistant** is retained as a restricted compatibility experience for older conversations.
- The provider-independent model gateway is preferred when configured. Base44 `InvokeLLM` remains available as a compatibility provider; its old route is not deleted.

Provider credentials must remain in backend secrets. The gateway reads:
- `AVCU_MODEL_GATEWAY_URL` (or `AVCU_AI_GATEWAY_URL`)
- `AVCU_MODEL_GATEWAY_API_KEY`
- `AVCU_MODEL_GATEWAY_MODEL`
- `AVCU_LEGACY_LLM_FALLBACK` (set to `false` to disable fallback)

The configured endpoint must be HTTPS outside local development. A configured endpoint is not considered verified until provider, timeout, structured-output and fallback tests pass.

## Financial-operation safety

A model response or recommendation is not a financial execution. Payments, transfers, withdrawals, trades, account changes, card issuance and other controlled actions must pass through authenticated server-side workflows, exact-action approval checks, idempotency controls and audit logging. Do not mark a financial capability live until its provider and both approval and rejection paths have been tested.

## Local development

```bash
npm install
npm run dev
```

Validation commands:

```bash
npm run lint
npm run typecheck
npm run build
```

Base44 backend resources live under `base44/`. Follow the Base44 project workflow before deploying entities, functions, agents or site changes.

## Repository consolidation

`iamtheoracle/vantoriss` is the canonical application repository for this consolidation branch. The `vantoris-x-money` recovery branch is a source of selected interface and security improvements, not an independent production application. Its open PR must not be merged wholesale: inspect and selectively port changes, especially any payment schema or database integration, before adopting them. Never reuse credentials or databases from another institution or project.

## Release status

This branch is a development change set. It has not been deployed to production. Live Base44 RLS, provider integrations, card issuance, real payment rails, authenticated browser testing and end-to-end operations workflows require independent verification before release.
