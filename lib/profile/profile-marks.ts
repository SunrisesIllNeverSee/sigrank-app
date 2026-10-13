import { getHallOfSignal, getLeaderboard, getOperatorSubmissions } from "@/lib/board";
import { BOARD_SIGIL, HALL_INK, hallSigil } from "./record-artwork";
import { earnedPixelMarks } from "./pixel-eligibility";
import { sortValue } from "@/lib/analytics/sort-value";
import { computeTrophyCounts } from "@/lib/analytics/trophy-counts";

export interface ProfileMarkOption {
  id: string;
  label: string;
  detail: string;
  pattern?: string;
  sigil?: string;
  accent?: string;
  rank?: number;
}

/** Derive selectable marks only from the operator's current accepted records. */
export async function getProfileMarkOptions(
  codename: string,
  knownBoardRows?: Awaited<ReturnType<typeof getLeaderboard>>,
  knownHallRecords?: Awaited<ReturnType<typeof getHallOfSignal>>,
  knownPlatformSubmissions?: Awaited<ReturnType<typeof getOperatorSubmissions>>,
) {
  const [boardRows, hallRecords] = knownBoardRows && knownHallRecords
    ? [knownBoardRows, knownHallRecords]
    : await Promise.all([
        getLeaderboard({ window: "all_time", operatorTotal: true, claimedOnly: true, mode: "all" }),
        getHallOfSignal(),
      ]);
  const row = boardRows.find((entry) => entry.operator.codename.toLowerCase() === codename.toLowerCase());
  const platformSubmissions = knownPlatformSubmissions ?? (row && !row.pending ? await getOperatorSubmissions(codename) : []);
  const pixelBadges: ProfileMarkOption[] = row ? earnedPixelMarks({
    percentile: row.percentile,
    processedTokens: row.telemetry ? sortValue(row, "totalTokens") : 0,
    verificationStatus: row.operator.verification_status,
    pending: row.pending,
    platformSubmissions,
  }) : [];

  const trophies = row
    ? await computeTrophyCounts(row.operator.codename, row.operator.display_name ?? undefined, boardRows, hallRecords)
    : null;
  const secondaryLogos: ProfileMarkOption[] = (trophies?.dynamicRecords ?? []).map((record) => ({
    id: `record:${record.canonId}`,
    label: record.name,
    detail: `#${record.rank} all-time · ${record.value}`,
    sigil: BOARD_SIGIL[record.canonId]?.s ?? "◆",
    accent: BOARD_SIGIL[record.canonId]?.ink ?? HALL_INK,
    rank: record.rank,
  }));
  const ownerKeys = new Set([codename.toLowerCase(), ...(row?.operator.display_name ? [row.operator.display_name.toLowerCase()] : [])]);
  const ownedHall = hallRecords.filter((record) => !record.isPlaceholder && ownerKeys.has(record.operator_codename.toLowerCase()));
  for (const record of ownedHall) secondaryLogos.push({
    id: `hall:${record.reward_id}`,
    label: record.title,
    detail: `Hall record · ${record.value}`,
    sigil: hallSigil(record.title),
    accent: HALL_INK,
  });
  return { pixelBadges, secondaryLogos };
}
