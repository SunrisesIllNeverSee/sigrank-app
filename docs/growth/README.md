# SigRank Growth Docs

Strategy + implementation playbooks for SEO/GEO, product analytics, and GTM.
**Start with the master roadmap** — it sequences everything by leverage; the rest are companions.

| Doc | What it covers |
|-----|----------------|
| [SIGRANK-MASTER-ROADMAP.md](./SIGRANK-MASTER-ROADMAP.md) | ⭐ Start here. All workstreams sequenced by leverage, with cadence. |
| [sigrank-dataset-citation-plan.md](./sigrank-dataset-citation-plan.md) | `Dataset` JSON-LD + "The SigRank Index" page + quarterly report (the citation play). |
| [sigrank-gtm-instrumentation-plan.md](./sigrank-gtm-instrumentation-plan.md) | PostHog wiring (privacy-safe, server-side) + Profound/Common Room/Clay integration. |
| [sigrank-posthog-dashboards.md](./sigrank-posthog-dashboards.md) | Exact funnel/retention/revenue/channel insight definitions for the PostHog UI. |
| [profound-rerun-prompts.md](./profound-rerun-prompts.md) | 30-prompt AEO re-run set (operator-metrics weighted) + competitor overrides. |
| [seo-geo-plan.md](./seo-geo-plan.md) | The original SEO/GEO plan (most phases already shipped on `main`). |

## Status note
These are **planning docs, not implementation**. Much of the original SEO/GEO plan
(`seo-geo-plan.md`) is already live on `main`. The dataset/citation, PostHog, and GTM
workstreams are not yet implemented — see the roadmap for sequence and the per-doc
acceptance criteria.

> Suggested first build: Workstream 1 (Dataset JSON-LD + `/methodology` page) — the
> highest-leverage, lowest-footprint change, and the direct fix for the 0% citation share
> flagged in the Profound AEO report.
