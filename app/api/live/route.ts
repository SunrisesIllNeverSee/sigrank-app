import { NextResponse } from "next/server";
import { z } from "zod";
import type {
  LiveTelemetrySnapshot,
  LiveTelemetryState,
} from "@/lib/live/types";

export const dynamic = "force-dynamic";

const snapshotSchema = z.object({
  operator: z.string().trim().min(1).max(48).default("LOCAL OPERATOR"),
  model: z.string().trim().min(1).max(64),
  context: z.string().trim().min(1).max(96).default("ACTIVE REPOSITORY"),
  input: z.number().finite().nonnegative(),
  output: z.number().finite().nonnegative(),
  cacheCreate: z.number().finite().nonnegative(),
  cacheRead: z.number().finite().nonnegative(),
  observedAt: z.string().datetime().optional(),
});

interface LiveStore {
  sequence: number;
  snapshot: LiveTelemetrySnapshot | null;
}

const globalStore = globalThis as typeof globalThis & {
  __signalafLiveStore?: LiveStore;
};

const store =
  globalStore.__signalafLiveStore ??
  (globalStore.__signalafLiveStore = { sequence: 0, snapshot: null });

function state(): LiveTelemetryState {
  return {
    status: store.snapshot ? "live" : "waiting",
    sequence: store.sequence,
    snapshot: store.snapshot,
  };
}

export async function GET() {
  return NextResponse.json(state(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const configuredToken = process.env.SIGNALAF_LIVE_TOKEN;
  const hostname = new URL(request.url).hostname;
  const isLocal = hostname === "localhost" || hostname === "127.0.0.1";
  const suppliedToken = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "");

  if (configuredToken ? suppliedToken !== configuredToken : !isLocal) {
    return NextResponse.json(
      {
        error: configuredToken
          ? "Invalid live telemetry token."
          : "Set SIGNALAF_LIVE_TOKEN before accepting telemetry in production.",
      },
      { status: configuredToken ? 401 : 503 },
    );
  }

  const parsed = snapshotSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid telemetry snapshot.", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const { input, output, cacheCreate, cacheRead, ...meta } = parsed.data;
  store.sequence += 1;
  store.snapshot = {
    operator: meta.operator,
    model: meta.model,
    context: meta.context,
    observedAt: meta.observedAt ?? new Date().toISOString(),
    pillars: { input, output, cacheCreate, cacheRead },
  };

  return NextResponse.json(state(), {
    headers: { "Cache-Control": "no-store" },
  });
}
