/**
 * Single bounded, server-side history read for the live board.
 * Actual dated Yield records only. No per-operator N+1 requests.
 */
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseService } from "@/lib/infra/supabase/server";
import { getLeaderboard } from "@/lib/board";
import { windowParamToEnum } from "@/lib/board/windows";
import { rateLimit, rateLimitedResponse } from "@/lib/infra/api-gate";
export const dynamic = "force-dynamic";
type HistoryRow = { operator_id: string; snapshot_date: string | null; yield_: number | string | null; platform: string | null };
export async function GET(req: NextRequest) {
  const gate = rateLimit(req);
  if (!gate.ok) return rateLimitedResponse(gate);
  const windowType = windowParamToEnum(req.nextUrl.searchParams.get("window") ?? "all");
  if (!["all_time","30d","7d","90d"].includes(windowType)) {
    return NextResponse.json({ error: "Unsupported window" }, { status: 400 });
  }
  const sb = getSupabaseService();
  if (!sb) return NextResponse.json({ status: "unavailable" }, { status: 503 });
  try {
    const ops = await getLeaderboard({
      window: windowType, windowFilter: windowType !== "all_time",
      operatorTotal: true, claimedOnly: true, mode: "all",
    });
    const ids = [...new Set(ops.map((r) => r.operator.operator_id))];
    if (ids.length === 0) return NextResponse.json({ metric: "yield", trends: {} });
    if (ids.length > 2000) return NextResponse.json({ error: "Field exceeds safe request limit" }, { status: 413 });
    const names = new Map(ops.map((r) => [r.operator.operator_id, r.operator.codename]));
    const all: HistoryRow[] = [];
    for (let page=0; page<8; page++) {
      const from=page*1000;
      const result = await sb.from("metric_snapshots")
        .select("operator_id,snapshot_date,yield_,platform")
        .eq("window_type",windowType)
        .in("operator_id",ids)
        .order("snapshot_date",{ascending:true})
        .range(from,from+999);
      if (result.error) throw result.error;
      const slice=(result.data??[]) as HistoryRow[];
      all.push(...slice);
      if (slice.length < 1000) break;
      if (page===7) throw new Error("History truncated: bounded scan limit reached");
    }
    const daily = new Map<string,Map<string,{rate:number;multi:boolean}>>();
    for (const row of all) {
      const rate=Number(row.yield_);
      if (!row.snapshot_date || !Number.isFinite(rate) || rate<=0) continue;
      const byDay=daily.get(row.operator_id) ?? new Map();
      const multi=row.platform==="multi";
      const current=byDay.get(row.snapshot_date);
      if (!current || (multi&&!current.multi)) byDay.set(row.snapshot_date,{rate,multi});
      daily.set(row.operator_id,byDay);
    }
    const trends: Record<string,number[]> = {};
    for (const [id,dates] of daily) {
      const code=names.get(id);
      if (code) trends[code]=[...dates.entries()].sort((a,b)=>a[0].localeCompare(b[0])).slice(-40).map(([,v])=>v.rate);
    }
    return NextResponse.json({metric:"yield",window:windowType,trends},{
      headers:{"Cache-Control":"public, s-maxage=600, stale-while-revalidate=3600"},
    });
  } catch {
    return NextResponse.json({status:"unavailable"}, {status:503});
  }
}
