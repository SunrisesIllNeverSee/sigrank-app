/**
 * lib/history/types.ts — types for the frozen July 31, 2026 board snapshot
 * (/board/history). HistoricalEntry is StaticBoardEntry copied verbatim from
 * lib/board/static-board.ts@4c610df9; it describes the archived rows and must
 * not track changes to the live board types.
 */

export interface HistoricalEntry {
  rank: number;
  percentile?: number | null;
  anonId: string;
  codename: string;
  subLabel?: string;
  isSeed?: boolean;
  location?: string;
  platform?: string;
  window?: string;
  signalClass: string;
  yield_?: number | null;
  leverage?: number | null;
  snr?: number;
  dev10x?: number | null;
  velocity?: number | null;
  totalTokens?: number | null;
  input?: number | null;
  output?: number | null;
  cacheWrite?: number | null;
  cacheRead?: number | null;
  scaleV?: number | null;
  costPerMillion?: number | null;
  efficiency?: number | null;
  opRatio?: string;
  snRatio?: number;
  messageVolume?: number;
  sessionDepth?: number;
  promptComplexity?: number;
  threadsRecalled?: number;
  compositeScore?: number;
  acctAge: string;
  lastSeen: string | null;
  status?: string | null;
  platforms?: string[];
  primaryDomain?: string;
}

/** data/history/manifest.json */
export interface HistoryManifest {
  source_commit: string;
  source_path: string;
  git_blob: string;
  bytes: number;
  sha256: string;
  generated_at: string;
  window: string;
  total_operators: number;
  entries: number;
  seeded: number;
  real: number;
  copied_at: string;
}

export interface HistoricalBoard {
  meta: {
    generatedAt: string;
    window: "all_time";
    totalOperators: number;
    sourceCommit: string;
    gitBlob: string;
    seeded: number;
    real: number;
  };
  entries: HistoricalEntry[];
}
