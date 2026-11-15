# Legacy shared-service audit — upstream Vantoris application

**Source repository:** `The-Oracle-Arc/vantoris-live`  
**Source branch:** `main`  
**Source commit:** `7ededd1eb4a7b946a9ac50371b33546aad0e0d29`  
**Audit date:** 15 November 2026  
**Purpose:** inspect the original shared-service files before designing or implementing Vantoris Base.

## Executive finding

The upstream application contains shared service and registry source files, but these are **legacy Base44 application wrappers and in-memory scaffolding**, not a verified Vantoris Base infrastructure platform.

The source has no verified self-owned PostgreSQL control plane, durable shared identity/session authority, transactional workflow engine, platform API gateway, cross-application service identity system, verified notification outbox, encrypted document service, or demonstrated recovery/monitoring operations.

Do not mark Base complete because these files exist. Preserve them as source lineage and use them to define capability parity and migration requirements.

## Service-by-service findings

| Legacy source | What the code actually does | Missing evidence / limitation |
|---|---|---|
| `base44/shared/services/IdentityService.ts` | Delegates current-user lookup to `base44.auth.me()`; looks up users through Base44 service-role entities; reads role from the returned user object. | No independent identity authority, MFA/recovery/session lifecycle, server-side permission policy, or verified cross-application identity boundary in this file. |
| `base44/shared/services/SessionService.ts` | Stores sessions in a process-local JavaScript `Map` with a one-hour TTL. | Not durable across restarts or multiple instances; no database persistence, device inventory, refresh rotation, centralized revocation, or audit lifecycle. |
| `base44/shared/services/AuditService.ts` | Writes AuditLog entities through Base44 service-role API and publishes an event on an in-memory event bus. | Does not itself enforce append-only storage, database immutability, transaction coupling, tamper evidence, retention, or restricted audit administration. |
| `base44/shared/services/NotificationService.ts` | Creates Base44 Notification entities, calls Base44 Core SendEmail, lists notifications and updates read state. | No verified delivery outbox, idempotency, retry/backoff, provider confirmation lifecycle, suppression controls, or transactional coupling. |
| `base44/shared/services/MemoryService.ts` | Stores JSON-serialized values in Base44 MemoryRecord entities; retrieves/lists/deletes them. | No explicit consent/permission scope, encryption/key management, data minimization, retention enforcement, audit policy or memory isolation tests. `clearExpired()` only queries expired records; it does not delete them. |
| `base44/shared/services/HealthService.ts` | Keeps health-check functions in an in-memory Map, executes them and writes result rows to Base44 HealthCheck entities. | No durable monitor scheduler, service discovery, alert delivery, SLOs, incident linkage, history retention or restore evidence. |
| `base44/shared/registries/WorkflowRegistry.ts` | Stores workflow definitions in an in-memory Map. | No durable workflow instances, atomic state transitions, retries, leases, idempotency, maker-checker, dual approval or crash recovery. |
| `base44/shared/registries/ServiceRegistry.ts` | Stores service descriptors in an in-memory Map. | No service discovery protocol, authenticated service identity, health-aware routing, version negotiation or durable registration. |
| `base44/shared/registries/CapabilityRegistry.ts` | Defines hardcoded reasoning, knowledge, search, memory, conversation and audit capability metadata. | Several default capabilities have empty permission arrays; metadata is not enforcement. No server-side capability authorization proof or per-application isolation. |

## Related legacy data definitions

- `base44/entities/AppConfiguration.jsonc` stores generic key/value configuration strings. It is not a secrets vault and does not establish secret encryption or privileged configuration approval.
- `base44/entities/CapabilityDefinition.jsonc` describes capability metadata and permission labels. It does not enforce those permissions.
- `base44/entities/MemoryRecord.jsonc` defines user/key/value/type/expiry fields. It does not define the required consent, encryption, retention, access review or deletion proof.
- The upstream project uses Base44 configuration and Base44 entity APIs. No self-owned PostgreSQL schema/migration history for these shared services was found in the inspected upstream tree.

## Implications for Vantoris Base

These source files provide useful functional vocabulary and historical behaviour to preserve where approved, but they cannot be copied into a new Base runtime and labelled complete.

Base must independently implement and verify:

1. Durable identity integration with separate institutional authentication/authorization boundaries, MFA, recovery and session/device lifecycle.
2. Organisation registry with explicit institution membership and immutable internal identifiers.
3. Server-side permission evaluation, delegated access, expiry/revocation and dual approval for privileged changes.
4. Authenticated, versioned APIs and events with service identities, scoped credentials, signed webhooks, replay protection and failure contracts.
5. PostgreSQL-owned migrations, constraints, transactions, least-privilege database roles, backup and demonstrated restore.
6. Append-only audit storage with actor/resource/action/correlation data and controlled audit access.
7. Durable workflow instances with maker-checker, dual control, idempotency, concurrency safety, retry, expiry and recovery.
8. Verified notification delivery with outbox, provider acknowledgement, retries, suppression and audit.
9. Private document storage, malware scanning, versioning, retention, legal hold and access grants.
10. Health/metrics/logging/tracing, alert routing, incident response and operator runbooks.
11. Oracle Arc integrations with explicit ORACLE/SPARK/ORBITS permissions and no unrestricted private, financial or admin access.

## Institutional boundaries

- Base must not become a shared unrestricted business database.
- Ashcombe, VPI, X Money, AVCU and T Market retain their own identity, records, ledgers, financial authority, permissions and release controls.
- Group Headquarters may receive only approved coordination data and reports.
- A shared login does not grant cross-institution resource access.
- Each consuming application must authorize every actor/resource/action on its own server.
- A Base outage must not corrupt institution-owned records or authorize consequential actions.

## Evidence and next action

The original Vantoris source recovery comparison is documented at:
https://github.com/iamtheoracle/vantoris-x-money/blob/work/xmoney-independent-runtime/docs/UPSTREAM_RECOVERY_DIFF.md

The dedicated Base workstream and acceptance gates are tracked at:
https://github.com/iamtheoracle/vantoriss/issues/20

**Status:** legacy shared services inspected; no Vantoris Base implementation or production operation verified. Next action is to identify the authoritative existing Base application/repository and inspect Institutional Link once access is restored. Do not create a second Base or silently repurpose Oracle Control.
