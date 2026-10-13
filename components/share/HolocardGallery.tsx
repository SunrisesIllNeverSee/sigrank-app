import type { LeaderboardRow } from "@/lib/board";
import { getLeaderboard, getHallOfSignal } from "@/lib/board";
import { getSupabaseServer } from "@/lib/infra/supabase/server";
import { computeFieldAverages } from "@/lib/analytics/field-average";
import { computeTrophyCounts } from "@/lib/analytics/trophy-counts";
import { buildArchetypeOf } from "@/lib/analytics/build-archetypes";
import { workflowCohortRank } from "@/lib/analytics/workflow-cohort";
import { getProfileMarkOptions } from "@/lib/profile/profile-marks";
import { PassportCard } from "@/components/profile-v2/PassportCard";
import { ArtworkShareControls } from "./ArtworkShareControls";
import "@/components/profile-v2/profile-workspace.css";

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
  return <div className="pv2 share-holocard flex flex-col items-center gap-4">
    <div className="pv2-pcard-scope">
    <PassportCard operator={row.operator} snapshot={row.snapshot} globalRank={own.global_rank}
      pending={!!row.pending} trophyCounts={trophies} fieldAvg={computeFieldAverages(board)}
      archetype={c && !c.nonCompounding ? buildArchetypeOf({ leverage: c.leverage, velocity: c.velocity, construction: c.construction }) : null}
      cohort={workflowCohortRank(board, row.operator.codename)}
      selectedPixelBadge={marks.pixelBadges.find(m => m.id === preferences?.profile_pixel_badge) ?? null}
      selectedSecondaryBadge={marks.secondaryLogos.find(m => m.id === preferences?.profile_secondary_logo) ?? null} />
    </div>
    <ArtworkShareControls target={`holocard-${row.operator.codename}`} title="holocard" animated
      filename={`signalaf-holocard-${row.operator.codename}`} href={`/user/${encodeURIComponent(row.operator.codename)}`} />
  </div>;
}
