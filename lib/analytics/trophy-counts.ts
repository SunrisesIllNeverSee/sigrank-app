import { getHallOfSignal } from "@/lib/board";
import type { LeaderboardRow } from "@/lib/board";
import { sortValue } from "@/lib/analytics/sort-value";
import {
  DISPLAY_RAW,
  DISPLAY_METRICS,
} from "@/lib/identity/canon-ids";
import { recordValue } from "@/lib/analytics/record-value";

interface DynamicRecord {
  canonId: string;
  name: string;
  ticker: string;
  rank: number;
  value: string;
}

const CASCADE_BOARDS = DISPLAY_METRICS.map((d) => ({
  canonId: d.id,
  sort: d.key,
  name: d.name,
  ticker: d.ticker,
}));
const RAW_BOARDS = DISPLAY_RAW.map((d) => ({
  canonId: d.id,
  sort: d.key,
  name: d.name,
  ticker: d.ticker,
}));

const ALL_BOARDS = [...CASCADE_BOARDS, ...RAW_BOARDS];

function computeDynamicRecords(
  codename: string,
  boardRows: LeaderboardRow[],
): DynamicRecord[] {
  const records: DynamicRecord[] = [];
  for (const board of ALL_BOARDS) {
    const sorted = [...boardRows]
      .sort((a, z) => sortValue(z, board.sort) - sortValue(a, board.sort))
      .slice(0, 3);
    const rank = sorted.findIndex((r) => r.operator.codename === codename);
    if (rank === -1) continue;
    const row = sorted[rank];
    const value = recordValue(row, board.canonId);
    if (value === "—") continue;
    records.push({
      canonId: board.canonId,
      name: board.name,
      ticker: board.ticker,
      rank: rank + 1,
      value,
    });
  }
  return records.sort((a, b) => a.rank - b.rank);
}

function filterStaticRecords(
  hallRecords: { operator_codename: string }[],
  codename: string,
  displayName?: string,
) {
  const names = new Set<string>([codename]);
  if (displayName) names.add(displayName);
  return hallRecords.filter((r) => names.has(r.operator_codename));
}

export interface TrophyCounts {
  gold: number;
  silver: number;
  bronze: number;
  total: number;
  dynamicRecords: DynamicRecord[];
  staticCount: number;
}

export async function computeTrophyCounts(
  codename: string,
  displayName: string | undefined,
  boardRows: LeaderboardRow[] | undefined,
): Promise<TrophyCounts> {
  const hallRecords = await getHallOfSignal();
  const staticRecords = filterStaticRecords(hallRecords, codename, displayName);
  const dynamicRecords = boardRows
    ? computeDynamicRecords(codename, boardRows)
    : [];

  const goldCount =
    dynamicRecords.filter((r) => r.rank === 1).length + staticRecords.length;
  const silverCount = dynamicRecords.filter((r) => r.rank === 2).length;
  const bronzeCount = dynamicRecords.filter((r) => r.rank === 3).length;

  return {
    gold: goldCount,
    silver: silverCount,
    bronze: bronzeCount,
    total: goldCount + silverCount + bronzeCount,
    dynamicRecords,
    staticCount: staticRecords.length,
  };
}
