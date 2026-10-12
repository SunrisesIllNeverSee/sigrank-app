# User Profile V2 — BUILT CANDIDATE, NOT RELEASE APPROVED

Route: /user/[codename]; /user/the-field returned HTTP 200 locally.
Authoritative modified files: app/user/[codename]/page.tsx and ProfileBody.tsx.
Seven V2 modules: components/profile-v2/; committed in shared source ba29f02.
Mock HTML previews: _workspace/profile-mocks/ (17 files).
Original planning documents: docs/PROFILE_PAGE_MAP.md and docs/PROFILE_REDESIGN_PROMPT.md; these predate the current implementation.
Candidate source archive and route diff patch preserved here. Never overwrite newer code from this capture.

## Tab implementation inventory
- [x] Overview — OverviewView and IdentityHero.
- [x] Stats — StatsView.
- [x] Analysis — AnalysisView.
- [x] Report — existing ReportTabGate (owner gated).
- [x] Lab — existing LabTabGate (owner gated).
- [x] Submissions — SubmissionsView.
- [x] Social — SocialView.
- [ ] All seven tested in browser on real ranked/pending profiles, with owner confirmation.

## Blocking gates
- [ ] watchCount=0 placeholder in ProfileBody.tsx is still present; resolve or visibly qualify.
- [ ] Validate public/private/unclaimed/claimed/owner/report/lab visibility and no private-data leakage.
- [ ] Preserve streaming header behavior and explain changes from prior header-first critical path.
- [ ] Verify current mocks parity, responsive layout and keyboard/tab focus.
- [ ] Test profile with empty history, unranked/single submission, retired/no-data cases.
- [ ] Scoped TypeScript/Eslint, performance, CI and independent source review.
- [x] Owner authorized preservation/source commit; shared source and R1–R4 archives saved in ba29f02.
- [ ] Owner design and release approval, deployment/rollback gates.

State: V2 SOURCE PRESENT AND WIRED LOCALLY; NOT RELEASE-READY. DEPLOYED NO.

## Current checkpoint — October 12, 2026

Shared source committed: ba29f02. Four-column integration: 9deca2a; latest R4 import: 37d5f7e. TypeScript, scoped ESLint and canonical 11/11 passed for source; integration also passed production build and public-tab browser checks. Detailed inspector/design parity and full owner/privacy acceptance remain open. No release signoff or deployment.
