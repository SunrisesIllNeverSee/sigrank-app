"use client";

/**
 * components/sandbox/CascadeGenome.tsx — the Cascade Genome visualization.
 *
 * A radar chart with benchmark overlays (your scores vs class average vs top
 * 1%) plus a strengths/opportunities panel that identifies which dimensions
 * are above/below the benchmarks.
 *
 * 2D Recharts implementation — the 3D three.js version (Grok artifact 056)
 * was skipped: 600KB+ bundle weight for a flow diagram is not justified when
 * the 2D radar communicates the same information clearly.
 *
 * With `roto` (owner 2026-10-24) the radar uses roto points against the live
 * board (lib/radar/genome) and draws the field's first / middle / last operator
 * as white reference shapes instead of the fixed benchmarks.
 */

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { RADAR_REF_STYLE } from "@/lib/radar/points";
import type { GenomeRoto } from "@/lib/radar/genome";

export interface GenomeScores {
  comp: number;
  sd: number;
  pc: number;
  ct: number;
  tt: number;
}

interface CascadeGenomeProps {
  /** The operator's current Core 5 scores. */
  scores: GenomeScores;
  /** Optional: class-average benchmark for each dimension. */
  classAverage?: Partial<GenomeScores>;
  /** Optional: top-1% benchmark for each dimension. */
  top1Percent?: Partial<GenomeScores>;
  /** Optional: label for the operator series (default: "You"). */
  operatorLabel?: string;
  /** Optional: compact mode (smaller chart, no panel). */
  compact?: boolean;
  /** Roto points + field references; replaces the fixed benchmarks. */
  roto?: GenomeRoto;
}

const DIMENSIONS: Array<{
  key: keyof GenomeScores;
  label: string;
  full: string;
}> = [
  { key: "comp", label: "Comp", full: "Compression" },
  { key: "sd", label: "Depth", full: "Session Depth" },
  { key: "pc", label: "PC", full: "Prompt Complexity" },
  { key: "ct", label: "Cross-T", full: "Cross-Thread" },
  { key: "tt", label: "Throughput", full: "Token Throughput" },
];

export function CascadeGenome({
  scores,
  classAverage,
  top1Percent,
  operatorLabel = "You",
  compact = false,
  roto,
}: CascadeGenomeProps) {
  const refName = (r: GenomeRoto["refs"][number]) => `#${r.rank} ${r.name}`;
  const data = DIMENSIONS.map((dim, k) => ({
    dimension: dim.label,
    [operatorLabel]: roto ? Math.round(roto.fracs[k] * 100) : scores[dim.key] ?? 0,
    "Class Avg": classAverage?.[dim.key] ?? 50,
    "Top 1%": top1Percent?.[dim.key] ?? 85,
    ...Object.fromEntries((roto?.refs ?? []).map((r) => [refName(r), Math.round(r.fracs[k] * 100)])),
  }));

  // Strengths: dimensions where the operator beats class average
  // Opportunities: dimensions where the operator is below class average
  const strengths: Array<{ dim: string; value: number; delta: number }> = [];
  const opportunities: Array<{ dim: string; value: number; delta: number }> =
    [];

  const middle = roto?.refs.find((r) => r.role === "middle");
  for (const [k, dim] of DIMENSIONS.entries()) {
    const val = roto ? Math.round(roto.fracs[k] * 100) : scores[dim.key] ?? 0;
    const avg = middle ? Math.round(middle.fracs[k] * 100) : classAverage?.[dim.key] ?? 50;
    const delta = Number((val - avg).toFixed(1));
    if (delta >= 5) {
      strengths.push({ dim: dim.full, value: val, delta });
    } else if (delta <= -5) {
      opportunities.push({ dim: dim.full, value: val, delta });
    }
  }

  strengths.sort((a, b) => b.delta - a.delta);
  opportunities.sort((a, b) => a.delta - b.delta);

  const tooltipStyle = {
    background: "rgb(var(--bg-elevated))",
    border: "1px solid rgb(var(--bg-border))",
    borderRadius: "6px",
    fontSize: "12px",
  };

  return (
    <div className="flex flex-col gap-4">
      <div style={{ height: compact ? 220 : 300 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
            <PolarGrid stroke="rgb(var(--bg-border))" />
            <PolarAngleAxis
              dataKey="dimension"
              tick={{ fill: "rgb(var(--text-muted))", fontSize: 11 }}
            />
            <PolarRadiusAxis
              domain={[0, 100]}
              tick={{ fill: "rgb(var(--text-dim))", fontSize: 8 }}
            />
            <Tooltip contentStyle={tooltipStyle} />
            {!compact && <Legend wrapperStyle={{ fontSize: "11px" }} />}
            {roto?.refs.map((r) => (
              <Radar
                key={r.role}
                name={refName(r)}
                dataKey={refName(r)}
                stroke="rgb(var(--text-primary))"
                strokeOpacity={RADAR_REF_STYLE[r.role].opacity}
                fill="none"
                fillOpacity={0}
                strokeWidth={RADAR_REF_STYLE[r.role].width}
                strokeDasharray={RADAR_REF_STYLE[r.role].dash}
                isAnimationActive={false}
              />
            ))}
            <Radar
              name={operatorLabel}
              dataKey={operatorLabel}
              stroke="rgb(var(--accent))"
              fill="rgb(var(--accent))"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            {classAverage && (
              <Radar
                name="Class Avg"
                dataKey="Class Avg"
                stroke="rgb(var(--text-muted))"
                fill="rgb(var(--text-muted))"
                fillOpacity={0.05}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            )}
            {top1Percent && (
              <Radar
                name="Top 1%"
                dataKey="Top 1%"
                stroke="rgb(var(--gold))"
                fill="rgb(var(--gold))"
                fillOpacity={0.05}
                strokeWidth={1}
                strokeDasharray="2 2"
              />
            )}
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {!compact && (strengths.length > 0 || opportunities.length > 0) && (
        <div className="grid grid-cols-2 gap-3">
          {strengths.length > 0 && (
            <div className="p-3 rounded-md border border-[rgb(var(--bg-border))] bg-[rgb(var(--bg-surface))]">
              <h4 className="text-xs uppercase tracking-wider text-[rgb(var(--text-muted))] mb-2">
                Strengths
              </h4>
              <div className="flex flex-col gap-1">
                {strengths.map((s) => (
                  <div key={s.dim} className="flex justify-between text-xs">
                    <span className="text-[rgb(var(--text-secondary))]">
                      {s.dim}
                    </span>
                    <span className="font-mono text-[rgb(var(--accent))]">
                      +{s.delta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {opportunities.length > 0 && (
            <div className="p-3 rounded-md border border-[rgb(var(--bg-border))] bg-[rgb(var(--bg-surface))]">
              <h4 className="text-xs uppercase tracking-wider text-[rgb(var(--text-muted))] mb-2">
                Opportunities
              </h4>
              <div className="flex flex-col gap-1">
                {opportunities.map((o) => (
                  <div key={o.dim} className="flex justify-between text-xs">
                    <span className="text-[rgb(var(--text-secondary))]">
                      {o.dim}
                    </span>
                    <span className="font-mono text-[rgb(var(--text-dim))]">
                      {o.delta}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
