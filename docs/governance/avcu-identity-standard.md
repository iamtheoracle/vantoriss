# Atchison Village Credit Union — Identity Standard

## Purpose

This repository is the Atchison Village Credit Union application. Product language, assistant identities, internal documentation and member-facing surfaces must belong to the credit-union brand. Do not introduce Oracle Arc, My Realm Network or UNIBUD identity into AVCU.

## Canonical intelligence architecture

| Canonical name | Responsibility | Legacy compatibility identifier |
|---|---|---|
| AVCU Trust | Authorization, security policy evaluation and security audit events | Guardian / guardian |
| AVCU Core | Request lifecycle and central intelligence pipeline | Oracle / oracle |
| AVCU Command | Specialist routing, capability resolution and workflow coordination | Nexus / nexus |
| AVCU Intelligence | Model invocation, reasoning and structured recommendations | Spark / spark |
| AVCU Scheduler | Deferred jobs, retries, pause/resume, cancellation and recovery | Orbit / orbit |
| AVA | Member-facing assistant identity and conversation experience | Bud / Vantoris Assistant agent record |

The component names describe actual code responsibilities. Memory remains a separate platform service; it is not owned by AVCU Intelligence. Document storage and processing remain separate services; they are not owned by AVCU Scheduler.

## Member-facing language

- The single member-facing assistant is **AVA by Atchison Village Credit Union**.
- Do not expose internal component names, orchestration paths, agent prompts, compatibility identifiers or implementation details to members.
- Use **AVCU Community Support** as the working product label for the existing community and charitable support experience formerly branded HeroBox.
- Use **Atchison Village Credit Union**, **Atchison Village** or **AVCU** in public product copy. Do not describe the institution as Vantoris, Oracle Arc, My Realm or UNIBUD.

## Migration and compatibility rules

1. Canonical code imports the new modules: `core.ts`, `trust.ts`, `command.ts`, `intelligence.ts` and `scheduler.ts`.
2. The previous module paths and exported factory names remain as deprecated compatibility shims until all consumers, tests, deployments and stored references have been migrated.
3. Compatibility identifiers are not member-facing branding. Do not rename Base44 entity names, agent IDs, workflow IDs, routes, environment variables or stored values without a separately reviewed migration and rollback plan.
4. Preserve existing member records, staff identities, roles, permissions, conversations, audit records and financial data.
5. Do not change financial authorization, execution, ledger or approval behavior as part of a naming migration.
6. Never claim a renamed surface is operational unless its underlying capability has been verified.

## Completion criteria

- All public and staff-facing product labels use AVCU language.
- AVA is the only member-facing assistant identity.
- Canonical runtime imports use the AVCU component names.
- Compatibility shims are explicitly documented and have no user-facing exposure.
- Tests and CI verify module exports, runtime boot and the assistant request pipeline.
- A repository-wide scan reports remaining legacy strings with each occurrence classified as a compatibility identifier, data/schema key, historical record, test fixture or unresolved branding leak.
