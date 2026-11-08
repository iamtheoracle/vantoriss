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


## Evidence-based provider shortlist (November 2026)

These are recommended candidates, not connected suppliers. Commercial approval, market coverage and production credentials still need to be confirmed.

### Flights — Duffel as the first candidate

Duffel documents a flight offer-request/search flow and order creation/management. Offers expire and should be re-fetched before booking; the current offer response may change, including total price and included services. Duffel orders expose available post-booking actions such as cancellation or changes when supported by the airline/order. See [Duffel flight concepts](https://duffel.com/docs/api/overview/flights-key-concepts), [offer revalidation](https://duffel.com/docs/api/offers) and [orders](https://duffel.com/docs/api/orders).

Do not treat a successful order API response as proof that AVCU's payment has settled. Confirm the payment model, eligible markets, supported airlines, ticketing responsibility, cancellation/refund coverage and account access with Duffel before enabling production checkout.

### Accommodation and car hire — Booking.com Demand API

Booking.com Demand API is the preferred candidate to evaluate for both accommodation and rental cars. Its documentation describes accommodation search, availability, property details, supported bookings and post-booking/reporting flows. Demand API v3.2/v3.3 documents car search, availability, terms, order preview/create and post-booking order details. It requires partner access and affiliate authentication. See [Demand API overview](https://developers.booking.com/demand/docs/getting-started/overview), [accommodation API](https://developers.booking.com/demand/docs/accommodations/about-accommodation), [car rental API](https://developers.booking.com/demand/docs/cars/overview) and [v3.3 API reference](https://developers.booking.com/demand/docs/open-api/3.3/demand-api).

The current Booking.com Demand API overview lists flights as coming soon, so it must not be selected as the flight inventory provider today. Partner access and the precise supported booking flows must be confirmed for AVCU's business model and operating markets.

Duffel Stays is a viable alternative for accommodation if access is granted. Its documented flow includes search, retrieving room rates, requesting a final quote and creating a booking. See [Duffel Stays getting started](https://duffel.com/docs/guides/getting-started-with-stays). Evaluate total cost, inventory coverage, support, payment terms and post-booking capability against Booking.com before committing.

### Flight status — Cirium

Cirium is the first candidate for operational flight status. Its Flight Status API documents scheduled, estimated and actual departure/arrival times, delays, cancellations, gates, terminals and baggage information. Flight tracking/position is a separate capability and must be licensed and integrated separately. Some airport/route APIs require a contract plan. See [Cirium Flight Status](https://developer.cirium.com/apis/flightstats-apis/flight-status) and [Cirium API catalogue](https://developer.flightstats.com/).

### Ground directions — Google Maps Routes API

Use Google Routes only for ground directions, distance and travel-time estimates between locations. It is not an airline inventory or live aircraft-tracking provider. See [Google Routes API](https://developers.google.com/maps/documentation/routes).

### Why Amadeus is not the default flight-booking choice

Amadeus Self-Service offers flight search, price confirmation, order creation and order management, but its own FAQ says production ticket issuance requires an airline consolidator contract (or the relevant accreditation), with post-ticketing changes and refunds handled offline by the consolidator. The Self-Service dataset also excludes several major airlines and low-cost carriers. This may be useful as an additional search source or where a suitable consolidator relationship is secured, but it is not the simplest default for a fully managed booking lifecycle. See [Amadeus Self-Service API FAQ](https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/faq/) and [flight API tutorials](https://admin.developers.amadeus.com/self-service/apis-docs/guides/developer-guides/resources/).

## Proposed integration order

1. Confirm supplier commercial eligibility, production access and markets for Duffel, Booking.com Demand API and Cirium.
2. Implement Duffel flight search, offer revalidation and order retrieval in sandbox; keep payment and ticketing status separate.
3. Implement Booking.com accommodation and car search/availability/terms/order flows in sandbox.
4. Add Cirium flight status lookup and event normalization; add aircraft position only if a separate licensed product is approved.
5. Add the member trip record and notifications only after provider booking references and webhook/event contracts are stable.
6. Complete payment-provider and supplier reconciliation, failure recovery and member-ownership tests before enabling any production booking.


## Dual-mode requirement: live providers plus no-API operation

The product must not become unusable when third-party credentials are absent. Implement two clearly distinguished modes.

### Mode A — Live connected services

When the corresponding backend adapter is configured and healthy, the member can use live supplier-backed search, availability, price revalidation, booking, cancellation and status capabilities that the supplier actually supports. Every response must carry its source, currency, retrieval time and supplier reference. A capability is enabled independently; a connected flight provider does not imply connected hotels, cars or flight status.

### Mode B — Manual / no-API operation

This mode must remain useful with zero third-party travel APIs:

- Create a trip with destination, dates and member-authored notes.
- Add, edit, reorder and remove itinerary entries for flights, stays, car hire, transfers, activities and meetings.
- Record details the member manually receives from an airline, hotel, car-rental company or travel agent. Clearly label them as member-entered, not independently verified.
- Keep a checklist, trip timeline, reminders and document references.
- Export/print the itinerary in a portable format.
- Open destination searches and directions in the user's chosen map or supplier website. External navigation must be labelled as leaving AVCU; it is not an in-app live integration.
- Let the member contact support for human assistance and record the case reference.
- Preserve the itinerary when a live provider is disconnected; do not delete member-authored data when a supplier goes offline.

No-API mode must never fabricate fares, availability, schedules, booking references, flight status, provider confirmations, payment completion or refunds. A manually typed confirmation reference is a note, not a verified booking.

### Persistence and privacy requirement

The first UI increment includes a browser-local manual planner as a limited offline-capable fallback. It is explicitly device-local and does not sync. It must not store passport numbers, payment card data, bank credentials, or sensitive identity documents.

Before offering cross-device persistence, create a dedicated TripPlan/TripItem data model with strict member ownership and server-side authorization. The current repository has existing entity access-control gaps; do not introduce a new member-owned entity without verified owner-scoped read/write rules and negative cross-member tests. A browser-local draft is not a substitute for secure server persistence.

### Capability matrix

| Capability | No third-party API | Live provider |
|---|---|---|
| Trip planning and itinerary | Member-created, local draft and export | Same, with verified supplier details attached |
| Flight discovery | External airline/booking-site links and manual comparison | Duffel search and re-price, subject to market/access |
| Flight purchase/ticketing | Member completes purchase with supplier; manually records details | Supplier order flow plus approved payment and ticketing reconciliation |
| Hotel search | External supplier website and manual comparison | Booking.com Demand API or approved alternative |
| Hotel booking | Member books externally; manual itinerary entry | Supplier reservation and confirmation flow |
| Car hire | External supplier website and manual entry | Booking.com Demand API or approved alternative |
| Flight status | Airline/airport public status pages; manually updated notes | Cirium status feed |
| Directions | Open external map app/site | Google Routes API for in-app route data |
| Cancellations/refunds | Contact supplier directly; track member-entered case/status | Supplier workflow plus payment reconciliation |
| Support | Member messages/contact workflow | Same, with case status and provider diagnostics |

The no-API experience is a genuine product mode, not a fake simulator. It must explain what the member can do directly and what still requires an airline, hotel, rental company, travel agent or staff member.

### Supplier account onboarding

The owner intends to pursue all shortlisted suppliers: Duffel, Booking.com Demand API, Cirium and Google Maps Platform (Routes). Keep provider setup independent. Access to one supplier must not block manual mode or the other providers. Store credentials only in the approved server-side secret manager; never request or commit keys in GitHub source, issue comments or chat. Production activation requires each provider's own contract, environment separation and release gates above.
