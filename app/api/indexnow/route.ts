/**
 * app/api/indexnow/route.ts — IndexNow protocol endpoint.
 *
 * IndexNow is the open protocol (used by Bing, Yandex, Seznam, Naver) for
 * instant URL submission. When a page materially changes, POST the URL here
 * and this route forwards to the IndexNow API. Google doesn't use IndexNow —
 * do not treat this as a Google indexing channel.
 *
 * The IndexNow key is a static file served at /indexnow-key.txt — IndexNow
 * verifies ownership by fetching it from the site root. The key itself is
 * public by design; the SUBMISSION endpoint is the protected surface.
 *
 * Security contract (SEARCH-RECOVERY J):
 *   - Auth: Authorization: Bearer <INDEXNOW_SUBMIT_SECRET>, falling back to
 *     CRON_SECRET so deploy/cron jobs can call it. Neither set → 500 (loud).
 *     There is intentionally no anonymous path — this endpoint is invoked by
 *     deployment tooling, not the public.
 *   - Origin allowlist: every submitted URL must have origin === SITE_ORIGIN.
 *     Any cross-origin entry rejects the whole batch (400).
 *   - No key override: the request can no longer supply `key`. The payload
 *     always uses the key that /indexnow-key.txt serves.
 *   - Dedupe + cap: URLs are deduplicated and capped at MAX_URLS per call.
 *   - Rate limit: MAX_CALLS per RATE_WINDOW per warm instance (best-effort
 *     on serverless — the auth gate is the real boundary).
 *
 * Usage (deploy-time):
 *   curl -X POST /api/indexnow \
 *     -H "Authorization: Bearer $INDEXNOW_SUBMIT_SECRET" \
 *     -d '{"urls":["https://signalaf.com/methodology"]}'
 */

import { NextResponse, type NextRequest } from "next/server";
import { SITE_ORIGIN } from "@/lib/seo";

export const dynamic = "force-dynamic";

// The IndexNow key — must match the file served at /indexnow-key.txt.
// Public by design; rotate by changing here AND the key file together.
const INDEXNOW_KEY =
  "a3f7b2c9e1d4f6a8b0c2e4d6f8a0b2c4e6d8f0a2b4c6d8e0f2a4b6c8d0e2f4a6";

const MAX_URLS = 100;
const RATE_WINDOW_MS = 10 * 60 * 1000;
const MAX_CALLS_PER_WINDOW = 6;

// Best-effort per-instance rate limiting (serverless warm-instance state).
const recentCalls: number[] = [];

function isAuthorized(req: NextRequest): { ok: boolean; status: number; error?: string } {
  const secret = process.env.INDEXNOW_SUBMIT_SECRET ?? process.env.CRON_SECRET;
  if (!secret) {
    return {
      ok: false,
      status: 500,
      error: "INDEXNOW_SUBMIT_SECRET/CRON_SECRET unset — cannot verify request",
    };
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return { ok: false, status: 401, error: "Unauthorized" };
  }
  return { ok: true, status: 200 };
}

export async function POST(req: NextRequest) {
  const auth = isAuthorized(req);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const now = Date.now();
  while (recentCalls.length && now - recentCalls[0] > RATE_WINDOW_MS) {
    recentCalls.shift();
  }
  if (recentCalls.length >= MAX_CALLS_PER_WINDOW) {
    console.warn("[indexnow] rate-limited submission attempt");
    return NextResponse.json(
      { error: "Rate limit exceeded — submit only materially changed URLs" },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = Array.isArray(body.urls)
    ? body.urls.filter((u) => typeof u === "string")
    : [];
  if (raw.length === 0) {
    return NextResponse.json({ error: "No URLs provided" }, { status: 400 });
  }

  // Origin allowlist — every URL must be exactly SITE_ORIGIN. One bad entry
  // fails the batch loudly so a misconfigured caller can't silently push junk.
  const siteOrigin = new URL(SITE_ORIGIN).origin;
  const invalid = raw.filter((u) => {
    try {
      return new URL(u).origin !== siteOrigin;
    } catch {
      return true;
    }
  });
  if (invalid.length > 0) {
    console.warn(`[indexnow] rejected ${invalid.length} non-origin URLs`);
    return NextResponse.json(
      { error: `Rejected ${invalid.length} URL(s) not on ${siteOrigin}` },
      { status: 400 },
    );
  }

  // Dedupe + cap
  const urls = [...new Set(raw)].slice(0, MAX_URLS);
  if (urls.length === 0) {
    return NextResponse.json({ error: "No valid URLs provided" }, { status: 400 });
  }

  recentCalls.push(now);

  try {
    const payload = {
      host: new URL(SITE_ORIGIN).host,
      key: INDEXNOW_KEY,
      keyLocation: `${SITE_ORIGIN}/indexnow-key.txt`,
      urlList: urls,
    };

    const res = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
    });

    const ok = res.ok || res.status === 200 || res.status === 202;
    console.log(
      `[indexnow] submitted ${urls.length} URL(s) → ${res.status} (${ok ? "ok" : "rejected by IndexNow"})`,
    );

    return NextResponse.json(
      {
        status: res.status,
        ok,
        submitted: urls.length,
        deduped: raw.length - new Set(raw).size,
      },
      { status: 200, headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    console.error("[indexnow] submission failed:", (e as Error).message);
    return NextResponse.json(
      { error: "IndexNow submission failed" },
      { status: 502 },
    );
  }
}
