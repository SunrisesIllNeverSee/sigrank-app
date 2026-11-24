# Analyst field benchmarks — contract 1.2.0

This feature release extends the isolated OpenAI/Codex Analyst endpoint. The shared submission MCP, authentication and measurement formulas are unchanged. Source: `lib/mcp/plugin/service.ts`, `field-analysis.ts`, and `contracts.json`.

## Implemented workflows

| Request | Tool and behavior |
|---|---|
| Whole live field | `get_leaderboard(window=all,view=total,limit=100)`, then returned cursors for additional pages. |
| Highest/lowest input, output or cache | Sort the complete selected field using `sort_by` and `order`, then page. `rank` remains published placement; `position` identifies requested ordering. Nulls sort last. |
| Average/typical token use | `get_field_stats` returns full-population arithmetic means, medians, quartiles, p95, extrema, valid n, missing n and observed zeros for each pillar and complete four-pillar total. Derived metrics have the same distribution shape. |
| Platform summaries | `get_platform_stats` selects one eligible snapshot per operator-platform and discloses record count, unique operators and overlap. Actual retained periods, per-group and overall alignment are explicit. |
| Frozen history | `get_historical_board` reads the immutable July 31 file through its archive loader, with no live-database access. It returns source composition/version/date, complete-selected-field summaries and bounded chart-ready rows. Optional archive codenames support focused comparisons. |

Live defaults align to claimed Total / All-time, including when a platform filter is provided. Explicit `view=platforms` selects the broader public population. `dataset=live` and `dataset=july_2026` cannot silently substitute for one another. Evidence-class cohorts remain unsupported until reliable source provenance exists.

Counts are aggregate counts per selected snapshot, not standardized per-day activity. Each metric has its own denominator. Missing pillars do not become zero, and total requires all four pillars. Platform groups may overlap; their summed populations are not unique people. Equal window labels do not imply equal actual duration. An arithmetic mean of counts is not a mean or median operating ratio.

## Ordering correction

The shared board sorts non-compounding rows below compounding rows. Its serializer masks their Yield, Leverage and 10xDEV; the old Analyst serializer did not. The Analyst now uses that same eligibility rule instead of displaying a computed non-compounding Yield as an ordinary ranked value. Observed pillars and applicable other metrics remain available. Published board ranks are preserved. Custom metric order is independently labeled position.

## Pagination and numerical behavior

Cursors bind to query scope, metric/order and the selected content revision. Retrieval timestamps do not invalidate a cursor. A changed field, incompatible query or malformed cursor returns INVALID_CURSOR, requiring a restart. A cursor never authorizes access. Filters precede full-field statistics and sorting; limit applies only to returned rows. Historical classifications and archive bytes remain unchanged.

## Verification and rollout

Regression coverage exercises full-field versus first-page statistics, weighted means, skew, zeros/missingness, null sorting, rank versus position, invalid requests, pagination/revision rejection, platform overlap and incompatible periods, database-independent archive reads, and real SDK HTTP calls. Existing contract, archive, analytics and rate-limit tests remain relevant.

The prepared OpenAI package 0.2.0 requires this backend contract. Deploy and verify the server first, refresh its seven-tool schema in the intended host, then test the feature prompts and submit the new package. Do not overwrite or cancel the already-submitted 0.1.33 review implicitly. No migration is needed. Local validation does not establish production deployment.

Tool design reference: https://developers.openai.com/plugins/plan/tools . New tools are read-only, idempotent, no-auth, with bounded inputs and explicit scope.
