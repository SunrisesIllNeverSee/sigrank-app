# Contributing to SigRank

Thanks for your interest in contributing. SigRank is a privacy-preserving AI
operator leaderboard, and this repo is intentionally strict about scoring
correctness, secrets, and deterministic fallbacks.

## Quick start

```bash
git clone https://github.com/SunrisesIllNeverSee/sigrank-app.git
cd sigrank-app
npm install
npm run dev
```

The app builds and renders without Supabase or Stripe credentials. With no live
credentials, reads fall back to the cold-store snapshot and deterministic mock
data.

## Before you commit

All three local gates must pass:

```bash
npx tsc --noEmit
node --test __tests__/ingest/canonical.test.mjs
npm run build
```

CI also runs (in addition to the above + cross-repo contract tests):

- **Secret scan** (gitleaks) — never commit real keys/tokens; `.env.example`
  placeholders are allowlisted.
- **CodeQL** — static analysis on JS/TS; fix or dismiss alerts it raises on your PR.
- **Dependency audit** — `npm audit` fails on high/critical advisories (moderate
  is reported only). If your PR bumps a dep with a high/critical advisory, CI blocks.

## Frozen invariants

Do not change these without explicit owner approval:

- **MO§ES SEED values:** `(1_251_211, 11_296_121, 128_196_310, 2_555_179,769)` -> Υ 18436.98
- **The Υ formula:** `(cache_read * output) / input^2`
- **The cascade identity:** `T * C * R = Cr/I = Leverage`
- **10xDEV:** `log10(Leverage)`
- **RS.xx weights:** server-only, never exposed in client components

## Conventions

- One job per commit. Don't batch unrelated changes.
- Match surrounding code style.
- No secrets in the repo. Keys live in `.env.local` (gitignored).
- Scoring weights are server-only (`lib/scoring/ruleset.ts` imports `server-only`).
- Read operator data through `@/lib/data`; do not import Supabase directly in
  feature code.
- Keep placeholder and canonical markers explicit with `<Placeholder />` and
  `<CanonId />`.
- Keep `components/sigrank/tokens.ts` and Tailwind theme values aligned.

## Pull request checklist

- Explain the user-visible change and why it matters.
- Note any database, env var, billing, or scoring impact.
- Include screenshots for visual changes.
- Confirm typecheck, canonical test, and build status.

## Pull requests

Use the PR template and keep the diff focused. If a check is skipped, explain
why in the PR notes.
