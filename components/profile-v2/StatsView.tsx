/**
 * components/profile-v2/StatsView.tsx — STATS tab for the redesigned
 * /user/[codename] profile. Server component: five pure data tables in
 * module shells — no charts, no radars.
 *
 * Layout port of _workspace/profile-mocks/stats.html onto the app's
 * Tailwind token system. All field ranks / medians / deltas are computed
 * here from the leaderboard rows the parent already fetched (no extra
 * data-layer reads on the render path).
 */

import type { ReactNode } from "react";

import type { Operator, ScoredSnapshot } from "@/lib/analytics/scoring-types";
import type { FieldAverages } from "@/lib/analytics/field-average";
import type { HistoryPoint, LeaderboardRow, TelemetryRaw } from "@/lib/board";
import { computeTierProgress } from "@/lib/analytics/tier-progress";
import { buildArchetypeOf } from "@/lib/analytics/build-archetypes";
import { RS05_CLASS_THRESHOLDS } from "@/lib/analytics/ruleset";

interface StatsViewProps {
  operator: Operator;
  snapshot: ScoredSnapshot;
  telemetry: TelemetryRaw;
  globalRank: number;
  topPct: number;
  /** True when the operator has a compounding cascade (ranked on the board). */
  ranked: boolean;
  /** Snapshot history, oldest → newest, for the Δ and history tables. */
  history: HistoryPoint[];
  /** From computeFieldAverages(boardRows) — fallback when a median is absent. */
  fieldAvg: FieldAverages;
  /** Field for per-metric medians / maxima / ranks. */
  boardRows: LeaderboardRow[];
  watchCount: number;
}

// ── Palette (live-board accents — same hexes as components/live/utils.ts) ──
const COL = {
  signal: "#a6ff00",
  cyan: "#00e5ff",
  orange: "#ff9a3c",
  violet: "#a855f7",
  blue: "#3b82f6",
  gold: "#e8b93c",
  silver: "#b9c4cc",
  bronze: "#b0722e",
} as const;
const RANK_MEDAL = [COL.gold, COL.silver, COL.bronze] as const;

const UP = "text-class-seeker"; // theme-aware positive (mock --up)
const DOWN = "text-class-refiner"; // theme-aware negative (mock --down)

// Claude list prices used by the cascade engine (lib/analytics/cascade.ts).
const PRICE = { input: 3e-6, output: 15e-6, cacheCreate: 3.75e-6, cacheRead: 0.3e-6 };

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const HISTORY_ROWS = 12;

// ── Formatters ────────────────────────────────────────────────────────────
const num = (n: number, d = 2): string =>
  n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d });

/** Compact tokens: 2.70B / 22.7M / 412M / 10.5K — precision by scaled magnitude. */
function compact(n: number): string {
  const a = Math.abs(n);
  const unit = a >= 1e12 ? 1e12 : a >= 1e9 ? 1e9 : a >= 1e6 ? 1e6 : a >= 1e3 ? 1e3 : 1;
  const suf = unit === 1e12 ? "T" : unit === 1e9 ? "B" : unit === 1e6 ? "M" : unit === 1e3 ? "K" : "";
  const v = n / unit;
  const d = Math.abs(v) < 10 ? 2 : Math.abs(v) < 100 ? 1 : 0;
  return `${num(v, d)}${suf}`;
}

const money = (n: number): string =>
  n >= 100 ? `$${num(n, 0)}` : n >= 10 ? `$${num(n, 1)}` : `$${num(n, 2)}`;

const signed = (v: number, d: number): string => `${v >= 0 ? "+" : ""}${num(v, d)}`;

/** "+113%" / "-31%" vs a baseline; null when baseline is unusable. */
const pctVs = (v: number, base: number | null): string | null =>
  base != null && base > 0
    ? `${v >= base ? "+" : ""}${(((v - base) / base) * 100).toFixed(0)}%`
    : null;

/** "Oct 8, 2026" from a 'YYYY-MM-DD' literal (deterministic, no clock read). */
function fmtDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}

/** Whole days between two 'YYYY-MM-DD' literals via Date.UTC (deterministic). */
function dayDiff(a: string, b: string): number | null {
  const pa = a.split("-").map(Number);
  const pb = b.split("-").map(Number);
  if (pa.length !== 3 || pb.length !== 3 || pa.some(isNaN) || pb.some(isNaN)) return null;
  return Math.round((Date.UTC(pa[0], pa[1] - 1, pa[2]) - Date.UTC(pb[0], pb[1] - 1, pb[2])) / 86_400_000);
}

// ── Field math ────────────────────────────────────────────────────────────
const med = (xs: number[]): number | null => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};
const fieldMax = (xs: number[]): number | null => (xs.length ? Math.max(...xs) : null);
/** 1-based rank of `v` inside `xs`; desc=false → lowest wins (cost metrics). */
const rankOf = (v: number | null, xs: number[], desc = true): number | null =>
  v == null ? null : 1 + xs.filter((x) => (desc ? x > v : x < v)).length;

type MetricKey = "yield_" | "snr" | "velocity" | "leverage" | "dev10x" | "scaleV" | "efficiency";

/** Cascade metrics re-derivable from a history point's token pillars. */
function histMetric(h: HistoryPoint, k: MetricKey): number | null {
  if (k === "yield_") return h.yield_;
  const i = h.input_tokens, o = h.output_tokens, cr = h.cache_read_tokens, cw = h.cache_creation_tokens;
  if (i == null || o == null || cr == null || cw == null) return null;
  const si = Math.max(i, 1);
  switch (k) {
    case "snr": return i + o > 0 ? o / (i + o) : 0;
    case "velocity": return o / si;
    case "leverage": return cr / si;
    case "dev10x": return i > 0 && o > 0 && cw > 0 && cr > 0 ? Math.log10(cr / i) : null;
    case "scaleV": { const t = i + o + cr + cw; return t > 0 ? Math.log10(t) : 0; }
    case "efficiency": return (cr + cw + o) / si / 4;
    default: return null;
  }
}

const rowTotal = (r: LeaderboardRow): number =>
  r.telemetry.fresh_input + r.telemetry.output + r.telemetry.cache_read + r.telemetry.cache_create;
const rowCompression = (r: LeaderboardRow): number | null => {
  const i = r.telemetry.fresh_input, cr = r.telemetry.cache_read;
  return i + cr > 0 ? cr / (i + cr) : null;
};
const rowPerDay = (r: LeaderboardRow): number | null =>
  r.operator.account_age_days > 0 ? rowTotal(r) / r.operator.account_age_days : null;

// ── Shared table styling (`.module` + `.dtable` from the mock) ────────────
const TBL = "w-full min-w-[640px] border-collapse font-mono text-[11px] tabular-nums [&>tbody>tr:last-child>td]:border-b-0";
const TH = "border-b border-bg-border bg-bg-elevated px-3 py-2 text-left font-mono text-[9px] font-normal uppercase tracking-[0.1em] text-text-muted";
const TD = "border-b border-bg-border-subtle px-3 py-[7px] text-text-primary";
const TDN = `${TD} text-right`;
const TDC = `${TD} text-center`;
const TDL = `${TD} text-[10px] uppercase tracking-[0.05em] text-text-secondary`;

function Module({ title, sub, children }: { title: string; sub: string; children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-lg border border-bg-border bg-bg-surface">
      <header className="flex items-center justify-between gap-3 border-b border-bg-border bg-bg-elevated px-4 py-3">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-text-muted">{title}</span>
        <span className="font-mono text-[9px] uppercase tracking-[0.06em] text-text-dim">{sub}</span>
      </header>
      <div className="overflow-x-auto">{children}</div>
    </section>
  );
}

function Rank({ rank }: { rank: number | null }) {
  if (rank == null) return <span className="text-text-dim">—</span>;
  const color = rank <= 3 ? RANK_MEDAL[rank - 1] : COL.signal;
  return <span className="font-bold" style={{ color }}>#{rank}</span>;
}

function Delta({ v, good }: { v: string | null; good: boolean }) {
  if (v == null) return <span className="text-text-dim">—</span>;
  return <span className={good ? UP : DOWN}>{v}</span>;
}

const Dim = () => <span className="text-text-dim">—</span>;

function Head({ cols }: { cols: ReadonlyArray<readonly [string, "l" | "r" | "c"]> }) {
  return (
    <thead><tr>
      {cols.map(([t, a]) => (
        <th key={t} className={`${TH}${a === "r" ? " text-right" : a === "c" ? " text-center" : ""}`}>{t}</th>
      ))}
    </tr></thead>
  );
}

// ── Component ─────────────────────────────────────────────────────────────
export function StatsView({
  operator,
  snapshot,
  telemetry,
  globalRank,
  topPct,
  ranked,
  history,
  fieldAvg,
  boardRows,
  watchCount,
}: StatsViewProps) {
  const c = ranked ? snapshot.cascade : null;
  const i = telemetry.fresh_input, o = telemetry.output;
  const cr = telemetry.cache_read, cw = telemetry.cache_create;
  const total = i + o + cr + cw;
  const age = Math.max(operator.account_age_days, 1);
  const totalCost = i * PRICE.input + o * PRICE.output + cw * PRICE.cacheCreate + cr * PRICE.cacheRead;

  const rankedRows = boardRows.filter(
    (r) => !r.pending && r.snapshot.cascade && !r.snapshot.cascade.nonCompounding,
  );
  const fieldVals = (f: (r: LeaderboardRow) => number | null | undefined): number[] =>
    rankedRows.map(f).filter((v): v is number => v != null);
  const metricField = (k: MetricKey): number[] => fieldVals((r) => r.snapshot.cascade?.[k]);

  const lastH = history.length ? history[history.length - 1] : null;
  const prevH = history.length > 1 ? history[history.length - 2] : null;

  const CASCADE: Array<{
    key: MetricKey; label: string; color?: string; fmt: (v: number) => string; ddec: number; avg: number | null;
  }> = [
    { key: "yield_", label: "Yield (Υ)", color: COL.signal, fmt: (v) => `${num(v, 1)}Υ`, ddec: 1, avg: fieldAvg.yield_ },
    { key: "snr", label: "SNR", color: COL.cyan, fmt: (v) => num(v, 3), ddec: 3, avg: fieldAvg.snr },
    { key: "velocity", label: "Velocity", color: COL.orange, fmt: (v) => num(v, 2), ddec: 2, avg: fieldAvg.velocity },
    { key: "leverage", label: "Leverage", color: COL.violet, fmt: (v) => num(v, 1), ddec: 1, avg: fieldAvg.leverage },
    { key: "dev10x", label: "10xDEV", color: COL.blue, fmt: (v) => num(v, 2), ddec: 2, avg: fieldAvg.dev10x },
    { key: "scaleV", label: "ScaleV", fmt: (v) => num(v, 3), ddec: 3, avg: fieldAvg.scaleV },
    { key: "efficiency", label: "Efficiency", fmt: (v) => num(v, v >= 100 ? 0 : 2), ddec: 2, avg: fieldAvg.efficiency },
  ];
  const d7Of = (k: MetricKey): number | null => {
    if (!lastH || !prevH) return null;
    const a = histMetric(lastH, k), b = histMetric(prevH, k);
    return a != null && b != null ? a - b : null;
  };

  const PILLARS: Array<{ label: string; color?: string; vol: number; cost: number; field: number[] }> = [
    { label: "Σ Total Tokens", vol: total, cost: totalCost, field: rankedRows.map(rowTotal) },
    { label: "Input", color: COL.blue, vol: i, cost: i * PRICE.input, field: fieldVals((r) => r.telemetry.fresh_input) },
    { label: "Output", color: COL.cyan, vol: o, cost: o * PRICE.output, field: fieldVals((r) => r.telemetry.output) },
    { label: "Cache-Read", color: COL.signal, vol: cr, cost: cr * PRICE.cacheRead, field: fieldVals((r) => r.telemetry.cache_read) },
    { label: "Cache-Write", color: COL.orange, vol: cw, cost: cw * PRICE.cacheCreate, field: fieldVals((r) => r.telemetry.cache_create) },
  ];

  // Operating-ratio field values.
  const levField = metricField("leverage");
  const levMed = med(levField);
  const perDayField = fieldVals(rowPerDay);
  const perDayMed = med(perDayField);
  const compField = fieldVals(rowCompression);
  const compMed = med(compField);
  const costField = fieldVals((r) => r.snapshot.cascade?.costPerMillion);
  const costMed = med(costField);
  const myCompression = i + cr > 0 ? cr / (i + cr) : null;
  const perDay = total / age;
  const msgsPerSnap = history.length > 0 ? operator.total_messages_lifetime / history.length : null;

  const ratioRows: Array<{
    label: string; value: string; color?: string; formula: string;
    rank: number | null; med: string; vs: string | null; good: boolean;
  }> = [
    { label: "Operating Ratio", value: c?.opRatio ?? "—", color: COL.violet,
      formula: "cache_read ÷ input", rank: rankOf(c?.leverage ?? null, levField),
      med: levMed != null ? `${Math.round(levMed)}:1` : "—",
      vs: c ? pctVs(c.leverage, levMed) : null, good: true },
    { label: "Υ/Day (Throughput)", value: compact(perDay), color: COL.signal,
      formula: `total ÷ ${age} days`, rank: rankOf(perDay, perDayField),
      med: perDayMed != null ? compact(perDayMed) : "—",
      vs: pctVs(perDay, perDayMed), good: true },
    { label: "Compression Ratio", value: myCompression != null ? num(myCompression, 3) : "—",
      formula: "cache_read ÷ (input + cache_read)", rank: rankOf(myCompression, compField),
      med: compMed != null ? num(compMed, 3) : "—",
      vs: myCompression != null ? pctVs(myCompression, compMed) : null, good: true },
    { label: "Cost per 1M", value: c ? money(c.costPerMillion) : "—",
      formula: "total_cost ÷ total × 1M", rank: rankOf(c?.costPerMillion ?? null, costField, false), // lowest $/1M wins
      med: costMed != null ? money(costMed) : "—",
      vs: c ? pctVs(c.costPerMillion, costMed) : null, good: false },
    { label: "Messages per Snapshot", value: msgsPerSnap != null ? num(msgsPerSnap, 0) : "—",
      formula: `${num(operator.total_messages_lifetime, 0)} ÷ ${history.length} obs`,
      rank: null, med: "—", vs: null, good: true }, // no per-operator history across the field
  ];

  const histRows = history.slice(-HISTORY_ROWS).reverse();
  const histTokens = (h: HistoryPoint): number | null =>
    [h.input_tokens, h.output_tokens, h.cache_read_tokens, h.cache_creation_tokens].some((v) => v != null)
      ? (h.input_tokens ?? 0) + (h.output_tokens ?? 0) + (h.cache_read_tokens ?? 0) + (h.cache_creation_tokens ?? 0) : null;

  // Field context rows.
  const tierIdx = RS05_CLASS_THRESHOLDS.findIndex((x) => x.class === snapshot.class_tier);
  const tierProgress = ranked ? computeTierProgress(snapshot.class_tier, total) : null;
  const archetype = c ? buildArchetypeOf({ leverage: c.leverage, velocity: c.velocity, construction: c.construction }) : null;
  const classColor: Record<string, string> = {
    "TRANSMITTER": "text-class-transmitter", "ARCH+": "text-class-archplus", "ARCH": "text-class-arch",
    "POWER": "text-class-power", "BASE": "text-class-base", "SEEKER": "text-class-seeker",
    "REFINER": "text-class-refiner", "BEARER": "text-class-bearer", "IGNITER": "text-class-igniter",
  };
  const joinLabel = (() => {
    if (!snapshot.snapshot_date) return "—";
    const [y, m, d] = snapshot.snapshot_date.split("-").map(Number);
    if (!y || !m || !d) return "—";
    const j = new Date(Date.UTC(y, m - 1, d) - operator.account_age_days * 86_400_000);
    return `joined ${MONTHS[j.getUTCMonth()]} ${j.getUTCFullYear()}`;
  })();
  const snapGap = history.length > 1 ? dayDiff(history[history.length - 1].date, history[0].date) : null;
  const snapFreq = snapGap != null ? `~every ${Math.max(1, Math.round(snapGap / (history.length - 1)))} days` : "—";
  const ownPlatforms = boardRows.find((r) => r.operator.codename === operator.codename)?.platforms;
  const ctxRows: Array<{ stat: string; value: ReactNode; detail: string } | "sep"> = [
    { stat: "Percentile", value: ranked ? `${(100 - topPct).toFixed(1)}%` : "—",
      detail: ranked ? `top ${globalRank} of ${rankedRows.length} ranked` : "—" },
    { stat: "Operators Ranked", value: num(rankedRows.length, 0), detail: "all-time window" },
    { stat: "Operators Above", value: ranked ? num(globalRank - 1, 0) : "—", detail: "—" },
    { stat: "Operators Below", value: ranked ? num(Math.max(0, rankedRows.length - globalRank), 0) : "—", detail: "—" },
    "sep",
    { stat: "Class Tier", value: <span className={classColor[snapshot.class_tier.split(" ")[0]] ?? ""}>{snapshot.class_tier}</span>,
      detail: tierIdx >= 0 ? `${tierIdx + 1} of ${RS05_CLASS_THRESHOLDS.length} classes` : "peak badge" },
    ...(tierProgress?.nextClass
      ? [{ stat: "Next Tier", value: <span className="text-text-accent">{tierProgress.nextClass}</span>,
          detail: `${tierProgress.progressPct.toFixed(0)}% progress` } as const]
      : []),
    { stat: "Archetype", value: archetype?.name ?? "—", detail: archetype?.familyLabel ?? "—" },
    "sep",
    { stat: "Account Age", value: `${operator.account_age_days} days`, detail: joinLabel },
    { stat: "Total Messages", value: num(operator.total_messages_lifetime, 0), detail: `${num(operator.total_messages_lifetime / age, 0)}/day avg` },
    { stat: "Snapshots", value: num(history.length, 0), detail: snapFreq },
    { stat: "Longest Streak", value: "—", detail: "not tracked" }, // streak is not in the token-telemetry CANON
    { stat: "Primary Platform", value: operator.primary_domain,
      detail: ownPlatforms && ownPlatforms.length > 1 ? `${ownPlatforms.length} platforms` : "sole platform" },
    { stat: "Total Cost", value: money(totalCost), detail: c ? `${money(c.costPerMillion)}/M avg` : "—" },
    { stat: "Watchers", value: num(watchCount, 0), detail: "—" },
  ];

  return (
    <div className="flex flex-col gap-3.5">
      {/* ── CASCADE METRICS ── */}
      <Module title="Cascade Metrics" sub={`7 metrics · latest snapshot ${snapshot.snapshot_date ? fmtDate(snapshot.snapshot_date) : "—"}`}>
        <table className={TBL}>
          <Head cols={[["Metric","l"],["Value","r"],["Rank","c"],["Field Median","r"],["Field Max","r"],["vs Median","r"],["vs Max","r"],["Δ 7D","r"]]} />
          <tbody>
            {CASCADE.map((m, ri) => {
              const v = c ? (c[m.key] as number | null) : null;
              const field = metricField(m.key);
              const fMed = med(field) ?? m.avg;
              const fMax = fieldMax(field);
              const d7 = d7Of(m.key);
              const vsMed = v != null ? pctVs(v, fMed) : null;
              const vsMax = v != null && fMax != null && fMax > 0 ? `${((v / fMax) * 100).toFixed(0)}%` : null;
              return (
                <tr key={m.key} className={ri === 0 ? "bg-gold/[0.04] even:bg-gold/[0.04]" : "even:bg-bg-elevated"}>
                  <td className={TDL}>{m.label}</td>
                  <td className={TDN} style={m.color ? { color: m.color } : undefined}>{v != null ? m.fmt(v) : "—"}</td>
                  <td className={TDC}><Rank rank={rankOf(v, field)} /></td>
                  <td className={TDN}>{fMed != null ? m.fmt(fMed) : <Dim />}</td>
                  <td className={TDN}>{fMax != null ? m.fmt(fMax) : <Dim />}</td>
                  <td className={TDN}><Delta v={vsMed} good={v != null && fMed != null ? v >= fMed : true} /></td>
                  <td className={TDN}>{vsMax == null ? <Dim /> : <span className={v != null && fMax != null && v >= fMax ? UP : undefined}>{vsMax}</span>}</td>
                  <td className={TDN}><Delta v={d7 != null ? signed(d7, Math.abs(d7) >= 10 ? 0 : m.ddec) : null} good={(d7 ?? 0) >= 0} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Module>

      {/* ── RAW TOKEN PILLARS ── */}
      <Module title="Raw Token Pillars" sub="4 pillars + totals · lifetime">
        <table className={TBL}>
          <Head cols={[["Pillar","l"],["Volume","r"],["% of Total","r"],["Rank","c"],["Field Median","r"],["vs Median","r"],["Per Day","r"],["Cost","r"]]} />
          <tbody>
            {PILLARS.map((p, pi) => {
              const fMed = med(p.field);
              const pctOfTotal = pi === 0 ? "100%" : total > 0 ? `${num((p.vol / total) * 100, p.vol / total >= 0.01 ? 1 : 2)}%` : "—";
              return (
                <tr key={p.label} className={pi === 0 ? "bg-gold/[0.04] even:bg-gold/[0.04]" : "even:bg-bg-elevated"}>
                  <td className={TDL}>{p.label}</td>
                  <td className={TDN} style={p.color ? { color: p.color } : undefined}>{num(p.vol, 0)}</td>
                  <td className={TDN}>{pctOfTotal}</td>
                  <td className={TDC}><Rank rank={rankOf(p.vol, p.field)} /></td>
                  <td className={TDN}>{fMed != null ? compact(fMed) : <Dim />}</td>
                  <td className={TDN}><Delta v={pctVs(p.vol, fMed)} good={fMed == null || p.vol >= fMed} /></td>
                  <td className={TDN}>{compact(p.vol / age)}</td>
                  <td className={TDN}>{money(p.cost)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Module>

      {/* ── OPERATING RATIOS ── */}
      <Module title="Operating Ratios" sub="derived · formula shown">
        <table className={TBL}>
          <Head cols={[["Ratio","l"],["Value","r"],["Formula","r"],["Rank","c"],["Field Median","r"],["vs Median","r"]]} />
          <tbody>
            {ratioRows.map((r, ri) => (
              <tr key={r.label} className={ri === 0 ? "bg-gold/[0.04] even:bg-gold/[0.04]" : "even:bg-bg-elevated"}>
                <td className={TDL}>{r.label}</td>
                <td className={TDN} style={r.color ? { color: r.color } : undefined}>{r.value}</td>
                <td className={`${TDN} text-text-dim`}>{r.formula}</td>
                <td className={TDC}><Rank rank={r.rank} /></td>
                <td className={TDN}>{r.med}</td>
                <td className={TDN}><Delta v={r.vs} good={r.vs == null ? true : r.good ? !r.vs.startsWith("-") : r.vs.startsWith("-")} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Module>

      {/* ── SNAPSHOT HISTORY ── */}
      <Module title="Snapshot History" sub={`${history.length} obs · newest first`}>
        <table className={TBL}>
          <Head cols={[["Date","l"],["Yield","r"],["SNR","r"],["Velocity","r"],["Leverage","r"],["Tokens","r"],["Δ Yield","r"],["Δ Tokens","r"]]} />
          <tbody>
            {histRows.length === 0 && (
              <tr><td colSpan={8} className={`${TD} text-center text-text-dim`}>no snapshots yet</td></tr>
            )}
            {histRows.map((h, ri) => {
              const prev = histRows[ri + 1];
              const dY = prev ? h.yield_ - prev.yield_ : null;
              const tk = histTokens(h);
              const ptk = prev ? histTokens(prev) : null;
              const dT = tk != null && ptk != null ? tk - ptk : null;
              const hSnr = histMetric(h, "snr");
              const hVel = histMetric(h, "velocity");
              const hLev = histMetric(h, "leverage");
              return (
                <tr key={h.date} className="even:bg-bg-elevated">
                  <td className={TDL}>{fmtDate(h.date)}</td>
                  <td className={TDN}>{num(h.yield_, 1)}</td>
                  <td className={TDN}>{hSnr != null ? num(hSnr, 3) : <Dim />}</td>
                  <td className={TDN}>{hVel != null ? num(hVel, 2) : <Dim />}</td>
                  <td className={TDN}>{hLev != null ? num(hLev, 1) : <Dim />}</td>
                  <td className={TDN}>{tk != null ? compact(tk) : <Dim />}</td>
                  <td className={TDN}><Delta v={dY != null ? signed(dY, 1) : null} good={(dY ?? 0) >= 0} /></td>
                  <td className={TDN}><Delta v={dT != null ? `${dT >= 0 ? "+" : "-"}${compact(Math.abs(dT))}` : null} good={(dT ?? 0) >= 0} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Module>

      {/* ── FIELD CONTEXT ── */}
      <Module title="Field Context" sub={`${rankedRows.length} operators · all-time window`}>
        <table className={TBL}>
          <Head cols={[["Stat","l"],["Value","r"],["Detail","r"]]} />
          <tbody>
            {ctxRows.map((row, ri) =>
              row === "sep" ? (
                <tr key={`sep-${ri}`}><td colSpan={3} className="h-[2px] border-t-2 border-bg-border p-0" /></tr>
              ) : (
                <tr key={row.stat} className="even:bg-bg-elevated">
                  <td className={TDL}>{row.stat}</td>
                  <td className={TDN}>{row.value}</td>
                  <td className={`${TDN} text-text-dim`}>{row.detail}</td>
                </tr>
              ),
            )}
          </tbody>
        </table>
      </Module>
    </div>
  );
}

export default StatsView;
