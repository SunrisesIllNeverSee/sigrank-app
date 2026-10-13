import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { svc, session } = vi.hoisted(() => ({
  svc: { from: vi.fn() },
  session: { op: null as null | Record<string, string> },
}));
vi.mock("@/lib/infra/supabase/server", () => ({ getSupabaseServer: () => svc }));
vi.mock("@/lib/infra/supabase/auth-server", () => ({
  getSessionOperator: async () => session.op,
}));
vi.mock("@/lib/ingest/materialize", () => ({ revalidateOperatorIndexState: vi.fn() }));

const { POST } = await import("@/app/api/v1/profile/codename/route");

const DAY = 24 * 60 * 60 * 1000;
type R = { data?: unknown; error?: { message: string; code?: string } | null };

interface Plan {
  last?: R; // cooldown lookup (codename_history .order)
  held?: R; // held-name lookup (codename_history .ilike)
  taken?: R; // operators uniqueness
  insert?: R;
  update?: R;
}
const calls: { table: string; op: string; arg?: unknown }[] = [];

function wire(plan: Plan) {
  svc.from.mockImplementation((table: string) => {
    let mode = "select";
    let isHeld = false;
    const q: Record<string, unknown> = {};
    const done = (r: R | undefined) => ({ data: r?.data ?? null, error: r?.error ?? null });
    for (const m of ["select", "eq", "neq", "gte", "limit", "order"]) q[m] = () => q;
    q.ilike = () => { isHeld = true; return q; };
    q.insert = (arg: unknown) => { mode = "insert"; calls.push({ table, op: "insert", arg }); return q; };
    q.update = (arg: unknown) => { mode = "update"; calls.push({ table, op: "update", arg }); return q; };
    q.delete = () => { mode = "delete"; calls.push({ table, op: "delete" }); return q; };
    q.single = async () => done(plan.insert ?? { data: { id: 7 } });
    q.maybeSingle = async () =>
      table === "operators" ? done(plan.taken) : done(isHeld ? plan.held : plan.last);
    q.then = (res: (v: unknown) => unknown) =>
      Promise.resolve(done(mode === "update" ? plan.update : undefined)).then(res);
    return q;
  });
}

const post = (codename: string) =>
  POST(new NextRequest("https://signalaf.com/api/v1/profile/codename", {
    method: "POST",
    body: JSON.stringify({ codename }),
  }));

beforeEach(() => {
  svc.from.mockReset();
  calls.length = 0;
  session.op = { operatorId: "op-1", codename: "old-name" };
});

describe("codename change cooldown and held names", () => {
  it("allows a first change and records history", async () => {
    wire({});
    const res = await post("new-name");
    expect(res.status).toBe(200);
    expect(calls.find((c) => c.table === "codename_history" && c.op === "insert")?.arg).toMatchObject({
      operator_id: "op-1", old_codename: "old-name", new_codename: "new-name",
    });
    expect(calls.some((c) => c.table === "operators" && c.op === "update")).toBe(true);
  });

  it("returns 429 with the availability date inside the 30-day window", async () => {
    const changed = new Date(Date.now() - 10 * DAY).toISOString();
    wire({ last: { data: { changed_at: changed } } });
    const res = await post("new-name");
    expect(res.status).toBe(429);
    const body = await res.json();
    const expected = new Date(new Date(changed).getTime() + 30 * DAY).toISOString();
    expect(body.available_at).toBe(expected);
    expect(body.error).toContain(expected.slice(0, 10));
    expect(Number(res.headers.get("Retry-After"))).toBeGreaterThan(19 * 86400);
    expect(calls).toHaveLength(0);
  });

  it("allows a change once 30 days have passed", async () => {
    wire({ last: { data: { changed_at: new Date(Date.now() - 31 * DAY).toISOString() } } });
    expect((await post("new-name")).status).toBe(200);
  });

  it("rejects a name another operator released within 30 days", async () => {
    wire({ held: { data: { id: 3 } } });
    const res = await post("new-name");
    expect(res.status).toBe(409);
    expect(calls).toHaveLength(0);
  });

  it("lets the same operator reclaim their own old name (held lookup excludes self)", async () => {
    // The route filters held rows with .neq(operator_id, self); no foreign row exists.
    wire({ held: { data: null } });
    expect((await post("new-name")).status).toBe(200);
  });

  it("returns generic errors, not raw Supabase text", async () => {
    wire({ update: { error: { message: "relation \"secret\" violates constraint x" } } });
    const res = await post("new-name");
    expect(res.status).toBe(500);
    const text = JSON.stringify(await res.json());
    expect(text).not.toContain("secret");
    // history row rolled back
    expect(calls.some((c) => c.table === "codename_history" && c.op === "delete")).toBe(true);
  });

  it("fails closed when the cooldown lookup errors", async () => {
    wire({ last: { error: { message: "boom detail" } } });
    const res = await post("new-name");
    expect(res.status).toBe(500);
    expect(JSON.stringify(await res.json())).not.toContain("boom");
    expect(calls).toHaveLength(0);
  });
});
