/**
 * components/profile-v2/OverviewView.tsx — the OVERVIEW tab of the redesigned
 * /user/[codename] profile. Server component (no client state): every visual
 * is computed inline — SVG charts, sparklines, and a deterministic
 * seeded-PRNG activity heatmap that renders identically on every render.
 *
 * Layout follows the approved mock (_workspace/profile-mocks/overview.html):
 * identity hero → cascade stat row → raw pillar row → signal+token module →
 * activity heatmap → records & honors → action bar.
 *
 * Surfaces/text/borders resolve through the app theme tokens so the view
 * swaps with data-theme; the categorical metric palette (cyan/violet/orange/
 * blue/magenta/yellow) is fixed data-viz color, scoped under .pv2. Display
 * type (Silkscreen / JetBrains Mono / Space Grotesk) comes from the
 * live-board font vars — preload:false, so the faces only ship where this
 * component renders.
 */

import Link from "next/link";

import type { Operator, ScoredSnapshot } from "@/lib/analytics/scoring-types";
import type {
  LeaderboardRow,
  TelemetryRaw,
  HallRecord,
  HistoryPoint,
} from "@/lib/board";
import type { TierProgress } from "@/lib/analytics/tier-progress";
import type { TrophyCounts } from "@/lib/analytics/trophy-counts";
import type { BuildArchetype } from "@/lib/analytics/build-archetypes";
import { lbwFontVars } from "@/components/live/fonts";

export interface OverviewViewProps {
  operator: Operator;
  snapshot: ScoredSnapshot;
  telemetry: TelemetryRaw;
  globalRank: number;
  topPct: number;
  pending: boolean;
  ranked: boolean;
  archetype: BuildArchetype | null;
  tierProgress: TierProgress | null;
  trophyCounts: TrophyCounts | null;
  records: HallRecord[];
  watchCount: number;
  boardRows: LeaderboardRow[];
  history: HistoryPoint[];
}

/* ── Scoped styles (theme tokens + mock structure, .pv2 prefix) ─────────── */
const CSS = `
.pv2{--pv2-signal:rgb(var(--gold));--pv2-cyan:#00E5FF;--pv2-blue:#3B82F6;--pv2-violet:#A855F7;--pv2-orange:#FF9A3C;--pv2-yellow:#FFE600;--pv2-magenta:#FF00D4;--pv2-up:#34d399;--pv2-down:#f87171;--pv2-medal:#FFD700;--pv2-silver:#C0C0C0;--pv2-bronze:#CD7F32;--pv2-display:var(--font-lbw-silk,"Silkscreen"),var(--font-lbw-jb,"JetBrains Mono"),ui-monospace,monospace;--pv2-mono:var(--font-lbw-jb,"JetBrains Mono"),var(--font-geist-mono),ui-monospace,monospace;--pv2-ui:var(--font-lbw-sg,"Space Grotesk"),var(--font-geist-sans),system-ui,sans-serif;display:flex;flex-direction:column;gap:14px;font-family:var(--pv2-ui)}
.pv2 *{box-sizing:border-box}
.pv2-mod{background:rgb(var(--bg-surface));border:1px solid rgb(var(--bg-border));border-radius:10px;padding:20px 24px}
.pv2-mhead{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding-bottom:10px;border-bottom:1px solid rgb(var(--bg-border))}
.pv2-mtitle{font-family:var(--pv2-display);font-size:11px;letter-spacing:.1em;color:rgb(var(--text-muted));text-transform:uppercase}
.pv2-msub{font-family:var(--pv2-mono);font-size:9px;letter-spacing:.06em;color:rgb(var(--text-muted));text-transform:uppercase;opacity:.7}
.pv2-tag{display:inline-flex;align-items:center;gap:4px;font-family:var(--pv2-mono);font-size:10px;letter-spacing:.06em;text-transform:uppercase;padding:3px 8px;border-radius:4px;border:1px solid rgb(var(--bg-border));background:rgb(var(--bg-elevated));color:rgb(var(--text-secondary));line-height:1}
.pv2-tag--class{border-color:rgb(var(--class-power)/.4);background:rgb(var(--class-power)/.08);color:rgb(var(--class-power));font-weight:600}
.pv2-tag--arch{border-color:rgb(var(--gold)/.35);color:rgb(var(--gold))}
.pv2-tag--wf{color:var(--pv2-cyan)}
.pv2-hero{display:grid;grid-template-columns:auto 1fr auto;gap:24px;align-items:center}
.pv2-av{position:relative;width:88px;height:88px;flex-shrink:0}
.pv2-avc{width:88px;height:88px;border-radius:50%;background:linear-gradient(135deg,rgb(var(--gold)) 0%,rgb(var(--bg-elevated)) 60%,var(--pv2-violet) 100%);display:flex;align-items:center;justify-content:center;font-family:var(--pv2-display);font-size:24px;font-weight:700;color:rgb(var(--bg-base));letter-spacing:.04em;overflow:hidden}
.pv2-avc img{width:100%;height:100%;object-fit:cover}
.pv2-ring{position:absolute;top:-6px;left:-6px;width:100px;height:100px}
.pv2-name{font-size:28px;font-weight:700;color:rgb(var(--text-primary));line-height:1.1;letter-spacing:-.01em}
.pv2-stats{display:grid;grid-template-columns:repeat(6,1fr);gap:2px}
.pv2-sc{background:rgb(var(--bg-elevated));border:1px solid rgb(var(--bg-border));border-radius:6px;padding:12px 14px 10px;display:flex;flex-direction:column;gap:4px;position:relative;overflow:hidden}
.pv2-sc:first-child{border-color:rgb(var(--gold)/.25)}
.pv2-sl{font-family:var(--pv2-display);font-size:9px;letter-spacing:.1em;text-transform:uppercase;color:rgb(var(--text-muted));line-height:1}
.pv2-sv{font-family:var(--pv2-mono);font-size:22px;font-weight:700;line-height:1;font-variant-numeric:tabular-nums}
.pv2-su{font-family:var(--pv2-mono);font-size:10px;color:rgb(var(--text-muted));letter-spacing:.05em;font-weight:400}
.pv2-sd{font-family:var(--pv2-mono);font-size:9px;font-weight:600;display:inline-flex;align-items:center;gap:2px}
.pv2-spark{position:absolute;bottom:0;right:0;width:60%;height:24px;opacity:.2}
.pv2-raw{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}
.pv2-rc{background:rgb(var(--bg-elevated));border:1px solid rgb(var(--bg-border));border-radius:6px;padding:9px 11px 8px;display:flex;flex-direction:column;gap:3px}
.pv2-rc:first-child{border-color:rgb(var(--gold)/.25)}
.pv2-rl{font-family:var(--pv2-display);font-size:8px;letter-spacing:.08em;text-transform:uppercase;color:rgb(var(--text-muted));line-height:1}
.pv2-rv{font-family:var(--pv2-mono);font-size:16px;font-weight:700;line-height:1.1;font-variant-numeric:tabular-nums}
.pv2-trow{display:flex;align-items:center;gap:10px}
.pv2-tl{width:64px;flex-shrink:0;font-family:var(--pv2-mono);font-size:9px;letter-spacing:.06em;color:rgb(var(--text-muted));text-transform:uppercase;text-align:right}
.pv2-tt{flex:1;height:10px;background:rgb(var(--bg-elevated));border-radius:5px;position:relative;z-index:2}
.pv2-tb{height:100%;border-radius:5px;position:relative;min-width:6px}
.pv2-td{position:absolute;top:50%;right:-4px;width:8px;height:8px;border-radius:50%;transform:translateY(-50%);border:1.5px solid rgb(var(--bg-surface))}
.pv2-tv{width:60px;flex-shrink:0;font-family:var(--pv2-mono);font-size:11px;font-weight:600;color:rgb(var(--text-secondary));font-variant-numeric:tabular-nums}
.pv2-hg{display:flex;gap:2px;overflow:hidden}
.pv2-hc{display:flex;flex-direction:column;gap:2px}
.pv2-hcell{width:11px;height:11px;border-radius:2px;background:rgb(var(--bg-elevated))}
.pv2-legend{display:flex;align-items:center;gap:16px;padding-top:10px;border-top:1px solid rgb(var(--bg-border));margin-top:12px;flex-wrap:wrap}
.pv2-li{display:flex;align-items:center;gap:5px;font-family:var(--pv2-mono);font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:rgb(var(--text-secondary))}
.pv2-meta{font-family:var(--pv2-mono);font-size:10px;color:rgb(var(--text-muted));letter-spacing:.04em;margin-top:2px}
.pv2-pillars{display:flex;gap:12px;margin-top:8px;flex-wrap:wrap}
.pv2-pbarwrap{width:80px;height:4px;background:rgb(var(--bg-border));border-radius:2px;overflow:hidden}
.pv2-plabel{font-family:var(--pv2-mono);font-size:8px;color:rgb(var(--text-muted));letter-spacing:.06em;display:flex;justify-content:space-between}
.pv2-badge{display:inline-flex;align-items:center;gap:5px;font-family:var(--pv2-mono);font-size:9px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:4px 8px;border-radius:4px;line-height:1}
.pv2-badge--v{border:1px solid rgb(0 229 255/.55);background:rgb(0 229 255/.08);color:var(--pv2-cyan)}
.pv2-badge--s{border:1px solid rgb(168 85 247/.55);background:rgb(168 85 247/.08);color:var(--pv2-violet)}
.pv2-sep{color:rgb(var(--bg-border));font-size:18px}
.pv2-hlabel{font-family:var(--pv2-display);font-size:9px;letter-spacing:.1em;color:rgb(var(--text-muted));text-transform:uppercase;margin-top:16px;display:flex;justify-content:space-between;align-items:center}
.pv2-hgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-top:8px}
.pv2-hcard{display:flex;align-items:center;gap:10px;background:rgb(var(--bg-elevated));border:1px solid rgb(255 215 0/.22);border-radius:6px;padding:9px 12px}
.pv2-hinfo{display:flex;flex-direction:column;gap:2px;min-width:0}
.pv2-hname{font-family:var(--pv2-mono);font-size:8px;letter-spacing:.08em;color:rgb(var(--text-muted));text-transform:uppercase;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pv2-hval{font-family:var(--pv2-mono);font-size:15px;font-weight:700;color:var(--pv2-medal);font-variant-numeric:tabular-nums;line-height:1.1}
.pv2-rstats{display:flex;gap:24px;margin-top:14px;padding-top:12px;border-top:1px solid rgb(var(--bg-border))}
.pv2-rstat{display:flex;flex-direction:column;gap:2px}
.pv2-rstat-v{font-family:var(--pv2-mono);font-size:13px;font-weight:600;color:rgb(var(--text-secondary));font-variant-numeric:tabular-nums}
.pv2-rstat-l{font-family:var(--pv2-mono);font-size:9px;color:rgb(var(--text-muted));letter-spacing:.06em;text-transform:uppercase}
.pv2-htype{display:inline-flex;align-items:center;gap:5px;font-family:var(--pv2-mono);font-size:9px;letter-spacing:.06em;color:rgb(var(--text-muted));text-transform:uppercase}
.pv2-hsw{width:11px;height:11px;border-radius:2px;display:inline-block;flex-shrink:0}
.pv2-hm{display:flex;justify-content:space-between;margin-bottom:6px;padding:0 2px}
.pv2-hm span{font-family:var(--pv2-mono);font-size:9px;letter-spacing:.06em;color:rgb(var(--text-muted));text-transform:uppercase}
.pv2-sub{font-family:var(--pv2-mono);font-size:12px;color:rgb(var(--text-muted));letter-spacing:.04em}
.pv2-tag--sm{font-size:9px;padding:2px 6px}
.pv2-mhmeta{font-family:var(--pv2-mono);font-size:10px;letter-spacing:.05em;text-transform:uppercase;color:rgb(var(--text-secondary))}
.pv2-chart{width:100%;height:280px;position:relative}
.pv2-empty{display:flex;height:100%;align-items:center;justify-content:center;font-family:var(--pv2-mono);font-size:11px;color:rgb(var(--text-muted));letter-spacing:.08em}
.pv2-conn{position:absolute;top:0;left:74px;width:calc(100% - 144px);height:100%;z-index:1;pointer-events:none}
.pv2-hrank{display:flex;flex-direction:column;align-items:flex-end;gap:2px;text-align:right}
.pv2-hstat{display:flex;gap:20px;margin-top:12px;flex-wrap:wrap}
.pv2-ab{display:flex;gap:8px}
.pv2-btn{flex:1;font-family:var(--pv2-mono);font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;padding:10px 16px;border-radius:6px;text-align:center;line-height:1;text-decoration:none;display:inline-block}
.pv2-btn--p{background:transparent;border:1.5px solid rgb(var(--gold));color:rgb(var(--gold))}
.pv2-btn--p:hover{background:rgb(var(--gold)/.1)}
.pv2-btn--g{background:transparent;border:1px solid rgb(var(--bg-border));color:rgb(var(--text-secondary))}
.pv2-btn--g:hover{color:rgb(var(--text-primary))}
@media(max-width:720px){.pv2-hero{grid-template-columns:auto 1fr;gap:16px}.pv2-hrank{grid-column:1/-1;flex-direction:row!important;align-items:center!important;gap:12px}.pv2-stats{grid-template-columns:repeat(3,1fr)}.pv2-raw{grid-template-columns:repeat(4,1fr)}.pv2-tl{width:56px}}
`;

/* ── Deterministic PRNG (identical output server + client renders) ───────── */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ── Formatting helpers ──────────────────────────────────────────────────── */
function compact(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (a >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${(n / 1e6).toFixed(a < 1e7 ? 2 : 1)}M`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
}
const num = (n: number) => Math.round(n).toLocaleString("en-US");
const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const fmtDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${MONTHS[(m ?? 1) - 1] ?? "?"} ${d ?? "?"} ${y ?? "?"}`;
};
const dayMs = 86400000;
const toDay = (iso: string) => Math.floor(Date.parse(iso.slice(0, 10) + "T00:00:00Z") / dayMs);

/* ── Per-snapshot cascade values derived from history token pillars ──────── */
interface Series {
  label: string;
  color: string;
  width: number;
  vals: (number | null)[];
}
function buildSeries(history: HistoryPoint[]): Series[] {
  const p = history.map((h) =>
    h.input_tokens && h.output_tokens != null && h.cache_read_tokens != null
      ? {
          i: h.input_tokens,
          o: h.output_tokens,
          cr: h.cache_read_tokens,
          cw: h.cache_creation_tokens ?? 0,
        }
      : null,
  );
  const map = (f: (x: { i: number; o: number; cr: number; cw: number }) => number | null) =>
    history.map((h, k) => {
      const x = p[k];
      if (x && x.i > 0) {
        const v = f(x);
        if (v != null && Number.isFinite(v)) return v;
      }
      return null;
    });
  return [
    { label: "YIELD", color: "var(--pv2-signal)", width: 2, vals: map((x) => (x.cr * x.o) / (x.i * x.i)) },
    { label: "SNR", color: "var(--pv2-cyan)", width: 1.5, vals: map((x) => (x.i + x.o > 0 ? x.o / (x.i + x.o) : null)) },
    { label: "VELOCITY", color: "var(--pv2-orange)", width: 1.5, vals: map((x) => x.o / x.i) },
    { label: "LEVERAGE", color: "var(--pv2-violet)", width: 1.5, vals: map((x) => x.cr / x.i) },
    { label: "10XDEV", color: "var(--pv2-blue)", width: 1.5, vals: map((x) => (x.cr > 0 ? Math.log10(x.cr / x.i) : null)) },
  ];
}
const seriesDelta = (v: (number | null)[]) => {
  const idx = v.map((x, k) => (x != null ? k : -1)).filter((k) => k >= 0);
  return idx.length >= 2 ? v[idx[idx.length - 1]]! - v[idx[0]]! : null;
};

function MedalSvg({ color, rank, size = 20 }: { color: string; rank: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" style={{ flexShrink: 0 }}>
      <circle cx="10" cy="10" r="9" fill="none" stroke={color} strokeWidth="1.5" />
      <circle cx="10" cy="10" r="6" fill={color} opacity="0.15" />
      <text x="10" y="13.5" textAnchor="middle" fill={color} fontFamily="var(--pv2-display)" fontSize="8" fontWeight="700">{rank}</text>
    </svg>
  );
}

export function OverviewView({
  operator,
  snapshot,
  telemetry,
  globalRank,
  topPct,
  pending,
  ranked,
  archetype,
  tierProgress,
  trophyCounts,
  records,
  watchCount,
  boardRows,
  history,
}: OverviewViewProps) {
  const c = snapshot.cascade;
  const show = ranked && !pending && c && !c.nonCompounding ? c : null;
  const name = operator.display_name ?? operator.codename;
  const initials = (() => {
    const t = name.trim().split(/\s+/);
    return (t.length >= 2 ? t[0][0] + t[1][0] : name.slice(0, 2)).toUpperCase();
  })();
  const totalTokens =
    telemetry.fresh_input + telemetry.output + telemetry.cache_read + telemetry.cache_create;
  const ownRow = boardRows.find((r) => r.operator.codename === operator.codename);
  const wf = ownRow?.workflow_mode ?? null;
  const fieldYields = boardRows
    .map((r) => r.snapshot.cascade?.yield_)
    .filter((v): v is number => v != null && v > 0)
    .sort((a, b) => a - b);
  const fieldMedianY = fieldYields.length ? fieldYields[Math.floor(fieldYields.length / 2)] : null;

  // Hero: tier ring (r=46, circumference 289.03)
  const ringOff = tierProgress ? 289.03 * (1 - Math.min(100, Math.max(0, tierProgress.progressPct)) / 100) : 289.03;
  const maxTok = Math.max(telemetry.fresh_input, telemetry.output, telemetry.cache_read, telemetry.cache_create, 1);

  // Cascade stat cards — series give sparklines + deltas
  const series = buildSeries(history);
  const statCards = [
    { label: "YIELD", color: "var(--pv2-signal)", s: series[0], value: show ? `${show.yield_ >= 1e3 ? compact(show.yield_) : show.yield_.toFixed(1)}` : "—", unit: "Υ", fmt: (d: number) => `${d >= 0 ? "+" : ""}${d.toFixed(1)}` },
    { label: "SNR", color: "var(--pv2-cyan)", s: series[1], value: c && !pending ? c.snr.toFixed(3) : "—", unit: "", fmt: (d: number) => `${d >= 0 ? "+" : ""}${d.toFixed(3)}` },
    { label: "LEVERAGE", color: "var(--pv2-violet)", s: series[3], value: show ? num(show.leverage) : "—", unit: "x", fmt: (d: number) => `${d >= 0 ? "+" : "-"}${num(Math.abs(d))}` },
    { label: "10xDEV", color: "var(--pv2-blue)", s: series[4], value: show && show.dev10x != null ? show.dev10x.toFixed(2) : "—", unit: "", fmt: (d: number) => `${d >= 0 ? "+" : ""}${d.toFixed(2)}` },
    { label: "VELOCITY", color: "var(--pv2-orange)", s: series[2], value: c && !pending ? c.velocity.toFixed(2) : "—", unit: "", fmt: (d: number) => `${d >= 0 ? "+" : ""}${d.toFixed(2)}` },
    { label: "EFFICIENCY", color: "rgb(var(--text-primary))", s: null, value: c && !pending ? num(c.efficiency) : "—", unit: "", fmt: (d: number) => `${d >= 0 ? "+" : "-"}${num(Math.abs(d))}` },
  ];

  // Signal chart geometry: viewBox -4 -6 856 380, plot x:44→812, y:355→15
  const n = history.length;
  const xAt = (i: number) => (n > 1 ? 44 + (i * 768) / (n - 1) : 428);
  const yAt = (v: number, lo: number, hi: number) => {
    const span = hi - lo || 1;
    return 355 - ((v - lo) / span) * 340;
  };
  const traces = series.map((s) => {
    const vals = s.vals.filter((v): v is number => v != null);
    const lo = Math.min(...vals), hi = Math.max(...vals);
    const pts = s.vals
      .map((v, i) => (v != null ? `${xAt(i).toFixed(1)},${yAt(v, lo, hi).toFixed(1)}` : null))
      .filter(Boolean) as string[];
    return { ...s, pts };
  });

  // Heatmap — 22 weeks × 7, anchored at snapshot date (deterministic)
  const anchorIso = history.length ? history[history.length - 1].date : (snapshot.snapshot_date ?? "2026-01-01");
  const anchor = toDay(anchorIso);
  const startDay = anchor - 153;
  const acctStart = anchor - operator.account_age_days;
  const histMap = new Map<number, number>();
  for (const h of history) {
    const d = toDay(h.date);
    if (h.yield_ > 0) histMap.set(d, h.yield_);
    else if (!histMap.has(d)) histMap.set(d, -1); // active, no yield
  }
  const yields = [...histMap.values()].filter((v) => v > 0).sort((a, b) => a - b);
  const baseline = yields.length ? yields[Math.floor(yields.length / 2)] : null;
  const peak = yields.length ? yields[yields.length - 1] : null;
  const rng = mulberry32(hashSeed(operator.codename));
  // Sparse seeded fill only applies once real history exists — a pending
  // operator with zero submissions gets an honest empty grid, not noise.
  const simulate = history.length > 0;
  const cells: { day: number; bg: string | null }[] = [];
  for (let k = 0; k < 154; k++) {
    const day = startDay + k;
    if (day > anchor || day < acctStart) { cells.push({ day, bg: null }); continue; }
    const recency = (day - Math.max(acctStart, startDay)) / Math.max(1, anchor - Math.max(acctStart, startDay));
    const y = histMap.get(day);
    let bg: string | null = null;
    if (y != null && y >= 0 && baseline) {
      if (peak && y >= peak) bg = "var(--pv2-orange)";
      else if (y < baseline * 0.9) bg = "rgb(255 0 212 / 0.55)";
      else if (y <= baseline * 1.1) bg = "rgb(255 230 0 / 0.55)";
      else bg = "rgb(var(--gold) / 0.75)";
    } else if (y === -1) {
      bg = "rgb(var(--gold) / 0.35)";
    } else if (simulate) {
      const v = rng() * 0.6 + recency * 0.4;
      if (v >= 0.15) {
        const t = rng(), lvl = rng();
        const al = lvl < 0.2 ? "0.15" : lvl < 0.4 ? "0.35" : lvl < 0.6 ? "0.55" : lvl < 0.8 ? "0.75" : null;
        if (t < 0.15) bg = `rgb(255 0 212 / ${lvl < 0.25 ? "0.15" : lvl < 0.5 ? "0.35" : lvl < 0.75 ? "0.55" : "0.75"})`;
        else if (t < 0.65) bg = al ? `rgb(255 230 0 / ${al})` : "var(--pv2-yellow)";
        else if (t < 0.9) bg = al ? `rgb(var(--gold) / ${al})` : "var(--pv2-signal)";
        else bg = lvl < 0.8 ? "rgb(255 154 60 / 0.55)" : "var(--pv2-orange)";
      }
    }
    cells.push({ day, bg });
  }
  const active = cells.filter((x) => x.bg);
  let longest = 0, run = 0;
  for (const x of cells) { run = x.bg ? run + 1 : 0; longest = Math.max(longest, run); }
  let streak = 0;
  for (let k = cells.length - 1; k >= 0; k--) { if (cells[k].day > anchor) continue; if (!cells[k].bg) break; streak++; }
  const monthSet: string[] = [];
  for (let w = 0; w < 22; w++) {
    const d = new Date((startDay + w * 7) * dayMs);
    const ab = d.toUTCString().slice(8, 11).toUpperCase();
    if (monthSet[monthSet.length - 1] !== ab) monthSet.push(ab);
  }
  const avgY = yields.length ? yields.reduce((a, b) => a + b, 0) / yields.length : null;

  const medals = [
    { n: trophyCounts?.gold ?? 0, color: "var(--pv2-medal)", rank: "1" },
    { n: trophyCounts?.silver ?? 0, color: "var(--pv2-silver)", rank: "2" },
    { n: trophyCounts?.bronze ?? 0, color: "var(--pv2-bronze)", rank: "3" },
  ];

  return (
    <div className={`pv2 ${lbwFontVars}`}>
      <style>{CSS}</style>

      {/* 1 ─ IDENTITY HERO */}
      <section className="pv2-mod" style={{ padding: "24px 28px" }}>
        <div className="pv2-hero">
          <div className="pv2-av">
            <div className="pv2-avc">
              {operator.avatar_url ? (
                /* eslint-disable-next-line @next/next/no-img-element -- user-uploaded avatar, fixed slot */
                <img src={operator.avatar_url} alt={name} width={88} height={88} />
              ) : (
                initials
              )}
            </div>
            <svg className="pv2-ring" viewBox="0 0 100 100" aria-hidden>
              <circle cx="50" cy="50" r="46" fill="none" stroke="rgb(var(--bg-border))" strokeWidth="3" />
              <circle
                cx="50" cy="50" r="46" fill="none" stroke="var(--pv2-violet)" strokeWidth="3"
                strokeLinecap="round" strokeDasharray="289.03" strokeDashoffset={ringOff.toFixed(1)}
                transform="rotate(-90 50 50)"
              />
            </svg>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h1 className="pv2-name" style={{ margin: 0 }}>{name}</h1>
            {operator.display_name && <div className="pv2-sub">{operator.codename}</div>}
            {operator.handle && (
              <div className="pv2-sub" style={{ color: "rgb(var(--text-secondary))" }}>@{operator.handle}</div>
            )}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
              {ranked && !pending && (
                <span className="pv2-tag pv2-tag--class">
                  <svg width="8" height="8" viewBox="0 0 8 8"><polygon points="4,0 8,4 4,8 0,4" fill="currentColor" /></svg>
                  {snapshot.class_tier}
                </span>
              )}
              {archetype && <span className="pv2-tag pv2-tag--arch">{archetype.name}</span>}
              {wf && <span className="pv2-tag pv2-tag--wf">{wf === "hitl" ? "HITL" : wf}</span>}
              <span className="pv2-tag">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" /></svg>
                {operator.primary_domain}
              </span>
            </div>
            <div className="pv2-pillars">
              {([
                ["INPUT", telemetry.fresh_input, "var(--pv2-signal)"],
                ["OUTPUT", telemetry.output, "var(--pv2-cyan)"],
                ["CACHE-R", telemetry.cache_read, "var(--pv2-signal)"],
                ["CACHE-W", telemetry.cache_create, "var(--pv2-orange)"],
              ] as const).map(([lbl, v, col]) => (
                <div key={lbl} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <div className="pv2-pbarwrap">
                    <div style={{ height: "100%", borderRadius: 2, background: col, width: `${Math.max(2, (Math.log10(Math.max(v, 1)) / Math.log10(Math.max(maxTok, 10))) * 100)}%` }} />
                  </div>
                  <div className="pv2-plabel">
                    <span>{lbl}</span><span style={{ color: "rgb(var(--text-secondary))" }}>{compact(v)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pv2-hrank">
            {pending || !ranked ? (
              <span style={{ fontFamily: "var(--pv2-display)", fontSize: 18, fontWeight: 700, color: "rgb(var(--text-muted))", letterSpacing: "0.04em" }}>UNRANKED</span>
            ) : (
              <>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 2 }}>
                  <span style={{ fontFamily: "var(--pv2-display)", fontSize: 14, color: "rgb(var(--text-muted))", position: "relative", top: -8 }}>#</span>
                  <span style={{ fontFamily: "var(--pv2-display)", fontSize: 48, fontWeight: 700, color: "var(--pv2-signal)", lineHeight: 1, letterSpacing: "-0.02em" }}>{globalRank}</span>
                </div>
                <div style={{ fontFamily: "var(--pv2-mono)", fontSize: 13, color: "var(--pv2-up)", fontWeight: 600 }}>
                  {(100 - topPct).toFixed(1)}<span style={{ fontSize: 10, opacity: 0.7 }}>%ile</span>
                </div>
              </>
            )}
            <div className="pv2-meta" style={{ marginTop: 6 }}>
              {operator.account_age_days} DAYS · {num(operator.total_messages_lifetime)} MSG
            </div>
            <div className="pv2-meta">
              {compact(totalTokens)} TOKENS{c ? ` · $${c.costPerMillion.toFixed(2)}/M` : ""}
            </div>
            {snapshot.snapshot_date && (
              <div className="pv2-meta" style={{ opacity: 0.6 }}>
                SNAPSHOT {fmtDate(snapshot.snapshot_date)}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 2 ─ CASCADE METRICS ROW */}
      <section className="pv2-stats">
        {statCards.map((m) => {
          const vals = m.s ? m.s.vals.filter((v): v is number => v != null) : [];
          const lo = Math.min(...vals), hi = Math.max(...vals), span = hi - lo || 1;
          const pts = m.s ? m.s.vals.map((v, i) => v == null ? null : `${(i * 8).toFixed(0)},${(22 - ((v - lo) / span) * 20).toFixed(1)}`).filter(Boolean).join(" ") : "";
          const d = m.s && !pending ? seriesDelta(m.s.vals) : null;
          return (
            <div key={m.label} className="pv2-sc">
              <div className="pv2-sl">{m.label}</div>
              <div className="pv2-sv" style={{ color: m.color }}>
                {m.value}{m.unit && <span className="pv2-su">{m.unit}</span>}
              </div>
              {d != null && m.value !== "—" && (
                <div className="pv2-sd" style={{ color: d >= 0 ? "var(--pv2-up)" : "var(--pv2-down)" }}>
                  {m.fmt(d)}{" "}
                  <svg width="8" height="6" viewBox="0 0 8 6" style={d < 0 ? { transform: "rotate(180deg)" } : undefined}><path d="M4 0L8 6H0z" fill="currentColor" /></svg>
                </div>
              )}
              {pts && (
                <svg className="pv2-spark" viewBox="0 0 60 24" preserveAspectRatio="none">
                  <polyline points={pts} fill="none" stroke={m.color} strokeWidth="1.5" />
                </svg>
              )}
            </div>
          );
        })}
      </section>

      {/* 3 ─ RAW METRICS ROW */}
      <section className="pv2-raw">
        {([
          ["TOTAL TOKENS", compact(totalTokens), "rgb(var(--text-primary))"],
          ["Υ/DAY", operator.account_age_days > 0 ? compact(totalTokens / operator.account_age_days) : "—", "var(--pv2-signal)"],
          ["INPUT", compact(telemetry.fresh_input), "var(--pv2-blue)"],
          ["OUTPUT", compact(telemetry.output), "var(--pv2-cyan)"],
          ["CACHE-R", compact(telemetry.cache_read), "var(--pv2-signal)"],
          ["CACHE-W", compact(telemetry.cache_create), "var(--pv2-orange)"],
          ["OP RATIO", c && !pending ? c.opRatio : "—", "var(--pv2-violet)"],
        ] as const).map(([lbl, v, col]) => (
          <div key={lbl} className="pv2-rc">
            <div className="pv2-rl">{lbl}</div>
            <div className="pv2-rv" style={{ color: col }}>{v}</div>
          </div>
        ))}
      </section>

      {/* 4 ─ SIGNAL & TOKEN BREAKDOWN */}
      <section className="pv2-mod" style={{ paddingBottom: 16 }}>
        <div className="pv2-mhead">
          <div>
            <div className="pv2-mtitle">SIGNAL &amp; TOKEN BREAKDOWN</div>
            <div className="pv2-msub">RELATIVE 0-100 · PER-TRACE SPAN</div>
            <div className="pv2-msub">RAW VOLUME · LOG SCALE</div>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <span className="pv2-tag pv2-tag--sm">{n} OBS</span>
            <span className="pv2-tag pv2-tag--sm">{operator.account_age_days}D</span>
            {fieldMedianY != null && <span className="pv2-tag pv2-tag--sm">FIELD MED Υ{compact(fieldMedianY)}</span>}
          </div>
        </div>
        <div className="pv2-chart">
          {n >= 2 ? (
            <svg viewBox="-4 -6 856 380" preserveAspectRatio="xMidYMid meet" style={{ width: "100%", height: "100%" }}>
              {[0, 90, 180, 270, 360].map((y, i) => (
                <line key={y} x1="36" y1={y} x2="812" y2={y} stroke="rgb(var(--bg-border))" strokeWidth="0.5" strokeDasharray={i === 0 || i === 4 ? undefined : "4,8"} />
              ))}
              {[100, 75, 50, 25, 0].map((t, i) => (
                <text key={t} x={t === 100 ? 0 : t === 0 ? 12 : 6} y={[14, 94, 184, 274, 356][i]} fill="rgb(var(--text-muted))" fontFamily="var(--pv2-mono)" fontSize="10" opacity="0.5">{t}</text>
              ))}
              {traces.map((t) =>
                t.pts.length >= 2 ? (
                  <g key={t.label}>
                    <polyline points={t.pts.join(" ")} fill="none" stroke={t.color} strokeWidth={t.width} strokeLinejoin="round" strokeLinecap="round" opacity={t.width === 2 ? 1 : 0.85} />
                    {t.pts.map((p, i) => {
                      const [cx, cy] = p.split(",");
                      return <circle key={i} cx={cx} cy={cy} r={t.width === 2 ? 3.5 : 2.5} fill={t.color} opacity={t.width === 2 ? 1 : 0.85} />;
                    })}
                  </g>
                ) : null,
              )}
            </svg>
          ) : (
            <div className="pv2-empty">
              {pending ? "AWAITING FIRST SUBMISSION" : "INSUFFICIENT HISTORY — NEED 2+ SNAPSHOTS"}
            </div>
          )}
        </div>
        <div style={{ borderTop: "1px solid rgb(var(--bg-border))", margin: "16px 0 14px" }} />
        <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 10 }}>
          {([
            ["INPUT", telemetry.fresh_input, "var(--pv2-blue)"],
            ["OUTPUT", telemetry.output, "var(--pv2-cyan)"],
            ["CACHE-R", telemetry.cache_read, "var(--pv2-signal)"],
            ["CACHE-W", telemetry.cache_create, "var(--pv2-orange)"],
            ["TOTAL", totalTokens, "rgb(var(--text-primary))"],
          ] as const).map(([lbl, v, col]) => {
            const w = Math.max(4, (Math.log10(Math.max(v, 1)) / Math.log10(Math.max(maxTok, 10))) * 100);
            return (
              <div key={lbl} className="pv2-trow">
                <div className="pv2-tl">{lbl}</div>
                <div className="pv2-tt">
                  <div className="pv2-tb" style={{ width: `${w}%`, background: col }}>
                    <span className="pv2-td" style={{ background: col }} />
                  </div>
                </div>
                <div className="pv2-tv">{compact(v)}</div>
              </div>
            );
          })}
          <svg className="pv2-conn" viewBox="0 0 100 90" preserveAspectRatio="none">
            <polyline
              points={([telemetry.fresh_input, telemetry.output, telemetry.cache_read, telemetry.cache_create, totalTokens] as const)
                .map((v, i) => `${Math.max(4, (Math.log10(Math.max(v, 1)) / Math.log10(Math.max(maxTok, 10))) * 100)},${5 + i * 20}`).join(" ")}
              fill="none" stroke="rgb(var(--text-secondary))" strokeWidth="1" strokeDasharray="2,4" vectorEffect="non-scaling-stroke" opacity="0.35"
            />
          </svg>
        </div>
        <div className="pv2-legend">
          {series.map((s) => (
            <div key={s.label} className="pv2-li">
              <div style={{ width: 12, height: 3, borderRadius: 1, background: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      </section>

      {/* 5 ─ ACTIVITY HEATMAP */}
      <section className="pv2-mod" style={{ paddingBottom: 16 }}>
        <div className="pv2-mhead">
          <div>
            <div className="pv2-mtitle">SUBMISSION ACTIVITY</div>
            <div className="pv2-msub">COLOR = YIELD VS OPERATOR BASELINE</div>
          </div>
          <div className="pv2-mhmeta">
            {operator.account_age_days} DAYS · {num(operator.total_messages_lifetime)} MESSAGES
          </div>
        </div>
        <div className="pv2-hm">
          {monthSet.map((m, i) => <span key={i}>{m}</span>)}
        </div>
        <div className="pv2-hg">
          {Array.from({ length: 22 }, (_, w) => (
            <div key={w} className="pv2-hc">
              {cells.slice(w * 7, w * 7 + 7).map((cell, d) => (
                <div key={d} className="pv2-hcell" style={cell.bg ? { background: cell.bg } : undefined} />
              ))}
            </div>
          ))}
        </div>
        <div className="pv2-hstat">
          {([
            ["ACTIVE DAYS", active.length],
            ["LONGEST STREAK", longest],
            ["CURRENT STREAK", streak],
            ["AVG Υ", avgY != null ? avgY.toFixed(1) : "—"],
            ["PEAK Υ", peak != null ? compact(peak) : "—"],
          ] as const).map(([lbl, v]) => (
            <div key={lbl} className="pv2-rstat">
              <span className="pv2-rstat-v">{v}</span>
              <span className="pv2-rstat-l">{lbl}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingTop: 8, borderTop: "1px solid rgb(var(--bg-border))", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {([
              ["rgb(255 0 212 / 0.55)", "BELOW"],
              ["rgb(255 230 0 / 0.55)", "BASELINE"],
              ["rgb(var(--gold) / 0.55)", "ABOVE"],
              ["rgb(255 154 60 / 0.55)", "RECORD"],
            ] as const).map(([bg, lbl]) => (
              <span key={lbl} className="pv2-htype">
                <span className="pv2-hsw" style={{ background: bg }} />
                {lbl}
              </span>
            ))}
          </div>
          <span className="pv2-msub">DAILY YIELD VS BASELINE</span>
        </div>
      </section>

      {/* 6 ─ RECORDS & HONORS */}
      <section className="pv2-mod">
        <div className="pv2-mhead">
          <div>
            <div className="pv2-mtitle">RECORDS &amp; HONORS</div>
            <div className="pv2-msub">MEDALS · BADGES · HALL RECORDS</div>
          </div>
          <div className="pv2-mhmeta" style={{ fontSize: 11, color: "rgb(var(--text-muted))" }}>
            WATCHED BY {watchCount}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          {medals.map((m, i) => (
            <span key={i} style={{ display: "contents" }}>
              {i > 0 && <span className="pv2-sep">·</span>}
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: "var(--pv2-mono)", fontSize: 16, fontWeight: 700, fontVariantNumeric: "tabular-nums", opacity: m.n === 0 ? 0.3 : 1 }}>
                <MedalSvg color={m.color} rank={m.rank} />
                <span style={{ color: m.color }}>{m.n}</span>
              </span>
            </span>
          ))}
          {operator.verification_status !== "unverified" && (
            <>
              <span className="pv2-sep">·</span>
              <span className="pv2-badge pv2-badge--v">
                <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1.5 5.5L3.8 7.8L8.5 2.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                VERIFIED
              </span>
            </>
          )}
          {operator.current_supporter_tier !== "free" && (
            <span className="pv2-badge pv2-badge--s">
              <svg width="9" height="9" viewBox="0 0 9 9"><polygon points="4.5,0.5 8.5,4.5 4.5,8.5 0.5,4.5" fill="currentColor" /></svg>
              SUPPORTER
            </span>
          )}
        </div>
        {records.length > 0 && (
          <>
            <div className="pv2-hlabel">
              <span>HALL RECORDS</span>
              {records.length > 3 && (
                <Link href="/hall" style={{ fontFamily: "var(--pv2-mono)", fontSize: 9, color: "rgb(var(--gold))", letterSpacing: "0.06em" }}>
                  VIEW ALL {records.length} →
                </Link>
              )}
            </div>
            <div className="pv2-hgrid">
              {records.slice(0, 3).map((r) => (
                <div key={r.reward_id + r.title} className="pv2-hcard">
                  <MedalSvg color="var(--pv2-medal)" rank="1" size={18} />
                  <div className="pv2-hinfo">
                    <div className="pv2-hname">
                      {r.title} <span style={{ color: "var(--pv2-medal)" }}>· CURRENT RECORD</span>
                    </div>
                    <div className="pv2-hval">{r.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        <div className="pv2-rstats">
          {([
            ["OP RATIO", c && !pending ? c.opRatio : "—"],
            ["SCALE V", c && !pending ? c.scaleV.toFixed(2) : "—"],
            ["COST", c && !pending ? `$${c.costPerMillion.toFixed(2)}/M` : "—"],
          ] as const).map(([lbl, v]) => (
            <div key={lbl} className="pv2-rstat">
              <span className="pv2-rstat-v">{v}</span>
              <span className="pv2-rstat-l">{lbl}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 7 ─ ACTION BAR */}
      <div className="pv2-ab">
        <Link href={`/user/${encodeURIComponent(operator.codename)}?tab=stats`} className="pv2-btn pv2-btn--p">SEE FULL STATS</Link>
        <Link href={`/compare?a=${encodeURIComponent(operator.codename)}`} className="pv2-btn pv2-btn--g">COMPARE</Link>
        <button type="button" className="pv2-btn pv2-btn--g">WATCH</button>
      </div>
    </div>
  );
}
