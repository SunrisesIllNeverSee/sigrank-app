import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  serviceConfigured: true,
  rpc: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/infra/supabase/server", () => ({
  get SUPABASE_SERVICE_CONFIGURED() {
    return state.serviceConfigured;
  },
  getSupabaseServer: () => ({ rpc: state.rpc }),
}));

const { checkDistributedRateLimit } = await import("@/lib/infra/distributed-rate-limit");
const cfg = { windowMs: 60_000, max: 2 };

beforeEach(() => {
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  state.serviceConfigured = true;
  state.rpc.mockReset();
});

describe("distributed rate limit without Upstash", () => {
  it("uses the Postgres counter and enforces max", async () => {
    state.rpc.mockResolvedValueOnce({ data: [{ hits: 2, reset_seconds: 30 }], error: null });
    expect((await checkDistributedRateLimit(["r", "1.1.1.1"], cfg, true)).ok).toBe(true);
    state.rpc.mockResolvedValueOnce({ data: [{ hits: 3, reset_seconds: 30 }], error: null });
    const over = await checkDistributedRateLimit(["r", "1.1.1.1"], cfg, true);
    expect(over).toMatchObject({ ok: false, retryAfter: 30 });
    expect(state.rpc).toHaveBeenCalledWith("api_rate_limit_hit", { p_bucket: "rl:r:1.1.1.1", p_window_seconds: 60 });
  });

  it("fails closed when Postgres errors on a sensitive route", async () => {
    state.rpc.mockResolvedValueOnce({ data: null, error: { message: "down" } });
    expect((await checkDistributedRateLimit(["r", "2.2.2.2"], cfg, true)).ok).toBe(false);
  });

  it("falls back to in-memory for best-effort routes when Postgres errors", async () => {
    state.rpc.mockResolvedValue({ data: null, error: { message: "down" } });
    expect((await checkDistributedRateLimit(["best", "3.3.3.3"], cfg, false)).ok).toBe(true);
  });

  it("never calls Postgres without a service-role key", async () => {
    state.serviceConfigured = false;
    expect((await checkDistributedRateLimit(["r", "4.4.4.4"], cfg, true)).ok).toBe(false);
    expect(state.rpc).not.toHaveBeenCalled();
  });
});
