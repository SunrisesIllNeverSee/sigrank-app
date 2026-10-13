import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { safeNext } from "@/lib/infra/safe-next";

const state = vi.hoisted(() => ({
  user: null as null | { id: string },
  database: { from: vi.fn() },
  writes: vi.fn(),
}));
vi.mock("@/lib/infra/supabase/auth-server", () => ({
  getSessionUser: async () => state.user,
  createServerClient: async () => null,
}));
vi.mock("@/lib/infra/supabase/server", () => ({
  getSupabaseServer: () => state.database,
}));
vi.mock("@/lib/infra/posthog/server", () => ({ captureServer: vi.fn() }));
vi.mock("@/lib/infra/api-gate", () => ({
  rateLimit: () => ({ ok: true }),
  rateLimitedResponse: vi.fn(),
}));

const claim = await import("@/app/api/v1/claim/route");
const callback = await import("@/app/auth/callback/route");
const installation = await import("@/app/api/vercel/oauth/callback/route");

beforeEach(() => {
  state.user = null;
  state.database.from.mockReset();
  state.database.from.mockReturnValue({ upsert: state.writes });
  state.writes.mockReset().mockResolvedValue({ error: null });
  vi.stubEnv("VERCEL_CLIENT_ID", "test-client");
  vi.stubEnv("VERCEL_CLIENT_SECRET", "test-placeholder");
  vi.stubGlobal("fetch", vi.fn());
});

describe("same-origin login redirects", () => {
  it.each(["//evil.test", "/\\evil.test", "/\n/evil.test", "/\t/evil.test", "https://evil.test", " /me", "/foo/..//evil.test", "/%2e%2e//evil.test"])(
    "rejects unsafe next %j", async (next) => {
      expect(safeNext(next, "https://signalaf.com")).toBeNull();
      const url = new URL("https://signalaf.com/auth/callback");
      url.searchParams.set("next", next);
      const response = await callback.GET(new NextRequest(url));
      expect(response.headers.get("location")).toBe("https://signalaf.com/me/edit");
    },
  );
  it("preserves a legitimate profile, query and anchor", async () => {
    const destination = "/user/test?tab=badges#earned";
    const url = new URL("https://signalaf.com/auth/callback");
    url.searchParams.set("next", destination);
    const response = await callback.GET(new NextRequest(url));
    expect(response.headers.get("location")).toBe("https://signalaf.com" + destination);
  });
});

describe("seed claim shutdown", () => {
  it("keeps anonymous requests unauthorized", async () => {
    const response = await claim.POST(new NextRequest("https://signalaf.com/api/v1/claim", { method: "POST" }));
    expect(response.status).toBe(401);
    expect(state.database.from).not.toHaveBeenCalled();
  });
  it.each([100, "100", "1,000"])("cannot claim with public input count %j", async (input_tokens) => {
    state.user = { id: "verified-user" };
    const response = await claim.POST(new NextRequest("https://signalaf.com/api/v1/claim", {
      method: "POST", body: JSON.stringify({ codename: "victim", input_tokens }),
    }));
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: "claim_verification_unavailable" });
    expect(state.database.from).not.toHaveBeenCalled();
  });
});

describe("Vercel installation ownership", () => {
  function token(data: Record<string, unknown>) {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ access_token: "test-placeholder", ...data }), { status: 200 }));
  }
  it("rejects a valid code with another installation query ID", async () => {
    token({ installation_id: "icfg_own" });
    const response = await installation.GET(new NextRequest("https://signalaf.com/api/vercel/oauth/callback?code=test&configurationId=icfg_victim"));
    expect(response.headers.get("location")).toContain("installation_mismatch");
    expect(state.writes).not.toHaveBeenCalled();
  });
  it("rejects missing provider installation ID rather than inventing one", async () => {
    token({});
    const response = await installation.GET(new NextRequest("https://signalaf.com/api/vercel/oauth/callback?code=test"));
    expect(response.headers.get("location")).toContain("installation_mismatch");
    expect(state.writes).not.toHaveBeenCalled();
  });
  it("uses the authenticated installation ID even without a query ID", async () => {
    token({ installation_id: "icfg_own", user_id: "provider-user" });
    const response = await installation.GET(new NextRequest("https://signalaf.com/api/vercel/oauth/callback?code=test"));
    expect(state.writes).toHaveBeenCalledWith(expect.objectContaining({ configuration_id: "icfg_own" }), { onConflict: "configuration_id" });
    expect(response.headers.get("location")).toContain("configurationId=icfg_own");
  });
  it("retains the query-only configuration redirect without database writes", async () => {
    const response = await installation.GET(new NextRequest("https://signalaf.com/api/vercel/oauth/callback?configurationId=icfg_own"));
    expect(response.headers.get("location")).toContain("/vercel/config?configurationId=icfg_own");
    expect(fetch).not.toHaveBeenCalled();
    expect(state.writes).not.toHaveBeenCalled();
  });
});
