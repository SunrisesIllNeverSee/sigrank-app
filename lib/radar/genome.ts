/**
 * lib/radar/genome.ts — roto points for the Cascade Genome radar (sandbox and
 * profile Lab tab; owner 2026-10-24: same points scale as every other radar).
 *
 * Each live operator's Core 5 scores are computed from its own token pillars
 * with the same public scoring rules the sandbox uses, then the sandbox
 * operator is ranked on each dimension against that field (1 + operators
 * beaten + ½ per tie). The field's first, middle (floor((first + last) / 2))
 * and last operator by board rank are the white reference shapes, replacing
 * the old fixed "class average" and "top 1%" benchmarks.
 */
import type { LeaderboardRow } from "@/lib/board/types";
import type { Core5Scores } from "@/lib/analytics/scoring-types";
import { normalizeCore5 } from "@/lib/analytics/scoring-engine";
import { publicScoringRules } from "@/lib/analytics/public-scoring";
import { pillarsToCore5 } from "@/lib/ingest/bridge";
import { operatorDisplayName } from "@/lib/identity/operator-name";
import { referenceIndexes, rotoPoints, type RadarRef } from "./points";

export const GENOME_KEYS = ["comp", "sd", "pc", "ct", "tt"] as const;

export interface GenomeRoto {
  /** Live operators the scores are ranked against. */
  size: number;
  /** The scored operator's points per dimension (GENOME_KEYS order), 1..size+1. */
  points: number[];
  /** 0..1 radius per dimension. */
  fracs: number[];
  refs: { role: RadarRef["role"]; rank: number; name: string; fracs: number[] }[];
}

interface GenomeField {
  rows: ReadonlyArray<LeaderboardRow>;
  ranked: { name: string; rank: number; scores: number[] }[];
}

let memo: GenomeField | null = null;

const vec = (s: Core5Scores) => GENOME_KEYS.map((k) => s[k]);

/** Core 5 scores for one board row, from its pillars (public rules). */
export function rowGenomeScores(row: LeaderboardRow): number[] | null {
  const t = row.telemetry;
  if (!t || !(t.fresh_input > 0) || !(t.output >= 0)) return null;
  const bridge = pillarsToCore5({
    pillars: { input: t.fresh_input, output: t.output, cacheCreate: t.cache_create, cacheRead: t.cache_read },
    sessionsCount: Math.max(t.sessions || 1, 1),
    turnsTotal: Math.max(t.turns || 1, 1),
  });
  return vec(normalizeCore5(bridge.core5, publicScoringRules));
}

function field(rows: ReadonlyArray<LeaderboardRow>): GenomeField {
  if (memo && memo.rows === rows) return memo;
  const ranked = [...rows]
    .sort((a, b) => a.global_rank - b.global_rank)
    .map((r) => ({ name: operatorDisplayName(r), rank: r.global_rank, scores: rowGenomeScores(r) }))
    .filter((r): r is { name: string; rank: number; scores: number[] } => r.scores !== null);
  memo = { rows, ranked };
  return memo;
}

/** Rank `scores` (Core 5, 0..100) against the live board on each dimension. */
export function genomeRoto(scores: Core5Scores, rows: ReadonlyArray<LeaderboardRow>): GenomeRoto | null {
  const { ranked } = field(rows);
  const n = ranked.length;
  if (n < 2) return null;
  const mine = vec(scores);
  const col = (k: number) => ranked.map((r) => r.scores[k]);
  const points = mine.map((v, k) => rotoPoints(v, col(k)) ?? 1);
  const max = n + 1;
  const idx = referenceIndexes(n)!;
  const refs = (["first", "middle", "last"] as const).map((role) => {
    const i = idx[role];
    const r = ranked[i];
    const fracs = r.scores.map((v, k) => (rotoPoints(v, col(k).filter((_, j) => j !== i)) ?? 1) / n);
    return { role, rank: r.rank, name: r.name, fracs };
  });
  return { size: n, points, fracs: points.map((p) => p / max), refs };
}
