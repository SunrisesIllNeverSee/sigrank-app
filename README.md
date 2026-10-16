# SignalAF · SigRank web app

Browse AI operator token telemetry, explore personal profiles, and compare token-cascade metrics on [signalaf.com](https://signalaf.com).

[![CI](https://github.com/SunrisesIllNeverSee/sigrank-app/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/SunrisesIllNeverSee/sigrank-app/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/sigrank.svg?style=flat-square&label=sigrank)](https://www.npmjs.com/package/sigrank)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](./LICENSE)

**[Live site](https://signalaf.com) · [Leaderboard](https://signalaf.com/board/all) · [Methodology](https://signalaf.com/methodology) · [CLI & MCP](https://github.com/SunrisesIllNeverSee/sigrank-mcp) · [Local setup](#local-setup)**

This repository contains the Next.js application: the leaderboard homepage, operator profiles, Compare, Hall of Signal, editorial pages, accounts, billing, and server APIs.

## Explore the site

| Surface | What you can do |
| --- | --- |
| [Leaderboard / homepage](https://signalaf.com/) | Filter the field by window and platform; inspect RAW and derived metrics |
| [Operator profiles](https://signalaf.com/me) | View personal stats, submission history, badges, and account settings |
| [Compare](https://signalaf.com/compare) | Examine two operators' telemetry and metric differences |
| [Hall of Signal](https://signalaf.com/hall) | Browse records and the badge directory |
| [SigRank overview](https://signalaf.com/sigrank) | Understand the measurement and enrollment flow |
| [Field](https://signalaf.com/fieldhub), [Articles](https://signalaf.com/articles), [Blog](https://signalaf.com/blog), [Wiki](https://signalaf.com/wiki) | Read research, explanations, and metric definitions |

Some features are gated; see [Feature flags](#feature-flags). This README describes the source tree, not a promise that every optional integration is configured on every deployment.

## Get your own results

You do not need to clone this application to use it. Run the [CLI/MCP package](https://github.com/SunrisesIllNeverSee/sigrank-mcp):

```bash
npx sigrank                       # inspect local usage in the terminal
npx sigrank enroll                # bind your device using a Settings connect code
npx sigrank submit --dry-run      # inspect the payload without sending it
npx sigrank submit                # publish a signed snapshot
```

Sign in at [signalaf.com](https://signalaf.com) to create a connect code. Claims for profiles from the original board require ownership verification through hello@signalaf.com.

## What is measured

Four token pillars feed the cascade: input, output, cache-write, and cache-read. Yield is calculated as:

```text
Υ = (cache_read × output) / input²
```

The server verifies and re-scores submissions. Leverage, Velocity, SNR, and 10xDEV describe token-processing patterns; they are not measures of model quality, work quality, productivity, or business outcomes.

**Upsilon** is the measurement engine; **SigRank** is the public leaderboard and proof surface on **SignalAF**. Protocol semantics belong to [TTEOP](https://github.com/SunrisesIllNeverSee/otep-spec). See the [methodology](https://signalaf.com/methodology) and [wiki](https://signalaf.com/wiki) for definitions and limitations.

Ranked telemetry does not require prompt text, responses, or source code. Submissions also carry identity, device/signature, platform, and report metadata; see the [CLI privacy details](https://github.com/SunrisesIllNeverSee/sigrank-mcp#privacy).

## Stack

- Next.js 16 App Router, React 19, TypeScript (strict)
- Tailwind CSS 3
- Supabase (Postgres, Auth, Realtime)
- Stripe Checkout, Billing Portal, webhooks
- Upstash Redis for rate limiting (Supabase Postgres fallback)
- zod, Node test runner, Vitest, Playwright

## Local setup

Requires Node 22.x (`engines` in `package.json`, `.nvmrc`).

```bash
npm install
cp .env.example .env.local   # optional; see Environment
npm run dev                  # http://localhost:3000
```

Unconfigured local development can use snapshot or demo data on supported read paths. This is not live telemetry. Live board data, authentication, signed writes, and billing need their corresponding services configured. A configured database with no matching records returns an empty result rather than a fabricated operator history.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Build for production (`next build --webpack`) |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Node test suites in `__tests__/` |
| `npm run test:ui` | Run Vitest component tests |
| `npm run test:canonical` | Check canonical ingest parity (MO§ES Υ 18436.98) |
| `npm run test:coverage` | Run `npm test` with c8 coverage |
| `npm run e2e` | Run Playwright tests (`e2e:local` targets localhost:3000) |
| `npm run verify` | Run `tsc --noEmit`, the canonical test, and `npm test` |
| `npm run db:parity` | Check local migrations against the remote ledger (`db:parity:ci` for CI) |
| `npm run snapshot` | Refresh the cold-store board snapshot |
| `npm run sitemap:validate` | Validate the sitemap (`:live` checks production) |

Before opening a PR, run `npm run verify` and `npm run build`.

## Environment

Copy `.env.example` to `.env.local`. It lists every variable with notes. Never commit values. Production values live in Vercel environment variables.

| Variable | Used for |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Live Supabase reads and service-role writes. The server client needs all three. |
| `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_*` | Billing and webhooks |
| `NEXT_PUBLIC_SITE_URL` | Stripe redirects and public URLs |
| `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (or Vercel's `KV_REST_API_URL`, `KV_REST_API_TOKEN`) | Shared rate limiter. Without Upstash, the limiter uses Supabase Postgres (`api_rate_limit_hit`, migration 0055), then a per-instance in-memory counter. Sensitive write routes fail closed. |
| `SIGRANK_RULESET` | Server-only RS.xx scoring overrides |
| `SIGRANK_API_KEY` | Trusted bulk-read key for the public API (`x-api-key`) |
| `SIGRANK_INGEST_WRITE` | `1` enables persistence of verified snapshots to the board. |
| `CRON_SECRET` | Bearer token for `/api/cron/recompute` |
| `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `POSTHOG_KEY` | Product analytics |
| `RESEND_API_KEY`, `*AGENTMAIL_API_KEY` | Contact form and exchange email |
| `ALGOLIA_*`, `EXA_API_KEY`, `MOTHERDUCK_*`, `AI_GATEWAY_*`, `VERCEL_CLIENT_*`, `SIGNALAF_LIVE_TOKEN` | Search, enrichment, analytics, AI gateway, Vercel integration, live demo |
| `NEXT_PUBLIC_REALTIME_ENABLED` | Set to `false` to disable live board updates |

### Feature flags

`lib/features.ts` defines the flags. All gated flags default to off and accept `1` or `true`.

| Flag | Gates |
| --- | --- |
| `NEXT_PUBLIC_GATE_CHALLENGES` | Throw-down challenges. Also needs `NEXT_PUBLIC_GATE_ARENA`. Off: `/api/v1/challenges` returns 404. |
| `NEXT_PUBLIC_GATE_ARENA` | Challenge submission interface (required with the challenges gate) |
| `NEXT_PUBLIC_GATE_SIGNAL_DROP` | Weekly signal drop |
| `NEXT_PUBLIC_GATE_BRACKETS` | Blind bracket / Circle Wars |
| `NEXT_PUBLIC_GATE_TRADING_CARD_SPECIES` | Species badge on trading cards |

## Database and migrations

Migrations live in [`supabase/migrations/`](./supabase/migrations/). Use that directory and `npm run db:parity` for the current schema and remote-ledger status rather than relying on a hard-coded migration count. Apply required migrations before deploying code that depends on them; review the pending SQL and target project first.

Row Level Security policies, seed data, and security tests live in [`supabase/`](./supabase/). See [`supabase/README.md`](./supabase/README.md) to run your own instance.

## Project map

| Path | Contents |
| --- | --- |
| `app/` | App Router pages and API routes |
| `app/api/v1/` | Public API: ingest, claim, devices, billing, metrics, leaderboard |
| `app/api/mcp/`, `app/api/plugins/sigrank/mcp/`, `app/api/exchange/mcp/` | MCP endpoints (main server, analyst plugin, exchange) |
| `app/exchange/`, `app/api/exchange/` | Contribution exchange UI and API |
| `components/` | UI components |
| `lib/board/` | Board reads: Supabase, snapshot, mock fallback |
| `lib/ingest/` | Payload parsing, signature checks, cascade materialization |
| `lib/analytics/` | Scoring engine and server-only ruleset boundary |
| `lib/exchange/`, `lib/exchange-gateway/` | Exchange server logic and portable gateway reference |
| `lib/infra/` | Supabase clients, Stripe, rate limiting, API gates |
| `supabase/` | Migrations, policies, seeds, SQL tests, edge functions |
| `__tests__/`, `e2e/` | Node, Vitest, and Playwright tests |

Development conventions:

- Pages are server components by default. Add `'use client'` only for hooks, handlers, or browser APIs.
- Keep RS.xx scoring configuration out of client code.
- Avoid random values and wall-clock reads at module scope.

## Deployment

Pushes to `main` deploy to Vercel (`vercel.json`). A daily cron calls `/api/cron/recompute`. Set environment variables in Vercel. An OpenNext Cloudflare path exists (`npm run preview`, `npm run deploy`, `wrangler.jsonc`).

## Security

Report vulnerabilities privately. Email the maintainer or open a private GitHub security advisory. Do not file public issues for vulnerabilities. See [`SECURITY.md`](./SECURITY.md).

## Related

- [sigrank-mcp](https://github.com/SunrisesIllNeverSee/sigrank-mcp): the `npx sigrank` CLI, TUI, and MCP server
- [signalaf.com/score](https://signalaf.com/score): paste four token counts, get a projected yield
- [MO§ES™](https://mos2es.com): the governance framework behind Upsilon

## Contributing

Open an [issue](https://github.com/SunrisesIllNeverSee/sigrank-app/issues) with repro steps and your Node version. For code changes, branch from `main`, keep the change small, run `npm run verify`, and open a PR. See [Contributing](./.github/CONTRIBUTING.md) and the [Code of Conduct](./.github/CODE_OF_CONDUCT.md).

## License

MIT. See [`LICENSE`](./LICENSE).
