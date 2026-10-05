import { RS05_CLASS_THRESHOLDS } from "@/lib/analytics/ruleset";
import type { SignalClass } from "@/components/sigrank/types";

export interface TierProgress {
  currentClass: string;
  currentTotal: number;
  nextClass: string | null;
  nextThreshold: number | null;
  progressPct: number;
  tokensToNext: number | null;
}

export function computeTierProgress(
  classTier: SignalClass,
  totalTokens: number,
): TierProgress {
  const ladder = RS05_CLASS_THRESHOLDS;
  const idx = ladder.findIndex((c) => c.class === classTier);

  if (idx === -1 || idx === 0) {
    return {
      currentClass: classTier,
      currentTotal: totalTokens,
      nextClass: null,
      nextThreshold: null,
      progressPct: 100,
      tokensToNext: null,
    };
  }

  const currentThreshold = ladder[idx].totalMin;
  const next = ladder[idx - 1];
  const nextThreshold = next.totalMin;
  const range = nextThreshold - currentThreshold;
  const progress = Math.max(0, Math.min(100, ((totalTokens - currentThreshold) / range) * 100));
  const tokensToNext = Math.max(0, nextThreshold - totalTokens);

  return {
    currentClass: classTier,
    currentTotal: totalTokens,
    nextClass: next.class,
    nextThreshold,
    progressPct: progress,
    tokensToNext,
  };
}
