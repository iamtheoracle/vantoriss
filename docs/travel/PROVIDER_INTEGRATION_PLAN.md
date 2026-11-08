# AVCU Travel — Provider Integration Plan

## Current verified state

The member application exposes a protected /travel route. The Travel provider is currently marked disconnected in src/lib/providers/registry.js. There are no verified flight, accommodation, car-rental, or live flight-status integrations in this repository. The member experience must continue to show unavailable states until each capability has a tested provider path.

This document is an implementation contract, not evidence that any supplier is connected.

## Product scope

1. Flights — one-way, return and multi-city search; passenger and cabin selection; fare rules; re-price before purchase; supplier-backed booking and ticket status.
2. Accommodation — destination/date/guest search; room and cancellation terms; final price; reservation and cancellation status.
3. Car hire — pickup/return locations and times; vehicle class; rental terms; final price; reservation status.
4. Flight status — flight/date lookup and verified operational updates such as scheduled, delayed, departed, diverted and landed.
5. Trip wallet — confirmed itinerary records, supplier references, documents, notifications and a timeline of booking changes.
6. Destination discovery — editorial content only when sourced and labelled; never present an editorial suggestion as live inventory.

## Provider-neutral backend boundary

All supplier calls must run server-side. The browser must never receive supplier secrets or call supplier booking endpoints directly.

Implement separate adapters behind stable internal interfaces:

- FlightSearchProvider: search offers, re-price an offer, create booking/order, retrieve booking, cancel where supported.
- StaySearchProvider: search properties/rooms, re-price, create reservation, retrieve reservation, cancel where supported.
- CarRentalProvider: search vehicles, re-price, create reservation, retrieve reservation, cancel where supported.
- FlightStatusProvider: retrieve flight status and normalize provider events.
- TravelContentProvider: retrieve editorial/destination content with source attribution.

Each adapter must return normalized data plus the supplier identifier, supplier reference, currency, retrieval timestamp, expiry time where applicable, and raw provider status for audit/debugging. Provider-specific fields must remain available in a controlled server-side record for reconciliation.

## Booking lifecycle and money boundary

Use an explicit lifecycle such as:

search_result -> repriced -> awaiting_member_confirmation -> payment_pending -> supplier_pending -> confirmed | failed | cancellation_pending | cancelled | refund_pending | refunded

A member's confirmation is not a booking. A payment authorization is not a supplier confirmation. A supplier confirmation is not proof that a refund settled.

Before any charge:
- re-price the selected offer and verify that it is still valid;
- display the complete payable amount, currency, taxes/fees and supplier cancellation terms;
- bind the member, offer, amount, currency and supplier reference to an idempotent booking intent;
- require explicit member confirmation;
- use an approved payment provider and reconcile its event with the supplier booking result.

Do not add travel charges to the credit-union ledger by directly editing account or transaction entities. Travel payment collection and any permitted account debit must use the approved financial mutation boundary and separate authorization. If payment or supplier status is ambiguous, keep the booking pending and reconcile; never show a success screen based on a timeout.

## Security and operations

- Keep API keys, client secrets, webhook secrets and signing keys in backend-only secret configuration.
- Authenticate every member request and enforce ownership on trip, booking and document records.
- Verify webhook signatures, timestamps and replay protection.
- Use idempotency keys for booking, cancellation and payment requests.
- Record append-only audit events for search selection, re-price, member confirmation, payment events, supplier responses, cancellation and refund.
- Apply request timeouts, bounded retries, rate limits, circuit breakers and provider health monitoring.
- Encrypt sensitive booking data at rest; restrict access to passport/identity data and avoid collecting it unless the supplier flow requires it.
- Define retention and deletion rules for passenger details, travel documents and supplier payloads.
- Keep test/sandbox and production credentials and data isolated.

## Provider selection gates

Do not select a supplier solely because its logo appears in the UI or it is listed as a candidate. For every provider, document:
- supported markets, currencies, routes and inventory;
- commercial access and production approval;
- booking, cancellation, refund and webhook coverage;
- service-level commitments and support escalation;
- payment model, settlement timing and reconciliation requirements;
- data processing, privacy and retention terms;
- sandbox test evidence and production smoke-test evidence.

A flight-shopping API, hotel wholesaler, flight-status feed and mapping service solve different problems. Do not treat one as a substitute for another. Keep adapters replaceable so the product is not coupled to one supplier.

## Release gates

A capability can be marked connected only after all applicable checks pass:

1. Backend secret is configured without exposing it to the client.
2. Authentication, ownership and authorization tests pass.
3. Provider contract tests cover success, empty results, invalid input, timeout, rate limit and malformed responses.
4. Prices and availability are revalidated before confirmation.
5. Booking, cancellation and refund state transitions are idempotent and auditable.
6. Webhook signature/replay tests pass.
7. Payment-provider and supplier reconciliation is verified end to end.
8. Member-facing status is derived from verified backend state.
9. Operations has health, failure and reconciliation visibility.
10. Production approval and a rollback plan are recorded.

Until these gates pass, the provider registry must remain disconnected and the member UI must not offer a live search, booking, payment or tracking action.
