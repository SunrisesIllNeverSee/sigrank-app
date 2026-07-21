/**
 * POST /api/v1/challenges — initiate a throw-down challenge.
 *
 * Creates a new challenge record. The challenger specifies:
 *   - their codename (challenger_codename)
 *   - their target (challenged_codename)
 *   - optional: custom prompt_brief, engine, window_hours (default 24)
 *   - optional: format (throwdown | signal_drop | bracket_match)
 *
 * If no prompt_brief is provided, the route picks the current active
 * signal_drop prompt from the DB (if one exists); otherwise uses the
 * default throwdown brief.
 *
 * Returns the created challenge record with challenge_id for polling.
 *
 * GET /api/v1/challenges — list recent active/complete challenges.
 * Query params: ?codename= (filter to one operator), ?format=, ?limit=
 */

import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseServer } from "@/lib/infra/supabase/server";
import { resolveAuth } from "@/lib/infra/api-auth";

const DEFAULT_WINDOW_HOURS = 24;
const DEFAULT_BRIEF =
  "Demonstrate signal architecture. Write a message that maximizes density without sacrificing clarity. No filler. Every token earns its place.";

function deterministicId(prefix: string, ...parts: string[]): string {
  let h = 0;
  const s = parts.join("|");
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) | 0;
  }
  return `${prefix}_${(h >>> 0).toString(16).padStart(8, "0")}`;
}

// ---------------------------------------------------------------------------
// POST — create challenge
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // AUTH (2026-07-02): resolve the challenger's identity from signature-OR-session,
  // NOT from a body-supplied codename. The body codename is ignored for the
  // challenger; the challenged codename is still accepted from the body (it's
  // the target, not the caller).
  const auth = await resolveAuth(req, body as Record<string, unknown>);
  if (!auth.ok) {
    return NextResponse.json(auth.body, { status: auth.status });
  }
  const challengerCodename = auth.codename;
  const challengerId = auth.operatorId;

  const b = body as Record<string, unknown>;
  const challengedCodename =
    typeof b.challenged_codename === "string"
      ? b.challenged_codename.trim()
      : "";
  const promptBrief =
    typeof b.prompt_brief === "string" ? b.prompt_brief.trim() : "";
  const format = typeof b.format === "string" ? b.format : "throwdown";
  const challengerEngine =
    typeof b.challenger_engine === "string" ? b.challenger_engine : "claude";
  const windowHours =
    typeof b.window_hours === "number" ? b.window_hours : DEFAULT_WINDOW_HOURS;

  if (format === "throwdown" && !challengedCodename) {
    return NextResponse.json(
      {
        error: "missing_field",
        detail: "challenged_codename required for throwdown",
      },
      { status: 400 },
    );
  }
  if (
    !["throwdown", "signal_drop", "bracket_match", "circle_war"].includes(
      format,
    )
  ) {
    return NextResponse.json(
      {
        error: "invalid_format",
        detail: "format must be throwdown|signal_drop|bracket_match|circle_war",
      },
      { status: 400 },
    );
  }

  const now = new Date();
  const windowClose = new Date(now.getTime() + windowHours * 60 * 60 * 1000);
  const challengeId = deterministicId(
    "ch",
    challengerCodename,
    challengedCodename,
    now.toISOString().slice(0, 16),
  );

  const sb = getSupabaseServer();

  // Mock path — no Supabase configured
  if (!sb) {
    return NextResponse.json(
      {
        challenge_id: challengeId,
        status: "active",
        format,
        challenger_codename: challengerCodename,
        challenged_codename: challengedCodename || null,
        prompt_brief: promptBrief || DEFAULT_BRIEF,
        window_open: now.toISOString(),
        window_close: windowClose.toISOString(),
        mock: true,
      },
      { status: 201 },
    );
  }

  // Challenger identity is already resolved from auth — no codename lookup needed.
  let challengedId: string | null = null;
  if (challengedCodename) {
    const { data: challenged } = await sb
      .from("operators")
      .select("operator_id")
      .eq("codename", challengedCodename)
      .single();
    if (!challenged) {
      return NextResponse.json(
        {
          error: "operator_not_found",
          detail: `Challenged '${challengedCodename}' not found`,
        },
        { status: 404 },
      );
    }
    challengedId = challenged.operator_id;
  }

  // Resolve active prompt if no brief provided
  let resolvedBrief = promptBrief || DEFAULT_BRIEF;
  let promptId: string | null = null;
  if (!promptBrief) {
    const { data: activePrompt } = await sb
      .from("signal_prompts")
      .select("prompt_id, brief")
      .eq("format", "signal_drop")
      .lte("active_from", now.toISOString())
      .gte("active_to", now.toISOString())
      .order("active_from", { ascending: false })
      .limit(1)
      .single();
    if (activePrompt) {
      resolvedBrief = activePrompt.brief;
      promptId = activePrompt.prompt_id;
    }
  }

  const { data: created, error } = await sb
    .from("challenges")
    .insert({
      challenger_id: challengerId,
      challenged_id: challengedId,
      prompt_id: promptId,
      prompt_brief: resolvedBrief,
      format,
      challenger_engine: challengerEngine,
      window_open: now.toISOString(),
      window_close: windowClose.toISOString(),
      status: "active",
      ruleset_version: "challenge-v1",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "db_error", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json(
    {
      challenge_id: created.challenge_id,
      status: created.status,
      format: created.format,
      challenger_codename: challengerCodename,
      challenged_codename: challengedCodename || null,
      prompt_brief: resolvedBrief,
      window_open: created.window_open,
      window_close: created.window_close,
    },
    { status: 201 },
  );
}

// ---------------------------------------------------------------------------
// GET — list recent challenges
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const codename = searchParams.get("codename") ?? "";
  const format = searchParams.get("format") ?? "";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "20", 10), 100);

  const sb = getSupabaseServer();
  if (!sb) {
    return NextResponse.json({ challenges: [], mock: true });
  }

  let q = sb
    .from("challenges")
    .select(
      `
      challenge_id, format, status, prompt_brief,
      window_open, window_close, completed_at, margin,
      challenger_score, challenged_score,
      challenger:challenger_id(codename),
      challenged:challenged_id(codename),
      winner:winner_id(codename)
    `,
    )
    .in("status", ["active", "complete"])
    .order("created_at", { ascending: false })
    .limit(limit);

  if (format) q = q.eq("format", format);

  if (codename) {
    // Filter to challenges involving this operator
    const { data: op } = await sb
      .from("operators")
      .select("operator_id")
      .eq("codename", codename)
      .single();
    if (op) {
      q = q.or(
        `challenger_id.eq.${op.operator_id},challenged_id.eq.${op.operator_id}`,
      );
    }
  }

  const { data, error } = await q;
  if (error) {
    return NextResponse.json(
      { error: "db_error", detail: error.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ challenges: data ?? [] });
}
