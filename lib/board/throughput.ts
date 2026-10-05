export interface SnapshotThroughput {
  processedTokens: number;
  processedTokensPerDay: number;
  outputTokensPerDay: number;
  periodDays: number;
}

/** Exact calendar-day rate from one accepted four-pillar snapshot. */
export function snapshotThroughput(input: {
  inputTokens: number | null | undefined;
  outputTokens: number | null | undefined;
  cacheWriteTokens: number | null | undefined;
  cacheReadTokens: number | null | undefined;
  windowStart: string | null | undefined;
  windowEnd: string | null | undefined;
}): SnapshotThroughput | null {
  const pillars = [
    input.inputTokens,
    input.outputTokens,
    input.cacheWriteTokens,
    input.cacheReadTokens,
  ];
  if (pillars.some((n) => n == null || !Number.isFinite(n) || n < 0)) return null;
  if (!input.windowStart || !input.windowEnd) return null;
  const start = Date.parse(input.windowStart);
  const end = Date.parse(input.windowEnd);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  const periodDays = (end - start) / 86_400_000;
  const processedTokens = pillars.reduce<number>((sum, n) => sum + (n ?? 0), 0);
  if (!Number.isSafeInteger(processedTokens)) return null;
  return {
    processedTokens,
    processedTokensPerDay: processedTokens / periodDays,
    outputTokensPerDay: input.outputTokens! / periodDays,
    periodDays,
  };
}
