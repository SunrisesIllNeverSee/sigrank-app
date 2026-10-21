/**
 * GET /api/v1/operators/{codename}/earned-marks — the earned-mark inputs the
 * live board cannot derive client-side, computed exactly like the profile
 * Badges tab (app/user/[codename]/ProfileBody.tsx): platform token-ladder
 * pixels, ranked metric medals + Hall records off the CLAIMED all-time
 * operator-total board, the scored-snapshot count, and the percentile /
 * processed tokens from that same board row.
 *
 * Why not /records: it ranks against getLeaderboard() with default filters,
 * which is a different field than the profile uses — for the owner's operator
 * it returns zero medals where the profile shows six.
 * Public-visibility contract is inherited from the submissions/snapshot
 * queries (unclaimed/private operators return empty marks).
 */
import { NextResponse, type NextRequest } from "next/server";
import {
  getHallOfSignal,
  getLeaderboard,
  getOperatorSnapshotRecords,
  getOperatorSubmissions,
} from "@/lib/board";
import { computeTrophyCounts } from "@/lib/analytics/trophy-counts";
import { sortValue } from "@/lib/analytics/sort-value";
import { earnedPixelMarks } from "@/lib/profile/pixel-eligibility";
import { rateLimit, rateLimitedResponse } from "@/lib/infra/api-gate";

export const revalidate = 3600;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ codename: string }> },
) {
  const rl = rateLimit(req);
  if (!rl.ok) return rateLimitedResponse(rl.retryAfter);
  const { codename } = await params;
  if (!/^[a-zA-Z0-9_-]{1,100}$/.test(codename)) {
    return NextResponse.json({ error: "Invalid operator" }, { status: 400 });
  }
  const [submissions, snapshots, boardRows, hallRecords] = await Promise.all([
    getOperatorSubmissions(codename),
    getOperatorSnapshotRecords(codename),
    getLeaderboard({ window: "all_time", operatorTotal: true, claimedOnly: true, mode: "all" }),
    getHallOfSignal(),
  ]);
  const row = boardRows.find(
    (r) => r.operator.codename.toLowerCase() === codename.toLowerCase(),
  );
  /* percentile 0 / no tokens → only the platform ladder marks come back */
  const platform_marks = earnedPixelMarks({
    percentile: 0,
    processedTokens: 0,
    platformSubmissions: submissions,
  }).map(({ id, label, detail, pattern }) => ({ id, label, detail, pattern }));
  const trophies = row
    ? await computeTrophyCounts(
        row.operator.codename,
        row.operator.display_name ?? undefined,
        boardRows,
        hallRecords,
      )
    : null;
  const owner = new Set(
    [codename, row?.operator.display_name ?? ""].map((n) => n.toLowerCase()),
  );
  const hall = hallRecords
    .filter((h) => !h.isPlaceholder && owner.has(h.operator_codename.toLowerCase()))
    .map((h) => ({ title: h.title, value: h.value, date: h.date ?? "" }));
  return NextResponse.json(
    {
      platform_marks,
      scored_snapshots: snapshots.length,
      medals: (trophies?.dynamicRecords ?? []).map((r) => ({
        canon_id: r.canonId,
        name: r.name,
        rank: r.rank,
        value: r.value,
      })),
      hall,
      pending: row?.pending ?? false,
      percentile: row?.percentile ?? null,
      processed_tokens: row?.telemetry ? sortValue(row, "totalTokens") : null,
    },
    {
      headers: {
        "Cache-Control":
          "public, max-age=1800, s-maxage=1800, stale-while-revalidate=3600",
      },
    },
  );
}
