import { beforeEach, describe, expect, it, vi } from "vitest";

// This executes the real four-step entrypoint against an in-memory RPC adapter.
// Never supply a staging or production Supabase credential to this test.
const state = vi.hoisted(() => ({
  rpc: vi.fn(),
  configured: true,
}));

vi.mock("@/lib/infra/supabase/server", () => ({
  getSupabaseService: () => state.configured ? { rpc: state.rpc } : null,
}));

import { dailyRecompute } from "@/lib/workflows/daily-recompute";

const RPC_ORDER = [
  "recompute_the_field",
  "refresh_system_stats",
  "backfill_rank_history",
  "compute_rank_movement",
];

describe("daily rank recomputation workflow (isolated RPC contract)", () => {
  beforeEach(() => {
    state.configured = true;
    state.rpc.mockReset();
    state.rpc.mockResolvedValue({ error: null });
  });

  it("executes all four RPC steps in order and reports success", async () => {
    const result = await dailyRecompute();

    expect(state.rpc.mock.calls.map(([name]) => name)).toEqual(RPC_ORDER);
    expect(Object.keys(result)).toEqual([
      "recomputed", "statsRefreshed", "historyBackfilled", "movementComputed",
    ]);
    for (const item of Object.values(result)) {
      expect(item.ok).toBe(true);
      expect(Number.isNaN(Date.parse(item.ranAt))).toBe(false);
    }
  });

  it("stops before later steps when a database RPC fails", async () => {
    state.rpc.mockResolvedValueOnce({ error: { message: "test injected failure" } });
    await expect(dailyRecompute()).rejects.toThrow(
      "recompute_the_field failed: test injected failure",
    );
    expect(state.rpc.mock.calls.map(([name]) => name)).toEqual([RPC_ORDER[0]]);
  });

  it("fails closed when the service-role client is absent", async () => {
    state.configured = false;
    await expect(dailyRecompute()).rejects.toThrow("Service client unavailable");
    expect(state.rpc).not.toHaveBeenCalled();
  });
});
