import { describe, expect, it, vi } from "vitest";
import { getProfileMarkOptions } from "@/lib/profile/profile-marks";
import type { HallRecord, LeaderboardRow } from "@/lib/board";

vi.mock("@/lib/board", () => ({ getLeaderboard: vi.fn(), getHallOfSignal: vi.fn() }));
vi.mock("@/lib/analytics/trophy-counts", () => ({
  computeTrophyCounts: vi.fn().mockResolvedValue({
    dynamicRecords: [{ canonId: "Y.01", name: "Yield", rank: 2, value: "100 Υ" }],
  }),
}));

const rows = [{ operator: { codename: "op-one", display_name: "Operator One", verification_status: "unverified" }, percentile: 96 }] as unknown as LeaderboardRow[];
const records = [
  { reward_id: "legacy", title: "First Podium", value: "100", operator_codename: "Operator One", isPlaceholder: false },
  { reward_id: "current", title: "Triple Crown", value: "3", operator_codename: "OP-ONE", isPlaceholder: false },
  { reward_id: "other", title: "Other record", value: "200", operator_codename: "op-two", isPlaceholder: false },
  { reward_id: "placeholder", title: "Placeholder", value: "0", operator_codename: "op-one", isPlaceholder: true },
] as unknown as HallRecord[];

describe("earned profile mark options", () => {
  it("accepts owned legacy and codename records without allowing another owner's or placeholder award", async () => {
    const options = await getProfileMarkOptions("op-one", rows, records);
    const ids = options.secondaryLogos.map((mark) => mark.id);
    expect(ids).toContain("hall:legacy");
    expect(ids).toContain("hall:current");
    expect(ids).not.toContain("hall:other");
    expect(ids).not.toContain("hall:placeholder");
  });

  it("keeps standing rank separate from the metric symbol", async () => {
    const options = await getProfileMarkOptions("op-one", rows, records);
    expect(options.secondaryLogos.find((mark) => mark.id === "record:Y.01")).toMatchObject({ rank: 2, sigil: "Υ", accent: "#bd83ff" });
    expect(options.secondaryLogos.find((mark) => mark.id === "hall:legacy")?.sigil).toBe("◇");
    expect(options.secondaryLogos.find((mark) => mark.id === "hall:current")?.sigil).toBe("♛");
  });

  it("does not grant top-one-percent or verified Pixel marks without the required standing or identity", async () => {
    const options = await getProfileMarkOptions("op-one", rows, []);
    expect(options.pixelBadges.map((mark) => mark.id)).toEqual(["top10", "top5"]);
  });
});
