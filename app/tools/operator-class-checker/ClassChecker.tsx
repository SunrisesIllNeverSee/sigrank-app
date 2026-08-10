"use client";

import { useMemo, useState } from "react";
import { CLASS_TIERS } from "@/lib/identity/canon-ids";

/**
 * ClassChecker — client-side operator-class tier checker.
 *
 * Accepts either a direct yield score OR four token pillars. Class tier is
 * based on TOTAL TOKENS (input + output + cacheCreate + cacheRead), not yield.
 * When four pillars are provided, total tokens are computed and classified
 * against the canonical 8-tier experience ladder (IGNITER → BEARER → REFINER
 * → SEEKER → BASE → POWER → ARCH → ARCH+) with a description of what that
 * tier means. When only a yield score is given, an approximate mapping is
 * shown for context only. TRANSMITTER is a separate peak badge, not on the
 * ladder.
 */

/** Tier-level minimum total-token thresholds (descending first-match scan). */
const TIER_MIN_TOKENS: Record<string, number> = {
  "ARCH+": 1_000_000_000_000,
  ARCH: 68_766_193_943,
  POWER: 19_141_226_889,
  BASE: 7_747_041_813,
  SEEKER: 2_961_798_768,
  REFINER: 1_334_876_308,
  BEARER: 431_702_990,
  IGNITER: 0,
};

const TIERS = Object.values(CLASS_TIERS).map((t) => ({
  name: t.name,
  glyph: t.glyph,
  hex: t.hex,
  meaning: t.meaning,
  totalMin: TIER_MIN_TOKENS[t.name] ?? 0,
}));

const PILLARS = [
  { key: "input", label: "Input tokens" },
  { key: "output", label: "Output tokens" },
  { key: "cacheRead", label: "Cache-read tokens" },
  { key: "cacheWrite", label: "Cache-write tokens" },
] as const;

type PillarKey = (typeof PILLARS)[number]["key"];

function classForTotalTokens(total: number) {
  for (const t of TIERS) if (total >= t.totalMin) return t;
  return TIERS[TIERS.length - 1];
}

function formatTokens(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

function thresholdLabel(idx: number): string {
  const tier = TIERS[idx];
  if (tier.totalMin === 0) {
    const upper = TIERS[idx - 1];
    return upper ? `< ${formatTokens(upper.totalMin)}` : "0+";
  }
  return `≥ ${formatTokens(tier.totalMin)}`;
}

export function ClassChecker() {
  const [mode, setMode] = useState<"yield" | "pillars">("yield");
  const [yieldInput, setYieldInput] = useState("3.5");
  const [pillars, setPillars] = useState<Record<PillarKey, string>>({
    input: "12000",
    output: "4500",
    cacheRead: "80000",
    cacheWrite: "15000",
  });

  const totalTokens = useMemo(() => {
    if (mode === "yield") return 0;
    const input = Number(pillars.input) || 0;
    const output = Number(pillars.output) || 0;
    const cacheRead = Number(pillars.cacheRead) || 0;
    const cacheWrite = Number(pillars.cacheWrite) || 0;
    return input + output + cacheRead + cacheWrite;
  }, [mode, pillars]);

  const yield_ = useMemo(() => {
    if (mode === "yield") return Number(yieldInput) || 0;
    const input = Number(pillars.input) || 0;
    const output = Number(pillars.output) || 0;
    const cacheRead = Number(pillars.cacheRead) || 0;
    return input > 0 ? (cacheRead * output) / (input * input) : 0;
  }, [mode, yieldInput, pillars]);

  const tier = mode === "pillars" ? classForTotalTokens(totalTokens) : null;

  function updatePillar(key: PillarKey, v: string) {
    setPillars((prev) => ({ ...prev, [key]: v }));
  }

  return (
    <div className="rounded-xl border border-bg-border bg-bg-surface p-6">
      {/* Mode toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setMode("yield")}
          className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
            mode === "yield"
              ? "border-gold bg-bg-elevated text-gold"
              : "border-bg-border bg-bg-base text-text-muted hover:text-text-primary"
          }`}
        >
          Enter yield directly
        </button>
        <button
          onClick={() => setMode("pillars")}
          className={`rounded-lg border px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
            mode === "pillars"
              ? "border-gold bg-bg-elevated text-gold"
              : "border-bg-border bg-bg-base text-text-muted hover:text-text-primary"
          }`}
        >
          Compute from pillars
        </button>
      </div>

      {/* Inputs */}
      {mode === "yield" ? (
        <label className="mt-5 flex flex-col gap-1">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-text-muted">
            Υ Yield score
          </span>
          <input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={yieldInput}
            onChange={(e) => setYieldInput(e.target.value)}
            className="rounded-lg border border-bg-border bg-bg-base px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-gold"
          />
        </label>
      ) : (
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
                value={pillars[p.key]}
                onChange={(e) => updatePillar(p.key, e.target.value)}
                className="rounded-lg border border-bg-border bg-bg-base px-3 py-2 font-mono text-sm text-text-primary outline-none focus:border-gold"
              />
            </label>
          ))}
        </div>
      )}

      {/* Result */}
      <div className="mt-6 rounded-lg border border-bg-border bg-bg-elevated p-5">
        {mode === "pillars" ? (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-text-muted">
                Total tokens
              </span>
              <span className="font-mono text-2xl font-bold text-gold">
                {formatTokens(totalTokens)}
              </span>
            </div>
            {tier && (
              <>
                <div
                  className="mt-4 font-mono text-lg font-bold"
                  style={{ color: tier.hex }}
                >
                  {tier.glyph} {tier.name}
                </div>
                <p className="mt-1 font-sans text-sm leading-relaxed text-text-secondary">
                  {tier.meaning}
                </p>
              </>
            )}
          </>
        ) : (
          <>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-mono text-xs uppercase tracking-widest text-text-muted">
                Yield score
              </span>
              <span className="font-mono text-2xl font-bold text-gold">
                {yield_ >= 1000
                  ? `${(yield_ / 1000).toFixed(1)}K`
                  : yield_.toFixed(2)}
              </span>
            </div>
            <p className="mt-3 font-sans text-xs leading-relaxed text-text-muted">
              NOTE: Class tier is based on TOTAL TOKENS (input + output +
              cacheCreate + cacheRead), not yield. The yield score above is
              shown for context only — switch to pillar input to determine
              your class tier.
            </p>
          </>
        )}

        {/* Tier ladder */}
        <div className="mt-5 flex flex-col gap-1.5">
          {TIERS.map((t, idx) => {
            const active = tier?.name === t.name;
            return (
              <div
                key={t.name}
                className={`flex items-center gap-3 rounded-md border px-3 py-1.5 font-mono text-xs ${
                  active
                    ? "border-gold bg-bg-base text-gold"
                    : "border-bg-border-subtle text-text-muted"
                }`}
              >
                <span
                  className="w-5 text-center"
                  style={{ color: t.hex }}
                >
                  {t.glyph}
                </span>
                <span className="w-24">{t.name}</span>
                <span className="text-text-muted">{thresholdLabel(idx)}</span>
                {active && <span className="ml-auto">◆ you are here</span>}
              </div>
            );
          })}
        </div>
      </div>

      <p className="mt-4 font-sans text-xs leading-relaxed text-text-muted">
        Class tier is based on total tokens (input + output + cacheCreate +
        cacheRead). Authoritative tiers are assigned server-side from signed
        snapshots. TRANSMITTER is a separate peak badge, not on the experience
        ladder.
      </p>
    </div>
  );
}
