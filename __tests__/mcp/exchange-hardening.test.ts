// @vitest-environment node
/**
 * Contribution Exchange hardening (fix/exchange-spec-hardening): E1-E7.
 * All Supabase/Stripe/DNS access is mocked; nothing touches the network.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createHash } from "node:crypto";

type Call = { table: string; op: string; payload?: unknown; filters: Record<string, unknown> };
const h = vi.hoisted(() => {
  const state = {
    calls: [] as Array<{ table: string; op: string; payload?: unknown; filters: Record<string, unknown> }>,
    handler: (_c: { table: string; op: string; payload?: unknown; filters: Record<string, unknown> }): { data?: unknown; error?: unknown; count?: number | null } => ({ data: null, error: null }),
  };
  function from(table: string) {
    const c = { table, op: "select", payload: undefined as unknown, filters: {} as Record<string, unknown> };
    const run = () => {
      state.calls.push({ ...c, filters: { ...c.filters } });
      const r = state.handler(c);
      return Promise.resolve({ data: r.data ?? null, error: r.error ?? null, count: r.count ?? null });
    };
    const q: Record<string, unknown> = {};
    for (const m of ["select", "order", "limit", "in"]) q[m] = (..._a: unknown[]) => q;
    q.eq = (k: string, v: unknown) => { c.filters[k] = v; return q; };
    q.insert = (p: unknown) => { c.op = "insert"; c.payload = p; return q; };
    q.update = (p: unknown) => { c.op = "update"; c.payload = p; return q; };
    q.upsert = (p: unknown) => { c.op = "upsert"; c.payload = p; return q; };
    q.delete = () => { c.op = "delete"; return q; };
    q.maybeSingle = run;
    q.single = run;
    q.then = (res: (v: unknown) => unknown, rej: (e: unknown) => unknown) => run().then(res, rej);
    return q;
  }
  return { state, from, stripe: { value: null as unknown }, dnsLookup: vi.fn() };
});

vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ from: h.from }) }));
vi.mock("@/lib/infra/posthog/server", () => ({ captureServer: vi.fn(async () => {}) }));
vi.mock("@/lib/infra/stripe/server", () => ({ getStripe: () => h.stripe.value }));
vi.mock("node:dns/promises", () => ({ lookup: (...a: unknown[]) => h.dnsLookup(...a), resolveTxt: vi.fn(async () => { throw new Error("nx"); }) }));
vi.mock("@/lib/infra/distributed-rate-limit", () => ({
  checkDistributedRateLimit: vi.fn(async () => ({ ok: true, retryAfter: 0, limit: 10, remaining: 9, reset: 60 })),
  distributedRateLimitHeaders: () => ({}),
}));

const sig = vi.hoisted(() => ({
  getSignal: vi.fn(), isAcceptingAttempts: vi.fn(), countActorAttempts: vi.fn(), countConcurrentAttempts: vi.fn(),
  createAttempt: vi.fn(), getAttempt: vi.fn(), getVerification: vi.fn(), getQualification: vi.fn(),
  consumeQualification: vi.fn(), recordProposalOrigin: vi.fn(), publishSignal: vi.fn(),
}));
vi.mock("@/lib/exchange/signal-server", () => sig);
vi.mock("@/lib/exchange/agent-notifications", () => ({ notifyAgent: vi.fn(async () => {}) }));

const sha = (s: string) => createHash("sha256").update(s).digest("hex");
const req = (url: string, init: RequestInit & { headers?: Record<string, string> } = {}) =>
  new NextRequest(`https://signalaf.com${url}`, init as never);
const params = <T,>(p: T) => ({ params: Promise.resolve(p) });

const signal = (anon: boolean) => ({
  publisher: { domain: "signalaf.com" }, title: "A signal", summary: "s", description: "d",
  participation: { anonymous_attempts: anon, maximum_attempts_per_actor: 5, concurrent_attempts_per_actor: 2 },
  follow_on: { mode: "proposal_allowed", qualification_required: false },
  constraints: { private_data_access: false, repository_write: false, production_write: false },
  desired_outcome: { description: "o" }, revision: 1, revision_hash: "h", submission: { accepted_media_types: ["application/json"], maximum_bytes: 1000, required_fields: [] },
});

beforeEach(() => {
  h.state.calls.length = 0;
  h.state.handler = () => ({ data: null, error: null });
  process.env.NEXT_PUBLIC_SUPABASE_URL = "http://supabase.test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "svc";
  delete process.env.EXCHANGE_REFERENCE_ADMIN_KEY;
  delete process.env.EXCHANGE_REFERENCE_DOMAIN;
  Object.values(sig).forEach((f) => f.mockReset());
  h.dnsLookup.mockReset();
});

describe("E1 attempt routes validate the agent key", () => {
  async function post(key?: string) {
    const { POST } = await import("@/app/api/exchange/signals/[signal_id]/attempts/route");
    return POST(
      req("/api/exchange/signals/sig_1/attempts", {
        method: "POST",
        headers: { "content-type": "application/json", "idempotency-key": "k1", ...(key ? { "x-exchange-agent-key": key } : {}) },
        body: JSON.stringify({ declarations: {} }),
      }) as never,
      params({ signal_id: "sig_1" }),
    );
  }
  beforeEach(() => {
    sig.getSignal.mockResolvedValue(signal(false));
    sig.isAcceptingAttempts.mockResolvedValue(true);
    sig.countActorAttempts.mockResolvedValue(0);
    sig.countConcurrentAttempts.mockResolvedValue(0);
    sig.createAttempt.mockResolvedValue({ attempt_id: "att_1", signal_revision: 1, signal_revision_hash: "h", status: "created" });
  });

  it("forged key -> 401, no attempt created", async () => {
    h.state.handler = () => ({ data: null, error: null }); // no agent / proposer row matches
    const res = await post("forged-key");
    expect(res.status).toBe(401);
    expect(sig.createAttempt).not.toHaveBeenCalled();
  });

  it("registered agent key -> 201 with actor derived from the key hash", async () => {
    h.state.handler = (c) => (c.table === "exchange_agents" && c.filters.agent_key_hash === sha("good-key") ? { data: { id: "a1" } } : { data: null });
    const res = await post("good-key");
    expect(res.status).toBe(201);
    expect(sig.createAttempt.mock.calls[0][0].actorId).toBe(`actor:${sha("good-key").slice(0, 16)}`);
  });

  it("no key on a non-anonymous signal -> 401; anonymous signal allows no key", async () => {
    expect((await post()).status).toBe(401);
    sig.getSignal.mockResolvedValue(signal(true));
    expect((await post()).status).toBe(201);
  });
});

describe("E2 company authentication", () => {
  const company = (status: string, createdAt = new Date().toISOString()) => ({
    id: "c1", domain: "acme.example", admin_key_hash: sha("admin-key"), verification_token: "tok", verification_status: status, created_at: createdAt,
  });

  it("unverified admin key is rejected on signal publish", async () => {
    h.state.handler = (c) => (c.table === "exchange_companies" ? { data: company("pending") } : { data: null });
    const { POST } = await import("@/app/api/exchange/signals/[signal_id]/publish/route");
    const res = await POST(
      req("/api/exchange/signals/sig_1/publish", {
        method: "POST", headers: { "x-exchange-domain": "acme.example", "x-exchange-company-key": "admin-key", "content-type": "application/json" }, body: "{}",
      }) as never,
      params({ signal_id: "sig_1" }),
    );
    expect(res.status).toBe(403);
    expect(sig.publishSignal).not.toHaveBeenCalled();
  });

  it("verified admin key passes authenticateCompany; unverified passes only the AllowUnverified variant", async () => {
    const { authenticateCompany, authenticateCompanyAllowUnverified } = await import("@/lib/exchange/server");
    h.state.handler = () => ({ data: company("verified") });
    expect(await authenticateCompany("acme.example", "admin-key")).toBe(true);
    h.state.handler = () => ({ data: company("pending") });
    expect(await authenticateCompany("acme.example", "admin-key")).toBe(false);
    expect(await authenticateCompanyAllowUnverified("acme.example", "admin-key")).toBe(true);
    expect(await authenticateCompanyAllowUnverified("acme.example", "wrong")).toBe(false);
  });

  it("unverified admin key is accepted on companies/verify (reaches DNS check) and companies/control GET", async () => {
    h.state.handler = (c) => (c.table === "exchange_companies" ? { data: company("pending") } : { data: [] });
    const verify = await import("@/app/api/exchange/companies/verify/route");
    const v = await verify.POST(
      req("/api/exchange/companies/verify", { method: "POST", headers: { "x-exchange-company-key": "admin-key", "content-type": "application/json" }, body: JSON.stringify({ domain: "acme.example" }) }) as never,
    );
    expect(v.status).toBe(409); // authenticated; TXT record not found
    const control = await import("@/app/api/exchange/companies/control/route");
    const g = await control.GET(req("/api/exchange/companies/control?domain=acme.example", { headers: { "x-exchange-company-key": "admin-key" } }) as never);
    expect(g.status).toBe(200);
  });

  const registration = (domain: string) => ({
    legalName: "Acme Inc", domain, contactName: "Ann Admin", contactEmail: "ann@acme.example", country: "US",
    addressLine1: "1 Main St", city: "Town", region: "CA", postalCode: "94000",
    acceptsUnsolicited: true, acceptsRequests: true, categories: ["other"], agentMode: "hosted_steward",
  });
  const register = async (domain: string) => {
    const { POST } = await import("@/app/api/exchange/companies/route");
    return POST(req("/api/exchange/companies", { method: "POST", headers: { "content-type": "application/json", "x-forwarded-for": "9.9.9.9" }, body: JSON.stringify(registration(domain)) }) as never);
  };

  it("rejects registering the reference domain", async () => {
    const res = await register("signalaf.com");
    expect(res.status).toBe(409);
    expect(h.state.calls.some((c) => c.op === "insert" || c.op === "update")).toBe(false);
  });

  it("stale (>7d) unverified registration can be re-claimed; fresh one cannot", async () => {
    const old = new Date(Date.now() - 8 * 86400_000).toISOString();
    h.state.handler = (c) => (c.table === "exchange_companies" && c.op === "select" ? { data: company("pending", old) } : { data: { id: "c1", domain: "acme.example", verification_status: "pending" } });
    const res = await register("acme.example");
    expect(res.status).toBe(201);
    const upd = h.state.calls.find((c) => c.op === "update");
    expect(upd).toBeTruthy();
    expect((upd!.payload as { verification_status: string }).verification_status).toBe("pending");
    expect((upd!.payload as { admin_key_hash: string }).admin_key_hash).not.toBe(sha("admin-key"));

    h.state.calls.length = 0;
    h.state.handler = (c) => (c.table === "exchange_companies" && c.op === "select" ? { data: company("pending") } : { data: null });
    expect((await register("acme.example")).status).toBe(409);
    // a stale but VERIFIED company is never re-claimable
    h.state.handler = (c) => (c.table === "exchange_companies" && c.op === "select" ? { data: company("verified", old) } : { data: null });
    expect((await register("acme.example")).status).toBe(409);
  });
});

describe("E3 stripe webhook", () => {
  const event = (paymentStatus: string) => ({
    type: "checkout.session.completed",
    data: { object: { id: "cs_1", payment_status: paymentStatus, payment_intent: "pi_1", metadata: { exchange_public_id: "CX-1" } } },
  });
  const hook = async () => {
    const { POST } = await import("@/app/api/exchange/stripe/webhook/route");
    return POST(req("/api/exchange/stripe/webhook", { method: "POST", headers: { "stripe-signature": "s" }, body: "{}" }) as never);
  };
  beforeEach(() => {
    process.env.EXCHANGE_STRIPE_WEBHOOK_SECRET = "whsec";
  });

  it("unpaid session does not settle", async () => {
    h.stripe.value = { webhooks: { constructEvent: () => event("unpaid") } };
    const res = await hook();
    expect(res.status).toBe(200);
    expect(h.state.calls.some((c) => c.op === "update")).toBe(false);
  });

  it("paid session settles from awaiting_payment and moves the record from verified", async () => {
    h.stripe.value = { webhooks: { constructEvent: () => event("paid") } };
    h.state.handler = (c) => {
      if (c.table === "exchange_records" && c.op === "select") return { data: { id: "r1", state: "verified" } };
      if (c.op === "update") return { data: [{ id: "r1", exchange_id: "r1" }] };
      return { data: null };
    };
    const res = await hook();
    expect(res.status).toBe(200);
    const s = h.state.calls.find((c) => c.table === "exchange_settlements" && c.op === "update");
    expect(s!.filters.status).toBe("awaiting_payment");
    const r = h.state.calls.find((c) => c.table === "exchange_records" && c.op === "update");
    expect(r!.filters.state).toBe("verified");
  });

  it("DB error -> 500 so Stripe retries", async () => {
    h.stripe.value = { webhooks: { constructEvent: () => event("paid") } };
    h.state.handler = (c) => (c.table === "exchange_settlements" && c.op === "update" ? { error: { message: "boom" } } : c.table === "exchange_records" ? { data: { id: "r1", state: "verified" } } : { data: null });
    expect((await hook()).status).toBe(500);
  });

  it("settlement matching no row does not flip the exchange", async () => {
    h.stripe.value = { webhooks: { constructEvent: () => event("paid") } };
    h.state.handler = (c) => (c.table === "exchange_records" && c.op === "select" ? { data: { id: "r1", state: "verified" } } : { data: [] });
    const res = await hook();
    expect(res.status).toBe(200);
    expect(h.state.calls.some((c) => c.table === "exchange_records" && c.op === "update")).toBe(false);
  });
});

describe("E4 attempt proposal", () => {
  const call = async (body: unknown = {}) => {
    const { POST } = await import("@/app/api/exchange/signals/[signal_id]/attempts/[attempt_id]/proposal/route");
    return POST(
      req("/api/exchange/signals/sig_1/attempts/att_1/proposal", { method: "POST", headers: { "x-exchange-agent-key": "good-key", "content-type": "application/json" }, body: JSON.stringify(body) }) as never,
      params({ signal_id: "sig_1", attempt_id: "att_1" }),
    );
  };
  beforeEach(() => {
    sig.getSignal.mockResolvedValue(signal(false));
    sig.getAttempt.mockResolvedValue({ status: "verified" });
    sig.getVerification.mockResolvedValue({ id: "v1" });
  });
  const db = (origins: unknown[], verified = true) => (c: Call) => {
    if (c.table === "exchange_agents") return { data: { id: "a" } };
    if (c.table === "exchange_companies") return { data: { id: "c1", verification_status: verified ? "verified" : "pending" } };
    if (c.table === "contribution_proposal_origins") return { data: origins };
    if (c.table === "exchange_records" && c.op === "insert") return { data: { id: "p1", public_id: "CX-1", state: "proposed", title: "t", created_at: "now" } };
    return { data: null };
  };

  it("first proposal -> 201; second proposal for the same attempt -> 409", async () => {
    h.state.handler = db([]);
    expect((await call()).status).toBe(201);
    h.state.handler = db([{ id: "o1" }]);
    expect((await call()).status).toBe(409);
  });

  it("oversized / malformed bodies are rejected and unverified publisher is blocked", async () => {
    h.state.handler = db([]);
    expect((await call({ title: "x".repeat(301) })).status).toBe(400);
    expect((await call({ consideration: Array.from({ length: 21 }, () => ({ type: "other", description: "d" })) })).status).toBe(400);
    h.state.handler = db([], false);
    expect((await call()).status).toBe(409);
  });
});

describe("E6 uniform 401 on execute / receipt", () => {
  const record = (state: string) => ({ id: "r1", public_id: "CX-1", target_domain: "acme.example", state, proposer_key_hash: sha("pk") });
  const dbFor = (state: string) => (c: Call) => (c.table === "exchange_records" ? { data: record(state) } : { data: null });

  it("execute: unauthenticated caller gets the same 401 body in any state", async () => {
    const { POST } = await import("@/app/api/exchange/exchanges/[id]/execute/route");
    const bodies: string[] = [];
    for (const state of ["proposed", "authorized", "settled"]) {
      h.state.handler = dbFor(state);
      const res = await POST(req("/api/exchange/exchanges/CX-1/execute", { method: "POST", headers: { "x-exchange-company-key": "nope" }, body: "{}" }) as never, params({ id: "CX-1" }));
      expect(res.status).toBe(401);
      bodies.push(JSON.stringify(await res.json()));
    }
    expect(new Set(bodies).size).toBe(1);
  });

  it("receipt: unauthenticated caller gets the same 401 body in any state", async () => {
    const { POST } = await import("@/app/api/exchange/exchanges/[id]/execution/receipt/route");
    const bodies: string[] = [];
    for (const state of ["proposed", "delivering", "closed"]) {
      h.state.handler = dbFor(state);
      const res = await POST(req("/api/exchange/exchanges/CX-1/execution/receipt", { method: "POST", headers: { "x-exchange-proposer-key": "wrong" }, body: "{}" }) as never, params({ id: "CX-1" }));
      expect(res.status).toBe(401);
      bodies.push(JSON.stringify(await res.json()));
    }
    expect(new Set(bodies).size).toBe(1);
  });
});

describe("E7 SSRF", () => {
  it("rejects loopback/private/link-local/CGNAT/unspecified/mapped literals", async () => {
    const { isPrivateIp } = await import("@/lib/exchange/ssrf");
    for (const ip of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "0.0.0.0", "::", "::1", "fc00::1", "fd12::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:7f00:1", "::ffff:10.0.0.1"]) {
      expect(isPrivateIp(ip), ip).toBe(true);
    }
    for (const ip of ["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111", "::ffff:8.8.8.8"]) expect(isPrivateIp(ip), ip).toBe(false);
  });

  it("rejects a public-looking hostname that resolves to a private address", async () => {
    const { isProhibitedHostResolved } = await import("@/lib/exchange/ssrf");
    h.dnsLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }, { address: "10.0.0.5", family: 4 }]);
    expect(await isProhibitedHostResolved("evil.example.com")).toBe(true);
    h.dnsLookup.mockResolvedValue([{ address: "93.184.216.34", family: 4 }]);
    expect(await isProhibitedHostResolved("fine.example.com")).toBe(false);
    h.dnsLookup.mockRejectedValue(new Error("ENOTFOUND"));
    expect(await isProhibitedHostResolved("nx.example.com")).toBe(true);
  });

  it("signed notification is not delivered to a host resolving to a private IP", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("ok"));
    h.dnsLookup.mockResolvedValue([{ address: "127.0.0.1", family: 4 }]);
    const { deliverSignedNotification } = await import("@/lib/exchange/signed-notification");
    const r = await deliverSignedNotification({ endpoint: "https://agent.evil.example/hook", sourceDomain: "signalaf.com", destinationDomain: "acme.example", event: { type: "t" } });
    expect(r.delivered).toBe(false);
    expect(r.reason).toBe("endpoint_host_prohibited");
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
});
