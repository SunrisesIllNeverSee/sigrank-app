# SigRank — Master Growth Roadmap

> Single source of truth. Five companion docs feed this; work from here and open the others for the code/specs.
> **Reordered by leverage**, not by the order we discussed them. The thesis below is the reason for the order.

## The thesis (read first)
SigRank is a **data company** that happens to ship a leaderboard. Its growth comes from two things:
1. **Becoming the cited primary source** of AI-operator-efficiency data (GEO / AEO).
2. **Measuring its own funnel** so every channel (AI search, community, viral) is legible.
Everything below serves one of those two. The Profound report's verdict — **7.2% visibility, 0% citation, #33** — is a *data-company-not-acting-like-one* problem, and that's fixable.

## Companion docs (the detail behind each workstream)
| # | File | Covers |
|---|------|--------|
| 1 | `sigrank-dataset-citation-plan.md` | Dataset JSON-LD + "The Index" page + quarterly report |
| 2 | `sigrank-gtm-instrumentation-plan.md` | PostHog wiring + GTM tool integration |
| 3 | `sigrank-posthog-dashboards.md` | Exact funnel/retention/revenue insight defs |
| 4 | `profound-rerun-prompts.md` | 30-prompt AEO re-run set + competitors |
| 5 | `seo-geo-plan.md` (already on `main`) | OG, JSON-LD, llms.txt, dynamic OG cards |

---

## ✅ Already shipped (baseline — don't redo)
On `main` across the two repos:
- JSON-LD: Organization, WebSite, ItemList, ProfilePage, Breadcrumb, DefinedTerm
- `llms.txt` route + sitemap entry
- Raster `og.png` + per-page dynamic `opengraph-image` cards
- `sigrank-mcp` npm keywords + GitHub topics; lockfile/CI fixed (PR #1 merged)
- Robots allows AI crawlers; dynamic sitemap incl. every operator

This is a strong foundation. The gaps below are what convert "indexed" into "cited" and "traffic" into "decisions."

---

## The sequence (do in this order)

### ▶ Workstream 1 — Dataset + "The Index"  · 🔴 highest leverage · doc #1
**Why first:** it's SigRank's unfair advantage (you own data nobody else has) and it's the direct fix for 0% citation.
- [ ] Add `sigrankDataset()` to `lib/jsonld.ts`; wire on `/methodology` + `/board/all` (doc #1 Part A)
- [ ] Build `/methodology` — "The SigRank Index" page, key figures rendered live from your API, FAQPage JSON-LD (Part B)
- [ ] Add `/methodology` to sitemap + a "## Data" block in `llms.txt`
- [ ] Validate: schema.org validator + Rich Results + (bonus) Google Dataset Search
**Done when:** `/methodology` and `/board/all` emit valid `Dataset`; key figures are accurate + quotable.
**Effort:** ~half a day. **One PR.**

### ▶ Workstream 2 — PostHog instrumentation  · 🔴 measurement · doc #2 (Phases 1–4)
**Why second:** without it, every channel below is blind. Privacy guardrail: **server-side capture only, no CLI telemetry.**
- [ ] Phase 1: provider + reverse proxy (`/ingest`) + pageviews
- [ ] Phase 2: client funnel events (board/profile/share/upgrade)
- [ ] Phase 3: server events at API boundary (`devices/enroll`, `snapshots`, `billing/*`, `stripe-webhook`)
- [ ] Phase 4: identify + alias on sign-in
**Done when:** a CLI enroll+submit and a web browse→upgrade both show up, stitched to one person.
**Effort:** ~1 day. **4 small PRs on `feat/posthog-gtm`.**

### ▶ Workstream 3 — PostHog dashboards  · measurement · doc #3
**Why now:** turns raw events into the numbers that drive decisions.
- [ ] Global setup: `Internal` exclusion cohort, Actions, the 5 cohorts
- [ ] **Dashboard 1 (Activation)** first — the enroll→submit funnel is your #1 diagnostic
- [ ] **Dashboard 5 (Channels)** next — so GTM runs are visible the moment they land
- [ ] Dashboards 2/3/4 once a few weeks of data exist
**Effort:** ~30–60 min in the UI (no code).

### ▶ Workstream 4 — Profound recurring re-run  · channel · doc #4
**Why now:** lowest effort, and it measures whether WS1/WS5 are working. **Override the auto-picked competitors** (YouGov→ccusage/tokscale) or the re-run is meaningless.
- [ ] Set the 30-prompt set (operator-metrics weighted) + correct competitors + topics
- [ ] Add `?utm_source=ai&utm_medium=answer_engine` to `llms.txt`/AI-surfaced links → so PostHog WS3 Dashboard 5 attributes AI enrolls
- [ ] Run on a schedule; track Visibility/Citation/Sentiment over time
**Done when:** you can diff a post-change report against the 7.2% / 0% baseline.

### ▶ Workstream 5 — Quarterly data report  · 🟢 recurring growth engine · doc #1 Part C
**Why after the Index exists:** this is what *creates third-party citations* (the only thing that moves citation share).
- [ ] Ship "State of AI Operator Efficiency — Q[current] 2026" at `/research/[slug]`
- [ ] 3–5 headline stats, each a standalone quotable sentence; `Dataset` + `Report` JSON-LD
- [ ] **Distribute it** — newsletters, HN, r/LocalLLaMA, MCP/"awesome-agent" directories
**Cadence:** once a quarter. This is the compounding growth flywheel.

### ▶ Workstream 6 — GTM tool wiring  · channel · doc #2 (Phase 6)
**Why after measurement exists:** now each tool points at a real funnel.
- [ ] **Common Room** — connect GitHub (both repos) + npm; track stars/issues/installs = your warm operator pipeline
- [ ] **Clay** — enrich stargazers/issue authors → consent-first outbound to seed the board
- [ ] Map each channel to a `utm_source` so Dashboard 5 scores them side by side

### ▶ Workstream 7 — Dev MCP for client work  · your day job · doc #2 (Phase 7)
**Why anytime:** independent of SigRank; compounds across every client project.
- [ ] Drop the `.mcp.json` (Context7 · GitHub · Supabase · Vercel) into your project template

---

## If you only do three things
1. **Workstream 1** (Dataset + Index) — the citation fix and your moat.
2. **Workstream 2** (PostHog Phases 1–4) — stop flying blind.
3. **Workstream 5** (one quarterly report + distribute) — the thing that actually earns citations.

## Realistic cadence (full-time job)
| Session | Do |
|---|---|
| Weekend 1 | WS1: Dataset + `/methodology` page (one PR) |
| Weekend 2 | WS2: PostHog Phases 1–4 |
| A weeknight | WS3 Dashboard 1 + 5; WS4 Profound re-run (override competitors) |
| Weekend 3 | WS5: first quarterly report + distribute |
| Ongoing | WS6 tools as segments fill; WS7 whenever you start the next client app |

## How it all connects
```
WS1 Dataset/Index ─┐
                   ├─► you become quotable ─► WS5 report + distribution ─► OTHERS cite you ─► citation share ↑
WS4 Profound ──────┘                                                                    (measured by WS4)
WS2 PostHog ──► WS3 dashboards ──► every channel (WS4 AI, WS6 community/outbound, viral) is legible
WS7 dev MCP ──► ships all of the above faster
```
**One line:** become the cited source of AI-operator-efficiency data (WS1+WS5), measure the funnel that traffic lands in (WS2+WS3), and prove each channel works (WS4+WS6).
