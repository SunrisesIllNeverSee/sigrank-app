/**
 * components/profile-v2/FlapBoard.tsx — the railway flap board (ticker-tape
 * statistics) for the /user/[codename] Overview opening split.
 *
 * Ported from _workspace/profile-mocks/shell.html §0 (.flapboard):
 *   columns  TELEMETRY | WELCOME OPERATOR | CASCADE | AVERAGE USER
 *   raw rows INPUT / OUTPUT / CACHE R / CACHE W / TOTAL
 *   derived  YIELD / SNR / LEVERAGE / VELOCITY / 10X DEV / SCALE V /
 *            EFFICIENCY / COST/1M
 *   footer   OP RATIO · C:I:O
 *
 * Server component. WELCOME OPERATOR = the displayed operator's real values;
 * AVERAGE USER = the per-metric mean of the current ranked field
 * (compounding rows only) — every cell reads from computeFieldAverages, the
 * single source of truth for average-operator references, so raw pillars and
 * derived metrics share one statistic. Missing values render "—", never zero.
 */

import type { Operator, ScoredSnapshot } from "@/lib/analytics/scoring-types";
import type { FieldAverages } from "@/lib/analytics/field-average";
import type { TelemetryRaw } from "@/lib/board";

interface FlapBoardProps {
  operator: Operator;
  snapshot: ScoredSnapshot;
  telemetry: TelemetryRaw;
  pending: boolean;
  fieldAvg: FieldAverages | null;
}

function compact(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

function row(name: string, you: string, abbr: string, avg: string, gold = false) {
  return (
    <div className="pv2-flap-row" key={name}>
      <span className="fk">{name}</span>
      <span className={`fv${gold ? " gold" : ""}`}>{you}</span>
      <span className="ck">{abbr}</span>
      <span className="cv avg">{avg}</span>
    </div>
  );
}

export function FlapBoard({
  operator,
  snapshot,
  telemetry,
  pending,
  fieldAvg,
}: FlapBoardProps) {
  const c = snapshot.cascade;
  const show = !pending && c && !c.nonCompounding ? c : null;

  const total = telemetry.fresh_input + telemetry.output + telemetry.cache_read + telemetry.cache_create;

  const hasTokens = total > 0;
  const t = (v: number | null | undefined) => (v == null ? "—" : compact(v));
  const you = (v: string) => (hasTokens ? v : "—");

  return (
    <div className="pv2-flapboard" aria-label={`${operator.codename} telemetry board`}>
      <div className="pv2-flap-cols">
        <span>Telemetry</span>
        <span>Welcome {operator.display_name ?? operator.codename}</span>
        <span>Cascade</span>
        <span>Average user</span>
      </div>
      <div className="pv2-flap-rows">
        {row("INPUT", you(compact(telemetry.fresh_input)), "IN", t(fieldAvg?.inputTokens))}
        {row("OUTPUT", you(compact(telemetry.output)), "OUT", t(fieldAvg?.outputTokens))}
        {row("CACHE R", you(compact(telemetry.cache_read)), "CR", t(fieldAvg?.cacheReadTokens))}
        {row("CACHE W", you(compact(telemetry.cache_create)), "CW", t(fieldAvg?.cacheCreateTokens))}
        {row("TOTAL", you(compact(total)), "Σ", t(fieldAvg?.totalTokens))}
        {row(
          "YIELD",
          show ? `${compact(show.yield_)}Υ` : "—",
          "Υ",
          fieldAvg?.yield_ != null ? `${compact(fieldAvg.yield_)}Υ` : "—",
          true,
        )}
        {row(
          "SNR",
          show ? show.snr.toFixed(3) : "—",
          "SNR",
          fieldAvg?.snr != null ? fieldAvg.snr.toFixed(2) : "—",
        )}
        {row(
          "LEVERAGE",
          show ? `${Math.round(show.leverage).toLocaleString("en-US")}x` : "—",
          "LEV",
          fieldAvg?.leverage != null ? `${fieldAvg.leverage.toFixed(0)}x` : "—",
        )}
        {row(
          "VELOCITY",
          show ? show.velocity.toFixed(2) : "—",
          "VEL",
          fieldAvg?.velocity != null ? fieldAvg.velocity.toFixed(2) : "—",
        )}
        {row(
          "10X DEV",
          show && show.dev10x != null ? show.dev10x.toFixed(2) : "—",
          "DEV",
          fieldAvg?.dev10x != null ? fieldAvg.dev10x.toFixed(2) : "—",
        )}
        {row(
          "SCALE V",
          show ? show.scaleV.toFixed(2) : "—",
          "SCL",
          fieldAvg?.scaleV != null ? fieldAvg.scaleV.toFixed(2) : "—",
        )}
        {row(
          "EFFICIENCY",
          show ? compact(show.efficiency) : "—",
          "EFF",
          fieldAvg?.efficiency != null ? `${compact(fieldAvg.efficiency)}` : "—",
        )}
        {row(
          "COST/1M",
          show ? `$${show.costPerMillion.toFixed(2)}` : "—",
          "$",
          fieldAvg?.costPerMillion != null ? `$${fieldAvg.costPerMillion.toFixed(2)}` : "—",
        )}
      </div>
      <div className="pv2-flap-foot">
        <span className="opr">OP RATIO&nbsp; {show ? show.opRatio : "—"}</span>
        <span className="cio">
          C:I:O&nbsp; <b>{show ? show.cascadeStr : "—"}</b>
        </span>
      </div>
    </div>
  );
}
