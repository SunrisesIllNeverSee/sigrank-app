import type { LiveOperator } from "@/lib/board/live-types";
import { DISPLAY_METRICS, DISPLAY_RAW } from "@/lib/identity/canon-ids";
import { numvOf } from "./utils";

export interface MedalStanding {
  operator: LiveOperator;
  count: number;
}

const categories = [...new Map([...DISPLAY_METRICS, ...DISPLAY_RAW].map(c => [c.id, c])).values()];
const compounding = new Set(["yield_", "leverage", "dev10x", "opRatio", "opBest", "opCache"]);
const measured = (exact: number | undefined, display: string | undefined) => {
  if (!display || display === "—") return null;
  const value = exact ?? numvOf(display);
  return Number.isFinite(value) ? value : null;
};

function valueOf(o: LiveOperator, key: string): number | null {
  if (compounding.has(key) && o.nc) return null;
  switch (key) {
    case "yield_": case "opRatio": return measured(o.num.yield, o.yield);
    case "leverage": case "opBest": return measured(o.num.lev, o.lev);
    case "velocity": case "opOutput": return o.num.velocity ?? o.vel;
    case "snr": return o.num.snr ?? o.snr;
    case "dev10x": return o.num.dev ?? o.dev;
    case "scaleV": return o.scalev;
    case "efficiency": return measured(o.num.eff, o.eff);
    case "costPerMillion": return measured(o.num.cost, o.cost);
    case "input": return measured(o.num.i, o.raw.i);
    case "output": return measured(o.num.o, o.raw.o);
    case "cacheRead": case "opCache": return measured(o.num.cr, o.raw.cr);
    case "cacheWrite": return measured(o.num.cw, o.raw.cw);
    case "totalTokens": return measured(o.num.total, o.total);
    default: return null;
  }
}

export function medalLeaders(ops: LiveOperator[]) {
  const counts = new Map(ops.map(o => [o, [0, 0, 0]]));
  for (const category of categories) {
    ops.map(operator => ({ operator, value: valueOf(operator, category.key) }))
      .filter((entry): entry is { operator: LiveOperator; value: number } => entry.value != null && Number.isFinite(entry.value))
      .sort((a, b) => category.lowerIsBetter ? a.value - b.value : b.value - a.value)
      .slice(0, 3)
      .forEach(({ operator }, rank) => { counts.get(operator)![rank]++; });
  }
  return ["gold", "silver", "bronze"].map((name, rank) => ({
    name,
    list: ops.map(operator => ({ operator, count: counts.get(operator)![rank] }))
      .filter(entry => entry.count > 0)
      .sort((a, b) => b.count - a.count || ops.indexOf(a.operator) - ops.indexOf(b.operator))
      .slice(0, 3),
  }));
}
