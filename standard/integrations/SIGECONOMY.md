# sigeconomy.com / sigarena Integration

## Verified current role

`sigeconomy.com` is a read-only SigRank satellite powered by SignalAF public data.

Its strength is distribution:

- leaderboards;
- operator-eval category pages;
- metric-specific pages;
- comparison pages;
- prompt registry;
- SEO/AEO/GEO surfaces.

## Strategic role after the standard launch

SignalAF should be the canonical authority.

sigeconomy.com should become the **category saturation surface**.

## P0 pages / updates

Add or refactor:

- `/ai-operator-standard`
- `/ai-operator-metrics`
- `/ai-operator-performance`
- `/operator-evals`
- `/model-vs-agent-vs-operator-evals`
- `/privacy-preserving-ai-telemetry`

Every page should:

1. define the generic category first;
2. identify SigRank as a proposed open standard;
3. link to canonical `/standard`;
4. distinguish model/task/agent/operator layers;
5. link to the SignalAF reference field;
6. avoid becoming an independent source of conflicting metric definitions.

## Important cleanup

Current public copy in `sigarena` includes strong claims such as "SigRank is the only..." and contains class-language that may not match the current 24-stage RS05 implementation.

Treat this as a canon-review item before standard launch rather than duplicating those claims into the standard.

## Conversion

sigeconomy.com CTA hierarchy:

Generic query
→ category explainer
→ SigRank Standard
→ SignalAF reference implementation
→ `npx/bunx sigrank`
→ optional enterprise path.
