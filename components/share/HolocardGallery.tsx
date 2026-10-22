import type { LeaderboardRow } from "@/lib/board";
import { getLeaderboard, getHallOfSignal } from "@/lib/board";
import { getSupabaseServer } from "@/lib/infra/supabase/server";
import { computeFieldAverages } from "@/lib/analytics/field-average";
import { computeTrophyCounts } from "@/lib/analytics/trophy-counts";
import { buildArchetypeOf } from "@/lib/analytics/build-archetypes";
import { workflowCohortRank } from "@/lib/analytics/workflow-cohort";
import { getProfileMarkOptions } from "@/lib/profile/profile-marks";
import { PassportCard } from "@/components/profile-v2/PassportCard";
import { BoneHolocard, type BenchmarkMetricCell } from "./BoneHolocard";
import { sortValue } from "@/lib/analytics/sort-value";
import { recordValue } from "@/lib/analytics/record-value";
import { operatorDisplayName } from "@/lib/identity/operator-name";
import { ArtworkShareControls } from "./ArtworkShareControls";
import "@/components/profile-v2/profile-workspace.css";

/** V6 ledger: 12 cascade boards, four raw pillars, total and processed/day.
 * The field ranks are calculated from the same all-time claimed population
 * as the Hall. Missing/not-yet-submitted metrics are never filled with demos.
 */
const BENCHMARK_COLUMNS = [
  ["Y.01", "YIELD", "yield_"],
  ["Y.02", "SNR", "snr"],
  ["Y.03", "LEVERAGE", "leverage"],
  ["Y.04", "VELOCITY", "velocity"],
  ["Y.05", "10xDEV", "dev10x"],
  ["Y.06", "SCALE V", "scaleV"],
  ["Y.08", "EFFICIENCY", "efficiency"],
  ["Y.07", "$/1M", "costPerMillion"],
  ["Y.09", "OP RATIO", "opRatio"],
  ["Y.10", "BEST OP", "opBest"],
  ["Y.11", "CACHE OP", "opCache"],
  ["Y.12", "OUTPUT OP", "opOutput"],
  ["T.02", "INPUT", "input"],
  ["T.01", "OUTPUT", "output"],
  ["T.03", "CACHE READ", "cacheRead"],
  ["T.04", "CACHE WRITE", "cacheWrite"],
  ["T.05", "TOTAL", "totalTokens"],
  ["throughput", "TOKENS/D", "throughput"],
] as const;

function benchmarkCells(self: LeaderboardRow, board: LeaderboardRow[]): BenchmarkMetricCell[] {
  const rankedSelf = board.find(r => r.operator.operator_id === self.operator.operator_id);
  const shown = rankedSelf ?? self;
  return BENCHMARK_COLUMNS.map(([id, label, key]) => {
    const value = !shown.pending ? recordValue(shown, id) : "—";
    const ranks = rankedSelf && value !== "—"
      ? board.filter(r => !r.pending && recordValue(r, id) !== "—" && Number.isFinite(sortValue(r, key)))
          .sort((a, b) => sortValue(b, key) - sortValue(a, key))
      : [];
    const position = ranks.findIndex(r => r.operator.operator_id === self.operator.operator_id);
    return { id, label, value, rank: position < 0 ? "—" : `#${position + 1}` };
  });
}

export async function HolocardGallery({ row }: { row: LeaderboardRow }) {
  if (row.operator.profile_visibility === "private") return <p>Holocard unavailable for a private profile.</p>;
  const service = getSupabaseServer();
  const [board, hall, preferenceResult] = await Promise.all([
    getLeaderboard({ window: "all_time", operatorTotal: true, claimedOnly: true, mode: "all" }),
    getHallOfSignal(),
    service ? service.from("operators").select("profile_pixel_badge, profile_secondary_logo")
      .eq("operator_id", row.operator.operator_id).maybeSingle() : Promise.resolve({ data: null }),
  ]);
  const marks = await getProfileMarkOptions(row.operator.codename, board, hall);
  const preferences = preferenceResult.data;
  const c = row.snapshot.cascade;
  const own = board.find(r => r.operator.operator_id === row.operator.operator_id) ?? row;
  const trophies = await computeTrophyCounts(row.operator.codename, row.operator.display_name ?? undefined, board, hall);
  const passport = (id: string) => <PassportCard id={id}
    operator={row.operator} snapshot={row.snapshot} globalRank={own.global_rank}
    pending={!!row.pending} trophyCounts={trophies} fieldAvg={computeFieldAverages(board)}
    archetype={c && !c.nonCompounding ? buildArchetypeOf({ leverage: c.leverage, velocity: c.velocity, construction: c.construction }) : null}
    cohort={workflowCohortRank(board, row.operator.codename)}
    selectedPixelBadge={marks.pixelBadges.find(m => m.id === preferences?.profile_pixel_badge) ?? null}
    selectedSecondaryBadge={marks.secondaryLogos.find(m => m.id === preferences?.profile_secondary_logo) ?? null} />;
  return <div className="pv2 share-holocard flex flex-col items-center gap-4">
    <BoneHolocard codename={row.operator.codename} name={operatorDisplayName(row)} metrics={benchmarkCells(row, board)}>{passport(`bone-passport-${row.operator.codename}`)}</BoneHolocard>
    <div className="pv2-pcard-scope">{passport(`holocard-${row.operator.codename}`)}</div>
    <ArtworkShareControls target={`holocard-${row.operator.codename}`} title="holocard" animated
      filename={`signalaf-holocard-${row.operator.codename}`} href={`/user/${encodeURIComponent(row.operator.codename)}`} />
  </div>;
}
