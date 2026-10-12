import { describe, expect, it } from "vitest";
import { registeredURMember, UR_STATUS } from "@/lib/board/unranked-status";

describe("UR registered but unranked ruleset", () => {
  it("is a non-scored status with no synthetic zero telemetry", () => {
    const member = registeredURMember(23);
    expect(UR_STATUS).toBe("UR");
    expect(member).toMatchObject({
      position: 23,
      rank_status: "UR",
      board_status: "unranked",
      performance_eligible: false,
      metrics: null,
      workflow_mode: null,
      display_group: "autonomous",
      identity_status: "not_publicly_listed",
    });
    expect(JSON.stringify(member)).not.toContain("input_tokens");
    expect(JSON.stringify(member)).not.toContain("output_tokens");
    expect(JSON.stringify(member)).not.toContain("codename");
    expect(JSON.stringify(member)).not.toContain("email");
  });

  it("preserves one occupied member position per registered unranked account", () => {
    const positions = Array.from({ length: 29 }, (_, i) => registeredURMember(23 + i));
    expect(positions.map((m) => m.position)).toEqual(
      Array.from({ length: 29 }, (_, i) => 23 + i));
    expect(positions.every((m) =>
      m.rank_status === "UR" && !m.performance_eligible && m.metrics === null)).toBe(true);
    const ranked = Array.from({ length: 22 }, (_, i) => ({ position: i + 1, yield: i }));
    expect(ranked.length).toBe(22);
    expect(ranked.length + positions.length).toBe(51);
  });

  it("rejects invalid member position values", () => {
    for (const pos of [0, -1, Number.NaN, Infinity, 1.3]) {
      expect(() => registeredURMember(pos)).toThrow(RangeError);
    }
  });
});
