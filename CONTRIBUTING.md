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
| Build      | `npm run build`                                   | Production build succeeds (31 routes)                              |
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
- **MO§ES SEED values** — `(1_251_211, 11_296_121, 128_196_310, 2_555_179,769)`.
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

CI runs several automated checks on every PR and on a schedule. Here's who
triages what and how to handle findings.

### CodeQL alerts (Security tab)

- **What:** Static analysis findings for JS/TS (taint flows, injection, crypto
  misuse). Runs on every PR + weekly on Monday.
- **Who triages:** the repo owner (or any maintainer with Security tab access).
- **How to triage:**
  1. Open the Security tab → Code scanning alerts.
  2. For each alert: read the description, check if it's a true positive.
  3. **True positive:** fix the code, push, the alert auto-closes.
  4. **False positive:** click "Dismiss" → choose "Used in tests" or "Not
     exploitable." Add a comment explaining why.
- **CodeQL build-mode:** this repo uses `build-mode: none` (analyzes source
  directly, no Next.js build needed). This is faster and independent of build
  env vars, but may miss issues introduced by the build step (bundled/transformed
  code). If you see false negatives, consider switching to autobuild for a
  subset of runs.

### Dependabot PRs

- **What:** Weekly PRs for npm packages + GitHub Actions versions. Security
  advisories open PRs immediately.
- **Who triages:** any maintainer.
- **How to triage:**
  1. Check if CI passes on the Dependabot PR.
  2. **Patch updates** (grouped): merge if CI is green.
  3. **Minor updates:** review the changelog, merge if no breaking changes.
  4. **Major updates:** review carefully — may break the build. Test locally
     before merging.
  5. **Security advisories:** prioritize over feature work. Merge the same day
     if CI is green.
- **Auto-merge:** not enabled by default. To enable, go to repo Settings →
  General → "Allow Dependabot auto-merge" + set the auto-merge policy in
  `.github/dependabot.yml`. Only enable for patch/minor after CI passes.

### Gitleaks (secret scan)

- **What:** Scans every commit for leaked keys/tokens. Runs on every PR with
  full history (`fetch-depth: 0`).
- **False positives:** the `.github/gitleaks.toml` config allow-lists test
  fixtures, seed data, and ed25519 public keys. If a new false positive
  appears, add the path/pattern to the allow-list and push.
- **True positive:** if gitleaks finds a real secret, **do not just remove it
  and push** — the secret is in git history. Rotate the secret immediately,
  then use `git filter-repo` or BFG to scrub history.

### Branch protection (owner action)

Branch protection is configured in GitHub UI (Settings → Branches), not in
code. The recommended rules for `main`:

- Require CI (build job) to pass before merge.
- Require CodeQL to pass.
- Require dependency-audit to pass.
- Require at least 1 review for PRs from external contributors.
- Allow force-push: **No**.
- Allow deletions: **No**.

## Questions?

- Open an issue on this repository.
- Read [AGENTS.md](./AGENTS.md) for the full agent orientation guide.
- Read [AUDIT.md](./AUDIT.md) for known bugs and improvement areas.

## License

By contributing to SigRank, you agree that your contributions will be licensed
under the [MIT License](./LICENSE).
