"use client";

import { useMemo, useState } from "react";

/**
 * YieldCalculator — client-side interactive calculator for the Υ Yield metric.
 *
 * Four token-pillar inputs → Υ Yield score, class tier, and a plain-language
 * interpretation. Pure arithmetic; no network calls.
 */

const PILLARS = [
  {
    key: "input",
    label: "Input tokens",
    hint: "Fresh tokens you send to the model",
  },
  {
    key: "output",
    label: "Output tokens",
    hint: "Tokens the model generates back",
  },
  {
    key: "cacheRead",
    label: "Cache-read tokens",
    hint: "Cached tokens reused from prior context",
  },
  {
    key: "cacheWrite",
    label: "Cache-write tokens",
    hint: "New tokens written to cache for reuse",
  },
] as const;

type PillarKey = (typeof PILLARS)[number]["key"];

/** Class tier from a yield score (approximate thresholds — see page copy). */
function classForYield(y: number): { tier: string; blurb: string } {
  if (y >= 10)
    return {
      tier: "TRANSMITTER",
      blurb:
        "Signal compounds aggressively — cached context amplifies every fresh input into outsized output.",
    };
  if (y >= 2)
    return {
      tier: "BUILDER",
      blurb:
        "A productive cascade — good cache reuse and solid output per input. Compounding, not just burning.",
    };
  if (y >= 0.5)
    return {
      tier: "SEEKER",
      blurb:
        "A working cascade, but most input is spent once. Cache reuse and output density have clear headroom.",
    };
  return {
    tier: "IGNITER",
    blurb:
      "Early-stage cascade — tokens are largely burned for context, not yet compounding. The starting line.",
  };
}

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toFixed(n < 10 ? 2 : 0);
}

export function YieldCalculator() {
  const [vals, setVals] = useState<Record<PillarKey, string>>({
    input: "12000",
    output: "4500",
    cacheRead: "80000",
    cacheWrite: "15000",
  });

  const nums = useMemo(() => {
    const p: Record<PillarKey, number> = {
      input: Number(vals.input) || 0,
      output: Number(vals.output) || 0,
      cacheRead: Number(vals.cacheRead) || 0,
      cacheWrite: Number(vals.cacheWrite) || 0,
    };
    return p;
  }, [vals]);

  const result = useMemo(() => {
    const { input, output, cacheRead } = nums;
    const yield_ = input > 0 ? (cacheRead * output) / (input * input) : 0;
    const compression = input > 0 ? output / input : 0;
    const cacheHitRate =
      cacheRead + (nums.cacheWrite || 0) > 0
        ? cacheRead / (cacheRead + (nums.cacheWrite || 0))
        : 0;
    const leverage = input > 0 ? cacheRead / input : 0;
    const cls = classForYield(yield_);
    return { yield_, compression, cacheHitRate, leverage, ...cls };
  }, [nums]);

  function update(key: PillarKey, v: string) {
    setVals((prev) => ({ ...prev, [key]: v }));
  }

  return (
    <div className="rounded-xl border border-bg-border bg-bg-surface p-6">
      <h2 className="font-mono text-base font-bold text-text-primary">
        Enter your four token pillars
      </h2>
      <p className="mt-1 font-sans text-sm leading-relaxed text-text-secondary">
        Pull these from{" "}
        <code className="font-mono text-text-primary">ccusage --json</code> or{" "}
        <code className="font-mono text-text-primary">npx sigrank me</code>.
        Token counts only — no prompt content.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {PILLARS.map((p) => (
          <label key={p.key} className="flex flex-col gap-1">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
              {p.label}
            </span>
            <input
              type="number"
              min={0}
              inputMode="numeric"
              value={vals[p.key]}
              onChange={(e) => update(p.key, e.target.value)}
              className="rounded-lg border border-bg-border bg-bg-base px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-gold"
            />
            <span className="font-sans text-xs text-text-muted">{p.hint}</span>
          </label>
        ))}
      </div>

      {/* Result */}
      <div className="mt-6 rounded-lg border border-bg-border bg-bg-elevated p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-text-muted">
            Υ Yield
          </span>
          <span className="font-mono text-3xl font-bold text-gold">
            {fmt(result.yield_)}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs text-text-secondary">
          <span>
            Compression:{" "}
            <span className="text-text-primary">
              {result.compression.toFixed(2)}
            </span>
          </span>
          <span>
            Cache hit:{" "}
            <span className="text-text-primary">
              {(result.cacheHitRate * 100).toFixed(0)}%
            </span>
          </span>
          <span>
            Leverage:{" "}
            <span className="text-text-primary">
              {result.leverage.toFixed(1)}x
            </span>
          </span>
        </div>
        <div className="mt-4 flex flex-col gap-1">
          <span className="font-mono text-sm font-bold text-accent">
            {result.tier}
          </span>
          <p className="font-sans text-sm leading-relaxed text-text-secondary">
            {result.blurb}
          </p>
        </div>
      </div>

      <p className="mt-4 font-sans text-xs leading-relaxed text-text-muted">
        Class thresholds are approximate (IGNITER &lt; 0.5, SEEKER 0.5–2,
        BUILDER 2–10, TRANSMITTER 10+). For the full paste-based scoring
        experience with signed submission, see{" "}
        <a
          href="/score"
          className="text-text-accent underline-offset-2 hover:underline"
        >
          /score
        </a>
        .
      </p>
    </div>
  );
}
