import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { service } = vi.hoisted(() => ({ service: { from: vi.fn() } }));
vi.mock("@/lib/infra/supabase/server", () => ({ getSupabaseService: () => service }));
vi.mock("@/lib/infra/api-gate", () => ({
  rateLimit: () => ({ ok: true }),
  rateLimitedResponse: vi.fn(),
}));

const { GET } = await import("@/app/api/v1/operators/[codename]/snapshot-history/route");

function query(data: unknown) {
  const q = {
    select: () => q,
    ilike: () => q,
    limit: () => q,
    eq: () => q,
    order: () => q,
    maybeSingle: async () => ({ data, error: null }),
    range: async () => ({ data, error: null }),
  };
  return q;
}

const request = new NextRequest("https://signalaf.com/api/v1/operators/test-op/snapshot-history");
const params = { params: Promise.resolve({ codename: "test-op" }) };

beforeEach(() => service.from.mockReset());

describe("public snapshot history", () => {
  it("does not read raw submissions for a private profile", async () => {
    service.from.mockImplementation((table: string) => {
      if (table === "operators_public") return query({
        operator_id: "op-1", claimed: true, status: "active", profile_visibility: "private",
      });
      return query([]);
    });
    const response = await GET(request, params);
    expect(response.status).toBe(404);
    expect(service.from).toHaveBeenCalledTimes(1);
  });

  it("returns scored counts and dates without private payload or device material", async () => {
    service.from.mockImplementation((table: string) => {
      if (table === "operators_public") return query({
        operator_id: "op-1", claimed: true, status: "active", profile_visibility: "public",
      });
      return query([{
        submission_id: "1e44be9b-57a1-4d3c-85aa-780afcc7f1d7",
        submitted_at: "2026-10-03T12:00:00Z",
        window_type: "7d",
        window_start: "2026-10-01T00:00:00Z",
        window_end: "2026-10-03T00:00:00Z",
        platform: "codex",
        ruleset_version: "1.0",
        input_tokens: 100,
        output_tokens: 300,
        cache_creation_tokens: 0,
        cache_read_tokens: 600,
        workflow_mode: null,
        workflow_evidence_url: null,
        payload_json: { prompt: "private" },
        device_id: "private-device",
        signature: "private-signature",
      }]);
    });
    const response = await GET(request, params);
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.entries[0]).toMatchObject({
      platform: "codex", window: "7d", processed_tokens_per_day: 500,
      output_tokens_per_day: 150, workflow_mode: "hitl",
    });
    const serialized = JSON.stringify(body);
    for (const secret of ["payload_json", "private-device", "private-signature", "submission_id"])
      expect(serialized).not.toContain(secret);
  });
});
