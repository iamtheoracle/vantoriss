# Vantoris Institutional World — Build Tracker

## Repository baseline

- Repository: `iamtheoracle/vantoriss`
- Default branch at inspection: `main`
- Baseline commit: `530184f1ad9d52766f359d77ded0c1cfc9bff51a` (2026-11-09)
- Application: Vite + React + React Router + Base44 SDK/plugin.
- Baseline tracked paths: 519.
- Existing member and operations routes are protected and must be preserved.
- Existing vector brand components: `src/components/vantoris/brand/`.
- Existing public assets: only `public/_redirects`; no integrated photography collection.
- No existing `BUILD_TRACKER.md` was found in the repository.
- Baseline CI status for the inspected main commit: no status checks returned by GitHub.
- Baseline verification branch created from the unchanged main source: `verify/vantoris-main-baseline-20261115`.
- Baseline Actions run: `43667976492` — `npm ci` passed; full lint failed with 103 existing unused-import errors; typecheck failed with 504 existing diagnostics; production build passed.
- Feature branch Actions run: `43667889756` at `0c8276102763e66b209e13a28cbaa91988b27407` — targeted ESLint for `src/App.jsx`, `InstitutionalSite.jsx` and `institutionalMedia.js` passed; full lint failed with the same 103 errors; typecheck failed with the same 504 diagnostics; production build passed.
- `npm ci` reported 30 dependency vulnerabilities (1 low, 12 moderate, 17 high); no automatic dependency changes were made.
- The package has no test script. Browser, accessibility, authentication and end-to-end tests have not been run.

## Identity and system boundaries

- This repository currently contains a Vantoris member/operations financial application. Its exact relationship to the Vantoris Private Institution organisation must not be inferred from the repository name.
- The Institutional Link Base44 app is the separate Group Headquarters project.
- Ashcombe Private Bank is maintained in `iamtheoracle/ashcombe-private-bank`.
- American Vanguard Credit Union is a separate institution and must not be treated as Vantoris Private Institution.
- No merge, deployment, Base44 publish, provider activation or real-money operation is authorised by this work.

## T Market

The existing source inspection did not establish an approved T Market business model. The public section is preserved as a distinct division, explicitly marked as awaiting verified founder direction. No generic shop or payment flow is being invented.

## Current branch work

Branch: `feat/vantoris-institutional-world`

- [x] Public institutional website and responsive routes — implemented; production build passed; browser and end-to-end verification outstanding.
- [x] Public brand asset pack — 12 SVG marks/templates created; group wordmark integrated into the public website and favicon/social metadata. Staff/client portal lockups are artwork only and are not yet integrated into the existing authenticated application.
- [x] Sourced editorial photography and attribution records — five Unsplash editorial images integrated with photographer, source, caption and usage-boundary metadata.
- [ ] Full company history, approved leadership directory, verified news, stories and publication content. The public pages deliberately show no invented names, dates, milestones, interviews or announcements.
- [ ] Group Headquarters implementation in Institutional Link (blocked: Base44 sandbox-bridge tools are paused because the workspace is out of integration credits; do not retry until credits are restored).
- [ ] Ashcombe public site and private portal work in its own repository. Audit only in this pass; no Ashcombe files changed. Existing public home/enquiry flows and separate client portal were inspected.
- [ ] Vantoris Private Institution workspace source/application identity verification.
- [ ] Searchable heritage, stories, research and spirituality publishing data models.
- [ ] PostgreSQL architecture, migrations, RLS and cross-institution isolation.
- [ ] Workflow lifecycle, maker-checker, audit, operations and recovery proof.
- [ ] End-to-end, accessibility, mobile, security and CI verification.

## Public website implementation status

- Public routes: home plus 14 institutional pages (About, History, Leadership, Institutions, Private Banking, T Market, Research & Intelligence, Heritage, Stories & Publications, Spirituality & Philosophy, Careers, News, Contact and Legal).
- The public site is served to visitors without an authentication token; the existing authenticated member/operations route tree remains in place.
- Five sourced Unsplash photographs are editorial references only, not Vantoris properties or evidence of historical events.
- T Market remains non-transactional until its original approved business model is recovered.
- Leadership, history, news and contact details remain unpopulated where approved evidence or contact channels were not found.
- The website does not yet provide a searchable CMS/archive, editorial database, live enquiry form or operating workflow.

## Next dependency

The next approved dependency is Group Headquarters in Institutional Link. Resume only after the Base44 workspace integration credits are restored. Then implement and verify the three separate workspaces and their authorisation boundaries. The exact Vantoris Private Institution source application remains to be verified; do not substitute AVCU. Ashcombe remains a separate repository and institution.
