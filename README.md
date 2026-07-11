# SigRank

> **🏆 SigRank is live: [signalaf.com](https://signalaf.com)** — the leaderboard for how
> efficiently you use AI, not how much. Run `npx sigrank` to see your cascade now.
> _Token counts only. Never your prompts._

<div align="center">

<p><img src="./.github/assets/og-card-v2.png" alt="SigRank — the new standard in AI evaluation &amp; benchmarks" width="800"></p>

**A privacy-preserving leaderboard for AI operator efficiency.**

Most platforms reward volume. SigRank rewards structure.

[![CI](https://github.com/SunrisesIllNeverSee/sigrank-app/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/SunrisesIllNeverSee/sigrank-app/actions/workflows/ci.yml)
[![CodeQL](https://github.com/SunrisesIllNeverSee/sigrank-app/actions/workflows/codeql.yml/badge.svg?branch=main)](https://github.com/SunrisesIllNeverSee/sigrank-app/actions/workflows/codeql.yml)
[![audit](https://github.com/SunrisesIllNeverSee/sigrank-app/actions/workflows/dependency-audit.yml/badge.svg?branch=main)](https://github.com/SunrisesIllNeverSee/sigrank-app/actions/workflows/dependency-audit.yml)
[![Dependabot](https://img.shields.io/badge/Dependabot-enabled-025E8C?style=flat-square&logo=dependabot)](https://github.com/SunrisesIllNeverSee/sigrank-app/network/dependencies)
[![coverage](https://img.shields.io/badge/coverage-c8-brightgreen.svg?style=flat-square)](https://github.com/SunrisesIllNeverSee/sigrank-app/actions/workflows/ci.yml)
[![Lighthouse](https://github.com/SunrisesIllNeverSee/sigrank-app/actions/workflows/lighthouse.yml/badge.svg?branch=main)](https://github.com/SunrisesIllNeverSee/sigrank-app/actions/workflows/lighthouse.yml)
[![E2E](https://github.com/SunrisesIllNeverSee/sigrank-app/actions/workflows/e2e.yml/badge.svg?branch=main)](https://github.com/SunrisesIllNeverSee/sigrank-app/actions/workflows/e2e.yml)
[![live](https://img.shields.io/badge/live-signalaf.com-gold.svg?style=flat-square)](https://signalaf.com)
[![npm](https://img.shields.io/npm/v/sigrank.svg?style=flat-square&color=gold&label=sigrank)](https://www.npmjs.com/package/sigrank)
[![deploy](https://img.shields.io/badge/deploy-Vercel-black.svg?style=flat-square)](https://vercel.com)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg?style=flat-square)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue.svg?style=flat-square)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg?style=flat-square)](https://www.typescriptlang.org)
[![Supabase](https://img.shields.io/badge/db-Supabase-green.svg?style=flat-square)](https://supabase.com)
[![Stripe](https://img.shields.io/badge/billing-Stripe-purple.svg?style=flat-square)](https://stripe.com)
[![license](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](./LICENSE)

</div>

<p align="center">
  <a href="https://www.npmjs.com/package/sigrank"><img src="https://img.shields.io/badge/$%20npx%20sigrank-gold?style=for-the-badge&logo=npm&logoColor=white&labelColor=1a1a1a&color=daa520" alt="npx sigrank" /></a>
</p>

## Table of Contents

- [What is SigRank?](#what-is-sigrank)
- [The SigRank ecosystem](#the-sigrank-ecosystem)
- [Get ranked (you don't need this repo)](#get-ranked-you-dont-need-this-repo)
- [How it works](#how-it-works)
- [For developers](#for-developers)
- [Stack](#stack)
- [Quick Start](#quick-start)
- [Scripts](#scripts)
- [Project Map](#project-map)
- [Data Model](#data-model)
- [Environment](#environment)
- [Supabase](#supabase)
- [Scoring Invariants](#scoring-invariants)
- [Development Notes](#development-notes)
- [Related](#related)
- [Community](#community)
- [License](#license)

|                                    The leaderboard                                    |                               Your operator profile                               |
| :-----------------------------------------------------------------------------------: | :-------------------------------------------------------------------------------: |
| [![SigRank leaderboard](./.github/assets/board.png)](https://signalaf.com/board/all)  | [![SigRank operator profile](./.github/assets/profile.png)](https://signalaf.com) |
| Every operator ranked by **Υ Yield** — the architecture of the cascade, not raw spend |        Cascade layer, class, and fingerprint — all from four token counts         |

---

## What is SigRank?

SigRank scores AI operators by **token cascade efficiency**: how much reusable signal
they create from each unit of input — not how many tokens they burn. The rank metric:

```txt
Υ = (cache_read × output) / input²
```

The board is anonymous by default, claimable by operators, and built around one
question: **is this session compounding signal, or just burning tokens?** Volume is
noise; yield is signal.

This repo is the **Next.js app behind [signalaf.com](https://signalaf.com)** — the
public board, operator profiles, the wiki, account + billing, and the scoring/ingest
engine. You don't clone this to _use_ SigRank (see below) — you clone it to work on it.

## The SigRank ecosystem

| Repo | What it is | Install |
|------|-----------|---------|
| **[sigrank-app](https://github.com/SunrisesIllNeverSee/sigrank-app)** (this repo) | The leaderboard — signalaf.com. Privacy-preserving operator profiles, class tiers, board rankings. | [signalaf.com](https://signalaf.com) |
| **[sigrank-mcp](https://github.com/SunrisesIllNeverSee/sigrank-mcp)** | The instrument — extracts 4 token pillars, computes the cascade, submits to the leaderboard. MCP server + TUI dashboard. | `npx sigrank` |
| **[signaf](https://github.com/SunrisesIllNeverSee/signa)** | The coach — reads your session logs, builds a taste profile, measures ASI, coaches you on token efficiency. | `npx @burnmydays/signaf` |
| **[sigrank-vscode](https://github.com/SunrisesIllNeverSee/sigrank-vscode)** | The IDE extension — see your cascade metrics inline in VS Code. | `code --install-extension sigrank.sigrank` |
| **[fundscore](https://github.com/SunrisesIllNeverSee/fundscore)** | The repo scorer — investor-readiness scoring for GitHub repos. CLI + MCP server. | `npx fundscore` |

## Get ranked (you don't need this repo)

SigRank runs from your terminal — or wire it as an MCP server for your AI agent:

```bash
npx sigrank                 # see your cascade now (no install, no sign-in)
```

The client reads your local AI session logs on-device, derives your cascade,
and publishes to the board — **token-only, no transcript content.**

```bash
npm install -g sigrank     # bundles ccusage + tokscale + tokendash — no separate installs
sigrank enroll             # sign in: paste a connect code from signalaf.com → Settings
sigrank submit             # publish your verified runs to the board
```

Or explore first, no sign-in:

```bash
sigrank                    # full tabbed TUI: dashboard · compare · board · watch
npx sigrank board --once   # print the live leaderboard once
```

Cautious? `sigrank submit --dry-run` prints the exact signed payload — four token
counts and a signature — and sends nothing.

```bash
$ sigrank submit --dry-run
📦 Payload (not sent):
  input:          1,251,211
  output:        11,296,121
  cache_create:     128,196
  cache_read:    2,555,179,769
  Υ Yield:          18,436.98
  class:            TRANSMITTER
  signature:        ed25519:9f3a...
```

Full CLI + MCP docs: **[sigrank-mcp](https://github.com/SunrisesIllNeverSee/sigrank-mcp)** ·
package: **[sigrank on npm](https://www.npmjs.com/package/sigrank)**.

## How it works

- **Four raw token pillars** — `input`, `output`, `cache_creation`, `cache_read` — are the
  only inputs. No message content, ever.
- The **cascade engine** derives Υ Yield, Leverage, Velocity, 10xDEV, SNR, and efficiency
  from those four numbers. The server re-scores every submission authoritatively.
- Operators are placed in **signal classes** (Transmitter, Architect, …) by their cascade
  shape, and ranked globally by Υ.
- **SIGNA RATE** is the class credential; **Υ Yield** is the rank metric.

Deep dive: the in-app **[wiki](https://signalaf.com/wiki)**.

---

# For developers

The rest of this README is for working on the app itself.

## Stack

- **Framework:** Next.js 15 App Router, React 19, TypeScript strict
- **UI:** Tailwind CSS, themeable SigRank design tokens (carbon default)
- **Data:** Supabase with cold-store snapshot and mock fallback
- **Billing:** Stripe Checkout, Billing Portal, webhook handlers
- **Validation:** zod, Node test runner, TypeScript

## Quick Start

```bash
npm install
cp .env.example .env.local      # all values optional — see Environment below
npm run dev                     # http://localhost:3000
```

The app is designed to run **without** Supabase or Stripe credentials. When env vars are
missing, reads fall back to the cold-store snapshot and then deterministic mock data,
while billing routes return configuration errors instead of crashing — so it stays
buildable, previewable, and testable out of the box.

> Requires **Node 22.x** (see `engines` in `package.json`). On a newer Node, `next dev`
> may fail to start — use the version manager of your choice to pin 22.
>
> If vendor chunks act strange, run the dev server directly: `node_modules/.bin/next dev --port 3000`

## Scripts

| Command                  | Purpose                                 |
| ------------------------ | --------------------------------------- |
| `npm run dev`            | Start the local Next.js dev server      |
| `npm run build`          | Create a production build               |
| `npm run start`          | Serve the production build              |
| `npm run lint`           | Run the configured Next.js lint command |
| `npm test`               | Run all Node test files                 |
| `npm run test:canonical` | Run the canonical ingest parity test    |
| `npm run snapshot`       | Refresh the database snapshot           |

Before committing, run the gates CI enforces:

```bash
npx tsc --noEmit            # 0 errors (typescript is a devDependency)
npm run build               # production build green
npm run test:canonical      # canonical ingest parity — MO§ES Υ 18436.98
```

## Project Map

| Path                  | Responsibility                                               |
| --------------------- | ------------------------------------------------------------ |
| `app/`                | App Router pages and API routes                              |
| `app/api/v1/`         | Public API, ingest, claim, devices, billing, metrics         |
| `components/`         | UI components by product area                                |
| `components/sigrank/` | Board, profile, and shared SigRank UI (incl. `PlatformIcon`) |
| `lib/data/`           | Single read facade: Supabase → snapshot → mock fallback      |
| `lib/ingest/`         | Canonical payload parsing and cascade metric materialization |
| `lib/scoring/`        | Core scoring engine and server-only ruleset boundary         |
| `lib/supabase/`       | Browser, server, service-role, and auth helpers              |
| `lib/stripe/`         | Stripe server helpers, handlers, tiers, and rewards          |
| `supabase/`           | SQL schema, migrations, seed data, policies, and tests       |
| `__tests__/`          | Node test suites and canonical fixtures                      |

## Data Model

All app code reads operator data through `@/lib/data`. The facade chooses the safest
available source, in order:

1. **Supabase live reads** when credentials are configured.
2. **Cold-store snapshot** (`lib/data/snapshot.json`) if live reads are unavailable or fail.
3. **Mock fixtures** (`lib/data/mock.ts`) as the last resort.

## Environment

Copy `.env.example` to `.env.local` and fill values as needed. All are optional locally
(the app degrades gracefully); production values live in **Vercel environment variables**.

| Variable group                                                                           | Notes                                                   |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Live Supabase reads + service-role writes               |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`       | Billing and webhook flows                               |
| `STRIPE_PRICE_*`                                                                         | Per paid tier / claim checkout path                     |
| `NEXT_PUBLIC_SITE_URL`                                                                   | Stripe redirects and public URLs                        |
| `SIGRANK_RULESET`                                                                        | **Server-only** proprietary RS.xx scoring overrides     |
| `SIGRANK_API_KEY`                                                                        | Optional trusted bulk-read key for public API consumers |
| `NEXT_PUBLIC_GATE_*`                                                                     | Optional feature gates for unfinished surfaces          |

**Never commit real secrets or proprietary ruleset values.**

## Supabase

Schema, migrations, RLS policies, and seed data live in [`supabase/`](./supabase/). See
[`supabase/README.md`](./supabase/README.md) to run your own instance. RS.xx scoring
weights are server-only and are not included here.

## Scoring Invariants

Product contracts, not implementation details:

- `Υ = (cache_read × output) / input²`
- `T × C × R = Cr / I = Leverage`
- `10xDEV = log₁₀(Leverage)`
- **SIGNA RATE** is the class credential; **Υ Yield** is the rank metric.
- RS.xx weights are server-only and must not be exposed to client components.

## Development Notes

- Keep changes small and aligned with existing file ownership.
- Pages are React Server Components by default; add `'use client'` only when a component
  needs hooks, event handlers, or browser APIs.
- Keep `components/sigrank/tokens.ts` and Tailwind theme values in sync.
- Use `<Placeholder />` for placeholder metrics and `<CanonId />` for canonical real values.
- Do not import server-only scoring configuration into client code.
- Avoid random values and wall-clock reads at module scope.

## Related

- **[signalaf.com](https://signalaf.com)** — the live board
- **[signalaf.com/score](https://signalaf.com/score)** — paste four token counts, get projected yield + ghost rank
- **[sigrank-mcp](https://github.com/SunrisesIllNeverSee/sigrank-mcp)** — the CLI / TUI / MCP server (`npx sigrank`)
- **[Smithery](https://smithery.ai/servers/burnmydays/sigrank-mcp)** — one-click MCP install for Claude Desktop, Cursor, and more
- **[Glama](https://glama.ai/mcp/servers/SunrisesIllNeverSee/sigrank-mcp)** — MCP server directory listing

## Community

- [Contributing](./.github/CONTRIBUTING.md)
- [Code of Conduct](./.github/CODE_OF_CONDUCT.md)
- [Security policy](./SECURITY.md)
- [Changelog](./CHANGELOG.md)

### Reporting issues

Found a bug or have a feature request? Please
[open an issue](https://github.com/SunrisesIllNeverSee/sigrank-app/issues) on GitHub.
Search existing issues first to avoid duplicates, and include repro steps, expected
vs. actual behavior, and your environment (OS, Node version).

### Pull request process

1. **Fork** the repo and create a branch from `main`.
2. Make your change, keeping it small and aligned with existing file ownership.
3. Ensure `npx tsc --noEmit` passes with **0 errors** before pushing.
4. Open a pull request against `main` with a clear description of what and why.

## License

MIT — see [`LICENSE`](./LICENSE).
