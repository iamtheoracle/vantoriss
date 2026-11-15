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