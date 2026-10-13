import { PLATFORM_PIXEL_BADGES, platformPixelTotals, type PlatformPixelSubmission } from "./platform-pixels";

export interface EarnedPixelMark {
  id: string;
  label: string;
  detail: string;
  pattern: string;
  platform?: string;
  evidenceDate?: string;
}

const STANDING = [
  { id: "top10", label: "Top 10% Achiever", threshold: 90, pattern: "LL./LGK/GGL" },
  { id: "top5", label: "Top 5% Elite", threshold: 95, pattern: "BBB/BBK/.KB" },
  { id: "top1", label: "Top 1% Legend", threshold: 99, pattern: "PPP/MMK/PMM" },
] as const;

export function earnedPixelMarks({ percentile, processedTokens, verificationStatus, pending = false, platformSubmissions = [] }: {
  percentile: number;
  processedTokens: number;
  verificationStatus?: string;
  pending?: boolean;
  platformSubmissions?: readonly PlatformPixelSubmission[];
}): EarnedPixelMark[] {
  if (pending) return [];
  const marks: EarnedPixelMark[] = STANDING.filter((mark) => percentile >= mark.threshold).map((mark) => ({
    id: mark.id, label: mark.label, pattern: mark.pattern,
    detail: `Current percentile ${percentile.toFixed(1)} · ${mark.threshold}+ required`,
  }));
  if (verificationStatus === "verified" || verificationStatus === "audited") {
    marks.push({ id: "verified", label: "Verified Operator", detail: `${verificationStatus} identity`, pattern: ".PR/BPK/.YM" });
  }
  if (Number.isFinite(processedTokens) && processedTokens >= 10_000_000) {
    marks.push({ id: "tokens10m", label: "10M Tokens Milestone", detail: "At least 10M accepted processed tokens · Input + Output + Cache-write + Cache-read", pattern: "C.W/CWK/CWC" });
  }
  const totals = platformPixelTotals(platformSubmissions);
  for (const badge of PLATFORM_PIXEL_BADGES) {
    const fact = totals.get(badge.platform);
    if (fact && fact.tokens >= badge.threshold) marks.push({
      id: badge.id, label: badge.label, pattern: badge.pattern, platform: badge.platform, evidenceDate: fact.date,
      detail: `${fact.tokens.toLocaleString("en-US")} accepted all-time ${badge.platformName} tokens · ${badge.threshold.toLocaleString("en-US")} required · ${fact.date}`,
    });
  }
  return marks;
}
