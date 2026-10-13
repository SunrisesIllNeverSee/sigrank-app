import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { certBindsTo, type ChallengeScoreCert } from "@/lib/identity/challenge-cert";
import { sanitizeNotifyCodename, safeText } from "@/lib/ingest/notify-sanitize";

const state = vi.hoisted(() => ({
  enabled: true,
  limited: false,
  eqCalls: [] as Array<[string, unknown]>,
  publicRow: null as null | { operator_id: string },
  limiterCalls: [] as string[],
}));

vi.mock("@/lib/features", () => ({ challengesEnabled: () => state.enabled }));
vi.mock("@/lib/infra/api-auth", () => ({
  resolveAuth: async () => ({ ok: true, codename: "alice", operatorId: "op-alice" }),
}));
vi.mock("@/lib/infra/api-gate", () => ({
  rateLimit: () => ({ ok: true }),
  rateLimitHeaders: () => ({}),
  rateLimitedResponse: vi.fn(),
  getClientIp: () => "1.2.3.4",
}));
vi.mock("@/lib/infra/route-rate-limit", () => ({
  enforceRouteLimit: async (_req: unknown, name: string) => {
    state.limiterCalls.push(name);
    return state.limited
      ? new Response(JSON.stringify({ error: "rate_limited" }), { status: 429 })
      : null;
  },
}));
vi.mock("@/lib/infra/supabase/server", () => {
  const chain: Record<string, unknown> = {};
  chain.select = () => chain;
  chain.eq = (c: string, v: unknown) => {
    state.eqCalls.push([c, v]);
    return chain;
  };
  chain.maybeSingle = async () => ({ data: state.publicRow });
  return { getSupabaseServer: () => ({ from: () => chain }) };
});
vi.mock("@/lib/infra/posthog/server", () => ({ captureServer: vi.fn() }));
vi.mock("workflow/api", () => ({ start: vi.fn(async () => undefined) }));
vi.mock("@/lib/workflows/daily-recompute", () => ({ dailyRecompute: {} }));

const challenges = await import("@/app/api/v1/challenges/route");
const challengeById = await import("@/app/api/v1/challenges/[id]/route");
const snapshots = await import("@/app/api/v1/snapshots/route");
const cron = await import("@/app/api/cron/recompute/route");

const post = (url: string, body: unknown) =>
  new NextRequest(url, { method: "POST", body: JSON.stringify(body) });
const ctx = { params: Promise.resolve({ id: "ch_1" }) };

beforeEach(() => {
  state.enabled = true;
  state.limited = false;
  state.eqCalls = [];
  state.publicRow = null;
  state.limiterCalls = [];
});

describe("challenges muted", () => {
  it("returns 404 no-store from every handler when the flag is off", async () => {
    state.enabled = false;
    const responses = [
      await challenges.POST(post("https://x.test/api/v1/challenges", {})),
      await challenges.GET(new NextRequest("https://x.test/api/v1/challenges")),
      await challengeById.GET(new NextRequest("https://x.test/api/v1/challenges/ch_1"), ctx),
      await challengeById.PATCH(
        new NextRequest("https://x.test/api/v1/challenges/ch_1", { method: "PATCH", body: "{}" }),
        ctx,
      ),
    ];
    for (const r of responses) {
      expect(r.status).toBe(404);
      expect(r.headers.get("cache-control")).toBe("no-store");
      expect(await r.json()).toEqual({ error: "Not found" });
    }
    expect(state.limiterCalls).toEqual([]);
  });
});

describe("challenge creation validation", () => {
  const url = "https://x.test/api/v1/challenges";
  it.each([0, 169, 1.5, "24", -1])("rejects window_hours %j", async (w) => {
    const r = await challenges.POST(post(url, { challenged_codename: "bob", window_hours: w }));
    expect(r.status).toBe(400);
  });
  it("rejects self-challenge (case-insensitive)", async () => {
    const r = await challenges.POST(post(url, { challenged_codename: "ALICE" }));
    expect(r.status).toBe(400);
  });
  it("rejects oversized prompt_brief", async () => {
    const r = await challenges.POST(
      post(url, { challenged_codename: "bob", prompt_brief: "x".repeat(2001) }),
    );
    expect(r.status).toBe(400);
  });
  it("private and nonexistent challenged codenames give identical 404s, public-only lookup", async () => {
    const a = await challenges.POST(post(url, { challenged_codename: "private-op" }));
    const b = await challenges.POST(post(url, { challenged_codename: "no-such-op" }));
    expect(a.status).toBe(404);
    expect(b.status).toBe(404);
    expect(await a.json()).toEqual(await b.json());
    expect(state.eqCalls).toContainEqual(["profile_visibility", "public"]);
  });
  it("applies the distributed limiter", async () => {
    state.limited = true;
    const r = await challenges.POST(post(url, { challenged_codename: "bob" }));
    expect(r.status).toBe(429);
    expect(state.limiterCalls).toContain("challenge-create");
  });
  it("rejects oversized signal_text and certificate_json on PATCH", async () => {
    const patch = (body: unknown) =>
      new NextRequest("https://x.test/api/v1/challenges/ch_1", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    const t = await challengeById.PATCH(patch({ signal_text: "x".repeat(2001) }), ctx);
    expect(t.status).toBe(400);
    const c = await challengeById.PATCH(
      patch({ signal_text: "ok", certificate_json: { pad: "x".repeat(20000) } }),
      ctx,
    );
    expect(c.status).toBe(400);
  });
});

describe("certBindsTo", () => {
  const cert: ChallengeScoreCert = {
    challenge_id: "ch_1",
    operator_id: "op-alice",
    scores: { density: 1, clarity: 1, fidelity: 1, brevity: 1, impact: 1 },
    composite: 1,
    engine: "claude",
    timestamp: "2026-10-13T12:00:00Z",
    signature: "sig",
  };
  const window = { open: "2026-10-13T00:00:00Z", close: "2026-10-14T00:00:00Z" };
  it("accepts matching challenge, operator and window", () => {
    expect(certBindsTo(cert, { challengeId: "ch_1", operatorId: "op-alice", window })).toBe(true);
  });
  it("rejects another challenge's cert", () => {
    expect(certBindsTo(cert, { challengeId: "ch_2", operatorId: "op-alice", window })).toBe(false);
  });
  it("rejects another operator's cert", () => {
    expect(certBindsTo(cert, { challengeId: "ch_1", operatorId: "op-bob", window })).toBe(false);
  });
  it("rejects timestamps outside the window or unparseable", () => {
    expect(
      certBindsTo({ ...cert, timestamp: "2026-10-20T00:00:00Z" }, { challengeId: "ch_1", operatorId: "op-alice", window }),
    ).toBe(false);
    expect(
      certBindsTo({ ...cert, timestamp: "" }, { challengeId: "ch_1", operatorId: "op-alice", window }),
    ).toBe(false);
  });
});

describe("snapshots hardening", () => {
  it("sanitizes attacker codenames", () => {
    expect(sanitizeNotifyCodename("good_name-1")).toBe("good_name-1");
    expect(sanitizeNotifyCodename("evil\r\nBcc: x@y.z")).toBe("unknown");
    expect(sanitizeNotifyCodename("a".repeat(41))).toBe("unknown");
    expect(sanitizeNotifyCodename({})).toBe("unknown");
    expect(safeText("a\r\nb", 10)).toBe("a b");
  });
  it("rate limits per IP before parsing the body", async () => {
    state.limited = true;
    const req = new NextRequest("https://x.test/api/v1/snapshots", { method: "POST", body: "{}" });
    const json = vi.spyOn(req, "json");
    const r = await snapshots.POST(req);
    expect(r.status).toBe(429);
    expect(state.limiterCalls).toEqual(["snapshots"]);
    expect(json).not.toHaveBeenCalled();
  });
});

describe("cron secret comparison", () => {
  const get = (auth?: string) =>
    new Request("https://x.test/api/cron/recompute", {
      headers: auth ? { authorization: auth } : {},
    });
  it("fails closed when CRON_SECRET is unset", async () => {
    vi.stubEnv("CRON_SECRET", "");
    expect((await cron.GET(get("Bearer "))).status).toBe(500);
  });
  it("rejects missing, wrong and different-length secrets", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect((await cron.GET(get())).status).toBe(401);
    expect((await cron.GET(get("Bearer s3creX"))).status).toBe(401);
    expect((await cron.GET(get("Bearer s3cret-longer"))).status).toBe(401);
  });
  it("accepts the exact secret", async () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect((await cron.GET(get("Bearer s3cret"))).status).toBe(200);
  });
});
