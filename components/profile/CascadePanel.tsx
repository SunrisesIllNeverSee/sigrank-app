/**
 * components/profile/CascadePanel.tsx — Υ (Yield) cascade diagnostic layer.
 *
 * Server component. Rendered below CoreMetricsGrid on the operator profile.
 * Shows the five cascade diagnostics + species classification derived from the
 * four token pillars. Null-safe — renders a "non-compounding" state card for
 * operators without cache telemetry (non-Claude platforms, Codex alpha path).
 *
 * Cascade metrics (CANON §IV, computed by lib/ingest/bridge.ts):
 *   Υ     (Yield)    = leverage × velocity  — the headline cascade number
 *   V     (Velocity) = output / input        — transmission rate
 *   L     (Leverage) = cache_read / input    — reuse per fresh token
 *   SNR              = output / (input+output) — compression ratio alias
 *   10xDEV           = log10(T × C × R)      — log-space cascade score
 *
 * Species classification (from CANON §V species taxonomy):
 *   Cascade Architect — Υ ≥ 10 000, dev10x ≥ 3.0
 *   Cache Architect   — Υ ≥ 1 000, cacheCreate large
 *   High Converter    — SNR ≥ 0.85, lower Υ
 *   Throughput Engine — high token volume, moderate cascade
 *   Baseline          — everything else
 */

import { CanonId } from "@/components/ui/CanonId";
import type { CascadeMetrics } from "@/lib/ingest/bridge";

// ---------------------------------------------------------------------------
// Species classifier
// ---------------------------------------------------------------------------

type Species =
  | "Cascade Architect"
  | "Cache Architect"
  | "High Converter"
  | "Throughput Engine"
  | "Baseline";

function classifySpecies(c: CascadeMetrics): Species {
  if (c.yield_ >= 10_000 && c.dev10x !== null && c.dev10x >= 3.0)
    return "Cascade Architect";
  if (c.yield_ >= 1_000 && !c.nonCompounding) return "Cache Architect";
  if (c.snr >= 0.85) return "High Converter";
  if (c.velocity >= 5) return "Throughput Engine";
  return "Baseline";
}

const SPECIES_COLORS: Record<Species, string> = {
  "Cascade Architect": "text-gold border-gold/40 bg-gold/8",
  "Cache Architect":
    "text-class-transmitter border-class-transmitter/40 bg-class-transmitter/8",
  "High Converter": "text-class-arch border-class-arch/40 bg-class-arch/8",
  "Throughput Engine":
    "text-text-accent border-text-accent/40 bg-text-accent/8",
  Baseline: "text-text-muted border-bg-border bg-bg-elevated",
};

// ---------------------------------------------------------------------------
// Stat row sub-component
// ---------------------------------------------------------------------------

function CascadeStat({
  label,
  canonId,
  value,
  sub,
  highlighted,
}: {
  label: string;
  canonId?: string;
  value: string;
  sub?: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`flex flex-col gap-0.5 rounded-md px-3 py-2.5 ${
        highlighted
          ? "bg-gold/8 border border-gold/20"
          : "bg-bg-elevated border border-bg-border"
      }`}
    >
      <div className="flex items-center gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
          {label}
        </span>
        {canonId && <CanonId id={canonId} title={`CANON ${canonId}`} />}
      </div>
      <span
        className={`font-mono text-lg font-bold leading-none ${
          highlighted ? "text-gold" : "text-text-primary"
        }`}
      >
        {value}
      </span>
      {sub && (
        <span className="font-mono text-[10px] text-text-muted">{sub}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Non-compounding state (no cache tokens)
// ---------------------------------------------------------------------------

function NonCompoundingState() {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-4">
      <div className="flex items-center gap-2">
        <h3 className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted">
          Cascade Layer · Υ
        </h3>
        <CanonId id="Y.01" title="Yield metric — CANON §IV" />
      </div>
      <div className="rounded-md border border-bg-border bg-bg-elevated px-4 py-3">
        <p className="font-mono text-sm text-text-secondary">
          <span className="font-bold text-text-primary">
            Non-compounding platform.
          </span>{" "}
          Cache telemetry unavailable — Υ (Yield) requires cache_read and
          cache_create tokens. SIGNA RATE still applies.
        </p>
        <p className="mt-1 font-mono text-xs text-text-muted">
          Platforms: ChatGPT · Gemini · Perplexity · Grok · Codex (alpha
          estimation)
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface Props {
  cascade: CascadeMetrics | null;
}

export function CascadePanel({ cascade }: Props) {
  if (!cascade || cascade.nonCompounding) {
    return <NonCompoundingState />;
  }

  const species = classifySpecies(cascade);
  const speciesColor = SPECIES_COLORS[species];

  const yieldFmt =
    cascade.yield_ >= 1_000
      ? `${(cascade.yield_ / 1_000).toFixed(1)}K`
      : cascade.yield_.toFixed(1);

  const velocityFmt =
    cascade.velocity >= 10
      ? cascade.velocity.toFixed(1)
      : cascade.velocity.toFixed(2);

  const leverageFmt =
    cascade.leverage >= 1_000
      ? `${(cascade.leverage / 1_000).toFixed(1)}K`
      : cascade.leverage.toFixed(1);

  const dev10xFmt = cascade.dev10x !== null ? cascade.dev10x.toFixed(2) : "—";

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-bg-border bg-bg-surface p-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted">
            Cascade Layer · Υ
          </h3>
          <CanonId id="Y.01" title="Yield metric — CANON §IV" />
        </div>
        {/* Species badge */}
        <span
          className={`rounded-full border px-3 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest ${speciesColor}`}
        >
          {species}
        </span>
      </div>

      {/* Cascade string — the T×C×R decomposition */}
      {cascade.cascadeStr !== "—" && (
        <div className="rounded-md border border-bg-border bg-bg-elevated px-3 py-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.06em] text-text-dim">
            T × C × R cascade
          </span>
          <p className="mt-0.5 font-mono text-base font-bold text-text-primary">
            {cascade.cascadeStr}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-text-muted">
            Transmission × Commitment × Reuse
          </p>
        </div>
      )}

      {/* Five diagnostic stats */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        <CascadeStat
          label="Υ Yield"
          canonId="Υ"
          value={yieldFmt}
          sub="leverage × velocity"
          highlighted
        />
        <CascadeStat
          label="V Velocity"
          value={velocityFmt}
          sub="output / input"
        />
        <CascadeStat
          label="L Leverage"
          value={leverageFmt}
          sub="cache_read / input"
        />
        <CascadeStat
          label="SNR"
          value={`${(cascade.snr * 100).toFixed(1)}%`}
          sub="compression alias"
        />
        <CascadeStat
          label="10xDEV"
          value={dev10xFmt}
          sub="log₁₀(T·C·R)"
          highlighted={cascade.dev10x !== null && cascade.dev10x >= 3.0}
        />
      </div>

      {/* Context note */}
      <p className="font-sans text-[11px] leading-snug text-text-muted">
        Cascade metrics are derived from cache token telemetry (Claude Code /
        API). Υ ≥ 10K with 10xDEV ≥ 3.0 classifies as Cascade Architect.
        Non-Claude platforms show this section as non-compounding.
      </p>
    </section>
  );
}
