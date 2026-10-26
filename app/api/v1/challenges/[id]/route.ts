/**
 * GET  /api/v1/challenges/[id] — fetch a single challenge + both submissions.
 * PATCH /api/v1/challenges/[id] — submit a signal score for this challenge.
 *
 * PATCH body:
 *   {
 *     operator_codename: string,
 *     signal_text:       string,
 *     engine:            string,          // gemini|claude|gpt|grok|deepseek|perplexity
 *     scores: {
 *       density:  number,  // 0–100 (CLIENT-REPORTED — NOT authoritative)
 *       clarity:  number,
 *       fidelity: number,
 *       brevity:  number,
 *       impact:   number,
 *     },
 *     certificate_json?: {                // SIGNED scoring certificate (authoritative)
 *       challenge_id: string,
 *       operator_id:  string,
 *       scores: { density, clarity, fidelity, brevity, impact },
 *       composite:    number,
 *       engine:       string,
 *       timestamp:    string,
 *       signature:    string,             // ed25519 base64 over canonical bytes (minus signature)
 *     }
 *   }
 *
 * F1 SECURITY FIX (2026-07-31): Body-supplied pillar scores are NO LONGER
 * authoritative. The composite used for ranking must come from either:
 *   (a) a verified ed25519-signed certificate_json (scoring worker), or
 *   (b) a future server-side scorer (not yet implemented).
 *
 * Without a verified cert, the submission is stored with scoring_mode="pending"
 * and composite_score=0. Auto-resolve only fires when BOTH submissions have
 * scoring_mode="api_verified" (signed cert verified by SCORING_WORKER_PUBKEY).
 *
 * The client-reported scores are still stored in score_density etc. columns
 * for display and future re-scoring, but they are NOT used for ranking.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseService } from "@/lib/infra/supabase/server";
import { resolveAuth } from "@/lib/infra/api-auth";
import { extractVerifiedCert, certBindsTo } from "@/lib/identity/challenge-cert";
import { enforceRouteLimit } from "@/lib/infra/route-rate-limit";
import {
  MAX_CERT_JSON_BYTES,
  MAX_SIGNAL_TEXT_CHARS,
  challengesMutedResponse,
  jsonWithinBytes,
} from "@/lib/identity/challenge-limits";
import { publicCodenameSet, redactEmbed } from "@/lib/identity/challenge-visibility";

function compositeScore(
  d: number,
  cl: number,
  fi: number,
  br: number,
  im: number,
): number {
  return (
    Math.round((d * 0.3 + cl * 0.2 + fi * 0.2 + br * 0.15 + im * 0.15) * 100) /
    100
  );
}

// ---------------------------------------------------------------------------
// GET — fetch challenge + submissions
// ---------------------------------------------------------------------------
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const muted = challengesMutedResponse();
  if (muted) return muted;

  const { id } = await params;
  const sb = getSupabaseService();
  if (!sb) {
    return NextResponse.json(
      { error: "db_not_configured", mock: true },
      { status: 503 },
    );
  }

  const { data: challenge, error } = await sb
    .from("challenges")
    .select(
      `
      challenge_id, format, status, prompt_brief, prompt_id,
      window_open, window_close, completed_at,
      challenger_score, challenged_score, margin,
      challenger_engine, challenged_engine,
      challenger:challenger_id(codename, class_tier:metric_snapshots(class_tier)),
      challenged:challenged_id(codename, class_tier:metric_snapshots(class_tier)),
      winner:winner_id(codename)
    `,
    )
    .eq("challenge_id", id)
    .single();

  if (error || !challenge) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Fetch submissions (only for completed challenges — privacy until window closes)
  let submissions = null;
  if (challenge.status === "complete") {
    const { data: subs } = await sb
      .from("challenge_submissions")
      .select(
        `
        submission_id, engine, composite_score,
        score_density, score_clarity, score_fidelity, score_brevity, score_impact,
        certificate_json, submitted_at,
        operator:operator_id(codename)
      `,
      )
      .eq("challenge_id", id);
    submissions = subs ?? [];
  }

  // Redact: only public codenames, never operator_id (also strip it from
  // the embedded signed certificate copy).
  type Row = Record<string, unknown>;
  const ch = challenge as unknown as Row;
  const subRows = (submissions ?? []) as unknown as Row[];
  const nameOf = (e: unknown): string | null => {
    const o = Array.isArray(e) ? e[0] : e;
    return (o as { codename?: string } | null)?.codename ?? null;
  };
  const pub = await publicCodenameSet(sb, [
    nameOf(ch.challenger),
    nameOf(ch.challenged),
    nameOf(ch.winner),
    ...subRows.map((s) => nameOf(s.operator)),
  ]);
  const redactedChallenge = {
    ...ch,
    challenger: redactEmbed(ch.challenger as never, pub) ? ch.challenger : null,
    challenged: redactEmbed(ch.challenged as never, pub) ? ch.challenged : null,
    winner: redactEmbed(ch.winner as never, pub),
  };
  const redactedSubs = submissions
    ? subRows.map((s) => {
        const cert = s.certificate_json;
        let certOut = cert;
        if (cert && typeof cert === "object" && !Array.isArray(cert)) {
          const { operator_id: _omit, ...rest } = cert as Row;
          void _omit;
          certOut = rest;
        }
        return { ...s, operator: redactEmbed(s.operator as never, pub), certificate_json: certOut };
      })
    : null;

  return NextResponse.json({ challenge: redactedChallenge, submissions: redactedSubs });
}

// ---------------------------------------------------------------------------
// PATCH — submit a signal score
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const muted = challengesMutedResponse();
  if (muted) return muted;

  const { id } = await params;

  const limited = await enforceRouteLimit(
    req,
    "challenge-submit",
    { windowMs: 60 * 60 * 1000, max: 60 },
    { failClosed: true },
  );
  if (limited) return limited;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // AUTH (2026-07-02): resolve the submitter's identity from signature-OR-session,
  // NOT from a body-supplied codename. Anyone with curl could previously submit
  // scores as any operator and decide challenge outcomes.
  const auth = await resolveAuth(req, body as Record<string, unknown>);
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }
  const operatorCodename = auth.codename;
  const operatorId = auth.operatorId;

  const b = body as Record<string, unknown>;
  const signalText = typeof b.signal_text === "string" ? b.signal_text : "";
  const engine = typeof b.engine === "string" ? b.engine : "claude";
  const certJson = b.certificate_json ?? null;

  // Client-reported scores (stored for display, NOT used for ranking)
  const rawScores = b.scores as Record<string, unknown> | undefined;
  const density = Number(rawScores?.density ?? 0);
  const clarity = Number(rawScores?.clarity ?? 0);
  const fidelity = Number(rawScores?.fidelity ?? 0);
  const brevity = Number(rawScores?.brevity ?? 0);
  const impact = Number(rawScores?.impact ?? 0);

  if (signalText.length > MAX_SIGNAL_TEXT_CHARS) {
    return NextResponse.json(
      { error: "too_long", detail: `signal_text max ${MAX_SIGNAL_TEXT_CHARS} chars` },
      { status: 400 },
    );
  }
  if (certJson !== null && !jsonWithinBytes(certJson, MAX_CERT_JSON_BYTES)) {
    return NextResponse.json(
      { error: "too_large", detail: "certificate_json too large" },
      { status: 400 },
    );
  }

  if (!signalText.trim()) {
    return NextResponse.json(
      { error: "missing_field", detail: "signal_text required" },
      { status: 400 },
    );
  }
  // Secondary guard: range validation (primary guard is the signature)
  if (
    [density, clarity, fidelity, brevity, impact].some((v) => v < 0 || v > 100)
  ) {
    return NextResponse.json(
      { error: "invalid_scores", detail: "All scores must be 0–100" },
      { status: 400 },
    );
  }

  // F1 FIX: Check for a verified signed certificate. If present, use its
  // scores as authoritative. If not, the submission is "pending" — the
  // client-reported composite is NOT used for ranking.
  // The cert must be bound to THIS challenge + THIS operator (and, once the
  // challenge row is loaded, its window); otherwise it is treated as pending.
  const sigCert = extractVerifiedCert(certJson);
  let verifiedCert =
    sigCert && certBindsTo(sigCert, { challengeId: id, operatorId })
      ? sigCert
      : null;
  let scoringMode = verifiedCert ? "api_verified" : "pending";
  let authoritativeComposite = verifiedCert
    ? verifiedCert.composite
    : 0; // pending submissions have composite=0 (not ranked)

  const sb = getSupabaseService();
  if (!sb) {
    // Mock path
    return NextResponse.json({
      submission_id: `sub_mock_${Date.now()}`,
      challenge_id: id,
      operator_codename: operatorCodename,
      composite_score: authoritativeComposite,
      scoring_mode: scoringMode,
      status: "submitted",
      mock: true,
    });
  }

  // Fetch challenge to validate it's active and this operator is a participant
  const { data: challenge } = await sb
    .from("challenges")
    .select(
      "challenge_id, status, challenger_id, challenged_id, window_open, window_close, format",
    )
    .eq("challenge_id", id)
    .single();

  if (!challenge) {
    return NextResponse.json({ error: "challenge_not_found" }, { status: 404 });
  }
  if (challenge.status !== "active") {
    return NextResponse.json(
      {
        error: "challenge_not_active",
        detail: `Status is '${challenge.status}'`,
      },
      { status: 409 },
    );
  }
  if (new Date() > new Date(challenge.window_close)) {
    return NextResponse.json(
      { error: "window_closed", detail: "Submission window has closed" },
      { status: 409 },
    );
  }
  // For throwdown: verify this operator is a participant
  if (challenge.format === "throwdown") {
    const isParticipant =
      challenge.challenger_id === operatorId ||
      challenge.challenged_id === operatorId;
    if (!isParticipant) {
      return NextResponse.json(
        {
          error: "not_participant",
          detail: "Operator is not a participant in this throwdown",
        },
        { status: 403 },
      );
    }
  }

  // Re-check the cert timestamp against this challenge's window.
  if (
    verifiedCert &&
    !certBindsTo(verifiedCert, {
      challengeId: id,
      operatorId,
      window: { open: challenge.window_open, close: challenge.window_close },
    })
  ) {
    verifiedCert = null;
    scoringMode = "pending";
    authoritativeComposite = 0;
  }

  // Upsert submission (UNIQUE constraint on challenge_id + operator_id)
  // F1 FIX: composite_score uses the AUTHORITATIVE composite (from verified
  // cert), not the client-reported one. scoring_mode reflects whether the
  // composite was verified. Client-reported scores are still stored in
  // score_density etc. for display / future re-scoring.
  const { data: sub, error: subErr } = await sb
    .from("challenge_submissions")
    .upsert(
      {
        challenge_id: id,
        operator_id: operatorId,
        signal_text: signalText,
        score_density: density,
        score_clarity: clarity,
        score_fidelity: fidelity,
        score_brevity: brevity,
        score_impact: impact,
        composite_score: authoritativeComposite,
        engine,
        certificate_json: verifiedCert ? certJson : null,
        scoring_mode: scoringMode,
      },
      { onConflict: "challenge_id,operator_id" },
    )
    .select("submission_id")
    .single();

  if (subErr) {
    console.error("[challenges/id] submission upsert error", subErr);
    return NextResponse.json(
      { error: "db_error", detail: "Could not record submission" },
      { status: 500 },
    );
  }

  // Auto-resolve: if throwdown and both sides have submitted with VERIFIED
  // composites (scoring_mode="api_verified"), compute winner.
  // F1 FIX: NEVER auto-resolve from client-reported (pending) scores.
  let resolved = false;
  let winner_codename: string | null = null;

  if (
    challenge.format === "throwdown" &&
    challenge.challenger_id &&
    challenge.challenged_id
  ) {
    const { data: subs } = await sb
      .from("challenge_submissions")
      .select("operator_id, composite_score, scoring_mode")
      .eq("challenge_id", id);

    if (subs && subs.length >= 2) {
      const challSub = subs.find(
        (s) => s.operator_id === challenge.challenger_id,
      );
      const challdSub = subs.find(
        (s) => s.operator_id === challenge.challenged_id,
      );

      // F1 FIX: only resolve when BOTH submissions have verified composites.
      // Pending submissions (no signed cert) cannot win — their composite is 0.
      if (
        challSub &&
        challdSub &&
        challSub.scoring_mode === "api_verified" &&
        challdSub.scoring_mode === "api_verified"
      ) {
        const challScore = Number(challSub.composite_score);
        const challdScore = Number(challdSub.composite_score);
        const winnerId =
          challScore >= challdScore
            ? challenge.challenger_id
            : challenge.challenged_id;
        const margin = Math.abs(challScore - challdScore);

        await sb
          .from("challenges")
          .update({
            status: "complete",
            challenger_score: challScore,
            challenged_score: challdScore,
            winner_id: winnerId,
            margin,
            completed_at: new Date().toISOString(),
            score_breakdown: {
              challenger: { composite: challScore },
              challenged: { composite: challdScore },
            },
          })
          .eq("challenge_id", id);

        // Fetch winner codename for response
        const { data: w } = await sb
          .from("operators_public")
          .select("codename")
          .eq("operator_id", winnerId)
          .eq("profile_visibility", "public")
          .maybeSingle();
        winner_codename = w?.codename ?? null;
        resolved = true;
      }
    }
  }

  return NextResponse.json(
    {
      submission_id: sub.submission_id,
      challenge_id: id,
      operator_codename: operatorCodename,
      composite_score: authoritativeComposite,
      scoring_mode: scoringMode,
      status: "submitted",
      resolved,
      winner_codename,
    },
    { status: resolved ? 200 : 202 },
  );
}
