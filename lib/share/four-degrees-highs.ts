import type { LeaderboardRow } from "@/lib/board/types";
import { inCohort, type WorkflowCohortKey } from "@/lib/analytics/workflow-cohort";
import type { GoldColumn } from "@/lib/marketing/top-operator-column";

export function fourDegreesHighs(rows: LeaderboardRow[], cohort: WorkflowCohortKey): GoldColumn | null {
  const members = rows.filter(row => !row.pending && !row.operator.isPlaceholder && row.operator.codename !== "the-field"
    && !row.operator.codename.startsWith("retired-") && inCohort(row.workflow_mode ?? null, cohort)
    && row.snapshot.cascade && !row.snapshot.cascade.nonCompounding);
  if (!members.length) return null;
  const cascades = members.map(row => row.snapshot.cascade!);
  const maximum = (key: "yield_" | "snr" | "velocity" | "leverage" | "dev10x" | "efficiency") => {
    const values = cascades.map(c => c[key]).filter((n): n is number => typeof n === "number" && Number.isFinite(n));
    return values.length ? Math.max(...values) : null;
  };
  const fmt = (n: number | null) => n == null ? "—" : n.toLocaleString("en-US", { maximumFractionDigits: 2, notation: Math.abs(n) >= 10_000 ? "compact" : "standard" });
  const yieldLeader = [...cascades].sort((a, b) => b.yield_ - a.yield_)[0];
  return {
    yield_: fmt(maximum("yield_")), snr: fmt(maximum("snr")), velocity: fmt(maximum("velocity")),
    leverage: maximum("leverage") == null ? "—" : `${fmt(maximum("leverage"))}×`,
    dev10x: fmt(maximum("dev10x")), efficiency: fmt(maximum("efficiency")),
    opRatio: `${fmt(yieldLeader.leverage)} : 1 : ${fmt(yieldLeader.velocity)}`,
    devLinear: maximum("leverage") == null ? "—" : `${fmt(maximum("leverage"))}×`,
  };
}
