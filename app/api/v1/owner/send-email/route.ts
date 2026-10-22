import "server-only";

import { createHash } from "node:crypto";
import { Resend } from "resend";
import { NextResponse, type NextRequest } from "next/server";
import { createClient, type User } from "@supabase/supabase-js";
import { getSessionUser } from "@/lib/infra/supabase/auth-server";
import { checkDistributedRateLimit } from "@/lib/infra/distributed-rate-limit";

/**
 * PRIVATE sender, intentionally NOT registered with the public/no-auth MCP tools.
 *
 * POST /api/v1/owner/send-email
 * Authorization: a verified Supabase access JWT (Bearer) owned by a
 * explicitly authorized owner account, or a same-origin owner browser session.
 *
 * No provider key or sender choice is accepted from the caller.
 * The existing RESEND_API_KEY is used only on the server.
 */
export const dynamic = "force-dynamic";

const FROM = "SignalAF <hello@signalaf.com>";
const REPLY_TO = "hello@signalaf.com";
const HEADERS = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const MAX_JSON_BYTES = 3 * 1024 * 1024;
const MAX_PNG_BYTES = 2 * 1024 * 1024;
const PNG_HEADER = "89504e470d0a1a0a";

type Body = {
  to: string;
  subject: string;
  text: string;
  confirmSend: true;
  idempotencyKey: string;
  attachment?: { filename: string; contentBase64: string };
};
type ErrorStatus = { status: number; error: string };

function response(status: number, result: object, retryAfter?: number) {
  return NextResponse.json(result, {
    status,
    headers: { ...HEADERS, ...(retryAfter ? { "Retry-After": String(retryAfter) } : {}) },
  });
}

function checkBody(input: unknown): Body | ErrorStatus {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { status: 400, error: "Expected an email object." };
  }
  const b = input as Record<string, unknown>;
  const allowed = new Set(["to", "subject", "text", "confirmSend", "idempotencyKey", "attachment"]);
  if (Object.keys(b).some((k) => !allowed.has(k))) {
    return { status: 400, error: "Unrecognized field; sender and headers cannot be overridden." };
  }
  if (b.confirmSend !== true) return { status: 400, error: "Explicit confirmSend=true is required." };
  if (typeof b.to !== "string" || !/^[^<>\s@,;]{1,64}@[A-Za-z0-9.-]+\.[A-Za-z]{2,24}$/.test(b.to) || b.to.length > 254) {
    return { status: 400, error: "Exactly one valid recipient email is required." };
  }
  if (typeof b.subject !== "string" || b.subject.length < 1 || b.subject.length > 160 || /[\r\n\x00-\x1f\x7f]/.test(b.subject)) {
    return { status: 400, error: "Invalid subject." };
  }
  if (typeof b.text !== "string" || b.text.trim().length < 1 || b.text.length > 12000 || /\x00/.test(b.text)) {
    return { status: 400, error: "Message text must contain 1–12,000 characters." };
  }
  if (typeof b.idempotencyKey !== "string" || !/^[A-Za-z0-9][A-Za-z0-9_-]{7,79}$/.test(b.idempotencyKey)) {
    return { status: 400, error: "Supply a stable 8–80 character idempotencyKey." };
  }
  if (b.attachment !== undefined) {
    if (!b.attachment || typeof b.attachment !== "object" || Array.isArray(b.attachment)) {
      return { status: 400, error: "Invalid PNG attachment." };
    }
    const attachment = b.attachment as Record<string, unknown>;
    if (
      Object.keys(attachment).some((k) => !["filename", "contentBase64"].includes(k)) ||
      typeof attachment.filename !== "string" ||
      !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,79}\.png$/i.test(attachment.filename) ||
      typeof attachment.contentBase64 !== "string" ||
      attachment.contentBase64.length > Math.ceil(MAX_PNG_BYTES / 3) * 4 + 4 ||
      !/^[A-Za-z0-9+/]+={0,2}$/.test(attachment.contentBase64)
    ) {
      return { status: 400, error: "Only one PNG attachment (2 MiB maximum) is supported." };
    }
    const bytes = Buffer.from(attachment.contentBase64, "base64");
    if (bytes.length === 0 || bytes.length > MAX_PNG_BYTES || bytes.subarray(0, 8).toString("hex") !== PNG_HEADER ||
      bytes.toString("base64") !== attachment.contentBase64) {
      return { status: 400, error: "Invalid PNG data." };
    }
  }
  return b as Body;
}

async function verifiedOwner(req: NextRequest): Promise<User | ErrorStatus> {
  const bearer = req.headers.get("authorization");
  let user: User | null = null;

  if (bearer !== null) {
    // ChatGPT/agent callers must present a real, verified Supabase user access JWT.
    const match = /^Bearer ([A-Za-z0-9_.-]+)$/.exec(bearer);
    if (!match) return { status: 401, error: "Invalid bearer authorization." };
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anon) return { status: 503, error: "Authentication unavailable." };
    const auth = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
    const result = await auth.auth.getUser(match[1]);
    if (result.error || !result.data.user) return { status: 401, error: "Invalid or expired access token." };
    user = result.data.user;
  } else {
    // Cookie-authenticated browser POSTs must be same-origin to prevent CSRF.
    const origin = req.headers.get("origin");
    if (!origin || origin !== new URL(req.url).origin) {
      return { status: 403, error: "Same-origin request required." };
    }
    user = await getSessionUser();
    if (!user) return { status: 401, error: "Sign in to SignalAF." };
  }

  // The SignalAF schema has no public profiles/role table. Bind the endpoint
  // to one verified Supabase user ID stored in a server-only Vercel env var.
  // Never trust user-editable metadata, a public codename, or a supplied email.
  const ownerId = process.env.SIGNALAF_MAIL_OWNER_USER_ID?.trim();
  if (!ownerId) return { status: 503, error: "Owner authorization unavailable." };
  if (user.id !== ownerId) return { status: 403, error: "Owner permission required." };
  return user;
}

export async function POST(req: NextRequest) {
  try {
    const actor = await verifiedOwner(req);
    if ("status" in actor) return response(actor.status, { error: actor.error });

    // Missing provider config is a hard error; never silently substitute Gmail.
    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) return response(503, { error: "Resend is not configured." });

    const raw = await req.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_JSON_BYTES) {
      return response(413, { error: "Request is too large." });
    }
    let parsed: unknown;
    try { parsed = JSON.parse(raw); }
    catch { return response(400, { error: "Invalid JSON." }); }
    const input = checkBody(parsed);
    if ("status" in input) return response(input.status, { error: input.error });

    // Durable distributed limits (Upstash or Postgres); fail closed if unavailable.
    const hour = await checkDistributedRateLimit(["owner-mail", actor.id, "hour"], { windowMs: 3_600_000, max: 20 }, true);
    if (!hour.ok) return response(429, { error: "Hourly sending limit reached." }, hour.retryAfter);
    const day = await checkDistributedRateLimit(["owner-mail", "global", "day"], { windowMs: 86_400_000, max: 60 }, true);
    if (!day.ok) return response(429, { error: "Daily sending limit reached." }, day.retryAfter);

    const attachments = input.attachment
      ? [{ filename: input.attachment.filename, content: Buffer.from(input.attachment.contentBase64, "base64") }]
      : undefined;
    const { data, error } = await new Resend(key).emails.send({
      from: FROM,
      replyTo: REPLY_TO,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      ...(attachments ? { attachments } : {}),
    }, {
      // Provider-side 24h deduplication; stable key also covers ambiguous retries.
      idempotencyKey: "signalaf-owner/" + input.idempotencyKey,
    });
    if (error || !data?.id) {
      // Do not log address, message contents, attachments, or authentication data.
      console.error("[owner-mail] provider refused request", { ownerId: actor.id, providerCode: error?.name ?? "no_receipt" });
      return response(502, { error: "Resend did not accept the email." });
    }
    const recipientDigest = createHash("sha256").update(input.to.toLowerCase()).digest("hex").slice(0, 16);
    console.info("[owner-mail] accepted", { ownerId: actor.id, recipientDigest, providerId: data.id, hasAttachment: !!attachments });
    return response(200, { status: "accepted", from: REPLY_TO, providerId: data.id, recipient: input.to });
  } catch {
    return response(503, { error: "Email service is unavailable." });
  }
}

// This is intentionally a send-only POST endpoint with no browser GET or public MCP registration.
