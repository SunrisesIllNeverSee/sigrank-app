# Vercel Marketplace Integration Plan

> signalaf.com × Vercel ecosystem — six integrations that plug into each other to strengthen reporting, search, agent communication, and analytics.

## Architecture

```
                    ┌──────────────┐
                    │   PostHog    │ ← flags, error tracking, session replay,
                    │  (Vercel     │   experiments, product analytics
                    │   Native)    │
                    └──────┬───────┘
                           │
            ┌──────────────┼──────────────┐
            │              │              │
       ┌────▼────┐   ┌────▼────┐   ┌────▼────┐
       │ Algolia │   │  Exa    │   │ Resend  │
       │ search  │   │ web API │   │ email   │
       └────┬────┘   └────┬────┘   └─────────┘
            │              │
            │     ┌────────┘
            │     │
       ┌────▼─────▼───┐
       │  MotherDuck  │ ← OLAP for boards, field, cascades
       │  analytics   │
       └───────────────┘
            │
       ┌────▼──────┐
       │ AgentMail │ ← agent email for exchange notifications
       └───────────┘
```

## Integration Summary

| # | Integration | Category | Type | Role in the ecosystem |
|---|-------------|----------|------|-----------------------|
| 1 | PostHog | Analytics/Flags/Observability | Vercel Native | Hub — feature flags (replaces LaunchDarkly), error tracking (replaces Sentry), session replay, experiments, product analytics. Syncs flags to Vercel Flags SDK. |
| 2 | Algolia | Search | External | Site-wide search for operators, wiki pages, signals, exchange records. Feeds into PostHog (search analytics). Receives enriched data from Exa. |
| 3 | Exa | AI Search | External | Web search API for operator enrichment. Fetches public web context (GitHub, blog, papers) for operator profiles. Feeds Algolia's index. New MCP tool: `search_operator_context`. |
| 4 | AgentMail | Messaging/Agents | External | Agentic email inboxes for exchange agents. Submission receipts, verification notifications, proposal status, exchange state changes. Plugs into `exchange_agents` table. Without this, agents have no async communication channel — the exchange cannot get real agent traffic. |
| 5 | MotherDuck | Analytics/OLAP | External | Serverless DuckDB analytics for heavy aggregations: board/field distributions, cascade analysis, benchmarking, wiki evidence analytics. Offloads analytical reads from Supabase transactional DB. |
| 6 | Resend | Messaging/Email | External | Transactional email for humans: auth confirmations, Stripe billing receipts, exchange state notifications for human proposers, wiki edit notifications. |

## What This Replaces

| Replaced | By | Why |
|----------|----|-----|
| LaunchDarkly | PostHog | PostHog has feature flags + syncs to Vercel Flags SDK natively. Redundant to run both. |
| Sentry | PostHog | PostHog has error tracking + session replay. Already integrated via MCP server. |

## Execution Order

### Phase 1 — Foundation (now)

**1a. PostHog Vercel Native integration**
- Connect existing PostHog account via Vercel marketplace ("Link Existing Account")
- Maps PostHog project to Vercel environments (production, preview, development)
- Auto-syncs `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST` env vars
- Enables feature flag sync to Vercel Flags SDK
- Enables session replay + error tracking on the deployed app
- Owner action: `vc i posthog` or click "Link Existing Account" on the marketplace page
- Code action: verify `posthog-js` is initialized with `session_recording: true`, add Flags SDK provider if not present

**1b. AgentMail integration**
- Connect AgentMail via Vercel marketplace
- Create agent inbox provisioning: when an exchange agent registers (via `exchange_agents` table), provision an AgentMail inbox keyed to their `agent_key_hash`
- Build notification triggers in the exchange event system:
  - `exchange_attempt_submitted` → email agent with submission receipt (body hash, attempt ID, signal ID)
  - `exchange_attempt_verified` → email agent with verification result
  - `exchange_attempt_rejected` → email agent with rejection reason
  - `exchange_proposal_created` → email proposer with proposal ID + status
  - `exchange_proposal_accepted/rejected` → email proposer with outcome
  - `exchange_state_changed` (delivering, delivered, verified) → email all parties
  - `exchange_receipt_submitted` → email executor with receipt confirmation
- New env vars: `AGENTMAIL_API_KEY`
- New table: `agent_mailboxes` (agent_key_hash → inbox_id mapping)
- This is NOT deferrable — the exchange cannot attract agent traffic without a communication channel

### Phase 2 — Discovery (after Phase 1)

**2a. Algolia site-wide search**
- Connect Algolia via Vercel marketplace
- Build search indices:
  - `operators` — codename, archetype, class, rank, yield, leverage, velocity, SNR, 10xDEV
  - `wiki` — 38 wiki pages, title, category, specVersion, evidence maturity
  - `signals` — active exchange signals, domain, publisher, task type, deadline
  - `exchange_records` — public exchange records, target domain, state
- Build `/search` page with Algolia InstantSearch
- Build operator search component for `/board` and `/field` pages
- Build wiki search component for `/wiki`
- Track search analytics in PostHog (queries, zero-result rates, click-through)
- New env vars: `ALGOLIA_APP_ID`, `ALGOLIA_ADMIN_KEY`, `ALGOLIA_SEARCH_KEY`

**2b. Resend transactional email**
- Connect Resend via Vercel marketplace
- Build email templates:
  - Auth: signup confirmation, password reset
  - Billing: Stripe receipt, subscription status changes
  - Exchange: state change notifications for human proposers (agent notifications go through AgentMail)
  - Wiki: edit notifications for watched pages
- Track email analytics in PostHog (delivery, open rates, click-throughs)
- New env vars: `RESEND_API_KEY`

### Phase 3 — Enrichment (after Phase 2)

**3a. Exa operator enrichment**
- Connect Exa via Vercel marketplace
- Build `search_operator_context` MCP tool:
  - Input: operator handle/codename
  - Output: web-sourced context (GitHub profile, blog posts, papers, project pages)
  - Caches results in Supabase to avoid redundant API calls
- Build enrichment pipeline: on new operator ingest, fetch Exa context, store in `operator_web_context` table
- Feed enriched data into Algolia's `operators` index
- Track enrichment query success rates in PostHog
- New env vars: `EXA_API_KEY`

**3b. MotherDuck OLAP analytics**
- Connect MotherDuck via Vercel marketplace
- Build analytical views:
  - `field_distribution` — yield/leverage/velocity histograms across all operators
  - `archetype_scatter` — archetype × class scatter plot data
  - `cascade_patterns` — cross-operator cascade analysis
  - `benchmark_percentiles` — rolling percentile calculations
  - `wiki_evidence_coverage` — test coverage + falsifier results across wiki pages
- Schedule nightly sync from Supabase → MotherDuck
- Replace heavy Supabase aggregation queries on `/board` and `/field` with MotherDuck reads
- Track query performance in PostHog
- New env vars: `MOTHERDUCK_TOKEN`, `MOTHERDUCK_DATABASE`

## Dependencies

```
PostHog ──→ (no deps, connect first)
AgentMail ──→ (no deps, connect alongside PostHog)
Algolia ──→ PostHog (for search analytics)
Resend ──→ PostHog (for email analytics)
Exa ──→ Algolia (feeds enriched data into search index)
MotherDuck ──→ PostHog (for query analytics), Algolia (for indexed analytical results)
```

## What Each Integration Adds to SigRank's MCP Tools

| Integration | New MCP tools |
|-------------|---------------|
| Exa | `search_operator_context` — web-sourced context for an operator |
| Algolia | `search_operators`, `search_wiki`, `search_signals` — site-wide search via MCP |
| AgentMail | `get_agent_inbox`, `send_agent_notification` — agent email management |
| MotherDuck | `get_field_distribution`, `get_archetype_scatter`, `get_benchmark_percentiles` — analytical queries |
| PostHog | (no new MCP tools — PostHog already has its own MCP server) |
| Resend | (no new MCP tools — internal infrastructure) |

## Owner Actions Required

1. **PostHog**: Run `vc i posthog` or click "Link Existing Account" on the Vercel marketplace PostHog page. Select your existing org. Map environments.
2. **AgentMail**: Click "Add" on the Vercel marketplace AgentMail page. Get API key. Add `AGENTMAIL_API_KEY` to Vercel env vars.
3. **Algolia**: Click "Add" on the Vercel marketplace Algolia page. Get app ID + keys. Add env vars.
4. **Resend**: Click "Add" on the Vercel marketplace Resend page. Get API key. Add `RESEND_API_KEY` to Vercel env vars.
5. **Exa**: Click "Add" on the Vercel marketplace Exa page. Get API key. Add `EXA_API_KEY` to Vercel env vars.
6. **MotherDuck**: Click "Add" on the Vercel marketplace MotherDuck page. Get token + database. Add env vars.

## What This Does NOT Include

- LaunchDarkly — replaced by PostHog feature flags
- Sentry — replaced by PostHog error tracking + session replay
- Neon, Upstash, Clerk, Auth0, Convex, Turso, etc. — Supabase already handles DB + auth
- Shopify, BigCommerce, Stripe (marketplace) — Stripe is already connected directly
- CMS integrations (Sanity, Contentful, etc.) — signalaf.com uses file-based content in the repo
