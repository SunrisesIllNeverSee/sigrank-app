# Contributing to SigRank

SigRank is a privacy-preserving leaderboard that scores AI operators on token
cascade efficiency. The app is live at [signalaf.com](https://signalaf.com).
Contributions are welcome — bug fixes, new pages, scoring improvements,
visualization upgrades, documentation.

## The one rule

**You must understand your change.** If you cannot explain what your code does
and how it interacts with the rest of the project, the PR may be closed.

Using AI tools is fine. Submitting generated output that you have not reviewed
and cannot explain is not.

## Getting started

```bash
git clone https://github.com/SunrisesIllNeverSee/sigrank-app.git
cd sigrank-app
npm install
cp .env.example .env.local   # fill in Supabase + Stripe values when available
npm run dev
```

Visit http://localhost:3000.

The app builds and renders fully **without** any Supabase or Stripe credentials.
With no creds, the data facade serves deterministic mock data — so you can
develop and test without a backend.

## How to contribute

1. **Fork** the repository.
2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b fix/my-bug-fix
   ```
3. **Make your changes** — keep commits focused and descriptive.
4. **Run the gates** (all three must pass before opening a PR):
   ```bash
   npx tsc --noEmit                          # 0 TypeScript errors
   npm run build                             # production build green
   node --test __tests__/ingest/canonical.test.mjs   # 11/11 canonical tests
   ```
5. **Open a pull request** with a clear summary of what changed and why.

### Branch naming

- `fix/<short-description>` — bug fixes
- `feat/<short-description>` — new features
- `docs/<short-description>` — documentation only
- `refactor/<short-description>` — code restructuring, no behavior change

### Commit style

One job per commit. Don't batch unrelated changes. Focus on _why_, not _what_:

```
fix(board): remove soft-404 /board/off from sitemap

The /board/off slug was listed in the sitemap but returned a 404 because
it's not in BOARD_WINDOWS. Replaced with /board/everything which is the
actual default board page.
```

## Quality gates

Every PR must pass all three gates before merge:

| Gate       | Command                                           | What it checks                                                     |
| ---------- | ------------------------------------------------- | ------------------------------------------------------------------ |
| TypeScript | `npx tsc --noEmit`                                | 0 type errors (strict mode)                                        |
| Build      | `npm run build`                                   | Production build succeeds                                          |
| Canonical  | `node --test __tests__/ingest/canonical.test.mjs` | 11/11 tests pass — the MO§ES Υ invariant (18436.98) + scoring math |

These are non-negotiable. If any gate fails, the PR will not be merged.

## What to work on

### Good first issues

- Fix bugs listed in [AUDIT.md](./AUDIT.md) (30 findings, 7 P1)
- Improve visual density (font antialiasing, tabular numbers, chart line weight)
- Add missing cascade metrics to the metrics page (Velocity, SDOT, SDRM, DR%)

### Areas that need contributions

- **Scoring engine** — new heuristics, anti-gaming rules, RS.xx weight calibration
- **Visualization** — charts, radar plots, trajectory graphs (Recharts)
- **Operator profiles** — richer profile pages with cascade breakdowns
- **Wiki content** — methodology pages, operator guides
- **SEO** — structured data, sitemap coverage, internal linking

### What NOT to change without discussion

- **The Υ formula** — `(cache_read × output) / input²` is a frozen invariant.
- **RS.xx scoring weights** — server-only, marked `OPERATOR_OVERRIDE_REQUIRED`.
- **MO§ES SEED values** — `(1_251_211, 11_296_121, 128_196_310, 2_555_179_769)`.
- **The cascade identity** — `T × C × R = Cr/I = Leverage`.

These are the mathematical foundation of SigRank. If you want to change them,
open an issue first to discuss the rationale.

## Code conventions

- **Server Components by default.** Add `'use client'` only to files that use
  hooks, handlers, or browser APIs.
- **Scoring weights are server-only.** `lib/scoring/ruleset.ts` imports
  `server-only`; the RS.xx weights must never be imported into a client component.
- **Placeholder vs real values.** Every placeholder number is wrapped in
  `<Placeholder/>` (gold ★ superscript + tooltip). Real values get a canonical-id
  superscript via `<CanonId/>`.
- **Deterministic data.** No random-number generation or wall-clock reads at
  module scope.
- **Design tokens.** `components/sigrank/tokens.ts` is the source of truth for
  colors and fonts. Keep the Tailwind theme in `tailwind.config.ts` in sync.
- **No secrets in the repo.** Keys live in `.env.local` (gitignored). Never
  commit API keys, Supabase service role keys, or Stripe secret keys.

## AI-assisted contributions

AI-assisted code is explicitly welcome — SigRank is built by and for AI agents.
However:

- **You must review every line** your AI tool generates.
- **You must be able to explain** what the code does and why.
- **Run the gates yourself** — don't trust the AI's claim that "it builds."
- **Test the change locally** — verify the affected pages render correctly.

Unreviewed AI output that fails the gates or introduces regressions will be
closed without merge.

## CI triage playbook

**What actually runs:** `.github/workflows/ci.yml` — one `verify` job on every
PR to `main` and every push to `main`:

| Check | Command | Fails when |
| ----- | ------- | ---------- |
| Repo hygiene | `node scripts/check-repo-hygiene.mjs` | a tracked symlink breaks, or a file is both tracked and ignored |
| Type check | `npx tsc --noEmit` | any type error |
| Canonical | `npm run test:canonical` | a contract test fails |

Nothing else is enforced. The wider suite was archived in PRs #108/#114 and
lives at `_archived/workflows/` — **the subsections below are reference
material for checks that are NOT currently running.** They preserve triage
knowledge in case a workflow is restored; do not assume they protect your PR
today.

### CodeQL alerts (Security tab) — ARCHIVED, not running

Workflow file: `_archived/workflows/codeql.yml` (was: every PR + weekly
Monday). If restored — how to triage:

1. Open the Security tab → Code scanning alerts.
2. For each alert: read the description, check if it's a true positive.
3. **True positive:** fix the code, push, the alert auto-closes.
4. **False positive:** click "Dismiss" → choose "Used in tests" or "Not
   exploitable." Add a comment explaining why.

The archived workflow used `build-mode: none` (analyzes source directly, no
Next.js build needed) — faster and independent of build env vars, but may
miss issues in bundled/transformed output.

### Dependabot PRs — ENABLED

Vulnerability alerts and automated security updates are enabled at the repo
level (PR-3C). `.github/dependabot.yml` schedules weekly version-update PRs
(Mondays) for npm and GitHub Actions — patch releases arrive grouped in one
PR. How to triage:

1. Check if CI passes on the Dependabot PR.
2. **Patch updates** (grouped): merge if CI is green.
3. **Minor updates:** review the changelog, merge if no breaking changes.
4. **Major updates:** review carefully — may break the build. Test locally
   before merging.
5. **Security advisories:** prioritize over feature work. Merge the same day
   if CI is green.

Auto-merge is not enabled. To enable: repo Settings → General → "Allow
Dependabot auto-merge" + policy in `.github/dependabot.yml`.

### Gitleaks (secret scan) — ARCHIVED, not running

Was a job in the old `_archived/workflows/ci.yml`. The `.github/gitleaks.toml`
allow-list config remains in place for reuse. **If a real secret is ever
committed** — with or without a scanner — do not just remove it and push: the
secret is in git history. Rotate it immediately, then scrub history with
`git filter-repo` or BFG.

### Branch protection (owner action)

Branch rules live in GitHub UI (Settings → Rules → Rulesets), not in code.
Current state: the `main-guardrails` ruleset is active on `main` and already
blocks force-pushes and branch deletion — but does **not** require reviews or
status checks.

Recommended additions for `main`:

- Require the CI check `hygiene + types + canonical tests` to pass before merge.
- Require at least 1 review for PRs from external contributors.
- Keep: no force-push, no deletions (already enforced by `main-guardrails`).

## Snapshots & rollback

- **Production rollback:** Vercel deployments — any prior deploy can be
  redeployed instantly.
- **Repo recovery:** git history + milestone/release tags. The automated
  5-day snapshot tag/release job is **retired**; existing tags and releases
  are preserved. See `Devins_Plans/repo-cleanup/PR-3A-SNAPSHOT-RETIREMENT.md`.
- **Before high-risk repo operations** (bulk cleanup, dependency surgery):
  create + push a manual annotated tag —
  `git tag -a pre-<operation>-YYYY-MM-DD -m "baseline before <operation>" && git push origin <tag>`.
- **Data:** none of the above covers Supabase state — database backups are
  managed on the Supabase side, not via repo tags.

## Questions?

- Open an issue on this repository.
- Read [AGENTS.md](./AGENTS.md) for the full agent orientation guide.
- Read [AUDIT.md](./AUDIT.md) for known bugs and improvement areas.

## License

By contributing to SigRank, you agree that your contributions will be licensed
under the [MIT License](./LICENSE).
