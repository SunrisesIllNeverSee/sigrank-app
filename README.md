<div align="center">

<img src="./banner.svg" alt="SigRank" width="800">

**A privacy-preserving leaderboard for AI operator efficiency.**

Most platforms reward volume. SigRank rewards structure.

[![CI](https://github.com/SunrisesIllNeverSee/sigrank-app/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/SunrisesIllNeverSee/sigrank-app/actions/workflows/ci.yml)
[![live](https://img.shields.io/badge/live-signalaf.com-gold.svg?style=flat-square)](https://signalaf.com)
[![deploy](https://img.shields.io/badge/deploy-Vercel-black.svg?style=flat-square)](https://vercel.com)
[![Node](https://img.shields.io/badge/Node-22.x-339933.svg?style=flat-square)](https://nodejs.org)
[![Next.js](https://img.shields.io/badge/Next.js-15-black.svg?style=flat-square)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-blue.svg?style=flat-square)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue.svg?style=flat-square)](https://www.typescriptlang.org)
[![Tests](https://img.shields.io/badge/tests-node%20--test-brightgreen.svg?style=flat-square)](https://nodejs.org/api/test.html)
[![Supabase](https://img.shields.io/badge/db-Supabase-green.svg?style=flat-square)](https://supabase.com)
[![Stripe](https://img.shields.io/badge/billing-Stripe-purple.svg?style=flat-square)](https://stripe.com)
[![Issues](https://img.shields.io/github/issues/SunrisesIllNeverSee/sigrank-app?style=flat-square)](https://github.com/SunrisesIllNeverSee/sigrank-app/issues)
[![Last commit](https://img.shields.io/github/last-commit/SunrisesIllNeverSee/sigrank-app?style=flat-square)](https://github.com/SunrisesIllNeverSee/sigrank-app/commits/main)
[![license](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](./LICENSE)

</div>

---

SigRank scores AI operators by token cascade efficiency: how much reusable signal
they create from each unit of input. The core rank metric is:

```txt
Υ = (cache_read * output) / input^2
```

The product is anonymous by default, claimable by operators, and built around a
simple question: is this session compounding signal, or just burning tokens?

## What This Repo Contains

- **Next.js app** for the public board, operator profiles, wiki, account pages,
  billing flows, and ingest routes.
- **Scoring and ingest logic** for canonical token pillars, cascade metrics,
  classes, audit records, and public leaderboard shapes.
- **Supabase schema** with migrations, RLS policies, seed data, and snapshot
  support for live and offline operation.
- **Stripe integration** for Pro billing, support checkout, and operator claims.

## Repository Status

| Area | Status |
| --- | --- |
| Public app | Live at [signalaf.com](https://signalaf.com) |
| CI | TypeScript, canonical ingest test, and production build |
| Data | Supabase-first reads with snapshot and mock fallback |
| Billing | Stripe-ready routes with explicit unconfigured states |
| Secrets | Kept out of git; production values belong in Vercel env |

## Stack

- **Framework:** Next.js 15 App Router, React 19, TypeScript strict
- **UI:** Tailwind CSS, dark-only SigRank design tokens
- **Data:** Supabase with cold-store snapshot and mock fallback
- **Billing:** Stripe Checkout, Billing Portal, webhook handlers
- **Validation:** zod, Node test runner, TypeScript

## Quick Start

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Start the dev server from the project directory:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The app is designed to run without Supabase or Stripe credentials. When env vars
are missing, reads fall back to the cold-store snapshot and then deterministic
mock data, while billing routes return configuration errors instead of crashing.

> If vendor chunks act strange, run the dev server directly from this directory:
>
> ```bash
> node_modules/.bin/next dev --port 3000
> ```

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the local Next.js dev server |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run the configured Next.js lint command |
| `npm test` | Run all Node test files |
| `npm run test:canonical` | Run the canonical ingest parity test |
| `npm run snapshot` | Refresh the database snapshot |

Before committing, run:

```bash
npx tsc --noEmit
npm run build
npm run test:canonical
```

## Project Map

| Path | Responsibility |
| --- | --- |
| `app/` | App Router pages and API routes |
| `app/api/v1/` | Public API, ingest, claim, devices, billing, metrics |
| `components/` | UI components by product area |
| `components/sigrank/tokens.ts` | Source of truth for SigRank colors and typography |
| `lib/data/` | Single read facade: Supabase, snapshot, then mock fallback |
| `lib/ingest/` | Canonical payload parsing and cascade metric materialization |
| `lib/scoring/` | Core scoring engine and server-only ruleset boundary |
| `lib/supabase/` | Browser, server, service-role, and auth helpers |
| `lib/stripe/` | Stripe server helpers, handlers, tiers, and rewards |
| `supabase/` | SQL schema, migrations, seed data, policies, and tests |
| `__tests__/` | Node test suites and canonical fixtures |

## Data Model

All app code should read operator data through `@/lib/data`.

That facade chooses the safest available source:

1. **Supabase live reads** when credentials are configured.
2. **Cold-store snapshot** from `lib/data/snapshot.json` if live reads are
   unavailable or fail.
3. **Mock fixtures** from `lib/data/mock.ts` as the last resort.

This keeps the app buildable, previewable, and testable even when external
services are not configured.

## Environment

Copy `.env.example` to `.env.local` and fill values as needed.

| Variable group | Notes |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Required for live Supabase reads and service-role writes |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` | Required for billing and webhook flows |
| `STRIPE_PRICE_*` | Required per paid tier or claim checkout path |
| `NEXT_PUBLIC_SITE_URL` | Used for Stripe redirects and public URLs |
| `SIGRANK_RULESET` | Server-only proprietary RS.xx scoring overrides |
| `SIGRANK_API_KEY` | Optional trusted bulk-read key for public API consumers |
| `NEXT_PUBLIC_GATE_*` | Optional feature gates for unfinished surfaces |

Never commit real secrets or proprietary ruleset values. Put production values in
Vercel environment variables.

## Supabase

Supabase setup lives in [`supabase/README.md`](./supabase/README.md).

At a high level:

```bash
supabase db push
psql "$SUPABASE_DB_URL" -f supabase/seed.sql
psql "$SUPABASE_DB_URL" -f supabase/policies.sql
```

The SQL is idempotent where practical, and RLS is enabled across the schema. Use
a dedicated SigRank Supabase project for live deployment.

## Scoring Invariants

These are product contracts, not implementation details:

- `Υ = (cache_read * output) / input^2`
- `T * C * R = Cr / I = Leverage`
- `10xDEV = log10(Leverage)`
- SIGNA RATE is the class credential.
- Υ Yield is the rank metric.
- RS.xx weights are server-only and must not be exposed to client components.

## Development Notes

- Keep changes small and aligned with the existing file ownership.
- Pages are React Server Components by default; add `'use client'` only when a
  component needs hooks, event handlers, or browser APIs.
- Keep `components/sigrank/tokens.ts` and Tailwind theme values in sync.
- Use `<Placeholder />` for placeholder metrics and `<CanonId />` for canonical
  real values.
- Do not import server-only scoring configuration into client code.
- Avoid random values and wall-clock reads at module scope.

## Related

- [signalaf.com](https://signalaf.com) - live SigRank board
- [sigrank-mcp](https://github.com/SunrisesIllNeverSee/sigrank-mcp) - local
  scanner, TUI dashboard, and MCP tooling

## Community

- [Contributing](./.github/CONTRIBUTING.md)
- [Security policy](./SECURITY.md)
- [Changelog](./CHANGELOG.md)

## License

MIT - see [`LICENSE`](./LICENSE).
