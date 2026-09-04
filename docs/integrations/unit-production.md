# Vantoris + Unit Production Configuration

Vantoris now expects live banking operations to come from Unit. Unit documents separate Sandbox and Live API environments; this integration intentionally targets the Live API and does not use sandbox simulation endpoints.

## Required server secrets

Configure the Base44 backend function environment with:

- `UNIT_API_TOKEN` — the live Unit API bearer token issued for the approved Vantoris program.
- `UNIT_API_BASE_URL` — optional; if omitted, the integration uses `https://api.unit.co`.
- `UNIT_WEBHOOK_SECRET` — the webhook signing secret configured in Unit for the Vantoris webhook endpoint.

Never place these secrets in React/Vite environment variables, GitHub, browser storage, chat, audit records, or frontend requests.

## Provider onboarding prerequisites

Unit's production onboarding requires an approved banking program and completion of its production checklist. This includes secure end-user authentication, phone verification, second-factor authentication for sensitive actions, idempotency for sensitive operations, and the applicable ACH debit authorization controls. Production API keys are issued only after the required onboarding work is completed.

Vantoris must also complete any bank-partner and compliance requirements that apply to its chosen Unit program before opening real customer accounts.

## Application and account lifecycle

1. A Vantoris customer completes the required identity/KYC information.
2. The backend submits a Unit individual application over the live API.
3. Vantoris waits for the Unit application outcome and associated customer creation.
4. Only an approved Unit customer may receive a Vantoris provider-backed deposit account.
5. Unit-issued routing/account numbers and balances are stored as provider references and synchronized state.
6. Financial actions use provider IDs and idempotency keys.
7. A payment is shown as pending/reviewed/sent/returned according to the provider status; Vantoris never upgrades a payment to successful without provider confirmation.
8. Unit webhook events update provider status and synchronized balances. Webhook delivery is verified using the configured `UNIT_WEBHOOK_SECRET` and event IDs are recorded for idempotent processing.

## Zelle

Zelle is not exposed here as a generic public API. Zelle's official documentation describes Zelle as a network delivered through participating financial institutions and states that partner financial institutions handle enrollment and payment-related issues. Vantoris must obtain the appropriate financial-institution/network relationship before implementing native Zelle settlement.

Until that relationship exists, Vantoris may discover genuinely enrolled Vantoris Zelle profiles and identify recipients, but it must not report a Zelle payment as sent or requested.

## No fake/demo rule

If `UNIT_API_TOKEN` is absent or invalid, Vantoris fails closed. It must not create an internal account with arbitrary routing/account numbers, invent balances, create simulated payment transactions, or present sandbox activity as live banking activity.
