import { NextRequest, NextResponse } from "next/server";
import { submitAttempt, getSignal } from "@/lib/exchange/signal-server";
import { logEncounter, requestIdentity } from "@/lib/exchange/server";
import { createHash } from "node:crypto";
import { checkDistributedRateLimit, distributedRateLimitHeaders } from "@/lib/infra/distributed-rate-limit";

/**
 * POST /api/exchange/signals/{signal_id}/attempts/{attempt_id}/submit — submit work (§10.2).
 *
 * Submission requirements:
 * - media type enforcement
 * - maximum size enforcement
 * - body digest
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ signal_id: string; attempt_id: string }> },
) {
  const { signal_id, attempt_id } = await params;
  const ip = requestIdentity(req);
  const rl = await checkDistributedRateLimit(["signal-submit", ip], { windowMs: 60 * 60 * 1000, max: 30 }, true);
  if (!rl.ok) return NextResponse.json({ error: "Rate limited" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter), ...distributedRateLimitHeaders(rl, "signal-submit") } });

  const signal = await getSignal(signal_id);
  if (!signal) return NextResponse.json({ error: "Signal not found" }, { status: 404, headers: distributedRateLimitHeaders(rl, "signal-submit") });

  const contentType = req.headers.get("content-type") ?? "";
  if (!signal.submission.accepted_media_types.some(mt => contentType.includes(mt))) {
    return NextResponse.json(
      { error: `Unsupported media type. Accepted: ${signal.submission.accepted_media_types.join(", ")}` },
      { status: 415, headers: distributedRateLimitHeaders(rl, "signal-submit") },
    );
  }

  const body = await req.text();
  if (body.length > signal.submission.maximum_bytes) {
    return NextResponse.json(
      { error: `Submission exceeds maximum size of ${signal.submission.maximum_bytes} bytes` },
      { status: 413, headers: distributedRateLimitHeaders(rl, "signal-submit") },
    );
  }

  const bodyHash = `sha256:${createHash("sha256").update(body).digest("hex")}`;
  const actorId = req.headers.get("x-exchange-actor-id") ?? `anonymous:${ip}`;

  // Validate required_fields (§10.2). The signal declares which fields must
  // be present in the submission body. For JSON submissions, we parse the
  // body and check that each required field is present. For non-JSON media
  // types, required_fields validation is skipped (the verifier will check
  // content semantics).
  if (contentType.includes("application/json") && signal.submission.required_fields.length > 0) {
    let parsedBody: Record<string, unknown>;
    try {
      parsedBody = JSON.parse(body);
    } catch {
      return NextResponse.json(
        { error: "Submission body is not valid JSON despite application/json content type" },
        { status: 400, headers: distributedRateLimitHeaders(rl, "signal-submit") },
      );
    }
    if (typeof parsedBody !== "object" || parsedBody === null || Array.isArray(parsedBody)) {
      return NextResponse.json(
        { error: "Submission body must be a JSON object" },
        { status: 400, headers: distributedRateLimitHeaders(rl, "signal-submit") },
      );
    }
    const missing = signal.submission.required_fields.filter(f => !(f in parsedBody));
    if (missing.length > 0) {
      return NextResponse.json(
        { error: `Submission missing required fields: ${missing.join(", ")}` },
        { status: 400, headers: distributedRateLimitHeaders(rl, "signal-submit") },
      );
    }
  }

  // Parse artifact references from headers if present.
  // Wrapped in try/catch to return 400 on malformed input instead of 500.
  const artifactRefsHeader = req.headers.get("x-artifact-references");
  let artifactReferences: Array<{ uri: string; digest: string }> | undefined;
  if (artifactRefsHeader) {
    try {
      const parsed = JSON.parse(artifactRefsHeader);
      if (!Array.isArray(parsed)) {
        return NextResponse.json(
          { error: "x-artifact-references header must be a JSON array" },
          { status: 400, headers: distributedRateLimitHeaders(rl, "signal-submit") },
        );
      }
      artifactReferences = parsed.map((r: unknown) => {
        if (typeof r !== "object" || r === null || !("uri" in r) || !("digest" in r)) {
          throw new Error("each artifact reference must have uri and digest");
        }
        return { uri: String((r as Record<string, unknown>).uri), digest: String((r as Record<string, unknown>).digest) };
      });
    } catch (error) {
      return NextResponse.json(
        { error: `Malformed x-artifact-references header: ${error instanceof Error ? error.message : "invalid JSON"}` },
        { status: 400, headers: distributedRateLimitHeaders(rl, "signal-submit") },
      );
    }
  }

  try {
    const result = await submitAttempt({
      signalId: signal_id,
      attemptId: attempt_id,
      actorId,
      mediaType: contentType,
      bodyHash,
      body,
      artifactReferences,
    });

    await logEncounter({
      targetDomain: signal.publisher.domain,
      endpoint: `/api/exchange/signals/${signal_id}/attempts/${attempt_id}/submit`,
      req,
      method: "POST",
      result: "ok",
      metadata: { attempt_id, body_hash: bodyHash },
    });

    return NextResponse.json(
      {
        attempt_id: result.attempt_id,
        status: result.status,
        body_hash: bodyHash,
        note: "Submission received. Verification will be performed by the Steward. This does not verify a Contribution or advance exchange state.",
      },
      { headers: distributedRateLimitHeaders(rl, "signal-submit") },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed";
    const status = message.includes("not found") ? 404 : message.includes("authorized") ? 403 : 400;
    return NextResponse.json({ error: message }, { status, headers: distributedRateLimitHeaders(rl, "signal-submit") });
  }
}
