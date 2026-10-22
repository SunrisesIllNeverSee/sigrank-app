// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const h = vi.hoisted(() => ({
  user: vi.fn(),
  tokenUser: vi.fn(),
  limit: vi.fn(),
  send: vi.fn(),
}));

vi.mock("@/lib/infra/supabase/auth-server", () => ({
  getSessionUser: h.user,
}));
vi.mock("@supabase/supabase-js", () => ({
  createClient: () => ({ auth: { getUser: h.tokenUser } }),
}));
vi.mock("@/lib/infra/distributed-rate-limit", () => ({
  checkDistributedRateLimit: h.limit,
}));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: h.send };
  },
}));

import { POST } from "@/app/api/v1/owner/send-email/route";

const OWNER_ID = "63e70157-2e63-49d2-b2bf-6a634fb547b9"; // test-only ID, never a credential
const valid = {
  to: "recipient@example.com",
  subject: "SignalAF card",
  text: "Here is your operator card.",
  confirmSend: true,
  idempotencyKey: "card20261022_r1",
};

const req = (body: unknown = valid, extra: Record<string, string> = {}) =>
  new NextRequest("https://signalaf.com/api/v1/owner/send-email", {
    method: "POST",
    headers: { origin: "https://signalaf.com", "content-type": "application/json", ...extra },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  process.env.SIGNALAF_MAIL_OWNER_USER_ID = OWNER_ID;
  process.env.RESEND_API_KEY = "re_test_not_real";
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test_publishable_key";
  h.user.mockResolvedValue({ id: OWNER_ID, email: "owner@example.com" });
  h.tokenUser.mockResolvedValue({ data: { user: { id: OWNER_ID, email: "owner@example.com" } }, error: null });
  h.limit.mockResolvedValue({ ok: true, retryAfter: 0, limit: 20, remaining: 19, reset: 60 });
  h.send.mockResolvedValue({ data: { id: "em_test_123" }, error: null });
});

describe("private SignalAF outbound mail route", () => {
  it("rejects anonymous and cross-origin browser posts before sending", async () => {
    h.user.mockResolvedValue(null);
    expect((await POST(req())).status).toBe(401);
    expect((await POST(req(valid, { origin: "https://evil.example" }))).status).toBe(403);
    expect(h.send).not.toHaveBeenCalled();
  });

  it("requires the specifically configured verified owner account", async () => {
    h.user.mockResolvedValue({ id: "other-user-id" });
    expect((await POST(req())).status).toBe(403);
    delete process.env.SIGNALAF_MAIL_OWNER_USER_ID;
    expect((await POST(req())).status).toBe(503);
    expect(h.send).not.toHaveBeenCalled();
  });

  it("verifies bearer JWTs with Supabase; rejects invalid bearer tokens", async () => {
    const headers = { authorization: "Bearer authenticated.user.jwt" };
    h.tokenUser.mockResolvedValueOnce({ data: { user: null }, error: { message: "expired" } });
    expect((await POST(req(valid, headers))).status).toBe(401);
    expect((await POST(req(valid, headers))).status).toBe(200);
    expect(h.tokenUser).toHaveBeenCalledWith("authenticated.user.jwt");
    expect(h.user).not.toHaveBeenCalled();
  });

  it("refuses unconfirmed, malformed and header-injection payloads", async () => {
    for (const body of [
      { ...valid, confirmSend: false },
      { ...valid, to: "a@example.com,b@example.com" },
      { ...valid, subject: "Subject\r\nBcc: victim@example.com" },
      { ...valid, from: "attacker@example.com" },
      { ...valid, idempotencyKey: "!" },
      { ...valid, text: "" },
    ]) {
      expect((await POST(req(body))).status).toBe(400);
    }
    expect(h.send).not.toHaveBeenCalled();
  });

  it("sends only from hello@signalaf.com with a stable Resend idempotency key", async () => {
    const response = await POST(req());
    expect(response.status).toBe(200);
    expect((await response.json()).providerId).toBe("em_test_123");
    expect(h.send).toHaveBeenCalledWith(
      expect.objectContaining({
        from: "SignalAF <hello@signalaf.com>",
        replyTo: "hello@signalaf.com",
        to: ["recipient@example.com"],
        subject: valid.subject,
        text: valid.text,
      }),
      { idempotencyKey: "signalaf-owner/card20261022_r1" },
    );
    expect(h.limit).toHaveBeenCalledTimes(2);
    expect(h.limit.mock.calls[0][2]).toBe(true);
    expect(h.limit.mock.calls[1][2]).toBe(true);
    expect(response.headers.get("cache-control")).toContain("no-store");
  });

  it("fails closed when durable rate limits are unavailable", async () => {
    h.limit.mockResolvedValue({ ok: false, retryAfter: 25, limit: 20, remaining: 0, reset: 25 });
    const response = await POST(req());
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("25");
    expect(h.send).not.toHaveBeenCalled();
  });

  it("rejects non-PNG attachments and accepts a bounded PNG payload", async () => {
    expect((await POST(req({
      ...valid, attachment: { filename: "card.png", contentBase64: Buffer.from("not a png").toString("base64") },
    }))).status).toBe(400);
    const png = Buffer.from("89504e470d0a1a0a0000000049454e44ae426082", "hex");
    const response = await POST(req({
      ...valid, attachment: { filename: "card.png", contentBase64: png.toString("base64") },
    }));
    expect(response.status).toBe(200);
    const attachments = h.send.mock.calls.at(-1)?.[0].attachments;
    expect(attachments[0].filename).toBe("card.png");
    expect(attachments[0].content).toEqual(png);
  });

  it("refuses to send if Resend configuration is missing or provider fails", async () => {
    delete process.env.RESEND_API_KEY;
    expect((await POST(req())).status).toBe(503);
    process.env.RESEND_API_KEY = "re_test_not_real";
    h.send.mockResolvedValue({ data: null, error: { name: "service_unavailable" } });
    expect((await POST(req())).status).toBe(502);
  });
});
