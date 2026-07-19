/**
 * app/research/csv/[table]/route.ts — CSV downloads for the State of the
 * Index dataset.
 *
 * Three tables:
 *  - raw       → per-operator raw token counts (anonymized)
 *  - metrics   → per-operator derived cascade metrics (anonymized)
 *  - platforms → per-platform aggregate token counts
 *
 * All operators are anonymized as signal-########## (SHA-256 of codename,
 * truncated). No codenames or display names are emitted.
 */

import { NextResponse } from "next/server";
import { getLeaderboard } from "@/lib/data";
import { toEntry } from "@/lib/leaderboard/to-entry";
import { signalId } from "@/lib/research/anonymize";

export const revalidate = 3600; // 1h — matches the page

const VALID_TABLES = new Set(["raw", "metrics", "platforms"]);

function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(row.map(csvEscape).join(","));
  }
  return lines.join("\n");
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ table: string }> },
) {
  const { table } = await params;
  if (!VALID_TABLES.has(table)) {
    return NextResponse.json({ error: "Invalid table name" }, { status: 404 });
  }

  const rows = await getLeaderboard({ window: "all_time", windowFilter: true });
  const entries = rows.map(toEntry);

  let csv: string;
  let filename: string;

  if (table === "raw") {
    const data = entries.map((e) => ({
      signal_id: signalId(e.codename),
      platform: e.platform ?? "other",
      input_tokens: e.input ?? 0,
      output_tokens: e.output ?? 0,
      cache_creation_tokens: e.cacheWrite ?? 0,
      cache_read_tokens: e.cacheRead ?? 0,
      total_tokens: (e.input ?? 0) + (e.output ?? 0) + (e.cacheWrite ?? 0) + (e.cacheRead ?? 0),
    }));
    csv = toCsv(
      ["signal_id", "platform", "input_tokens", "output_tokens", "cache_creation_tokens", "cache_read_tokens", "total_tokens"],
      data.map((d) => [d.signal_id, d.platform, d.input_tokens, d.output_tokens, d.cache_creation_tokens, d.cache_read_tokens, d.total_tokens]),
    );
    filename = "sigrank-index-raw.csv";
  } else if (table === "metrics") {
    const data = entries.map((e) => ({
      signal_id: signalId(e.codename),
      platform: e.platform ?? "other",
      class_tier: e.signalClass ?? "",
      yield: e.yield_,
      leverage: e.leverage,
      dev10x: e.dev10x,
      cost_per_million: e.costPerMillion,
      snr: e.snr,
      velocity: e.velocity,
      scale_v: e.scaleV,
    }));
    csv = toCsv(
      ["signal_id", "platform", "class_tier", "yield", "leverage", "dev10x", "cost_per_million", "snr", "velocity", "scale_v"],
      data.map((d) => [d.signal_id, d.platform, d.class_tier, d.yield, d.leverage, d.dev10x, d.cost_per_million, d.snr, d.velocity, d.scale_v]),
    );
    filename = "sigrank-index-metrics.csv";
  } else {
    // platforms
    const platformMap = new Map<string, {
      platform: string;
      operator_count: number;
      input_tokens: number;
      output_tokens: number;
      cache_creation_tokens: number;
      cache_read_tokens: number;
      total_tokens: number;
    }>();
    for (const e of entries) {
      const p = e.platform ?? "other";
      const entry = platformMap.get(p) ?? {
        platform: p,
        operator_count: 0,
        input_tokens: 0,
        output_tokens: 0,
        cache_creation_tokens: 0,
        cache_read_tokens: 0,
        total_tokens: 0,
      };
      entry.operator_count++;
      entry.input_tokens += e.input ?? 0;
      entry.output_tokens += e.output ?? 0;
      entry.cache_creation_tokens += e.cacheWrite ?? 0;
      entry.cache_read_tokens += e.cacheRead ?? 0;
      entry.total_tokens += (e.input ?? 0) + (e.output ?? 0) + (e.cacheWrite ?? 0) + (e.cacheRead ?? 0);
      platformMap.set(p, entry);
    }
    const data = Array.from(platformMap.values()).sort((a, b) => b.total_tokens - a.total_tokens);
    csv = toCsv(
      ["platform", "operator_count", "input_tokens", "output_tokens", "cache_creation_tokens", "cache_read_tokens", "total_tokens"],
      data.map((d) => [d.platform, d.operator_count, d.input_tokens, d.output_tokens, d.cache_creation_tokens, d.cache_read_tokens, d.total_tokens]),
    );
    filename = "sigrank-index-platforms.csv";
  }

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${filename}"`,
      "cache-control": "public, max-age=3600",
    },
  });
}
