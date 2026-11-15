# Vantoris — Master Completion Tracker

**Last reconciled:** 2026-11-15  
**Purpose:** one executive view of the founder-approved Vantoris institutional world. This tracker separates repository evidence from claims of live operation. It does not authorize merges, deployments, provider activation, financial operations or data migrations.

## Completion stages

1. **Finish building** — complete approved websites, applications, workspaces, data models and operating workflows.
2. **Pre-launch verification** — prove security, data integrity, workflow lifecycle, integrations, institutional separation, accessibility, recovery and test acceptance.
3. **Launch and operational readiness** — approved deployment, monitoring, maintenance, support, incident response, recovery and growth.

**Overall stage:** Stage 1 — Finish building. Some visual and backend foundations exist, but Stage 1 is not complete. Stage 2 has not been passed. Stage 3 has not started as a verified group-wide release.

## Portfolio identity boundaries

| Product / institution | Repository or application | Identity rule |
|---|---|---|
| Vantoris Group company website | `iamtheoracle/vantoriss`, branch `feat/vantoris-institutional-world` | Public group identity; branch is not merged. |
| Institutional Link / Group Headquarters | Base44 app `6af8b50525cd7f7bb57813cc` | Group coordination only; no unrestricted access to institutional or private banking records. |
| Ashcombe Private Bank | `iamtheoracle/ashcombe-private-bank` | Independent private bank, client identity, records, financial authority and operations. |
| Vantoris X Money | `iamtheoracle/vantoris-x-money` | Independent product; must not depend on Base44 and must not absorb VPI, AVCU or Ashcombe. |
| Vantoris Private Institution | Recovered source is present on branches inside `iamtheoracle/vantoris-x-money`; no separate authoritative repository verified | Keep distinct from X Money and AVCU. Current repository/branch arrangement is not sufficient proof of independent ownership/runtime. |
| AVCU | Existing member/operations application in `iamtheoracle/vantoriss` history and branches | American Vanguard Credit Union remains separate from Vantoris Private Institution and X Money. |
| T Market | Vantoris group division | Preserve section; original approved business model is not yet recovered. |

## Stage 1 — Finish building

### 1. Vantoris group identity, brand and public company website

**Status: PARTIALLY BUILT — unmerged feature branch.**

Repository: `iamtheoracle/vantoriss`  
Branch: `feat/vantoris-institutional-world`  
Last verified commit: `3114f21e355a85ba66aa73ec327a76170de7eb8e`

| Requirement | Status | Evidence / remaining work |
|---|---|---|
| Original emblem and wordmark | Built in branch | 12 SVG identity assets created. |
| Brand system | Built in branch | Midnight navy, warm ivory, antique brass and Instrument Serif direction documented. |
| Logo integration | Partially built | Group wordmark, favicon and social metadata integrated; staff/client portal artwork is not yet integrated into authenticated apps. |
| Company homepage | Built in branch | Responsive public homepage and navigation implemented; browser QA outstanding. |
| Institutional pages | Built in branch | About, History, Leadership, Institutions, Private Banking, T Market, Research, Heritage, Stories, Spirituality, Careers, News, Contact and Legal routes. |
| Editorial imagery | Partially built | Five source-attributed Unsplash editorial photographs integrated. |
| Verified history and leadership | Outstanding | Approved names, dates, milestones, biographies and source records needed. |
| Verified news and publications | Outstanding | No fabricated articles, interviews or announcements. |
| Contact/enquiry lifecycle | Outstanding | Working persistent enquiry submission, delivery, assignment and audit are not established. |
| Searchable content/archive | Outstanding | Public pages do not yet have persistent CMS/archive data models or search. |
| SEO | Partially built | Route-specific title/description, social metadata and robots policy added; domain-level indexing and canonical deployment checks outstanding. |
| Desktop/tablet/mobile QA | Not verified | Responsive styles exist; browser/device and accessibility tests not run. |

CI evidence:
- Feature run `43668057732`: targeted lint passed; full lint failed with 103 baseline errors; typecheck failed with 504 baseline diagnostics; production build passed.
- Unchanged-main baseline run `43667976492`: same 103 lint errors and 504 typecheck diagnostics; production build passed.
- `npm ci` reported 30 dependency vulnerabilities (1 low, 12 moderate, 17 high).
- No test script exists in this repository.
- Not merged or deployed.

### 2. Institutional Link — Group Headquarters

**Status: EXISTING APPLICATION; NEXT IMPLEMENTATION BLOCKED.**

Application: `6af8b50525cd7f7bb57813cc`.

Required workspace scope:
- Executive office, board/governance and group strategy.
- Departments, workforce, staff access and delegation.
- Institutional directory and coordination.
- Group reporting and validated institutional performance.
- Communications, documents, approvals and shared services.
- Risk/compliance oversight, internal audit coordination, legal affairs and operational monitoring.

Previously verified engineering checkpoint:
- Existing application and workspace structure are present.
- Last known lint/build passed.
- Last known typecheck had 17 diagnostics.
- Financial instruction approvals were configured for one approval in the inspected flow, not the required dual-control.
- Multi-step approval, target update and audit writes were not proven atomic.
- Full role matrix, cross-institution isolation, PostgreSQL/RLS and operational recovery were not verified.

**Blocker:** Base44 workspace sandbox-bridge access was reported paused because the workspace had exhausted integration credits. Do not retry until credits are restored. After access returns, re-read the app, current tracker and latest code before making changes.

### 3. Ashcombe Private Bank

**Status: SUBSTANTIAL IMPLEMENTATION IN MAIN; PRE-LAUNCH NOT VERIFIED.**

Repository: `iamtheoracle/ashcombe-private-bank`  
Main HEAD: `b79dfcaa49855f9c1dcebad44887b3c109f9127b`.

Current repository evidence:
- Next.js 15, TypeScript, Prisma, PostgreSQL and Auth.js.
- 14 committed Prisma SQL migrations and 20 test/spec files on main.
- Public institutional website and prospective-client/institutional enquiry flows.
- Persistent enquiries, conversations, messages, lifecycle history and audit events.
- Staff credentials authentication and protected administration.
- Separate client identity domain, invitation activation, database-backed authentication/lockout, actor-separated sessions and read-only active-account/posted-ledger overview.
- Client relationship and KYC case management foundations.
- Private document upload/scan/download and human verification code paths.
- Controlled account-opening and activation foundations.
- Payment instruction, approval and fund-reservation foundations.

Outstanding or unverified:
- MFA, recovery and per-device session management.
- Exact-money arithmetic and consistent staff actor-type enforcement in sensitive actions.
- Database-enforced RLS and immutable audit controls were not established in the reviewed migrations.
- External SEPA/SWIFT/ACH/direct-debit/payment rails are not live.
- Account approval/activation does not issue an IBAN or establish external banking connectivity.
- Client-visible transfers and complete balanced-ledger/payment settlement lifecycle remain incomplete.
- S3-compatible storage credentials/bucket and ClamAV service are not configured/live-verified.
- Document retention scheduling, legal-hold administration, version replacement/comparison and controlled deletion remain outstanding.
- Treasury, wealth, lending, complete reporting and remaining institutional operating systems remain outstanding.
- Applicable regulatory permissions, provider agreements, legal disclosures and operating authority require independent verification.

Open work:
- PR #55 staff identity/invitations.
- PR #56 payment operating/evidence documentation.
- PRs #54, #52, #49, #47, #46, #45 and other stacked feature branches also remain open.
- The latest sampled Actions run for PR #55 (`43658545487`) failed before a runner was allocated. The commit itself records that local checks were recorded, but PostgreSQL migrations were not replayed. Do not describe this as a passing CI run.
- An Ashcombe tracker exists on branch `engineering/build-tracker-foundation`; it is not on main. It records static source review, 14 migrations and 20 tests, but also records that local tests were not executed in that environment.

### 4. Vantoris X Money

**Status: BLOCKED — authoritative complete X Money source tree not established.**

Repository: `iamtheoracle/vantoris-x-money`  
Main HEAD at reconciliation: `792cfa325bdb778363433eb1c1783089c44b71f3`.

Main-branch findings:
- Partial Base44 shell; `@base44/sdk` and `@base44/vite-plugin` remain dependencies.
- `src/App.jsx`, `src/main.jsx`, `netlify/functions/member-auth.mjs` and the Vantoris X Money ledger specification were absent from main at inspection.
- Main contains an AVCU-labelled payment-control migration; it is not accepted as X Money's authoritative ledger.
- Main README itself says the full application tree is missing and Base44 configuration is required.

Working branch:
- `work/xmoney-independent-runtime` contains a tracker only; no X Money product code was changed.
- The tracker records that complete recovered branches overlap and are diverged from main.
- The large recovered branch `migration/remove-base44-and-codex` identifies its product in `package.json` as `vantoris-private-institution`, not X Money.
- Do not transplant the VPI code into X Money or remove Base44 from X Money by assumption.

Required next:
1. Establish an X Money-specific source manifest and complete source tree.
2. Obtain an executable checkout and run exact-HEAD baseline checks.
3. Remove Base44 only after full source recovery and route/feature preservation.
4. Establish independent X Money PostgreSQL, authentication, authorisation, ledger, migration, audit and recovery.
5. Test member/staff separation, lifecycle, idempotency, concurrency, approval and financial integrity.
6. Verify provider and settlement integrations only where contracts, credentials and evidence exist.

### 5. Vantoris Private Institution

**Status: SOURCE RECOVERED ON BRANCHES; INDEPENDENT PRODUCT/REPOSITORY BOUNDARY NOT VERIFIED.**

Recovered source:
- Repository currently named `iamtheoracle/vantoris-x-money`.
- Branch `work/private-institution-programme` has an open draft PR #4 targeting `recovery/merge-vantoris-live`.
- The recovered route register identifies 6 public/authentication routes, 35 member routes and 62 operations routes.
- It records 18 Base44 entity schemas, 11 server-function entry points, five SQL migrations and five test files.
- The branch `migration/remove-base44-and-codex` has successful build and institutional-ledger PostgreSQL Actions runs at commit `969531eb724ff37f77544a1b0f02abba2c51e37b`.

Critical boundary findings:
- These branches exist inside the X Money repository, not a separately verified VPI repository.
- The recovered SQL migrations are AVCU-labelled.
- The source inventory records client-side privilege helpers, missing generic server-authorised approval lifecycle, incomplete support persistence, unverified provider status and unverified investment entity contracts.
- The successful CI runs apply to that recovered branch/commit only; they do not prove independent VPI production deployment, live Base44 data, complete institution isolation or operational banking.

Required next:
1. Establish VPI's authoritative repository/application and ownership identity.
2. Separate VPI source, data, authentication, migrations, permissions and release pipeline from X Money and AVCU.
3. Reconcile every recovered route, entity, function, migration and existing approved capability.
4. Complete server-side authorisation, transactional approvals, audit, data isolation and operational lifecycle proof.

### 6. AVCU

**Status: SEPARATE EXISTING APPLICATION; NOT A VANTORIS PRIVATE INSTITUTION SUBSTITUTE.**

- Preserve American Vanguard Credit Union as its own institution.
- Existing member/operations routes and AVCU-related feature branches remain in the `iamtheoracle/vantoriss` repository history.
- AVCU-specific PRs and features must be reviewed in their own product scope.
- Do not move AVCU migrations, accounts, members, branding or operational authority into VPI or X Money.

### 7. T Market

**Status: PRESERVED; ORIGINAL APPROVED BUSINESS MODEL UNRESOLVED.**

Outstanding:
- Recover original purpose and founder-approved scope.
- Establish its independent identity and operating boundaries.
- Build only the workflows justified by that source specification.
- Do not invent a generic online shop, trading platform or payments business.

### 8. History, heritage, stories, publications, research, spirituality and philosophy

**Status: PUBLIC PRESENTATION STARTED; PERSISTENT CONTENT SYSTEMS NOT BUILT.**

Outstanding:
- Verified institutional history and dated milestones.
- Searchable heritage archive, timelines, biographies and collections.
- Separate Hambros Bank tribute with no succession or ownership implication.
- Source-linked photographs and documents with rights, provenance and verification metadata.
- Editorial records, author profiles, drafts, reviews, publication scheduling, revisions and archive.
- Research records with citations, source quality, evidence class, review status and competing interpretations.
- Separate spirituality/philosophy educational library with respectful treatment of different beliefs.
- Search, filters, media storage, permissions, lifecycle, moderation and audit.

## Stage 2 — Pre-launch verification

**Status: NOT PASSED GROUP-WIDE.**

Required for each independent application:
- Authentication, recovery, MFA, sessions and actor-type boundaries.
- Staff, client/member, administrator and executive permission matrix.
- Cross-institution and cross-client isolation tests.
- PostgreSQL migrations replayed from an empty database; constraints and transaction/concurrency tests.
- Maker-checker and dual approval lifecycle tests.
- Immutable audit and evidence traceability.
- Document access, malware scanning, retention and recovery.
- Financial ledger reconciliation, exact minor-unit arithmetic and settlement evidence where relevant.
- Integration failure, retry, idempotency and unavailable-state handling.
- Unit, integration, end-to-end, mobile, desktop, accessibility and performance testing.
- Dependency and security vulnerability remediation.
- Backup restoration, disaster recovery and incident exercises.
- Independent security review and documented acceptance.

A passing build, route inventory or successful branch CI run is not a substitute for these checks.

## Stage 3 — Launch and operational readiness

**Status: NOT STARTED AS A VERIFIED GROUP-WIDE RELEASE.**

Required:
- Founder-approved release scope and deployment plan for each independent product.
- Verified domains, DNS, TLS, hosting and production configuration.
- Verified legal identity, regulatory permissions, contracts and disclosures for any regulated service.
- Provider credentials and connection evidence; no implied live rails.
- Production database, secrets, encryption, backup schedule and demonstrated restoration.
- Monitoring, alerting, incident response, operational ownership and support runbooks.
- Staff onboarding, access reviews, approval delegation and offboarding.
- Release rollback and change-control procedure.
- Explicit founder release approval.
- Post-launch monitoring, maintenance and growth reporting.

## Priority order and dependencies

| Priority | Next work | Exit condition |
|---:|---|---|
| 1 | Restore Institutional Link access and continue its existing app | Current code/tracker inspected; core HQ workflows and institutional boundaries tested. |
| 2 | Reconcile VPI source identity and independent application boundary | Separate authoritative VPI source and data/permission ownership established. |
| 3 | Recover authoritative X Money source tree | X Money-specific source manifest and complete executable checkout. |
| 4 | Complete Ashcombe engineering baseline and merge-path reconciliation | Runnable baseline; open branches reconciled; CI and database tests pass. |
| 5 | Complete Vantoris public company website and verified content | Approved identity/content, enquiry lifecycle, search/archive and responsive QA. |
| 6 | Recover T Market approved specification | Founder-approved model before implementation. |
| 7 | Implement archive, editorial, research and spirituality systems | Persistent records, search, permissions, review and audit. |
| 8 | Complete institution-specific operating systems | All approved workflows have persisted lifecycle and audit evidence. |
| 9 | Complete group-wide security and acceptance | Required tests pass independently for every institution. |
| 10 | Prepare and approve launch | Deployment, monitoring, recovery, legal and operational gates pass. |

## Deferrals and blockers

| Item | Why deferred | Next action |
|---|---|---|
| Institutional Link implementation | Base44 workspace integration credits were exhausted; sandbox-bridge tools paused. | Restore credits; then inspect current app and resume. |
| VPI source integration | Current recovered code is hosted inside the X Money repository and includes AVCU-labelled migrations. | Establish independent VPI repository/source and perform file-level provenance reconciliation. |
| X Money implementation | Main is incomplete; recovered complete branch identifies as VPI. | Recover an X Money-specific source tree before implementation. |
| T Market build | Original business model not recovered. | Retrieve approved original specification. |
| Historical/editorial content | Verified names, dates, original sources and media rights not yet supplied/verified. | Populate only with evidenced content. |
| Live banking/payment rails | Provider, permissions, credentials and operational settlement evidence not established. | Keep disabled until independently approved and verified. |

## Evidence links

- Vantoris public implementation: https://github.com/iamtheoracle/vantoriss/tree/feat/vantoris-institutional-world
- Vantoris public implementation tracker: https://github.com/iamtheoracle/vantoriss/blob/feat/vantoris-institutional-world/docs/BUILD_TRACKER.md
- Vantoris Actions: https://github.com/iamtheoracle/vantoriss/actions
- Ashcombe main: https://github.com/iamtheoracle/ashcombe-private-bank
- Ashcombe tracker branch: https://github.com/iamtheoracle/ashcombe-private-bank/blob/engineering/build-tracker-foundation/docs/BUILD_TRACKER.md
- Ashcombe open work: https://github.com/iamtheoracle/ashcombe-private-bank/pulls
- X Money main: https://github.com/iamtheoracle/vantoris-x-money
- X Money tracker branch: https://github.com/iamtheoracle/vantoris-x-money/blob/work/xmoney-independent-runtime/BUILD_TRACKER.md
- VPI recovered route register: https://github.com/iamtheoracle/vantoris-x-money/blob/work/private-institution-programme/docs/route-preservation-register.md

## Reporting rule

For every task, record owner, dependency, source branch/commit, changed files, acceptance test, result and evidence. Use only these delivery states:

- Built
- Tested
- Security verified
- CI verified
- Committed
- Merged
- Deployed
- Operational

Never infer a later state from an earlier one.

## Dedicated workstream — Vantoris Base infrastructure

**Status: ARCHITECTURE REQUIREMENT ACCEPTED; AUTHORITATIVE BASE IMPLEMENTATION NOT YET IDENTIFIED OR VERIFIED.**

Base is a required platform workstream and a completion gate for the connected Vantoris ecosystem. It is not an optional afterthought, a fourth Institutional Link workspace, or a replacement for the independent institutional applications.

### Repository and application reconciliation

- A fresh inventory of repositories accessible to the connected GitHub account did not identify a repository explicitly named `vantoris-base` or `base`.
- The existing Institutional Link / Group Headquarters application remains identified as Base44 app `6af8b50525cd7f7bb57813cc`. Its previous engineering access was blocked because the Base44 workspace exhausted integration credits. Do not retry sandbox tools until access/credits are restored.
- The Vantoris group website repository is not evidence of a shared infrastructure runtime.
- The separate `iamtheoracle/oracle-control` repository describes a restricted Oracle Arc administrative control plane. It is not assumed to be Vantoris Base and must not be repurposed or merged without an explicit identity and architecture decision.
- No current evidence establishes a production Base runtime, shared service endpoints, tenant registry, common identity provider, shared PostgreSQL control plane, or connected application integrations.

### Required Base responsibilities

1. Identity foundation: authentication integration, account lifecycle, MFA, recovery, session inventory and revocation.
2. Organisation registry: Vantoris Group and independently registered institutions, each with immutable internal identifiers and explicit status.
3. Access control: central permission vocabulary and delegation policy, with authorisation enforced by each service and institution server-side.
4. Integration layer: authenticated APIs, service identities, scoped tokens, event contracts, webhook signing, replay protection and delivery observability.
5. Data infrastructure: PostgreSQL ownership boundaries, versioned migrations, encryption, backups and tested recovery.
6. Audit infrastructure: append-only, attributable records for consequential actions, with controlled access and retention.
7. Workflow engine: durable state transitions, maker-checker, dual approval, idempotency, concurrency control and cancellation/expiry handling.
8. Notifications: verified email delivery, templates, delivery state, retries and suppression controls.
9. Document infrastructure: private object storage, malware scanning, versioning, access grants, retention and legal hold.
10. Monitoring: service health, structured logs, metrics, traces, alert routing and incident records.
11. Administration: least-privilege platform operators, access reviews, break-glass controls and dual approval for privileged changes.
12. Oracle Arc integration: separately permissioned reasoning, tools, SPARK memory and ORBITS media; capability discovery must not be represented as proof of operational integration.

### Non-negotiable architecture boundaries

- Base may provide shared infrastructure and validated coordination; it must not become an unrestricted shared business database.
- Ashcombe Private Bank, Vantoris Private Institution, Vantoris X Money, AVCU and T Market retain independent identities, authoritative records, financial authority, permissions, ledgers and release controls.
- Group Headquarters receives only approved, purpose-limited reports and coordination events. It does not gain institution-level banking or operational authority by virtue of using Base.
- Shared authentication, if implemented, does not imply shared authorisation. Each application must validate its own actor, institution, resource, action and policy on the server.
- No institution may trust client-supplied roles, tenant IDs, account IDs or approval status.
- No shared ledger or financial settlement authority is introduced by Base.
- Base must support independent application failure and recovery; a Base outage must not corrupt institutional records or silently authorise consequential actions.

### Required architecture and acceptance evidence

| Area | Required evidence / acceptance |
|---|---|
| Ownership and topology | Verified repository/application owner, source branch, runtime, environment inventory, dependency map and service data-flow diagram. |
| Identity | Tests for account lifecycle, MFA, recovery, session rotation/revocation, service identities and institution-scoped claims. |
| Organisation registry | Migration-backed organisation records, uniqueness constraints, lifecycle and explicit institution membership; no implicit affiliation. |
| Authorisation | Server-side policy tests for cross-institution denial, least privilege, delegation expiry/revocation and privileged action separation. |
| APIs and events | Versioned contracts, authenticated service-to-service calls, scoped credentials, signed webhooks, replay/idempotency and retry/dead-letter behaviour. |
| PostgreSQL | Real PostgreSQL migrations from empty database, constraints, transaction/concurrency tests, backups and demonstrated restore. |
| Audit | Append-only audit records, actor/resource/action/correlation IDs, tamper-resistance controls and access tests. |
| Workflow | Atomic state transitions, maker-checker, dual-control enforcement, race/replay protection and full lifecycle tests. |
| Documents and notifications | Private storage, malware scan, access/version/retention tests, verified email and delivery/retry evidence. |
| Operations | Health checks, metrics, logs, alerts, incident runbooks, operator access reviews and recovery drills. |
| Application integration | Contract tests for every connected application; failure isolation; no direct database sharing across institutional boundaries. |
| Release | Per-environment configuration, secret rotation, migration/rollback plan, deployment evidence and explicit release approval. |

### Required application dependency register

Each application must declare whether it consumes a Base service, the exact API/event contract and version, its service identity, data exchanged, permission scope, failure behaviour and independent fallback. Initial candidates to reconcile are:

- Institutional Link / Group Headquarters — existing coordination application; access currently blocked pending Base44 workspace credits.
- Ashcombe Private Bank — independent application; integration must be explicit and must not move its client, banking or ledger authority into Base.
- Vantoris Private Institution — independent source/runtime boundary must first be established.
- Vantoris X Money — authoritative X Money source tree must first be recovered.
- AVCU — remains a separate institution; no VPI or X Money identity crossover.
- T Market — integration only after its approved business model and system boundary are recovered.
- Vantoris public website — public content and enquiry integration only; no privileged institutional data access.

### Execution sequence

1. Identify the authoritative Base product, repository/application and owner; inspect existing source and deployment configuration before creating or changing anything.
2. Recover Institutional Link access and inventory its existing services, workspaces, roles, data entities, integrations and current release state.
3. Map existing shared capabilities in each repository; classify each as Base-owned, institution-owned, duplicated, missing or unverified.
4. Produce a source-backed architecture/dependency map and migration plan that preserves existing functionality and data.
5. Implement the next approved Base dependency in the existing authoritative location; do not create a second Base.
6. Add real PostgreSQL, security, isolation, integration and recovery acceptance tests.
7. Connect each application only through explicit, versioned, least-privilege contracts.
8. Mark Base complete only when its own lifecycle and operations are verified and every connected application passes its independent integration and isolation acceptance suite.

**Current deferral:** Base implementation changes are deferred until the authoritative Base location is identified and Institutional Link access is restored. This is a discovery/access blocker, not a decision to omit Base. No new Base repository, service, database or deployment has been created.


## Execution update — 15 November 2026

### Base workstream opened

- GitHub issue #20: https://github.com/iamtheoracle/vantoriss/issues/20
- The dedicated Base section above records required services, architecture boundaries, application dependency register and acceptance evidence.
- No Base repository, service, database or deployment was created because the authoritative existing implementation has not yet been identified.
- Institutional Link access remains blocked by the previously reported Base44 workspace integration-credit restriction. No Base44 tools were retried.

### VPI / X Money source boundary work opened

- GitHub issue #5: https://github.com/iamtheoracle/vantoris-x-money/issues/5
- Added `docs/SOURCE_IDENTITY_BOUNDARY.md` on `migration/remove-base44-and-codex`.
- Commit: `b62b2b53d9b2f83242c66ba7f19a46ea2390c447`.
- Source inspection reconfirmed that this branch's `package.json` and README identify Vantoris Private Institution, while the repository's main README identifies X Money and reports that the full X Money application tree is missing.
- The recovered VPI README describes an independent Vantoris PostgreSQL ledger and separate member/staff authentication. It also states that the branch has not been merged to main or deployed.
- The route preservation register's five SQL migrations are AVCU-labelled. Their product/schema provenance remains unresolved; they must not be applied, renamed or transplanted until ownership is established.

### Vantoris website CI recheck

- Workflow run `43668457861` for the tracker-era website branch completed with **failure**.
- Targeted lint passed.
- Full repository lint failed.
- Typecheck failed.
- Production build passed.
- This matches the previously observed unchanged-main baseline of 103 lint errors and 504 typecheck diagnostics. Do not describe the branch as CI-passing.
- The latest documentation-only tracker commit has no reported combined commit statuses; this is not a substitute for a passing workflow.
- No merge or deployment was performed.

### Current blockers and next actions

1. Restore Institutional Link/Base44 workspace access; then inspect the existing app and map its real services before implementing Base-dependent changes.
2. Establish Vantoris Base's authoritative repository/application and owner from source and deployment evidence; do not infer that `oracle-control` or Institutional Link is Base itself.
3. Reconcile AVCU-labelled migration provenance and establish an independent VPI source/release boundary.
4. Recover a complete X Money-specific source tree before making X Money runtime changes.
5. Continue Ashcombe and Vantoris public-site work only on their own verified branches and preserve all existing work.


## Execution update — VPI source inventory and exact-head CI (15 November 2026)

The recovered VPI branch `iamtheoracle/vantoris-x-money:migration/remove-base44-and-codex` has now been inspected at source level.

### Inventory evidence

- 480 tracked Git tree entries.
- 328 entries under `src/` (application router, member workspace, operations workspace, identity context, UI components and styles).
- 62 entries under legacy `base44/` (18 entity schemas, 11 server-function entry points, shared payment code and older Oracle runtime files).
- 25 SQL migration files: bootstrap `000` and ordered migrations `001`–`024`.
- 9 Netlify function files.
- 12 test entries, including disposable PostgreSQL integration and concurrency/rollback tests.
- The separate `work/private-institution-programme` route register records 6 public/auth, 35 member and 62 operations routes. PR #4 remains a separate draft/open/unmerged VPI transformation branch; do not conflate its branch with the migration branch.

### Migration label reconciliation

The first five migration filenames retain an `avcu` label. Direct inspection of their SQL shows Vantoris-specific `vantoris_ledger` schema/tables/functions and Vantoris comments. CI provisions `vantoris_backend` as the restricted NOLOGIN role and a legacy `avcu_backend` CI login that inherits those Vantoris grants. The workflow verifies that inheritance. These labels are not proof that AVCU data or an AVCU ledger is being used. Original repository/migration provenance remains unresolved. Preserve existing migration filenames and SHA-256 history; do not rename or rewrite applied migrations.

### Exact-head CI evidence

On commit `b62b2b53d9b2f83242c66ba7f19a46ea2390c447`, both workflows completed successfully:

- [Vantoris institutional ledger PostgreSQL — run 43669234464](https://github.com/iamtheoracle/vantoris-x-money/actions/runs/43669234464): PostgreSQL 16 service, ordered migrations/checksums, least-privilege runtime role inheritance, ledger integration, concurrent transfer race, forced rollback, member-auth cryptography and migration contract tests all passed.
- [Recovery build check — run 43669234441](https://github.com/iamtheoracle/vantoris-x-money/actions/runs/43669234441): JavaScript syntax, migration runner/manifest, Oracle runtime checks, assistant and browser mutation guards, entity/security validation, Deno suites, ESLint, TypeScript typecheck and Vite production build all passed.

The detailed source inventory and CI evidence are recorded in [docs/SOURCE_IDENTITY_BOUNDARY.md](https://github.com/iamtheoracle/vantoris-x-money/blob/migration/remove-base44-and-codex/docs/SOURCE_IDENTITY_BOUNDARY.md), subsequently updated at commit `6459c1c3064bbce1222597f8d2ea080c2f6700c9`.

### Important boundary and outstanding work

- The `base44/` directory is legacy VPI application source; it is not Vantoris Base shared infrastructure.
- The VPI branch README states that active application configuration no longer depends on the Base44 SDK/Vite plugin, but legacy Base44 entity/function/runtime files remain to be archived or retired after parity and data continuity proof.
- The VPI source remains hosted on a branch inside the X Money repository. Independent VPI repository/application ownership is not verified.
- X Money `main` still reports its full source tree missing. No VPI code is to be used to fill that gap.
- No production database migration, member-data import, merge or deployment occurred. Successful disposable PostgreSQL CI does not prove live banking or production readiness.


## Execution update — adjacent platform foundations reconciled (15 November 2026)

### Oracle Control — separate Oracle Arc control plane, not Vantoris Base

A fresh inspection found an implementation branch in `iamtheoracle/oracle-control`:

- Branch: `implementation/security-control-foundation`
- Commit: `a582da17bedbde0c0082ec1bf82f31ddebf961c9`
- 34 tracked tree entries.
- Includes two PostgreSQL migrations, shared DB/auth/TOTP functions, login/logout/session endpoints, operator creation script, UI, and authentication/migration/TOTP tests.
- Its architecture explicitly states that it has its own deployment, database, secrets, session authority, operator enrollment and recovery procedure, and that no cross-application trust is implied.
- Exact-head CI passed: [run 38228079916](https://github.com/iamtheoracle/oracle-control/actions/runs/38228079916), including Node syntax checks, PostgreSQL migrations, tests and migration rerun.
- Default `main` contains only README; the implementation is on the separate branch.

**Boundary:** this is Oracle Arc's restricted administrative control plane, not an identified Vantoris Base implementation. It must remain independently deployed and governed unless the founder explicitly approves a specific, scoped integration. Do not transplant its authentication, database or operator authority into Base or institutional applications by assumption.

### Oracle Investment Platform — separate financial platform

A separate branch exists in `iamtheoracle/oracle-investment-platform`:

- Branch: `implementation/ledger-foundation`
- Commit: `1d0b7cd15e360c295a95f519583df775328d065d`
- 29 tracked tree entries.
- Includes separate finance authentication endpoints, PostgreSQL migrations, financial ledger, investor profile, statements, valuations, reconciliation, approvals and audit foundation.
- Its architecture explicitly requires its own URL, authentication/session authority, database, secrets, administration, deployment and audit trail, and says it is not a module of The Arc Space or Oracle Control.
- Exact-head CI passed: [run 38228061911](https://github.com/iamtheoracle/oracle-investment-platform/actions/runs/38228061911), including PostgreSQL migrations, tests and migration rerun.
- Default `main` contains only README; implementation is on the separate branch.

**Boundary:** this is a separate investment platform, not Vantoris Base and not an institutional ledger for Ashcombe, VPI, X Money or AVCU. Do not merge or reuse its accounts, investor records, permissions or financial authority without explicit approval.

### Base reconciliation consequence

The repositories above demonstrate that useful independent foundations exist, but neither identifies the authoritative Vantoris Base. Base discovery remains open. The existing Institutional Link / Group HQ app is still the known Base44 application and its sandbox access remains blocked pending restored workspace integration credits. The next Base step is still to recover that application's access and map its actual existing services, while preserving the independent systems listed above.

### Current VPI CI recheck

The updated VPI source-boundary document at commit `6459c1c3064bbce1222597f8d2ea080c2f6700c9` triggered fresh workflows:
- Recovery build check: [run 43670364151](https://github.com/iamtheoracle/vantoris-x-money/actions/runs/43670364151).
- PostgreSQL ledger: [run 43670364153](https://github.com/iamtheoracle/vantoris-x-money/actions/runs/43670364153).

Both were still in progress at the last inspection. The prior exact-head pair on commit `b62b2b53d9b2f83242c66ba7f19a46ea2390c447` had passed. Do not claim the newer commit passed until these two runs complete.
