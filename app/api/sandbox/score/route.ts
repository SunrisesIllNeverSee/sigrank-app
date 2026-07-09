/**
 * app/api/sandbox/score/route.ts — server-side scoring for the sandbox.
 *
 * Takes the 4 raw pillars + session/turn counts, runs the full scoring
 * pipeline (normalize → SignaRate → class → signal force), returns the
 * server-computed slice. Cascade metrics (Υ, SNR, etc.) are computed
 * client-side from the same pillars (no secret weights needed).
 */

import { NextRequest, NextResponse } from "next/server";
import { scoreSnapshot } from "@/lib/scoring/engine";
import { pillarsToCore5 } from "@/lib/ingest/bridge";
import type { RawPillars } from "@/lib/ingest/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let body: {
    pillars: RawPillars;
    sessionsCount: number;
    turnsTotal: number;
    totalMessagesLifetime: number;
    accountAgeDays: number;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const {
    pillars,
    sessionsCount,
    turnsTotal,
    totalMessagesLifetime,
    accountAgeDays,
  } = body;

  if (
    !pillars ||
    typeof pillars.input !== "number" ||
    typeof pillars.output !== "number" ||
    typeof pillars.cacheCreate !== "number" ||
    typeof pillars.cacheRead !== "number"
  ) {
    return NextResponse.json(
      { error: "Missing or invalid pillars" },
      { status: 400 },
    );
  }

  const bridge = pillarsToCore5({
    pillars,
    sessionsCount: Math.max(sessionsCount, 1),
    turnsTotal: Math.max(turnsTotal, 1),
  });

  const result = scoreSnapshot({
    raw: bridge.core5,
    pcConfidence: bridge.pcConfidence,
    totalMessagesLifetime: Math.max(totalMessagesLifetime, 0),
    accountAgeDays: Math.max(accountAgeDays, 1),
  });

  return NextResponse.json({
    signa_rate: result.signa_rate,
    class_tier: result.class_tier,
    scores: result.scores,
    signal_force: result.signal_force,
    signal_force_raw: result.signal_force_raw,
    core5: bridge.core5,
    compressionRatio: bridge.compressionRatio,
    tokensTotal: bridge.tokensTotal,
  });
}
