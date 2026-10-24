/**
 * lib/history/board-2026-07-31.ts — the frozen July 31, 2026 board behind
 * /board/history. Static JSON imports so the snapshot is bundled on both
 * Vercel and OpenNext/Cloudflare (no fs). Never reads live board data.
 */

import raw from "@/data/history/board-all_time-2026-07-31.json";
import manifest from "@/data/history/manifest.json";
import { parseHistoricalBoard } from "./parse";
import type { HistoricalBoard, HistoryManifest } from "./types";

let cached: HistoricalBoard | null = null;

export function getHistoricalBoard(): HistoricalBoard {
  cached ??= parseHistoricalBoard(raw, manifest as HistoryManifest);
  return cached;
}
