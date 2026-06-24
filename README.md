# SigRank

A privacy-preserving, BlitzStars-style leaderboard that scores AI operators on
11 canonical token-telemetry metrics, with a Pro tier behind Stripe billing.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript** (strict) + **Tailwind CSS**
- Pages are React Server Components by default; `'use client'` is added only to
  files that use hooks, handlers, or browser APIs.
- **Supabase** for data/auth, **Stripe** for billing — both reached through the
  `lib/data` facade so the app builds and every page renders with no creds
  present (deterministic mock fallback).

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Supabase + Stripe values when available
npm run dev
```

Visit http://localhost:3000.

The app is designed to build and render fully **without** any Supabase or Stripe
credentials. With no creds, the data facade serves deterministic mock data.

## Scripts

| Script          | Purpose                          |
| --------------- | -------------------------------- |
| `npm run dev`   | Start the dev server             |
| `npm run build` | Production build                 |
| `npm run start` | Serve the production build       |
| `npm run lint`  | Lint                             |

## Conventions

- **Scoring weights are server-only.** `lib/scoring/ruleset.ts` imports
  `server-only`; the RS.xx weights must never be imported into a client
  component or rendered into markup.
- **Placeholder vs real values.** Every placeholder number is wrapped in
  `<Placeholder/>` (gold ★ superscript + tooltip). Real values get a
  canonical-id superscript via `<CanonId/>` (`.canon-id`, green `.real`).
- **Deterministic data.** No random-number generation or wall-clock reads at
  module scope.

## Design tokens

`components/sigrank/tokens.ts` is the source of truth for colors and fonts. The
Tailwind theme in `tailwind.config.ts` mirrors those hex values (`bg-base`,
`class-transmitter` … `class-igniter`, `gold`, `accent`, etc.). Keep the two in
sync.

## Environment variables

See [`.env.example`](./.env.example) for the full list (Supabase, Stripe price
ids, grace period, site URL, `SIG_ARMY_DIR`, `RULESET_VERSION`). Values marked
`OPERATOR_OVERRIDE_REQUIRED` must be supplied by the operator before going live.
