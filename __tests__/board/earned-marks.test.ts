import { describe, expect, it } from "vitest";
import { selectEarnedMarks, summarizeEarnedMarks } from "@/lib/live/earned-marks";

const base = { pct: 99.5, totalTokens: 5e10, verif: "verified", klass: "TITAN" };

describe("selectEarnedMarks (board AWARDS & BADGES)", () => {
  it("returns nothing for pending operators", () => {
    expect(selectEarnedMarks({ ...base, pending: true })).toEqual([]);
  });

  it("includes every category the profile Badges tab shows", () => {
    const marks = selectEarnedMarks({
      ...base,
      medals: [
        { canonId: "Y.01", name: "Yield", rank: 1, value: "9.9" },
        { canonId: "T.05", name: "Total", rank: 3, value: "50B" },
      ],
      hall: [
        { title: "First Verified", value: "x", date: "2026-01-02T00:00:00Z" },
        { title: "Placeholder", value: "x", date: "", placeholder: true },
      ],
      platformMarks: [{ id: "platform:claude:10m", label: "Claude · 10M tokens", detail: "d", pattern: "p" }],
      scoredSnapshots: 500,
    });
    const ids = marks.map((m) => m.id);
    expect(ids).toEqual(expect.arrayContaining([
      "top10", "top5", "top1", "verified", "tokens10m",
      "platform:claude:10m", "medal:Y.01:1", "medal:T.05:3",
      "class", "identity", "snapshots500",
    ]));
    expect(marks.filter((m) => m.id.startsWith("hall:"))).toHaveLength(1);
  });

  it("does not grant unearned marks", () => {
    const ids = selectEarnedMarks({ pct: 50, totalTokens: 1e6, scoredSnapshots: 499 }).map((m) => m.id);
    expect(ids).toEqual([]);
    expect(selectEarnedMarks({ pct: 50, totalTokens: 1e6, klass: "AGENT", medals: [{ canonId: "Y.01", name: "Yield", rank: 4, value: "1" }] }).map((m) => m.id)).toEqual(["class"]);
  });

  it("summarizes counts and puts metal medals first", () => {
    const marks = selectEarnedMarks({ ...base, medals: [{ canonId: "Y.01", name: "Yield", rank: 2, value: "9" }] });
    const s = summarizeEarnedMarks(marks, 2);
    expect(s.total).toBe(marks.length);
    expect(s.pixels + s.records + s.standing).toBe(s.total);
    expect(s.top[0].id).toBe("medal:Y.01:2");
    expect(s.top).toHaveLength(2);
  });
});
