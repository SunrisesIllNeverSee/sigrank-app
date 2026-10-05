import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { computeCascadeMetrics } from "@/lib/analytics/cascade";
import { snapshotThroughput } from "@/lib/board/throughput";
import { resolveWorkflowMode } from "@/lib/board/workflow-mode";
import { getSupabaseService } from "@/lib/infra/supabase/server";
import { rateLimit, rateLimitedResponse } from "@/lib/infra/api-gate";

const PAGE_SIZE = 20;

interface ScoredSubmission {
  submission_id: string;
  submitted_at: string;
  window_type: string;
  window_start: string;
  window_end: string;
  platform: string | null;
  ruleset_version: string;
  input_tokens: number | null;
  output_tokens: number | null;
  cache_creation_tokens: number | null;
  cache_read_tokens: number | null;
  workflow_mode: "hitl" | "agentic" | null;
  workflow_evidence_url: string | null;
  workflow_mode_version: string | null;
  mode_assessed_at: string | null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ codename: string }> },
) {
  const rl = rateLimit(req);
  if (!rl.ok) return rateLimitedResponse(rl);
  const { codename } = await params;
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(codename)) {
    return NextResponse.json({ error: "Invalid operator" }, { status: 400 });
  }
  const page = Number(req.nextUrl.searchParams.get("page") ?? "0");
  if (!Number.isInteger(page) || page < 0 || page > 100) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }
  const svc = getSupabaseService();
  if (!svc) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const { data: operator, error: operatorError } = await svc
    .from("operators_public")
    .select("operator_id, claimed, status, profile_visibility")
    .ilike("codename", codename)
    .limit(1)
    .maybeSingle();
  if (operatorError) return NextResponse.json({ error: "Unavailable" }, { status: 503 });
  if (!operator || !operator.claimed || operator.status === "retired" ||
      operator.profile_visibility === "private") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await svc
    .from("snapshot_submissions")
    .select("submission_id, submitted_at, window_type, window_start, window_end, platform, ruleset_version, input_tokens, output_tokens, cache_creation_tokens, cache_read_tokens, workflow_mode, workflow_evidence_url, workflow_mode_version, mode_assessed_at")
    .eq("operator_id", operator.operator_id)
    .eq("status", "scored")
    .order("submitted_at", { ascending: false })
    .order("submission_id", { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);
  if (error) return NextResponse.json({ error: "Unavailable" }, { status: 503 });

  const submissions = (data ?? []) as ScoredSubmission[];
  const entries = submissions.slice(0, PAGE_SIZE).map((s) => {
    const pillars = [s.input_tokens, s.output_tokens, s.cache_creation_tokens, s.cache_read_tokens];
    const complete = pillars.every((n) => n != null && Number.isFinite(n) && n >= 0);
    const cascade = complete
      ? computeCascadeMetrics({
          input: s.input_tokens!, output: s.output_tokens!,
          cacheCreate: s.cache_creation_tokens!, cacheRead: s.cache_read_tokens!,
        })
      : null;
    const throughput = snapshotThroughput({
      inputTokens: s.input_tokens,
      outputTokens: s.output_tokens,
      cacheWriteTokens: s.cache_creation_tokens,
      cacheReadTokens: s.cache_read_tokens,
      windowStart: s.window_start,
      windowEnd: s.window_end,
    });
    const mode = complete
      ? resolveWorkflowMode({
          inputTokens: s.input_tokens!, outputTokens: s.output_tokens!,
          cacheWriteTokens: s.cache_creation_tokens!, cacheReadTokens: s.cache_read_tokens!,
          assessment: s.workflow_mode, evidenceUrl: s.workflow_evidence_url,
        })
      : null;
    return {
      snapshot_id: createHash("sha256").update(s.submission_id).digest("hex").slice(0, 16),
      submitted_at: s.submitted_at,
      platform: s.platform ?? "other",
      window: s.window_type,
      period_start: s.window_start,
      period_end: s.window_end,
      ruleset_version: s.ruleset_version,
      input_tokens: s.input_tokens,
      output_tokens: s.output_tokens,
      cache_write_tokens: s.cache_creation_tokens,
      cache_read_tokens: s.cache_read_tokens,
      yield_: cascade && !cascade.nonCompounding ? cascade.yield_ : null,
      leverage: cascade && !cascade.nonCompounding ? cascade.leverage : null,
      velocity: cascade?.velocity ?? null,
      snr: cascade?.snr ?? null,
      construction: cascade?.construction ?? null,
      operating_ratio: cascade?.opRatio ?? null,
      processed_tokens_per_day: throughput?.processedTokensPerDay ?? null,
      output_tokens_per_day: throughput?.outputTokensPerDay ?? null,
      workflow_mode: mode,
      workflow_evidence_url: mode === "agentic" ? s.workflow_evidence_url : null,
      workflow_mode_version: mode === "hitl" ? "hcm-v1" : s.workflow_mode_version,
      mode_assessed_at: mode === "agentic" ? s.mode_assessed_at : null,
    };
  });
  return NextResponse.json({ entries, next_page: submissions.length > PAGE_SIZE ? page + 1 : null },
    { headers: { "Cache-Control": "no-store" } });
}
