import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/components/live/enrich", () => ({
  fetchOperatorProfile: vi.fn().mockResolvedValue({ current_rank: { global: 10, percentile: 57 } }),
}));

afterEach(() => { vi.unstubAllGlobals(); vi.resetModules(); });

function mockResponses(selected: () => string | null, owner = "owner-op") {
  const request = vi.fn(async (url: string) => ({
    ok: true,
    json: async () => url === "/api/auth/session"
      ? { signedIn: true, operator: { codename: "owner-op", displayName: "Owner" } }
      : { operator: { codename: owner, profile_pixel_badge: selected() } },
  }));
  vi.stubGlobal("fetch", request);
  return request;
}

describe("workspace saved Pixel badge", () => {
  it("uses the owner's saved token badge even without top-percentile standing", async () => {
    const request = mockResponses(() => "tokens10m");
    const { fetchBoardSession } = await import("@/components/live/session");
    expect((await fetchBoardSession()).pixelBadge).toBe("tokens10m");
    await fetchBoardSession();
    expect(request).toHaveBeenCalledTimes(2);
  });
  it("refreshes the saved choice after profile save invalidates session data", async () => {
    let selected: string | null = "tokens10m";
    mockResponses(() => selected);
    const { fetchBoardSession, invalidateBoardSession } = await import("@/components/live/session");
    expect((await fetchBoardSession()).pixelBadge).toBe("tokens10m");
    selected = "verified";
    invalidateBoardSession();
    expect((await fetchBoardSession()).pixelBadge).toBe("verified");
    selected = null;
    invalidateBoardSession();
    expect((await fetchBoardSession()).pixelBadge).toBeNull();
  });
  it("does not apply another operator's selected badge", async () => {
    mockResponses(() => "tokens10m", "other-op");
    const { fetchBoardSession } = await import("@/components/live/session");
    expect((await fetchBoardSession()).pixelBadge).toBeNull();
  });
});
