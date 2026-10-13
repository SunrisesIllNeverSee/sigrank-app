/**
 * Token-window PRORATION (not measured daily usage).
 * For each day select the narrowest available valid reporting window; within
 * equal spans select the latest scored submission. Window totals are allocated
 * uniformly across calendar days, without inferring sessions or user activity.
 */
export interface TokenWindow {
  periodStart: string | null;
  periodEnd: string | null;
  submittedAt: string;
  inputTokens: number | null;
  outputTokens: number | null;
  cacheCreateTokens: number | null;
  cacheReadTokens: number | null;
}
const DAY = 86_400_000;
export const calendarDay = (v: string): number => {
  const timestamp = Date.parse(v.slice(0, 10) + "T00:00:00Z");
  return Number.isFinite(timestamp) ? Math.floor(timestamp / DAY) : NaN;
};

export function proratedDailyTokens(records: TokenWindow[], day: number): number | null {
  let bestSpan = Infinity;
  let newest = -Infinity;
  let estimate: number | null = null;
  for (const row of records) {
    const from = row.periodStart ? calendarDay(row.periodStart) : NaN;
    const until = row.periodEnd ? calendarDay(row.periodEnd) : NaN;
    if (!Number.isFinite(from) || !Number.isFinite(until)) continue;
    const span = until - from;
    if (span < 1 || !(from <= day && day < until)) continue;
    const pillars = [row.inputTokens,row.outputTokens,row.cacheCreateTokens,row.cacheReadTokens];
    if (!pillars.every(n => typeof n === "number" && Number.isFinite(n) && n >= 0)) continue;
    const total = (pillars as number[]).reduce((a,b) => a+b,0);
    const submittedAt = Date.parse(row.submittedAt);
    const submittedMs = Number.isFinite(submittedAt) ? submittedAt : 0;
    if (span < bestSpan || (span === bestSpan && submittedMs > newest)) {
      bestSpan = span; newest = submittedMs; estimate = total / span;
    }
  }
  return estimate;
}
