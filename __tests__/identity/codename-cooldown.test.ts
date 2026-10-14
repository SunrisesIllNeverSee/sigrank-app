import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { revalidateOperatorIndexState } from "@/lib/ingest/materialize";

const { svc, session } = vi.hoisted(() => ({
  svc: { rpc: vi.fn() },
  session: { op: null as null | Record<string, string> },
}));
vi.mock("@/lib/infra/supabase/server", () => ({ getSupabaseService: () => svc }));
vi.mock("@/lib/infra/supabase/auth-server", () => ({ getSessionOperator: async () => session.op }));
vi.mock("@/lib/ingest/materialize", () => ({ revalidateOperatorIndexState: vi.fn() }));

const { POST } = await import("@/app/api/v1/profile/codename/route");
const DAY = 24 * 60 * 60 * 1000;
const post = (codename: unknown, extra: Record<string, unknown> = {}) =>
  POST(new NextRequest("https://signalaf.com/api/v1/profile/codename", {
    method: "POST", body: JSON.stringify({ codename, ...extra }),
  }));

function wire(status: string, extra: Record<string, unknown> = {}) {
  svc.rpc.mockReturnValue({ single: async () => ({
    data: { status, old_codename: "old-name", codename: "new-name", available_at: null, ...extra },
    error: null,
  }) });
}

beforeEach(() => {
  svc.rpc.mockReset();
  vi.mocked(revalidateOperatorIndexState).mockClear();
  session.op = { operatorId: "op-1", codename: "old-name" };
});

describe("atomic codename route", () => {
  it("sends the session operator, not a caller-selected operator, to one RPC", async () => {
    wire("changed");
    const res = await post(" NEW-NAME ", { operator_id: "victim" });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, codename: "new-name" });
    expect(svc.rpc).toHaveBeenCalledExactlyOnceWith("change_operator_codename", {
      p_operator_id: "op-1", p_new_codename: "new-name",
    });
    expect(revalidateOperatorIndexState).toHaveBeenCalledWith("old-name");
    expect(revalidateOperatorIndexState).toHaveBeenCalledWith("new-name");
  });
  it("uses the locked database's old name for cache invalidation", async () => {
    wire("changed", { old_codename: "actual-old-name" });
    expect((await post("new-name")).status).toBe(200);
    expect(revalidateOperatorIndexState).toHaveBeenCalledWith("actual-old-name");
  });
  it("preserves the cooldown response and Retry-After", async () => {
    const at = new Date(Date.now() + 20 * DAY).toISOString();
    wire("cooldown", { available_at: at });
    const res = await post("new-name");
    expect(res.status).toBe(429);
    expect((await res.json()).available_at).toBe(at);
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(19 * 86400);
    expect(revalidateOperatorIndexState).not.toHaveBeenCalled();
  });
  it.each(["held", "taken"])("maps %s to a conflict without cache invalidation", async (status) => {
    wire(status);
    expect((await post("new-name")).status).toBe(409);
    expect(revalidateOperatorIndexState).not.toHaveBeenCalled();
  });
  it.each(["unchanged", "invalid"])("maps %s to 400", async (status) => {
    wire(status);
    expect((await post("new-name")).status).toBe(400);
  });
  it.each(["admin", "the-field", "..", null])("rejects invalid/reserved %j before RPC", async (name) => {
    expect((await post(name)).status).toBe(400);
    expect(svc.rpc).not.toHaveBeenCalled();
  });
  it("requires authentication", async () => {
    session.op = null;
    expect((await post("new-name")).status).toBe(401);
    expect(svc.rpc).not.toHaveBeenCalled();
  });
  it("returns generic errors with no raw database details", async () => {
    svc.rpc.mockReturnValue({ single: async () => ({ data: null, error: { message: "secret SQL" } }) });
    const res = await post("new-name");
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("secret SQL");
    expect(revalidateOperatorIndexState).not.toHaveBeenCalled();
  });
});
