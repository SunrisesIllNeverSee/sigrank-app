/**
 * Public pre-board placement projection.
 *
 * REAL linked account rows determine exactly one stable member position each.
 * The public response deliberately contains no auth/operator IDs, codename,
 * email, profile link or personal metadata. An explicit pre-board-public
 * consent mechanism is not yet present; public profile defaults are NOT
 * considered authorization to publish someone in a new leaderboard.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseService } from "@/lib/infra/supabase/server";
import { getLeaderboard } from "@/lib/board";
import { rateLimit, rateLimitedResponse } from "@/lib/infra/api-gate";
import { registeredURMember } from "@/lib/board/unranked-status";

export const dynamic = "force-dynamic";

type OperatorJoin = {
  claimed?: boolean;
  status?: string;
  created_at?: string | null;
  claimed_at?: string | null;
} | null;
type AccountLink = {
  operator_id: string;
  operators: OperatorJoin | OperatorJoin[];
};

export async function GET(req: NextRequest) {
  const gate = rateLimit(req);
  if (!gate.ok) return rateLimitedResponse(gate);
  const sb = getSupabaseService();
  if (!sb) return NextResponse.json({ status: "unavailable" }, { status: 503 });
  try {
    const [accounts, ranked] = await Promise.all([
      sb.from("operator_accounts")
        .select("operator_id, operators:operator_id(claimed,status,created_at,claimed_at)")
        .limit(10000),
      getLeaderboard({
        window: "all_time", windowFilter: false,
        operatorTotal: true, claimedOnly: true, mode: "all",
      }),
    ]);
    if (accounts.error) throw accounts.error;
    if ((accounts.data?.length ?? 0) >= 10000)
      throw new Error("Account list may be truncated; cannot assign safe positions");
    const active = new Map<string, string>();
    for (const row of (accounts.data ?? []) as AccountLink[]) {
      const op = Array.isArray(row.operators) ? row.operators[0] : row.operators;
      if (op?.claimed !== true || op.status === "retired" || op.status === "banned")
        continue;
      active.set(row.operator_id, op.claimed_at ?? op.created_at ?? "");
    }
    const rankedIDs = new Set(ranked.map((o) => o.operator.operator_id));
    const rankedLinked = [...rankedIDs].filter((id) => active.has(id)).length;
    if (rankedLinked !== rankedIDs.size)
      throw new Error("Ranked operator not linked to an active signup");
    const unrankedIDs = [...active.entries()]
      .filter(([id]) => !rankedIDs.has(id))
      .sort((a, b) => a[1].localeCompare(b[1]) || a[0].localeCompare(b[0]));
    const nextPosition = ranked.length + 1;
    const members = unrankedIDs.map(([_id, _joined], index) =>
      registeredURMember(nextPosition + index));
    return NextResponse.json({
      scope: "active_linked_registered_operators",
      registered_total: active.size,
      ranked_total: rankedLinked,
      unranked_total: members.length,
      ur_total: members.length,
      ranked_metrics_population: rankedLinked,
      next_member_position: nextPosition,
      members,
      roster_status: "registered_positions_only; public identities require consent",
      source: "live_server_account_anti_join",
      as_of: new Date().toISOString(),
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503 });
  }
}
