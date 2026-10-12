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

  it("uses the signed-up member's public display name and avatar without scoring them", () => {
    const m = registeredURMember(23, {
      codename: "public-operator-a",
      display_name: "Public Operator A",
      handle: "@operator-a",
      avatar_url: "https://example.org/avatar.png",
      location: "Boston",
      profile_visibility: "public",
      data_opt_out: false,
    });
    expect(m).toMatchObject({
      position: 23,
      rank_status: "UR",
      performance_eligible: false,
      metrics: null,
      identity_status: "public_profile",
      display_label: "Public Operator A",
      profile_slug: "public-operator-a",
      handle: "@operator-a",
      avatar_url: "https://example.org/avatar.png",
      location: "Boston",
    });
    expect(JSON.stringify(m)).not.toContain("user_id");
    expect(JSON.stringify(m)).not.toContain("operator_id");
  });

  it("falls back to the public codename when display name is absent", () => {
    const m = registeredURMember(24, {
      codename: "public-operator-b",
      display_name: null,
      handle: null,
      avatar_url: null,
      location: null,
      profile_visibility: "public",
      data_opt_out: false,
    });
    expect(m.display_label).toBe("public-operator-b");
    expect(m.profile_slug).toBe("public-operator-b");
  });

  it("redacts private or opted-out profiles, including avatar, slug and handle", () => {
    for (const fields of [
      { profile_visibility: "private", data_opt_out: false },
      { profile_visibility: "public", data_opt_out: true },
      { profile_visibility: null, data_opt_out: false },
    ]) {
      const m = registeredURMember(25, {
        codename: "hidden-operator",
        display_name: "Hidden Person",
        handle: "@hidden",
        avatar_url: "https://example.org/hidden.png",
        location: "Secret Place",
        ...fields,
      });
      expect(m.identity_status).toBe("not_publicly_listed");
      expect(m.display_label).toBe("PRIVATE OPERATOR");
      expect(m.profile_slug).toBeNull();
      expect(m.handle).toBeNull();
      expect(m.avatar_url).toBeNull();
      expect(m.location).toBeNull();
      expect(JSON.stringify(m)).not.toContain("Hidden");
      expect(JSON.stringify(m)).not.toContain("hidden-operator");
    }
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
