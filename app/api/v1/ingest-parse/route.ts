/**
 * POST /api/v1/ingest-parse — parse a ccusage/Codex paste, return a preview.
 *
 * No DB write. Returns the four token pillars + compression ratio + projected
 * Υ Yield + class tier so the /score paste card shows the full projected rank,
 * not just compression. Public example scores do not expose private production rules.
 *
 * Request body: { text: string }
 * Response:     ParsePreview JSON or { error, detail }
 */

import { NextResponse, type NextRequest } from "next/server";
import { ingestMeta } from "@/lib/ingest";
import { pillarsToCore5, computeCascadeMetrics } from "@/lib/ingest/bridge";
import { scoreSnapshot } from "@/lib/analytics/scoring-engine";
import { publicScoringRules } from "@/lib/analytics/public-scoring";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid_json", detail: "Body is not valid JSON." },
      { status: 400 },
    );
  }

  if (
    !body ||
    typeof body !== "object" ||
    typeof (body as Record<string, unknown>).text !== "string"
  ) {
    return NextResponse.json(
      { error: "missing_field", detail: "Required field: text (string)." },
      { status: 400 },
    );
  }

  const text = (body as Record<string, unknown>).text as string;

  try {
    const { pillars, meta } = ingestMeta(text);
    // Use placeholder session counts for the parse preview (operator hasn't provided them yet)
    // The real submission will use 1/1 fallback — same as free-tier manual path.
    const bridge = pillarsToCore5({ pillars, sessionsCount: 1, turnsTotal: 1 });

    // Preview with public example rules; signed submissions use production rules.
    const cascade = computeCascadeMetrics(pillars);
    const scored = scoreSnapshot({
      raw: bridge.core5,
      pcConfidence: bridge.pcConfidence,
      totalMessagesLifetime: 1, // unknown at paste time — minimum
      accountAgeDays: 1, // unknown at paste time — minimum
    }, publicScoringRules);

    return NextResponse.json({
      ruleset: "public-example",
      input: pillars.input,
      output: pillars.output,
      cacheCreate: pillars.cacheCreate,
      cacheRead: pillars.cacheRead,
      compressionRatio: bridge.compressionRatio,
      source: meta.source,
      estimated: meta.estimated,
      caveat: meta.caveat,
      costUsd: meta.costUsd,
      // Projected scoring (the "ghost rank" preview):
      yield: cascade.yield_,
      leverage: cascade.leverage,
      velocity: cascade.velocity,
      signaRate: scored.signa_rate,
      classTier: scored.class_tier,
      signalForce: scored.signal_force,
      dev10x: cascade.dev10x,
      cascadeStr: cascade.cascadeStr,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "Parse failed.";
    return NextResponse.json(
      { error: "parse_failed", detail },
      { status: 422 },
    );
  }
}
