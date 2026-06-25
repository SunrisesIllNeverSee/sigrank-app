/**
 * lib/leaderboard/to-entry.ts — map a facade LeaderboardRow into the ported
 * LeaderboardTable's LeaderboardEntry shape.
 *
 * Extracted from the former /operators leaderboard page so the per-window board route
 * (app/board/[window]) is the single consumer. Mapping (per group brief):
 * snRatio=compression_ratio, threadsRecalled=cross_thread, compositeScore=
 * signa_rate. Board identity is PUBLIC (owner §0, 2026-06-25): anonId shows the
 * operator's display_name when present, else the generated codename.
 *
 * 730 addition: the four RAW PILLARS (input/output/cacheWrite/cacheRead) are
 * populated from row.telemetry on EVERY row — including non-compounding ones
 * whose cascade is null — so the raw-pillars view ("show your work") always has
 * real fuel to display even where the derived metrics read "—".
 */

import type { LeaderboardRow } from '@/lib/data/mock'
import type { LeaderboardEntry } from '@/components/sigrank'

/** Map a scored row into the ported LeaderboardTable entry shape. */
export function toEntry(row: LeaderboardRow): LeaderboardEntry {
  const { operator, snapshot, global_rank } = row
  const c = snapshot.cascade
  const t = row.telemetry
  return {
    rank: global_rank,
    // Seed rows render italic (owner 2026-06-20). The live facade hardcodes
    // isPlaceholder:false for ALL DB rows, so that's mock-only — the signal that works
    // in BOTH paths is "unclaimed": pre-auth the whole board is the seed corpus
    // (italic); a claimed operator renders upright once claiming is real.
    isSeed: !operator.claimed,
    // Board identity is PUBLIC (owner §0, 2026-06-25): show the operator's
    // display_name whenever they have one — including unclaimed seeds, whose real
    // names are backfilled in Supabase — else the generated codename. The prior
    // `claimed &&` gate hid those backfilled names and is dropped. Never invent
    // PII: this only surfaces an operator-set / owner-backfilled name.
    anonId: operator.display_name ? operator.display_name : operator.codename,
    // Operator-cell 2nd line: the operator's @handle (their real tokscale/social
    // username, e.g. @olafurns7). Primary line is the real name (codename); the 2nd
    // line is the @handle so the cell reads "Ólafur Nils Sigurðsson / @olafurns7".
    // Falls back to the platform (no @) when there's no handle.
    subLabel: operator.handle ? `@${operator.handle}` : operator.primary_domain,
    // Operator-supplied public location (city/country). Rendered only when present
    // (post-auth profiles set it; seeds without it render no location). Data-gated.
    location: operator.location ?? undefined,
    signalClass: snapshot.class_tier,
    // Real cascade metrics computed from the operator's four-integer pillars by
    // the engine (computeCascadeMetrics). The compounding metrics (yield/leverage/
    // dev10x) are nulled for NON-COMPOUNDING rows (cache_create=0) to match the
    // facade's sortValue, which ranks them last — otherwise the table's client sort
    // (blind to nonCompounding) would float a real positive yield to the top while
    // the server rank put it at the bottom, so the # column and row order would
    // disagree. snr/velocity stay (meaningful for non-compounding ops).
    yield_: c && !c.nonCompounding ? c.yield_ : null,
    leverage: c && !c.nonCompounding ? c.leverage : null,
    snr: c ? c.snr : snapshot.compression_ratio,
    dev10x: c && !c.nonCompounding ? c.dev10x : null,
    velocity: c ? c.velocity : null,
    totalTokens: c
      ? t
        ? t.fresh_input + t.output + t.cache_create + t.cache_read
        : null
      : null,
    // Raw pillars — always from telemetry (independent of compounding) so the
    // raw-pillars board view has real integers for every operator.
    input: t ? t.fresh_input : null,
    output: t ? t.output : null,
    cacheWrite: t ? t.cache_create : null,
    cacheRead: t ? t.cache_read : null,
    scaleV: c ? c.scaleV : null,
    costPerMillion: c ? c.costPerMillion : null,
    efficiency: c ? c.efficiency : null,
    opRatio: c ? c.opRatio : undefined,
    snRatio: snapshot.compression_ratio,
    threadsRecalled: snapshot.cross_thread,
    sessionDepth: snapshot.session_depth,
    promptComplexity: snapshot.prompt_complexity.value,
    messageVolume: operator.total_messages_lifetime,
    compositeScore: snapshot.signa_rate,
    acctAge: `${operator.account_age_days}d`,
    lastSeen: 'active',
    // LB-4: primary_domain for the client-side platform filter (lowercased; 'other'
    // when absent). Matched against PLATFORM_DOMAIN_MAP[selectedLabel] in the table.
    platform: (operator.primary_domain ?? 'other').toLowerCase(),
  }
}
