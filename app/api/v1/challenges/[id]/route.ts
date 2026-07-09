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
 *       density:  number,  // 0–100
 *       clarity:  number,
 *       fidelity: number,
 *       brevity:  number,
 *       impact:   number,
 *     },
 *     certificate_json?: object           // signal-Areana fidelity cert
 *   }
 *
 * Composite score = (density×0.30)+(clarity×0.20)+(fidelity×0.20)+(brevity×0.15)+(impact×0.15)
 *
 * When both challenger and challenged have submitted, the scoring worker
 * auto-resolves: sets winner_id, margin, status='complete', completed_at.
 */

import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/supabase/server";
import { resolveAuth } from "@/lib/api/auth";

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
  const { id } = await params;
  const sb = getSupabaseServer();
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
        submission_id, operator_id, engine, composite_score,
        score_density, score_clarity, score_fidelity, score_brevity, score_impact,
        certificate_json, submitted_at,
        operator:operator_id(codename)
      `,
      )
      .eq("challenge_id", id);
    submissions = subs ?? [];
  }

  return NextResponse.json({ challenge, submissions });
}

// ---------------------------------------------------------------------------
// PATCH — submit a signal score
// ---------------------------------------------------------------------------
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

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

  const rawScores = b.scores as Record<string, unknown> | undefined;
  const density = Number(rawScores?.density ?? 0);
  const clarity = Number(rawScores?.clarity ?? 0);
  const fidelity = Number(rawScores?.fidelity ?? 0);
  const brevity = Number(rawScores?.brevity ?? 0);
  const impact = Number(rawScores?.impact ?? 0);

  if (!signalText.trim()) {
    return NextResponse.json(
      { error: "missing_field", detail: "signal_text required" },
      { status: 400 },
    );
  }
  if (
    [density, clarity, fidelity, brevity, impact].some((v) => v < 0 || v > 100)
  ) {
    return NextResponse.json(
      { error: "invalid_scores", detail: "All scores must be 0–100" },
      { status: 400 },
    );
  }

  const composite = compositeScore(density, clarity, fidelity, brevity, impact);

  const sb = getSupabaseServer();
  if (!sb) {
    // Mock path
    return NextResponse.json({
      submission_id: `sub_mock_${Date.now()}`,
      challenge_id: id,
      operator_codename: operatorCodename,
      composite_score: composite,
      status: "submitted",
      mock: true,
    });
  }

  // Fetch challenge to validate it's active and this operator is a participant
  const { data: challenge } = await sb
    .from("challenges")
    .select(
      "challenge_id, status, challenger_id, challenged_id, window_close, format",
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

  // Upsert submission (UNIQUE constraint on challenge_id + operator_id)
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
        composite_score: composite,
        engine,
        certificate_json: certJson,
        scoring_mode: "local_sim",
      },
      { onConflict: "challenge_id,operator_id" },
    )
    .select("submission_id")
    .single();

  if (subErr) {
    return NextResponse.json(
      { error: "db_error", detail: subErr.message },
      { status: 500 },
    );
  }

  // Auto-resolve: if throwdown and both sides have submitted, compute winner
  let resolved = false;
  let winner_codename: string | null = null;

  if (
    challenge.format === "throwdown" &&
    challenge.challenger_id &&
    challenge.challenged_id
  ) {
    const { data: subs } = await sb
      .from("challenge_submissions")
      .select("operator_id, composite_score")
      .eq("challenge_id", id);

    if (subs && subs.length >= 2) {
      const challSub = subs.find(
        (s) => s.operator_id === challenge.challenger_id,
      );
      const challdSub = subs.find(
        (s) => s.operator_id === challenge.challenged_id,
      );

      if (challSub && challdSub) {
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
              challenger: { density: challSub.composite_score },
              challenged: { density: challdSub.composite_score },
            },
          })
          .eq("challenge_id", id);

        // Fetch winner codename for response
        const { data: w } = await sb
          .from("operators")
          .select("codename")
          .eq("operator_id", winnerId)
          .single();
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
      composite_score: composite,
      status: "submitted",
      resolved,
      winner_codename,
    },
    { status: resolved ? 200 : 202 },
  );
}
