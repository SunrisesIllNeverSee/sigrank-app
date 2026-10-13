# SignalAF site audit — AUDIT_RESULTS.md

Audit of the staged rebuild `integration/site-a315435` (preview http://localhost:3230).
Findings recorded per owner format: URL | Issue | Severity | Reproduction | Implemented fix or recommendation | File/line | Commit | Verification | Remaining work.

## Deployment status (checked 2026-10-13)

- **signalaf.com serves `54484c7`** — Oct-10 baseline + PR #243 markdown-404 fix. **REBUILD NOT DEPLOYED.** Missing staging work: 69 commits / 364 files / +44,356 (−3,565), incl. 7 new routes (`/articles`, `/sigrank`, `/hall/badges`, `/s/[codename]`, `/share/four-degrees`, `/editor/review`, `/wiki/metrics/scale-v`), board/profile/compare redesign, badge + share systems, migration 0052.
- All findings below are **staging findings** against commit `1a505a0` unless noted.

## Site map (staging, 235 routes swept)

`TOTAL 235 · OK 234 · non-200: /search (intentional — flag-gated rollout shell)`

Groups: `/` (leaderboard), `/board/{7d,30d,90d,all}`, `/user/[codename]`, `/compare`, `/hall`, `/hall/badges`, `/s/[codename]`, `/sigrank`, `/field`, `/fieldhub`, `/wiki/*`, `/articles`, `/blog/*`, `/guides/*`, `/tools/*`, `/vs/*`, `/alternatives/*`, `/standard`, `/science`, `/research`, `/about`, `/faq`, `/contact`, `/pricing`, `/upgrade`, `/login`, `/me/edit`, `/editor/review` (dev-only), `/search` (flagged), plus 150+ SEO/AEO editorial routes (intentional per AGENTS.md — excluded from dead-link review).

## Findings

| # | URL | Issue | Severity | Reproduction | Implemented fix / recommendation | File/line | Commit | Verification | Remaining |
|---|-----|-------|----------|--------------|----------------------------------|-----------|--------|--------------|-----------|
| F-1 | /login (+ every page) | `.lbw-root button` + `.lbw-root a` resets (specificity 0,1,1) override all Tailwind `bg-*`/`text-*`/`underline` utilities on buttons/links sitewide. "Email me a magic link" loses `bg-gold`+`text-bg-base` → renders as plain text, not a CTA. "Continue with GitHub" loses `bg-elevated` fill (outline survives via `button.border` restore). | HIGH | localhost:3230/login — computed bg `rgba(0,0,0,0)` + `color:inherit` on both OAuth buttons and gold submit. | `:where()`-wrap the three resets → specificity (0,0,x); utilities win, unclassed proto elements keep resets. | components/live/proto-scoped.css:80-82 | pending | Computed styles verified in-browser: gold fill `rgb(224,178,64)` + dark text `rgb(8,16,13)` restored; GitHub `1px solid` outline retained; /board/all proto buttons unchanged (sbtn/laybtn/avatar class rules unaffected). | none |
| V-1 | /search | Returns 404. | — | curl 404 | Verified INTENTIONAL: `exchange_search` PostHog flag gates `notFound()`; nav link also hidden when flag off. Rollout shell, not a defect. | app/search/page.tsx:22-24 | — | code inspection | none |
| V-2 | /login | Owner checklist: "confirm this control retains the thin solid outline" (Continue with GitHub, 750×662). | — | playwright @750×662 | Verified: `1px solid rgb(38,54,28)` — thin solid outline present and visible. RESOLVED — owner item closed. | components/auth/LoginButtons.tsx:77-78 | — | screenshot /tmp/audit-login-github-btn.png | none |

*More findings land here as the three audit lanes (wiring trace, interaction flows, link inventory) report back.*
