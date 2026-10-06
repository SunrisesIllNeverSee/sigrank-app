/**
 * components/live/utils.ts — verbatim ports of the pure logic from
 * live-board-prototype/board.js + data.js (tag reference-v1).
 *
 * What ports byte-for-byte:
 *   - numvOf     compact-number parser ("34.2B"→34.2e9, "395.7×"→395.7,
 *                "$0.58"→0.58, "—"→0 so non-compounding rows sink in sorts)
 *   - opRadar    axis normalization against RMAX (0.06 floor)
 *   - rank3      top-3-per-column heat index (cost ranks lowest-first)
 *   - rawRankMap ∑ raw-volume rank, separate from performative rank
 *   - deriveMovers  movement_7d projection (data.js, top-5)
 *   - spark geometry (56×18 polyline normalization)
 *   - profileFor  selected-operator adapter (board.js profileData)
 *
 * What is intentionally different (documented):
 *   - RMAX is NOT computed from rendered rows — per the Phase-2B contract it
 *     arrives as initial.fieldMax, computed server-side from the FULL
 *     ranking scope. rmaxOf() applies only the reference's `|| 1` zero-guard.
 */
import type { CSSProperties } from "react";
import type {
  FieldMaxima,
  LiveBoardInitialState,
  LiveOperator,
} from "@/lib/board/live-types";

/* ---------- LB-20 theme list (board.js) ---------- */
export const THEMES = ["green", "gold", "bone", "purple"] as const;
export type ThemeName = (typeof THEMES)[number];

/* ---------- LB-20 theme persistence (2C) ----------
   The reference read `?theme=` once at boot and dropped the choice on reload
   (board.js set documentElement.dataset.theme; index.html hardcoded "green").
   The port scopes the palette to .lbw-root[data-theme], so persistence is a
   workspace-local concern under its own key — deliberately NOT `sigrank-theme`
   (the site's carbon/paper/railway/terminal domain on <html>).

   Resolution order, both at parse time (LBW_THEME_INIT) and at React init
   (resolveLbwTheme):  ?theme=  >  localStorage  >  "green". The param is an
   ephemeral override — it never writes storage, so QA/preview links can't
   poison a visitor's stored preference; clicking a swatch persists. */
export const LBW_THEME_KEY = "lbw-theme";

export function resolveLbwTheme(): ThemeName {
  if (typeof window === "undefined") return "green";
  try {
    const q = new URLSearchParams(window.location.search).get("theme");
    if ((THEMES as readonly string[]).includes(q ?? "")) return q as ThemeName;
    const s = window.localStorage.getItem(LBW_THEME_KEY);
    if ((THEMES as readonly string[]).includes(s ?? "")) return s as ThemeName;
  } catch {
    /* storage disabled (private mode) → fall through to default */
  }
  return "green";
}

export function persistLbwTheme(t: ThemeName): void {
  try {
    window.localStorage.setItem(LBW_THEME_KEY, t);
  } catch {
    /* storage disabled — theme still applies for the session */
  }
}

/**
 * No-flash init — emitted as the FIRST child of .lbw-root so the HTML parser
 * runs it while the root element is open but before the subtree paints
 * (document.currentScript.parentElement === .lbw-root). Mirrors the site's
 * own THEME_INIT pattern in app/layout.tsx, scoped to the workspace element
 * instead of documentElement. SSR always renders data-theme="green"; this
 * script corrects it pre-paint so a stored/param theme never flashes.
 */
export const LBW_THEME_INIT = `(function(){try{var ok=${JSON.stringify(
  THEMES,
)};var t=new URLSearchParams(location.search).get("theme");if(ok.indexOf(t)<0){t=localStorage.getItem(${JSON.stringify(
  LBW_THEME_KEY,
)});}if(ok.indexOf(t)>=0){var el=document.currentScript&&document.currentScript.parentElement;if(el){el.setAttribute("data-theme",t);}}}catch(e){}})();`;

/* ---------- copy locks (data.js COPY — keyed fixture values are the
   canonical strings; the contract does not carry them) ---------- */
export const COPY = {
  heroKicker: "BURNERS, BUILDERS & 10XERS",
  heroTitleA: "Global ",
  heroTitleB: "AI Operator Leaderboard",
  privacy: "Token counts only. Never your prompts.",
} as const;

/* ---------- control options (data.js CONTROLS, verbatim) ---------- */
export const CONTROLS = {
  windows: ["7D", "30D", "90D", "All-time"],
  platforms: [
    "All Platforms",
    "Claude Code",
    "ChatGPT",
    "Cursor",
    "Copilot",
    "Windsurf",
    "Codex",
  ],
  classes: [
    "All Classes",
    "ARCH+",
    "ARCH",
    "POWER",
    "BASE",
    "SEEKER",
    "REFINER",
    "BEARER",
    "IGNITER",
  ],
  sorts: [
    "Yield",
    "Total",
    "Leverage",
    "Velocity",
    "SNR",
    "10xDEV",
    "Efficiency",
    "$/1M",
  ],
} as const;

/** /board/[window] slug per WINDOW option label. */
export const WINDOW_SLUG: Record<string, string> = {
  "7D": "7d",
  "30D": "30d",
  "90D": "90d",
  "All-time": "all",
};

/** meta.window (route enum or API name) → WINDOW option label. */
export const windowLabel = (w: string): string =>
  (
    ({
      "7d": "7D",
      "30d": "30D",
      "90d": "90D",
      all: "All-time",
      all_time: "All-time",
    }) as Record<string, string>
  )[w] ?? "All-time";

export const COMPARE_SLOTS = 3;
export const COMPARE_CTA = "Start Comparing";

/* radar axis labels — data.js FEATURED.radar.axes, verbatim order */
export const RADAR_AXES = ["Yield", "Leverage", "Velocity", "SNR", "10xDEV"];

/* board.js avatarCols — deterministic per operator index */
export const AVATAR_COLS = [
  "#a6ff00",
  "#00e5ff",
  "#3b82f6",
  "#a855f7",
  "#ff9a3c",
  "#ff6eb4",
  "#ffe600",
];
export const avatarStyle = (i: number): CSSProperties => ({
  background: AVATAR_COLS[i % AVATAR_COLS.length],
});

/* hall medal fills — board.js `medal()` (gold/silver/bronze) */
export const MEDAL_FILLS = ["#e8b93c", "#b9c4cc", "#b0722e"];

/* ---------- numvOf — verbatim from board.js ----------
   parse abbreviated numerics ("7.0B" "17.1M" "395.7×" "$0.58") */
export const numvOf = (s: string | number): number => {
  const str = String(s);
  const n = parseFloat(str.replace(/[×$,]/g, ""));
  if (!Number.isFinite(n)) return 0; // "—" non-compounding rows sort as 0
  return /B/i.test(str) ? n * 1e9 : /M/i.test(str) ? n * 1e6 : /K/i.test(str) ? n * 1e3 : n;
};

/* Math paths prefer the server-projected `num` numerics (exact values, no
   re-parse) and fall back to numvOf when a row lacks them (contract: `num`
   is authoritative when present — LiveOperator.num). */
export const numYield = (o: LiveOperator): number => o.num?.yield ?? numvOf(o.yield);
export const numLev = (o: LiveOperator): number => o.num?.lev ?? numvOf(o.lev);
export const numTotal = (o: LiveOperator): number => o.num?.total ?? numvOf(o.total);
export const numCost = (o: LiveOperator): number =>
  o.num?.cost ?? (parseFloat(o.cost.replace("$", "")) || 0);

/* ---------- RMAX (board.js) — server provides full-scope maxima via
   initial.fieldMax; only the reference's `|| 1` guards are applied here.
   Radar axes normalize vs the loaded field's maxima — fixture and live
   scales differ by orders of magnitude, so constants cannot calibrate. */
export const rmaxOf = (m: FieldMaxima): FieldMaxima => ({
  yield: m.yield || 1,
  lev: m.lev || 1,
  vel: m.vel || 1,
  snr: m.snr || 1,
  dev: m.dev || 1,
  scalev: m.scalev || 1,
});

/* ---------- opRadar — verbatim from board.js ---------- */
export const opRadar = (o: LiveOperator, rmax: FieldMaxima): number[] => {
  const n = (v: number) => Math.min(v, 1);
  return [
    n(numYield(o) / rmax.yield),
    n(numLev(o) / rmax.lev),
    n(o.vel / rmax.vel),
    n(o.snr / rmax.snr),
    n(o.dev / rmax.dev),
  ].map((v) => Math.max(v, 0.06));
};

/* ---------- top-3 sets per column (cost: lowest wins) — board.js rank3/TT */
export type TopMap = Record<number, number>;
export interface TopSets {
  yield: TopMap;
  lev: TopMap;
  vel: TopMap;
  snr: TopMap;
  dev: TopMap;
  tot: TopMap;
  cost: TopMap;
  i: TopMap;
  o: TopMap;
  cr: TopMap;
  cw: TopMap;
}

const rank3 = (
  ops: LiveOperator[],
  fn: (o: LiveOperator) => number,
  low = false,
): TopMap => {
  const m: TopMap = {};
  ops
    .map((o, i) => [i, fn(o)] as const)
    .sort((a, b) => (low ? a[1] - b[1] : b[1] - a[1]))
    .slice(0, 3)
    .forEach(([i], r) => (m[i] = r + 1));
  return m;
};

export const computeTT = (ops: LiveOperator[]): TopSets => ({
  yield: rank3(ops, numYield),
  lev: rank3(ops, numLev),
  vel: rank3(ops, (o) => o.vel),
  snr: rank3(ops, (o) => o.snr),
  dev: rank3(ops, (o) => o.dev),
  tot: rank3(ops, numTotal),
  cost: rank3(ops, numCost, true),
  i: rank3(ops, (o) => numvOf(o.raw.i)),
  o: rank3(ops, (o) => numvOf(o.raw.o)),
  cr: rank3(ops, (o) => numvOf(o.raw.cr)),
  cw: rank3(ops, (o) => numvOf(o.raw.cw)),
});

/** board.js `tc` — " tt1".." tt3" suffix when the row ranks top-3. */
export const tc = (m: TopMap, i: number): string => (m[i] ? ` tt${m[i]}` : "");

/* ---------- raw-volume rank (board.js rawRankOf) ---------- */
export const rawRankMap = (ops: LiveOperator[]): Record<number, number> => {
  const m: Record<number, number> = {};
  ops
    .map((o, i) => [i, numTotal(o)] as const)
    .sort((a, b) => b[1] - a[1])
    .forEach(([i], r) => (m[i] = r + 1));
  return m;
};

/* ---------- deriveMovers — verbatim from data.js ----------
   sorts the active field projection by movement_7d; `mv7: null` (no
   movement data) behaves as 0 spots gained, matching a "stayed" row. */
export interface DerivedMover {
  o: LiveOperator;
  i: number;
  mv: number;
}
export const deriveMovers = (ops: LiveOperator[]): DerivedMover[] =>
  ops
    .map((o, i) => ({ o, i, mv: o.mv7 ?? 0 }))
    .sort((a, b) => b.mv - a.mv)
    .slice(0, 5);

/* ---------- sparkline geometry (board.js spark, w/h defaults kept) ------ */
export const sparkGeom = (
  arr: number[],
  w = 56,
  h = 18,
): { points: string; up: boolean } | null => {
  if (!arr || arr.length < 2) return null; // guard: no 1-point polylines
  const mx = Math.max(...arr);
  const mn = Math.min(...arr);
  const rg = mx - mn || 1;
  const points = arr
    .map((v, i) => `${(i / (arr.length - 1)) * w},${h - 2 - ((v - mn) / rg) * (h - 4)}`)
    .join(" ");
  const up = arr[arr.length - 1] >= arr[0];
  return { points, up };
};

/* ---------- sort selectors for the SORT control (compact-number aware) --
   reference shipped the dropdown as chrome; the port wires it so sorting is
   client-side over the full supplied field. Keys use numvOf so compact
   strings ("34.2B") order numerically. */
export const SORT_KEY: Record<string, (o: LiveOperator) => number> = {
  Yield: numYield,
  Total: numTotal,
  Leverage: numLev,
  Velocity: (o) => o.vel,
  SNR: (o) => o.snr,
  "10xDEV": (o) => o.dev,
  Efficiency: (o) => numvOf(o.eff),
  "$/1M": numCost,
};
/** "$/1M" is a cost — lowest first. Everything else descends. */
export const SORT_ASC = new Set(["$/1M"]);

/* ---------- profileData adapter (board.js profileData) ----------
   idx === -1 → the canonical featured operator; otherwise the ops row. */
export interface ProfileView {
  name: string;
  handle: string;
  rank: number;
  klass: string;
  arch: string;
  y: string;
  delta: string;
  sub: string;
  series: number[];
  /** Verification status for the ✓ mark — real `verif` only ("verified" |
   *  "audited" render the mark; anything else, incl. unresolved featured
   *  profiles, renders no mark — never the reference's @-handle heuristic). */
  verif: string;
  /** underlying ops row when the profile is a real field operator. */
  op: LiveOperator | null;
}

/** The verified mark predicate — bound to operators.verification_status
 *  verbatim, so the ✓ is never unconditional (WS-4 / WS-5 contract). */
export const isVerifiedOp = (v: string | null | undefined): boolean =>
  v === "verified" || v === "audited";

export const profileFor = (
  initial: LiveBoardInitialState,
  ops: LiveOperator[],
  idx: number,
  rmax: FieldMaxima,
): ProfileView | null => {
  const fx = initial.featured;
  if (idx === -1) {
    if (!fx) return null;
    /* the featured card is the rank-1 operator; when its row is present we
       compute the radar the same way as any selected operator (fixture
       shipped a keyed series; the contract drops it — live.js emits the
       same shape via [1,1,1,1,1] for the field leader). Match by codename
       (identity, never display name); fall back to ops[0] only because
       FEATURED is definitionally the rank-1 context block — keeps the card
       drillable when the payload's codename drifts from the field row. */
    const match =
      ops.find((o) => o.codename === fx.codename) ??
      (fx.rank === 1 ? (ops[0] ?? null) : null);
    return {
      name: fx.name,
      handle: fx.handle,
      rank: fx.rank,
      klass: fx.klass,
      arch: fx.archetype,
      y: fx.yield,
      delta: fx.delta,
      sub: fx.blurb,
      series: match ? opRadar(match, rmax) : [1, 1, 1, 1, 1],
      verif: match?.verif ?? "",
      op: match,
    };
  }
  const o = ops[idx];
  if (!o) return null;
  const t = o.trend ?? [];
  const trendDelta =
    t.length >= 2
      ? `${t[t.length - 1] >= t[0] ? "+" : "−"}${Math.abs(t[t.length - 1] - t[0])} pts vs prior window`
      : "";
  return {
    name: o.codename,
    handle: o.handle,
    rank: idx + 1,
    klass: o.klass,
    arch: o.archetype,
    y: o.yield,
    delta: o.delta || trendDelta,
    sub: o.sub || `${o.archetype} signature · ${o.klass} tier · ${o.total} observed`,
    series: opRadar(o, rmax),
    verif: o.verif,
    op: o,
  };
};

/** board.js dirUp — "−" is a literal U+2212, not a hyphen. */
export const deltaUp = (delta: string): boolean => !delta.startsWith("−");

/** board.js — strip the leading +/− before rendering with the arrow glyph. */
export const deltaBody = (delta: string): string => delta.replace(/^\+|^−/, "");

/** signed movement display, e.g. "+8" / "−3" / "0" */
export const mvLabel = (mv: number | null | undefined): string =>
  mv == null ? "0" : mv > 0 ? `+${mv}` : mv < 0 ? `−${Math.abs(mv)}` : "0";
