import { describe, expect, it } from "vitest";
import { PLATFORM_PIXEL_BADGES, platformPixelTotals, type PlatformPixelSubmission } from "@/lib/profile/platform-pixels";
import { earnedPixelMarks } from "@/lib/profile/pixel-eligibility";
const fact = (platform: string, totalTokens: number, over: Partial<PlatformPixelSubmission> = {}): PlatformPixelSubmission => ({
  platform, totalTokens, window: "all_time", snapshotDate: "2026-10-12", platformAttributed: true, ...over,
});
const earned = (platformSubmissions: PlatformPixelSubmission[], pending = false) => earnedPixelMarks({
  percentile: 0, processedTokens: 0, platformSubmissions, pending,
}).map(e => e.id);

describe("cumulative per-platform Pixel milestones", () => {
  it("unlocks every reached tier independently at exact boundaries", () => {
    expect(earned([fact("claude", 9_999_999)])).toEqual([]);
    expect(earned([fact("claude", 10_000_000)])).toEqual(["platform:claude:10m"]);
    expect(earned([fact("claude", 53_000_000_000)])).toEqual(["platform:claude:10m", "platform:claude:100m", "platform:claude:1b", "platform:claude:10b"]);
    expect(earned([fact("codex", 100_000_000_000)])).toHaveLength(5);
  });
  it("uses the latest all-time total, never sums snapshots or overlapping windows", () => {
    const rows = [fact("claude", 60_000_000), fact("claude-code", 70_000_000, { snapshotDate: "2026-10-13" }), fact("claude", 1e12, { window: "30d" })];
    expect(platformPixelTotals(rows).get("claude")?.tokens).toBe(70_000_000);
    expect(earned(rows)).toEqual(["platform:claude:10m"]);
  });
  it("normalizes aliases but keeps Pi and Oh My Pi distinct", () => {
    const values = earned([fact("CLAUDE-CODE", 1e7), fact("codex-cli", 1e8), fact("pi", 1e7), fact("oh-my-pi", 1e9)]);
    expect(values).toContain("platform:claude:10m");
    expect(values).toContain("platform:codex:100m");
    expect(values).toContain("platform:pi:10m");
    expect(values).toContain("platform:omp:1b");
    expect(values).not.toContain("platform:pi:100m");
  });
  it("rejects mixed, unknown, inferred, invalid and pending facts", () => {
    expect(earned([fact("multi", 1e12), fact("other", 1e12), fact("unknown", 1e12), fact("claude", Infinity), fact("codex", -1), fact("gemini", 1e12, { platformAttributed: false }), fact("devin", 1e12, { snapshotDate: "2026-02-30" })])).toEqual([]);
    expect(earned([fact("claude", 1e12)], true)).toEqual([]);
    expect(earned([fact("claude", 1e12, { platformAttributed: undefined })])).toEqual([]);
  });
  it("fails closed on conflicting same-date platform totals", () => {
    const rows = [fact("claude", 1e7), fact("claude-code", 1e8), fact("claude", 1e7)];
    expect(earned(rows)).toEqual([]);
    expect(earned([...rows, fact("claude", 1e8, { snapshotDate: "2026-10-13" })])).toHaveLength(2);
  });
  it("has 35 unique progressive designs for the seven individually recorded platforms", () => {
    expect(PLATFORM_PIXEL_BADGES).toHaveLength(35);
    expect(new Set(PLATFORM_PIXEL_BADGES.map(b => b.id)).size).toBe(35);
    expect(new Set(PLATFORM_PIXEL_BADGES.map(b => b.pattern)).size).toBe(35);
    for (const b of PLATFORM_PIXEL_BADGES) {
      expect(b.pattern.split("/")).toHaveLength(7);
      expect(b.pattern.split("/").every(row => row.length === 7)).toBe(true);
    }
  });
});
