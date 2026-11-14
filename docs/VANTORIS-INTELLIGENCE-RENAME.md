# Vantoris Intelligence naming and release note

## Canonical terminology

- Core reasoning and orchestration runtime: **Vantoris Intelligence**
- Customer-facing assistant: **Vantoris Advisor**
- User-facing conversational interface: **Bud**
- Governance and authorization: **Guardian**
- Capability orchestration: **Nexus**
- Reasoning/model interaction: **Spark**
- Deferred work scheduling: **Orbit**

These are distinct responsibilities. Renaming the former Oracle runtime does not merge, remove, or grant additional permissions to any component.

## Code changes in this branch

- Replaced the former runtime module with `base44/shared/runtime/intelligence.ts`.
- Exported `createVantorisIntelligence` from the runtime index.
- Boot now exposes `runtime.vantorisIntelligence`.
- Added the `vantorisIntelligence` Base44 function endpoint.
- Updated Bud's backend contract and Spark's response-event target.
- Updated the customer-facing assistant heading and processing label to Vantoris Advisor / Vantoris Intelligence.
- Removed the old runtime module and old `oracleRuntime` function entry.

## Release and migration requirements

- This branch has not been published to Base44 or deployed.
- Before publishing, inspect every Base44 frontend function invocation and configured workflow for the old `oracleRuntime` function name; update any runtime invocation to `vantorisIntelligence`.
- Publish the new function and frontend together. Do not assume GitHub commits alone deploy Base44 functions.
- Verify health action, normal conversational requests, denial behavior, recommendation persistence, audit logging, and deferred-job scheduling in a non-production environment.
- Verify existing conversations and agent configuration remain intact. The Base44 agent identifier `vantoris_assistant` is intentionally retained to avoid breaking stored conversations.
- Do not migrate historical audit/event rows by destructive rewrite. If historical display normalization is required, add a read-time label mapping and preserve original event records.
- No financial, admin, or private-data permissions are expanded by this naming change.
