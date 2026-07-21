import { NextResponse, type NextRequest } from "next/server";
import { Resend } from "resend";

/**
 * POST /api/v1/account/removal-request — public removal request form.
 *
 * For seeded operators without an account. No auth required.
 * Body: { handle, email }
 * Sends an email to hello@signalaf.com via Resend and returns a reference number.
 * Rate-limited by IP (3 requests / minute).
 */

export const dynamic = "force-dynamic";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const TO = "hello@signalaf.com";
const FROM = "SigRank Removal <onboarding@resend.dev>";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 3;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

function makeRef(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SR-${ts}-${rand}`;
}

export async function POST(req: NextRequest) {
  if (!RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Removal requests are not configured." },
      { status: 503 },
    );
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("cf-connecting-ip") ??
    "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute." },
      { status: 429 },
    );
  }

  let body: { handle?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const handle = (body.handle ?? "").trim().slice(0, 100);
  const email = (body.email ?? "").trim();

  if (!handle) {
    return NextResponse.json(
      { error: "Board handle is required." },
      { status: 400 },
    );
  }
  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "A valid email is required." },
      { status: 400 },
    );
  }

  const reference = makeRef();

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: FROM,
      to: TO,
      replyTo: email,
      subject: `Removal request ${reference}: ${handle}`,
      text: [
        `Reference: ${reference}`,
        `Handle: ${handle}`,
        `Email: ${email}`,
        `Submitted: ${new Date().toISOString()}`,
        "",
        "Process: verify identity → clear_operator_data() → delete_account() → confirm to user.",
      ].join("\n"),
    });

    if (error) {
      console.error("Resend error:", error);
      return NextResponse.json(
        { error: "Could not submit request. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, reference });
  } catch (err) {
    console.error("Removal request error:", err);
    return NextResponse.json(
      { error: "Could not submit request. Please try again." },
      { status: 500 },
    );
  }
}
