import { describe, expect, it } from "vitest";
import { earnedPixelMarks } from "@/lib/profile/pixel-eligibility";

describe("Pixel eligibility across profile surfaces", () => {
  it("grants the existing token milestone without top-percentile or verification status", () => {
    const marks = earnedPixelMarks({ percentile: 57.1, processedTokens: 53_904_800_000, verificationStatus: "unverified" });
    expect(marks.map((mark) => mark.id)).toEqual(["tokens10m"]);
  });
  it("uses the exact 10M threshold and rejects missing or invalid totals", () => {
    for (const processedTokens of [0, 9_999_999, NaN, Infinity]) {
      expect(earnedPixelMarks({ percentile: 0, processedTokens })).toEqual([]);
    }
    expect(earnedPixelMarks({ percentile: 0, processedTokens: 10_000_000 }).map((mark) => mark.id)).toEqual(["tokens10m"]);
  });
  it("does not invent awards for pending operators or 100-day activity from token volume", () => {
    expect(earnedPixelMarks({ percentile: 99, processedTokens: 1e12, verificationStatus: "verified", pending: true })).toEqual([]);
    const ids = earnedPixelMarks({ percentile: 99, processedTokens: 1e12, verificationStatus: "verified" }).map((mark) => mark.id);
    expect(ids).toEqual(["top10", "top5", "top1", "verified", "tokens10m"]);
    expect(ids).not.toContain("days100");
  });
});
