"use client";

/**
 * LeaderboardTable — the live board (origin: Devins_Plans/_HEADER_LOCKED.html).
 *
 * Theme-reactive palette (globals.css tokens). Real engine output
 * (computeCascadeMetrics) passed in as LeaderboardEntry[]; nothing hand-seeded here.
 *
 * Finals once-over (owner 2026-06-22):
 *  - Filters (Window · Class · Platform dropdowns) top-LEFT; Metric/Raw toggle top-RIGHT.
 *  - "Rank by" pills removed — every metric header click-sorts (click again to flip ▲/▼).
 *  - Operator image slot (OperatorAvatar, upload via profile post-auth) replaces the
 *    class-color swatch; the colored class GLYPH stays next to the name.
 *  - "Class Potential" column → PLATFORM (the declared platform(s); Multi-ready).
 *  - Υ Yield text is one uniform color; top-3 per column shown via shadow boxes.
 *  - Raw view: headers click-sort too; last column is TOTAL COST ($), keeping Total (tokens).
 */

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LeaderboardEntry } from "./types";
import { glyphFor } from "@/lib/identity/canon-ids";
import {
  PLATFORM_UI,
  PLATFORM_DOMAIN_MAP,
  CLASS_FILTER,
  type PlatformUI,
} from "@/lib/constants";
import { OperatorAvatar } from "./OperatorAvatar";
import { PlatformIcon } from "./PlatformIcon";
import { track } from "@/lib/infra/posthog/events";
import { isOutlierEntry } from "@/lib/analytics/outlier-classify";

// ── Palette — THEME-REACTIVE (owner 2026-06-20). Chrome keys are theme tokens; the
// SPECIES colors stay literal (semantic identity for the class glyph, theme-invariant).
const T = {
  field: "rgb(var(--bg-surface))",
  line: "rgb(var(--bg-border))",
  ink: "rgb(var(--text-primary))",
  gold: "rgb(var(--gold))",
  mut: "rgb(var(--text-muted))",
  casc: "#8b5cf6",
  arch: "#3b82f6",
  thru: "#5b6472",
  power: "#e0a64a",
  rowLine: "rgb(var(--bg-border-subtle))",
};

// Species color — drives ONLY the class glyph next to the operator name now.
const SPECIES_SWATCH: Record<string, string> = {
  casc: T.casc,
  arch: T.arch,
  power: T.power,
  base: T.thru,
};

function speciesOf(cls: string): "casc" | "arch" | "power" | "base" {
  if (cls === "TRANSMITTER") return "casc";
  if (cls === "ARCH+" || cls === "ARCH") return "arch";
  if (cls === "POWER") return "power";
  return "base";
}

// PLATFORM (replaces the old class-potential column). Declared platform(s) per operator;
// 'multi' / multiple → "Multi" once profiles feed several. Single value today (hand-seeded).
const PLATFORM_LABEL: Record<string, string> = {
  claude: "Claude",
  chatgpt: "ChatGPT",
  gemini: "Gemini",
  pi: "Pi",
  codex: "Codex",
  devin: "Devin",
  multi: "Multi",
  other: "Other",
};
function platformLabel(e: LeaderboardEntry): string {
  const p = (e.platform ?? "").toLowerCase();
  if (!p) return "—";
  return PLATFORM_LABEL[p] ?? (e.platform as string);
}

// BOARD redesign (2026-06-27): on the operator-total board a single row stands in for
// an operator across platforms, so each row carries the distinct platform SET they
// submitted (e.platforms). The badge reads "claude·codex·multi" (compact) when more
// than one platform; for a single platform it just shows that platform's label. Empty
// on boards that don't populate the set (per-platform / "off" — the PLATFORM column is
// the source there). `platforms` is attached structurally by to-entry on this path.
type EntryWithPlatforms = LeaderboardEntry & { platforms?: string[] };

// PLATFORM column (2026-06-28): the REAL platforms an operator submitted, as a deduped
// lowercased list with 'multi' DROPPED — "multi" is a roll-up flag, not a 4th platform,
// so listing it next to the real ones (claude·codex·multi) was wasted space. Falls back
// to the single per-row platform on per-platform / "off" boards. Sorted stably.
function platformsOf(e: LeaderboardEntry): string[] {
  const set = (e as EntryWithPlatforms).platforms;
  const raw = set && set.length > 0 ? set : [e.platform ?? ""];
  const real = [...new Set(raw.map((p) => p.toLowerCase()))].filter(
    (p) => p && p !== "multi",
  );
  return real.sort((a, b) => a.localeCompare(b));
}

// Render: primary platform's logo + a small "+N" when the operator spans more (logo +N
// badge, owner 2026-06-28). One platform → just its logo. None → an em dash.
function PlatformCell({ e }: { e: LeaderboardEntry }) {
  const list = platformsOf(e);
  if (list.length === 0) return <span style={{ color: T.mut }}>—</span>;
  const [primary, ...rest] = list;
  const full = list.map((p) => PLATFORM_LABEL[p] ?? p).join(" · ");
  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: 5 }}
      title={full}
    >
      <PlatformIcon
        platform={primary}
        size={16}
        title={PLATFORM_LABEL[primary] ?? primary}
      />
      {rest.length > 0 ? (
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: T.mut,
            letterSpacing: ".02em",
          }}
        >
          +{rest.length}
        </span>
      ) : null}
    </span>
  );
}

// WINDOW chip (FIX F): on the "off" board the same operator shows once per
// (platform, window), so each row is tagged with its window to read as an
// intentional breakout, not a duplicate. Single-window boards don't render it.
const WINDOW_LABEL: Record<string, string> = {
  today: "TODAY",
  "7d": "7D",
  "30d": "30D",
  "90d": "90D",
  all_time: "ALL",
  all: "ALL",
};
function windowLabel(e: LeaderboardEntry): string {
  const w = (e.window ?? "").toLowerCase();
  if (!w) return "";
  return WINDOW_LABEL[w] ?? w.toUpperCase();
}

const fmtBig = (n: number | null | undefined): string => {
  if (n == null) return "—";
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return `${n}`;
};
const fmtY = (n: number | null | undefined): string =>
  n == null
    ? "—"
    : n >= 1000
      ? n.toLocaleString(undefined, { maximumFractionDigits: 2 })
      : n.toFixed(2);
const fmtLev = (n: number | null | undefined): string =>
  n == null
    ? "—"
    : n >= 1000
      ? `${(n / 1000).toFixed(1)}K×`
      : `${n.toFixed(1)}×`;
const ratio3 = (n: number | null | undefined): string =>
  n == null ? "—" : n.toFixed(3);
const f2 = (n: number | null | undefined): string =>
  n == null ? "—" : n.toFixed(2);
// TOTAL COST = total $ spent (costPerMillion × total/1e6). The raw view's last column.
const fmtMoney = (n: number | null | undefined): string =>
  n == null
    ? "—"
    : n >= 1e6
      ? `$${(n / 1e6).toFixed(2)}M`
      : n >= 1e3
        ? `$${(n / 1e3).toFixed(1)}K`
        : `$${n.toFixed(2)}`;

// LAST cell (2026-06-28): render the operator's snapshot_date as mm/dd/yy (owner) —
// was the literal string "active" for every row. e.lastSeen is the snapshot's
// 'YYYY-MM-DD' (or null). Returns { short, full }: "05/14/26" for the cell + a long
// date for the hover tooltip. Sliced from the ISO parts directly (no Date/timezone
// math) so the displayed day never drifts across the viewer's locale.
function fmtLast(iso: string | null | undefined): {
  short: string;
  full: string;
} {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? "");
  if (!m) return { short: "—", full: "" };
  const [, yyyy, mm, dd] = m;
  const short = `${mm}/${dd}/${yyyy.slice(2)}`;
  const full = new Date(`${iso}T12:00:00Z`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
  return { short, full };
}

// Top-3 rank accent (# column + shadow-box tint). Gold / blue / indigo.
const RANK_COLOR: Record<number, string> = {
  1: "#f5a623",
  2: "#60a5fa",
  3: "#818cf8",
};
const rankColor = (rank: number): string => RANK_COLOR[rank] ?? T.mut;
const rankWeight = (rank: number): number => (rank <= 3 ? 700 : 400);

type ViewMode = "metrics" | "raw";
type SortDir = "asc" | "desc";
type SortKey =
  | "yield"
  | "snr"
  | "velocity"
  | "leverage"
  | "dev10x"
  | "totalTokens"
  | "costPerMillion"
  | "opRatioBest"
  | "opRatioWorst"
  | "opRatioCacheHigh"
  | "opRatioCacheLow"
  | "opRatioOutputHigh"
  | "opRatioOutputLow"
  | "efficiency"
  | "input"
  | "output"
  | "cacheWrite"
  | "cacheRead"
  | "rawTotal"
  | "totalCost";

// Raw-pillars total = the four integers summed (independent of the cascade).
const rawTotal = (e: LeaderboardEntry): number =>
  (e.input ?? 0) + (e.output ?? 0) + (e.cacheWrite ?? 0) + (e.cacheRead ?? 0);
const totalCostOf = (e: LeaderboardEntry): number | null =>
  e.costPerMillion == null ? null : e.costPerMillion * (rawTotal(e) / 1e6);

const sortVal = (e: LeaderboardEntry, k: SortKey): number => {
  switch (k) {
    case "yield":
      return e.yield_ ?? -Infinity;
    case "snr":
      return e.snr ?? -Infinity;
    case "velocity":
      return e.velocity ?? -Infinity;
    case "leverage":
      return e.leverage ?? -Infinity;
    case "dev10x":
      return e.dev10x ?? -Infinity;
    case "totalTokens":
      return e.totalTokens ?? -Infinity;
    case "costPerMillion":
      return e.costPerMillion ?? -Infinity;
    case "efficiency":
      return e.efficiency ?? -Infinity;
    // Op Ratio = leverage:1:velocity → rank by the lead term (leverage).
    case "opRatioBest":
    case "opRatioWorst":
    case "opRatioCacheHigh":
    case "opRatioCacheLow":
      return e.leverage ?? -Infinity;
    case "opRatioOutputHigh":
    case "opRatioOutputLow":
      return e.velocity ?? -Infinity;
    case "input":
      return e.input ?? -Infinity;
    case "output":
      return e.output ?? -Infinity;
    case "cacheWrite":
      return e.cacheWrite ?? -Infinity;
    case "cacheRead":
      return e.cacheRead ?? -Infinity;
    case "rawTotal":
      return rawTotal(e);
    case "totalCost":
      return totalCostOf(e) ?? -Infinity;
    default:
      return -Infinity;
  }
};

// $/1M is the one "lower is better" metric (cheapest = best) for default sort direction.
const LOWER_IS_BETTER = new Set<string>(["costPerMillion"]);

// LB-6: top-1/2/3 distinct values per column → podium place (1/2/3), for shadow-box shading.
function topThreeByColumn(
  list: LeaderboardEntry[],
  pick: (e: LeaderboardEntry) => number | null | undefined,
  lowerIsBetter: boolean,
): Map<number, number> {
  const vals = list
    .map(pick)
    .filter((v): v is number => v != null && isFinite(v));
  const distinct = Array.from(new Set(vals)).sort((a, b) =>
    lowerIsBetter ? a - b : b - a,
  );
  const place = new Map<number, number>();
  distinct.slice(0, 3).forEach((v, i) => place.set(v, i + 1));
  return place;
}

// Window dropdown — "off" (filter off: one row/operator, no window) then All time · 90 · 30 · 7,
// driving the /board/[window] route. Owner 2026-06-25: the "everything" firehose was removed.
const WINDOW_OPTS = [
  { value: "off", label: "off" },
  { value: "all", label: "All time" },
  { value: "90d", label: "90 day" },
  { value: "30d", label: "30 day" },
  { value: "7d", label: "7 day" },
];

/** One uniform labeled dropdown (Window/Class/Platform) — same size, top-left of the board. */
function Field({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label style={st.fieldCol}>
      <span style={st.flab}>{label}</span>
      <select
        aria-label={`${label} filter`}
        value={value}
        onChange={onChange}
        style={st.sel}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

interface Props {
  entries: LeaderboardEntry[];
  totalUsers?: number;
  window?: string;
  /** Initial Platform filter (BOARD redesign 2026-06-27) — reflects the ?platform=
   *  URL param; the dropdown drives the URL (server re-queries). Default 'All'. */
  platform?: PlatformUI;
  /** Board breakdown mode (BOARD redesign 2026-06-27): 'total' = one operator-total
   *  row (default), 'platforms' = the per-platform breakdown (?view=platforms). The
   *  "by platform" toggle drives the URL. Off boards ignore it. */
  view?: "total" | "platforms";
}

export function LeaderboardTable({
  entries,
  totalUsers,
  window: win = "30d",
  platform: platformProp = "All",
  view: breakdownProp = "total",
}: Props) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("metrics");
  const [sort, setSort] = useState<SortKey>("yield");
  const [dir, setDir] = useState<SortDir>("desc");
  // Platform filter is URL-DRIVEN on windowed boards (server re-queries with ?platform=)
  // so the operator-total board can filter to a single platform's snapshots. Seeded from
  // the prop (the URL's value); changing it pushes a new URL rather than filtering in JS.
  const [platform, setPlatform] = useState<PlatformUI>(platformProp);
  const [classFilter, setClassFilter] = useState<string>("all");
  // Category filter (owner 2026-07-14): default = "human" (Human Center of Mass only).
  // "outliers" adds outliers & bots (input/total < 0.1% or > 80%) — one category.
  // "all" shows everything unfiltered.
  const [categoryFilter, setCategoryFilter] = useState<string>("human");
  // Search filter (owner 2026-07-14): client-side text search across anonId (display
  // name), codename, and subLabel (@handle). Filters the visible rows in real time.
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [page, setPage] = useState(0); // 0-based; 25 rows/page (owner 2026-06-24)
  // OP RATIO dropdown (multi-sort): the column header opens a menu of 6 sort
  // options instead of the simple click-to-sort every other column uses.
  const [opRatioOpen, setOpRatioOpen] = useState(false);

  // board_viewed funnel event (no-ops without the PostHog key). Fires on mount and
  // when the window/platform/breakdown changes; URL-driven boards remount so it stays fresh.
  React.useEffect(() => {
    track.boardViewed(win, {
      platform,
      view: breakdownProp,
      total: totalUsers,
    });
  }, [win, platform, breakdownProp, totalUsers]);

  // FIX F: the "off" board mixes windows (per-(operator, platform, window) rows), so it
  // labels each row with its window. Single-window boards don't (the window is the board).
  const showWindow = win === "off";
  const winChip = (e: LeaderboardEntry) =>
    showWindow && windowLabel(e) ? (
      <span
        style={{
          marginLeft: 6,
          padding: "0 5px",
          borderRadius: 4,
          background: "rgb(var(--bg-elevated))",
          border: `1px solid ${T.line}`,
          color: T.mut,
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "0.04em",
          verticalAlign: "middle",
          whiteSpace: "nowrap",
        }}
        title={`${e.window} window`}
      >
        {windowLabel(e)}
      </span>
    ) : null;

  const isActive = (col: SortKey) => sort === col;

  // OP RATIO multi-sort: any of the 6 op-ratio sort keys counts as "active" for
  // the column header highlight. The dropdown drives sort/dir directly (no toggle).
  const OP_RATIO_KEYS: SortKey[] = [
    "opRatioBest",
    "opRatioWorst",
    "opRatioCacheHigh",
    "opRatioCacheLow",
    "opRatioOutputHigh",
    "opRatioOutputLow",
  ];
  const isOpRatioActive = () => OP_RATIO_KEYS.includes(sort);

  // Close the OP RATIO dropdown on click-outside (no portal — simple backdrop).
  React.useEffect(() => {
    if (!opRatioOpen) return;
    const onDocClick = () => setOpRatioOpen(false);
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [opRatioOpen]);

  // Selecting an op-ratio option sets both sort + dir, then closes the menu.
  const onOpRatioSelect = (key: SortKey, nextDir: SortDir) => {
    setSort(key);
    setDir(nextDir);
    setOpRatioOpen(false);
  };

  // Click a header → sort by it; click the active column → flip direction. Default
  // direction is the metric's "best-first" ($/1M asc, all else desc). The # column
  // shows the position within the active sort — switching metrics renumbers rows.
  const onSortColumn = (col: SortKey) => {
    if (col === sort) setDir((d) => (d === "desc" ? "asc" : "desc"));
    else {
      setSort(col);
      setDir(LOWER_IS_BETTER.has(col) ? "asc" : "desc");
    }
  };

  // Switch view → reset sort to that view's natural default.
  const switchView = (v: ViewMode) => {
    setView(v);
    setSort(v === "raw" ? "rawTotal" : "yield");
    setDir("desc");
  };

  // URL-driven board controls (BOARD redesign 2026-06-27). The Window slug, the
  // ?platform= filter, and the ?view=platforms breakdown all live in the URL so the
  // SERVER re-queries the right rows (the operator-total board's platform filter can't
  // be done client-side — its rows are 'multi' roll-ups, not per-platform). buildBoardUrl
  // composes the next URL from the current board slug + the next platform/view, dropping
  // params at their defaults so clean states stay clean. The "off" board keeps its
  // pre-existing client-side platform filter (it ships every row, no server re-query).
  const isOff = win === "off";
  const buildBoardUrl = (
    nextWin: string,
    nextPlatform: PlatformUI,
    nextView: "total" | "platforms",
  ) => {
    const sp = new URLSearchParams();
    const domain = PLATFORM_DOMAIN_MAP[nextPlatform];
    if (domain) sp.set("platform", domain);
    if (nextView === "platforms") sp.set("view", "platforms");
    const qs = sp.toString();
    const base = `/board/${nextWin}`;
    return qs ? `${base}?${qs}` : base;
  };

  const onWindow = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nextWin = e.target.value;
    // Off board has no platform/view breakdown — go clean. Else preserve them.
    if (nextWin === "off") router.push("/board/off");
    else router.push(buildBoardUrl(nextWin, platform, breakdownProp));
  };

  // Platform dropdown: off board → client-side filter (setState); windowed boards →
  // drive the URL so the server returns that platform's rows (operator-total path).
  const onPlatform = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as PlatformUI;
    setPlatform(next);
    if (!isOff) router.push(buildBoardUrl(win, next, breakdownProp));
  };

  // "By platform" breakdown toggle (windowed boards only): flips ?view=platforms.
  const onBreakdownToggle = (next: "total" | "platforms") => {
    if (isOff || next === breakdownProp) return;
    router.push(buildBoardUrl(win, platform, next));
  };

  // Shared filter — class tier (always client-side) + platform + category. The platform
  // filter is applied IN JS only on the "off" board (which ships every row); on windowed
  // boards the server already returned the selected platform's rows (URL-driven), so
  // re-filtering in JS would wrongly hide the operator-total 'multi' roll-up rows.
  // Category filter (owner 2026-07-14): defaults to "human" (Human Center of Mass) —
  // excludes outliers (input/total < 0.1%) and bots (input/total > 80%).
  const filtered = useMemo(() => {
    const domain = PLATFORM_DOMAIN_MAP[platform]; // null = All
    const sq = searchQuery.trim().toLowerCase();
    return entries.filter((e) => {
      if (isOff && domain && (e.platform ?? "other") !== domain) return false;
      if (classFilter !== "all" && e.signalClass.toLowerCase() !== classFilter)
        return false;
      // Category filter: Human Center of Mass / + Outliers & Bots / All
      if (categoryFilter === "human") {
        if (isOutlierEntry(e)) return false;
      }
      // Search filter: match against display name, codename, or @handle.
      if (sq) {
        const haystack = [
          e.anonId,
          e.codename,
          e.subLabel ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(sq)) return false;
      }
      return true;
    });
  }, [entries, platform, classFilter, categoryFilter, isOff, searchQuery]);

  // One sort pipeline for both views (raw default = rawTotal). Nulls fall to the bottom.
  const sorted = useMemo(() => {
    const cmp = (a: LeaderboardEntry, b: LeaderboardEntry) => {
      const av = sortVal(a, sort),
        bv = sortVal(b, sort);
      return dir === "desc" ? bv - av : av - bv;
    };
    return [...filtered].sort(cmp);
  }, [filtered, sort, dir]);

  // Dual-rank # column (owner 2026-07-14): show the current sort rank AND the
  // "other" board's default rank so a reader sees both positions at once.
  // Metrics board: primary = current sort rank, secondary = volume rank (by
  // totalTokens). Raw board: primary = current sort rank, secondary = yield
  // rank (by Υ). Both computed over the filtered set so they track the active
  // class/platform/category filters.
  const yieldRankMap = useMemo(() => {
    const order = [...filtered].sort(
      (a, b) => (b.yield_ ?? -Infinity) - (a.yield_ ?? -Infinity),
    );
    const m = new Map<LeaderboardEntry, number>();
    order.forEach((e, i) => m.set(e, i + 1));
    return m;
  }, [filtered]);

  const volumeRankMap = useMemo(() => {
    const order = [...filtered].sort(
      (a, b) => (b.totalTokens ?? -Infinity) - (a.totalTokens ?? -Infinity),
    );
    const m = new Map<LeaderboardEntry, number>();
    order.forEach((e, i) => m.set(e, i + 1));
    return m;
  }, [filtered]);

  // Short label for the current sort key, used in the # header so the reader
  // knows which metric the primary rank reflects. Y/V on metrics, V/Y on raw.
  const sortLabel = (k: SortKey): string => {
    switch (k) {
      case "yield":
        return "Y";
      case "snr":
        return "S";
      case "velocity":
        return "VEL";
      case "leverage":
        return "L";
      case "dev10x":
        return "D";
      case "efficiency":
        return "E";
      case "costPerMillion":
        return "$";
      case "totalTokens":
      case "rawTotal":
        return "V";
      case "input":
        return "IN";
      case "output":
        return "OUT";
      case "cacheWrite":
        return "CW";
      case "cacheRead":
        return "CR";
      case "totalCost":
        return "$";
      default:
        return "#";
    }
  };

  // Pagination — 25 rows/page (owner 2026-06-24). Page resets to 0 on any sort/filter
  // change so you never land on an out-of-range page. `rows` is the current page slice;
  // the # column shows the position within the active sort (renumbers on sort change).
  const PER_PAGE = 25;
  const pageCount = Math.max(1, Math.ceil(sorted.length / PER_PAGE));
  React.useEffect(() => {
    setPage(0);
  }, [sort, dir, platform, classFilter, categoryFilter, view, searchQuery]);
  const safePage = Math.min(page, pageCount - 1);
  const rows = useMemo(
    () => sorted.slice(safePage * PER_PAGE, safePage * PER_PAGE + PER_PAGE),
    [sorted, safePage],
  );

  // Per-column top-3 value sets over the FILTERED list (shading tracks the filter).
  const top3 = useMemo(
    () => ({
      totalTokens: topThreeByColumn(filtered, (e) => e.totalTokens, false),
      yield: topThreeByColumn(filtered, (e) => e.yield_, false),
      snr: topThreeByColumn(filtered, (e) => e.snr, false),
      velocity: topThreeByColumn(filtered, (e) => e.velocity, false),
      leverage: topThreeByColumn(filtered, (e) => e.leverage, false),
      dev10x: topThreeByColumn(filtered, (e) => e.dev10x, false),
      efficiency: topThreeByColumn(filtered, (e) => e.efficiency, false),
      costPerMillion: topThreeByColumn(filtered, (e) => e.costPerMillion, true),
      rawTotal: topThreeByColumn(filtered, (e) => rawTotal(e), false),
      input: topThreeByColumn(filtered, (e) => e.input, false),
      output: topThreeByColumn(filtered, (e) => e.output, false),
      cacheWrite: topThreeByColumn(filtered, (e) => e.cacheWrite, false),
      cacheRead: topThreeByColumn(filtered, (e) => e.cacheRead, false),
    }),
    [filtered],
  );

  const caret = (col: SortKey) =>
    sort === col ? (dir === "desc" ? " ▼" : " ▲") : "";

  // Top-3 SHADOW BOX: a rank-tinted background + inset ring, so the best numbers in each
  // column read as little shadowed boxes after any sort/filter (owner: top-3 indication).
  const podiumBox = (
    m: Map<number, number>,
    v: number | null | undefined,
  ): React.CSSProperties => {
    if (v == null) return {};
    const place = m.get(v);
    if (!place) return {};
    const col = RANK_COLOR[place];
    return {
      background: `${col}1f`,
      boxShadow: `inset 0 0 0 1px ${col}66`,
      borderRadius: 5,
    };
  };

  return (
    <div style={st.wrap}>
      <div style={st.field}>
        {/* Filters (Window · Class · Platform) top-LEFT; Metric/Raw toggle top-RIGHT. */}
        <div style={st.headRow}>
          <div style={st.filters}>
            <Field
              label="Window"
              value={win}
              onChange={onWindow}
              options={WINDOW_OPTS}
            />
            <Field
              label="Class"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              options={CLASS_FILTER.map((c) => ({
                value: c.id,
                label: c.label,
              }))}
            />
            {/* Category filter (owner 2026-07-14): Human Center of Mass by default.
                Toggle to add outliers & bots (one category). */}
            <div style={st.fieldCol}>
              <span style={st.flab}>Category</span>
              <div style={st.toggleRow}>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("human")}
                  style={{
                    ...st.modeBtn,
                    ...(categoryFilter === "human" ? st.modeOn : null),
                  }}
                >
                  Human
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("outliers")}
                  style={{
                    ...st.modeBtn,
                    ...(categoryFilter === "outliers" ? st.modeOn : null),
                  }}
                >
                  + Outliers & Bots
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter("all")}
                  style={{
                    ...st.modeBtn,
                    ...(categoryFilter === "all" ? st.modeOn : null),
                  }}
                >
                  All
                </button>
              </div>
            </div>
            {/* Platform: URL-driven on windowed boards (server returns that platform's rows),
                client-side on the "off" board. (BOARD redesign 2026-06-27.) */}
            <Field
              label="Platform"
              value={platform}
              onChange={onPlatform}
              options={PLATFORM_UI.map((p) => ({ value: p, label: p }))}
            />
            {/* Search — filter by operator name, codename, or @handle. */}
            <label style={st.fieldCol}>
              <span style={st.flab}>Search</span>
              <input
                type="text"
                aria-label="Search operators"
                placeholder="name or @handle…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={st.searchInput}
              />
            </label>
            {/* "By platform" breakdown toggle — windowed boards only. Default = one
                operator-total row; "By platform" = one row per (operator, platform). */}
            {!isOff ? (
              <div style={st.fieldCol}>
                <span style={st.flab}>Breakdown</span>
                <div style={st.toggleRow}>
                  <button
                    type="button"
                    onClick={() => onBreakdownToggle("total")}
                    style={{
                      ...st.modeBtn,
                      ...(breakdownProp === "total" ? st.modeOn : null),
                    }}
                  >
                    Total
                  </button>
                  <button
                    type="button"
                    onClick={() => onBreakdownToggle("platforms")}
                    style={{
                      ...st.modeBtn,
                      ...(breakdownProp === "platforms" ? st.modeOn : null),
                    }}
                  >
                    By platform
                  </button>
                </div>
              </div>
            ) : null}
          </div>
          <div style={st.toggleRow}>
            <button
              onClick={() => switchView("metrics")}
              style={{
                ...st.modeBtn,
                ...(view === "metrics" ? st.modeOn : null),
              }}
            >
              Metrics · the cascade
            </button>
            <button
              onClick={() => switchView("raw")}
              style={{ ...st.modeBtn, ...(view === "raw" ? st.modeOn : null) }}
            >
              Raw · the fuel
            </button>
          </div>
        </div>

        {/* Mobile: condensed card list (below md). */}
        <ul className="flex flex-col gap-1.5 md:hidden">
          {rows.map((e, i) => {
            const sp = speciesOf(e.signalClass);
            const displayRank = searchQuery
              ? e.rank
              : safePage * PER_PAGE + i + 1;
            const otherRank =
              view === "raw" ? yieldRankMap.get(e) : volumeRankMap.get(e);
            const yld =
              e.yield_ == null
                ? "—"
                : e.yield_ >= 1000
                  ? `${(e.yield_ / 1000).toFixed(1)}K`
                  : e.yield_.toFixed(0);
            return (
              <li key={`m-${e.anonId}-${i}`}>
                {e.status === "retired" ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 12px",
                      borderRadius: 8,
                      background: T.field,
                      border: `1px solid ${T.rowLine}`,
                    }}
                  >
                    <span style={{ width: 22, color: rankColor(displayRank), fontWeight: rankWeight(displayRank), fontSize: 12, fontVariantNumeric: "tabular-nums" }}>{displayRank}</span>
                    <OperatorAvatar alt={e.anonId} size={26} />
                    <span style={{ minWidth: 0, flex: 1, display: "flex", flexDirection: "column" }}>
                      <span style={{ color: T.ink, fontSize: 13, fontWeight: 600, fontStyle: e.isSeed ? "italic" : "normal", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        <span aria-hidden style={{ color: SPECIES_SWATCH[sp] ?? T.thru, marginRight: 5, fontStyle: "normal" }} title={e.signalClass}>{glyphFor(e.signalClass)}</span>
                        {e.anonId}
                      </span>
                      <span style={{ color: T.mut, fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{e.subLabel ?? platformLabel(e)}</span>
                    </span>
                    <span style={{ textAlign: "right", flexShrink: 0 }}>
                      <span style={{ display: "block", color: T.ink, fontSize: 14, fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{view === "raw" ? `∑ ${fmtBig(rawTotal(e))}` : `Υ ${yld}`}</span>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 2, padding: "2px 6px", borderRadius: 4, background: "rgb(var(--bg-elevated))", border: `1px solid ${T.line}`, color: T.mut }}>
                        <PlatformCell e={e} />
                      </span>
                    </span>
                  </div>
                ) : (
                <Link
                  href={`/user/${encodeURIComponent(e.codename)}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: T.field,
                    border: `1px solid ${T.rowLine}`,
                    textDecoration: "none",
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      color: rankColor(displayRank),
                      fontWeight: rankWeight(displayRank),
                      fontSize: 12,
                      fontVariantNumeric: "tabular-nums",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      lineHeight: 1.1,
                    }}
                  >
                    {displayRank}
                    {otherRank != null && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 400,
                          color: T.mut,
                        }}
                      >
                        /{otherRank}
                      </span>
                    )}
                  </span>
                  <OperatorAvatar alt={e.anonId} size={26} />
                  <span
                    style={{
                      minWidth: 0,
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <span
                      style={{
                        color: T.ink,
                        fontSize: 13,
                        fontWeight: 600,
                        fontStyle: e.isSeed ? "italic" : "normal",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      <span
                        aria-hidden
                        style={{
                          color: SPECIES_SWATCH[sp] ?? T.thru,
                          marginRight: 5,
                          fontStyle: "normal",
                        }}
                        title={e.signalClass}
                      >
                        {glyphFor(e.signalClass)}
                      </span>
                      {e.anonId}
                      {winChip(e)}
                    </span>
                    <span
                      style={{
                        color: T.mut,
                        fontSize: 11,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {e.subLabel ?? platformLabel(e)}
                    </span>
                  </span>
                  <span style={{ textAlign: "right", flexShrink: 0 }}>
                    <span
                      style={{
                        display: "block",
                        color: T.ink,
                        fontSize: 14,
                        fontWeight: 700,
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {view === "raw" ? `∑ ${fmtBig(rawTotal(e))}` : `Υ ${yld}`}
                    </span>
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        marginTop: 2,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "rgb(var(--bg-elevated))",
                        border: `1px solid ${T.line}`,
                        color: T.mut,
                      }}
                    >
                      <PlatformCell e={e} />
                    </span>
                  </span>
                </Link>
                )}
              </li>
            );
          })}
        </ul>

        {/* Desktop (md+). */}
        <div style={{ overflowX: "auto" }} className="hidden md:block">
          {view === "metrics" ? (
            <table style={st.table}>
              <thead>
                <tr>
                  <th colSpan={3} style={st.grp}>
                    IDENTITY &amp; SCALE
                  </th>
                  <th
                    colSpan={5}
                    style={{ ...st.grp, ...st.gdiv, color: T.gold }}
                  >
                    CASCADE YIELD
                  </th>
                  <th colSpan={3} style={{ ...st.grp, ...st.gdiv }}>
                    COMPOSITION &amp; COST
                  </th>
                  <th colSpan={2} style={{ ...st.grp, ...st.gdiv }}>
                    ACTIVITY
                  </th>
                </tr>
                <tr>
                  <th
                    style={{
                      ...st.col,
                      ...st.colR,
                      ...st.stickyRankHead,
                      width: 30,
                    }}
                  >
                    {sortLabel(sort)}/V
                  </th>
                  <th style={{ ...st.col, ...st.colL, ...st.stickyOpHead }}>
                    OPERATOR
                  </th>
                  <th
                    onClick={() => onSortColumn("totalTokens")}
                    style={{
                      ...st.col,
                      ...st.colR,
                      ...st.colSort,
                      ...(isActive("totalTokens") ? st.colActive : null),
                    }}
                    title="Sort by Total"
                  >
                    <span style={st.ic}>∑</span>TOTAL{caret("totalTokens")}
                  </th>
                  <th
                    onClick={() => onSortColumn("yield")}
                    style={{
                      ...st.col,
                      ...st.colR,
                      ...st.gdiv,
                      ...st.colSort,
                      ...(isActive("yield") ? st.colActive : null),
                    }}
                    title="Sort by Υ Yield"
                  >
                    <span style={st.ic}>Υ</span>YIELD{caret("yield")}
                  </th>
                  <th
                    onClick={() => onSortColumn("snr")}
                    style={{
                      ...st.col,
                      ...st.colR,
                      ...st.colSort,
                      ...(isActive("snr") ? st.colActive : null),
                    }}
                    title="Sort by SNR"
                  >
                    <span style={st.ic}>▲</span>SNR{caret("snr")}
                  </th>
                  <th
                    onClick={() => onSortColumn("velocity")}
                    style={{
                      ...st.col,
                      ...st.colR,
                      ...st.colSort,
                      ...(isActive("velocity") ? st.colActive : null),
                    }}
                    title="Sort by Velocity"
                  >
                    <span style={st.ic}>⚡</span>VEL{caret("velocity")}
                  </th>
                  <th
                    onClick={() => onSortColumn("leverage")}
                    style={{
                      ...st.col,
                      ...st.colR,
                      ...st.colSort,
                      ...(isActive("leverage") ? st.colActive : null),
                    }}
                    title="Sort by Leverage"
                  >
                    <span style={st.ic}>⚙</span>LEV{caret("leverage")}
                  </th>
                  <th
                    onClick={() => onSortColumn("dev10x")}
                    style={{
                      ...st.col,
                      ...st.colR,
                      ...st.colSort,
                      ...(isActive("dev10x") ? st.colActive : null),
                    }}
                    title="Sort by 10xDEV"
                  >
                    <span style={st.ic}>✧</span>10xDEV{caret("dev10x")}
                  </th>
                  <th
                    style={{
                      ...st.col,
                      ...st.colR,
                      ...st.gdiv,
                      ...st.colSort,
                      ...(isOpRatioActive() ? st.colActive : null),
                      position: "relative" as const,
                    }}
                    title="Sort by Op Ratio (c:i:o)"
                  >
                    <span
                      style={{
                        ...st.ic,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                      }}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        setOpRatioOpen((o) => !o);
                      }}
                    >
                      <span style={st.ic}>⋮</span>
                      OP RATIO
                      {isOpRatioActive() ? (
                        <span
                          style={{
                            marginLeft: 4,
                            color: T.gold,
                            fontSize: 9,
                          }}
                        >
                          ●
                        </span>
                      ) : null}
                      <span style={{ marginLeft: 3 }}>▾</span>
                    </span>
                    {opRatioOpen ? (
                      <div
                        onClick={(ev) => ev.stopPropagation()}
                        style={{
                          position: "absolute" as const,
                          top: "100%",
                          right: 0,
                          zIndex: 20,
                          marginTop: 4,
                          minWidth: 220,
                          background: "rgb(var(--bg-elevated))",
                          border: `1px solid ${T.line}`,
                          borderRadius: 8,
                          boxShadow: "0 8px 24px rgba(0,0,0,0.45)",
                          padding: 4,
                          textAlign: "left",
                          textTransform: "none",
                          letterSpacing: 0,
                          fontSize: 12,
                          color: T.ink,
                          fontWeight: 400,
                        }}
                      >
                        {(
                          [
                            {
                              key: "opRatioBest",
                              dir: "desc" as SortDir,
                              label: "Best ratio overall",
                            },
                            {
                              key: "opRatioWorst",
                              dir: "asc" as SortDir,
                              label: "Worst ratio overall",
                            },
                            {
                              key: "opRatioCacheHigh",
                              dir: "desc" as SortDir,
                              label: "↑Cache c:i:o — highest cache",
                            },
                            {
                              key: "opRatioCacheLow",
                              dir: "asc" as SortDir,
                              label: "↓Cache c:i:o — lowest cache",
                            },
                            {
                              key: "opRatioOutputHigh",
                              dir: "desc" as SortDir,
                              label: "c:i:o ↑Output — highest output",
                            },
                            {
                              key: "opRatioOutputLow",
                              dir: "asc" as SortDir,
                              label: "c:i:o ↓Output — lowest output",
                            },
                          ] as const
                        ).map((opt) => {
                          const activeOpt =
                            sort === opt.key && dir === opt.dir;
                          return (
                            <button
                              key={opt.key}
                              type="button"
                              onClick={() =>
                                onOpRatioSelect(opt.key, opt.dir)
                              }
                              style={{
                                display: "block",
                                width: "100%",
                                background: activeOpt
                                  ? "rgb(var(--gold) / 0.16)"
                                  : "transparent",
                                border: "none",
                                color: activeOpt ? T.gold : T.ink,
                                padding: "7px 10px",
                                borderRadius: 6,
                                fontSize: 12,
                                fontWeight: activeOpt ? 700 : 400,
                                cursor: "pointer",
                                fontFamily: "inherit",
                                textAlign: "left",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {opt.label}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </th>
                  <th
                    onClick={() => onSortColumn("efficiency")}
                    style={{
                      ...st.col,
                      ...st.colR,
                      ...st.colSort,
                      ...(isActive("efficiency") ? st.colActive : null),
                    }}
                    title="Sort by Efficiency"
                  >
                    <span style={st.ic}>◌</span>EFF{caret("efficiency")}
                  </th>
                  <th
                    onClick={() => onSortColumn("costPerMillion")}
                    style={{
                      ...st.col,
                      ...st.colR,
                      ...st.colSort,
                      ...(isActive("costPerMillion") ? st.colActive : null),
                    }}
                    title="Sort by $/1M (lower is better)"
                  >
                    <span style={st.ic}>$</span>/1M{caret("costPerMillion")}
                  </th>
                  <th style={{ ...st.col, ...st.colL, ...st.gdiv }}>
                    PLATFORM
                  </th>
                  <th style={{ ...st.col, ...st.colR }}>LAST</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e, i) => {
                  const sp = speciesOf(e.signalClass);
                  const displayRank = searchQuery
                    ? e.rank
                    : safePage * PER_PAGE + i + 1;
                  const volRank = volumeRankMap.get(e);
                  return (
                    <tr key={`${e.anonId}-${i}`}>
                      <td
                        style={{
                          ...st.td,
                          ...st.tdR,
                          ...st.stickyRank,
                          color: rankColor(displayRank),
                          fontWeight: rankWeight(displayRank),
                        }}
                      >
                        {displayRank}
                        {volRank != null && (
                          <span
                            style={{
                              display: "block",
                              fontSize: 9,
                              fontWeight: 400,
                              color: T.mut,
                              lineHeight: 1.1,
                            }}
                          >
                            /{volRank}
                          </span>
                        )}
                        {e.percentile != null && e.percentile > 0 && (
                          <span
                            style={{
                              display: "block",
                              fontSize: 9,
                              fontWeight: 400,
                              color: T.mut,
                              lineHeight: 1.1,
                            }}
                          >
                            p{e.percentile.toFixed(0)}
                          </span>
                        )}
                      </td>
                      <td style={{ ...st.td, ...st.tdL, ...st.stickyOp }}>
                        <span style={st.op}>
                          <OperatorAvatar alt={e.anonId} />
                          {e.status === "retired" ? (
                            <span style={st.opLink}>
                              <span style={{ ...st.opName, fontStyle: e.isSeed ? "italic" : "normal" }}>
                                <span aria-hidden style={{ color: SPECIES_SWATCH[sp] ?? T.thru, marginRight: 5, fontStyle: "normal" }} title={e.signalClass}>{glyphFor(e.signalClass)}</span>
                                {e.anonId}
                              </span>
                              {e.subLabel || e.location ? (
                                <span style={st.opSub}>
                                  {e.subLabel}
                                  {e.location ? <span style={{ color: T.mut }}>{e.subLabel ? "  ·  " : ""}◍ {e.location}</span> : null}
                                </span>
                              ) : null}
                            </span>
                          ) : (
                          <Link
                            href={`/user/${encodeURIComponent(e.codename)}`}
                            style={st.opLink}
                          >
                            <span
                              style={{
                                ...st.opName,
                                fontStyle: e.isSeed ? "italic" : "normal",
                              }}
                            >
                              <span
                                aria-hidden
                                style={{
                                  color: SPECIES_SWATCH[sp] ?? T.thru,
                                  marginRight: 5,
                                  fontStyle: "normal",
                                }}
                                title={e.signalClass}
                              >
                                {glyphFor(e.signalClass)}
                              </span>
                              {e.anonId}
                              {winChip(e)}
                            </span>
                            {e.subLabel || e.location ? (
                              <span style={st.opSub}>
                                {e.subLabel}
                                {e.location ? (
                                  <span style={{ color: T.mut }}>
                                    {e.subLabel ? "  ·  " : ""}◍ {e.location}
                                  </span>
                                ) : null}
                              </span>
                            ) : null}
                          </Link>
                          )}
                        </span>
                      </td>
                      <td
                        style={{
                          ...st.td,
                          ...st.tdR,
                          fontWeight: 700,
                          ...podiumBox(top3.totalTokens, e.totalTokens),
                        }}
                      >
                        {fmtBig(e.totalTokens)}
                      </td>
                      <td
                        style={{
                          ...st.td,
                          ...st.tdR,
                          ...st.gdiv,
                          color: T.ink,
                          fontWeight: 700,
                          ...podiumBox(top3.yield, e.yield_),
                        }}
                      >
                        {fmtY(e.yield_)}
                      </td>
                      <td
                        style={{
                          ...st.td,
                          ...st.tdR,
                          ...podiumBox(top3.snr, e.snr),
                        }}
                      >
                        {ratio3(e.snr)}
                      </td>
                      <td
                        style={{
                          ...st.td,
                          ...st.tdR,
                          ...podiumBox(top3.velocity, e.velocity),
                        }}
                      >
                        {f2(e.velocity)}
                      </td>
                      <td
                        style={{
                          ...st.td,
                          ...st.tdR,
                          ...podiumBox(top3.leverage, e.leverage),
                        }}
                      >
                        {fmtLev(e.leverage)}
                      </td>
                      <td
                        style={{
                          ...st.td,
                          ...st.tdR,
                          ...podiumBox(top3.dev10x, e.dev10x),
                        }}
                      >
                        {e.dev10x == null ? "—" : e.dev10x.toFixed(2)}
                      </td>
                      <td
                        style={{
                          ...st.td,
                          ...st.tdR,
                          ...st.gdiv,
                          fontSize: 11,
                          color: T.mut,
                        }}
                      >
                        {e.opRatio ?? "—"}
                      </td>
                      <td
                        style={{
                          ...st.td,
                          ...st.tdR,
                          ...podiumBox(top3.efficiency, e.efficiency),
                        }}
                      >
                        {f2(e.efficiency)}
                      </td>
                      <td
                        style={{
                          ...st.td,
                          ...st.tdR,
                          ...podiumBox(top3.costPerMillion, e.costPerMillion),
                        }}
                      >
                        {e.costPerMillion == null
                          ? "—"
                          : `$${e.costPerMillion.toFixed(2)}`}
                      </td>
                      <td
                        style={{
                          ...st.td,
                          ...st.tdL,
                          ...st.gdiv,
                          color: T.ink,
                        }}
                      >
                        <PlatformCell e={e} />
                      </td>
                      <td
                        style={{ ...st.td, ...st.tdR, color: T.mut }}
                        title={fmtLast(e.lastSeen).full || undefined}
                      >
                        {fmtLast(e.lastSeen).short}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table style={st.table}>
              <thead>
                <tr>
                  <th colSpan={2} style={st.grp}>
                    OPERATOR
                  </th>
                  <th
                    colSpan={5}
                    style={{ ...st.grp, ...st.gdiv, color: T.gold }}
                  >
                    RAW TOKEN PILLARS
                  </th>
                  <th colSpan={1} style={{ ...st.grp, ...st.gdiv }}>
                    COST
                  </th>
                </tr>
                <tr>
                  <th
                    style={{
                      ...st.col,
                      ...st.colR,
                      ...st.stickyRankHead,
                      width: 30,
                    }}
                  >
                    {sortLabel(sort)}/Y
                  </th>
                  <th style={{ ...st.col, ...st.colL, ...st.stickyOpHead }}>
                    OPERATOR
                  </th>
                  <th
                    onClick={() => onSortColumn("input")}
                    style={{
                      ...st.col,
                      ...st.colR,
                      ...st.gdiv,
                      ...st.colSort,
                      ...(isActive("input") ? st.colActive : null),
                    }}
                    title="Sort by Input"
                  >
                    <span style={st.ic}>→</span>INPUT{caret("input")}
                  </th>
                  <th
                    onClick={() => onSortColumn("output")}
                    style={{
                      ...st.col,
                      ...st.colR,
                      ...st.colSort,
                      ...(isActive("output") ? st.colActive : null),
                    }}
                    title="Sort by Output"
                  >
                    <span style={st.ic}>←</span>OUTPUT{caret("output")}
                  </th>
                  <th
                    onClick={() => onSortColumn("cacheWrite")}
                    style={{
                      ...st.col,
                      ...st.colR,
                      ...st.colSort,
                      ...(isActive("cacheWrite") ? st.colActive : null),
                    }}
                    title="Sort by Cache-write"
                  >
                    <span style={st.ic}>✎</span>CACHE-WRITE{caret("cacheWrite")}
                  </th>
                  <th
                    onClick={() => onSortColumn("cacheRead")}
                    style={{
                      ...st.col,
                      ...st.colR,
                      ...st.colSort,
                      ...(isActive("cacheRead") ? st.colActive : null),
                    }}
                    title="Sort by Cache-read"
                  >
                    <span style={st.ic}>↺</span>CACHE-READ{caret("cacheRead")}
                  </th>
                  <th
                    onClick={() => onSortColumn("rawTotal")}
                    style={{
                      ...st.col,
                      ...st.colR,
                      ...st.gdiv,
                      ...st.colSort,
                      ...(isActive("rawTotal") ? st.colActive : null),
                    }}
                    title="Sort by Total tokens"
                  >
                    <span style={st.ic}>∑</span>TOTAL{caret("rawTotal")}
                  </th>
                  <th
                    onClick={() => onSortColumn("totalCost")}
                    style={{
                      ...st.col,
                      ...st.colR,
                      ...st.gdiv,
                      ...st.colSort,
                      ...(isActive("totalCost") ? st.colActive : null),
                    }}
                    title="Sort by total cost ($)"
                  >
                    <span style={st.ic}>$</span>TOTAL COST{caret("totalCost")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e, i) => {
                  const sp = speciesOf(e.signalClass);
                  const displayRank = searchQuery
                    ? e.rank
                    : safePage * PER_PAGE + i + 1;
                  const yRank = yieldRankMap.get(e);
                  return (
                    <tr key={`raw-${e.anonId}-${i}`}>
                      <td
                        style={{
                          ...st.td,
                          ...st.tdR,
                          ...st.stickyRank,
                          color: rankColor(displayRank),
                          fontWeight: rankWeight(displayRank),
                        }}
                      >
                        {displayRank}
                        {yRank != null && (
                          <span
                            style={{
                              display: "block",
                              fontSize: 9,
                              fontWeight: 400,
                              color: T.mut,
                              lineHeight: 1.1,
                            }}
                          >
                            /{yRank}
                          </span>
                        )}
                        {e.percentile != null && e.percentile > 0 && (
                          <span
                            style={{
                              display: "block",
                              fontSize: 9,
                              fontWeight: 400,
                              color: T.mut,
                              lineHeight: 1.1,
                            }}
                          >
                            p{e.percentile.toFixed(0)}
                          </span>
                        )}
                      </td>
                      <td style={{ ...st.td, ...st.tdL, ...st.stickyOp }}>
                        <span style={st.op}>
                          <OperatorAvatar alt={e.anonId} />
                          {e.status === "retired" ? (
                            <span style={st.opLink}>
                              <span style={{ ...st.opName, fontStyle: e.isSeed ? "italic" : "normal" }}>
                                <span aria-hidden style={{ color: SPECIES_SWATCH[sp] ?? T.thru, marginRight: 5, fontStyle: "normal" }} title={e.signalClass}>{glyphFor(e.signalClass)}</span>
                                {e.anonId}
                              </span>
                              {e.subLabel || e.location ? (
                                <span style={st.opSub}>
                                  {e.subLabel}
                                  {e.location ? <span style={{ color: T.mut }}>{e.subLabel ? "  ·  " : ""}◍ {e.location}</span> : null}
                                </span>
                              ) : null}
                            </span>
                          ) : (
                          <Link
                            href={`/user/${encodeURIComponent(e.codename)}`}
                            style={st.opLink}
                          >
                            <span
                              style={{
                                ...st.opName,
                                fontStyle: e.isSeed ? "italic" : "normal",
                              }}
                            >
                              <span
                                aria-hidden
                                style={{
                                  color: SPECIES_SWATCH[sp] ?? T.thru,
                                  marginRight: 5,
                                  fontStyle: "normal",
                                }}
                                title={e.signalClass}
                              >
                                {glyphFor(e.signalClass)}
                              </span>
                              {e.anonId}
                              {winChip(e)}
                            </span>
                            {e.subLabel || e.location ? (
                              <span style={st.opSub}>
                                {e.subLabel}
                                {e.location ? (
                                  <span style={{ color: T.mut }}>
                                    {e.subLabel ? "  ·  " : ""}◍ {e.location}
                                  </span>
                                ) : null}
                              </span>
                            ) : null}
                          </Link>
                          )}
                        </span>
                      </td>
                      <td
                        style={{
                          ...st.td,
                          ...st.tdR,
                          ...st.gdiv,
                          ...podiumBox(top3.input, e.input),
                        }}
                      >
                        {fmtBig(e.input)}
                      </td>
                      <td
                        style={{
                          ...st.td,
                          ...st.tdR,
                          ...podiumBox(top3.output, e.output),
                        }}
                      >
                        {fmtBig(e.output)}
                      </td>
                      <td
                        style={{
                          ...st.td,
                          ...st.tdR,
                          ...podiumBox(top3.cacheWrite, e.cacheWrite),
                        }}
                      >
                        {fmtBig(e.cacheWrite)}
                      </td>
                      <td
                        style={{
                          ...st.td,
                          ...st.tdR,
                          ...podiumBox(top3.cacheRead, e.cacheRead),
                        }}
                      >
                        {fmtBig(e.cacheRead)}
                      </td>
                      <td
                        style={{
                          ...st.td,
                          ...st.tdR,
                          ...st.gdiv,
                          fontWeight: 700,
                          color: T.ink,
                          ...podiumBox(top3.rawTotal, rawTotal(e)),
                        }}
                      >
                        {fmtBig(rawTotal(e))}
                      </td>
                      <td
                        style={{
                          ...st.td,
                          ...st.tdR,
                          ...st.gdiv,
                          color: T.ink,
                        }}
                      >
                        {fmtMoney(totalCostOf(e))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
        {pageCount > 1 ? (
          <div style={{ ...st.pager, flexDirection: "column", gap: 10 }}>
            {/* Row 1: Prev / Next */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                style={{
                  ...st.pagerBtn,
                  ...(safePage === 0 ? st.pagerOff : null),
                }}
              >
                ← Prev
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={safePage >= pageCount - 1}
                style={{
                  ...st.pagerBtn,
                  ...(safePage >= pageCount - 1 ? st.pagerOff : null),
                }}
              >
                Next →
              </button>
            </div>
            {/* Row 2: page number buttons */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
              {(() => {
                const pages: (number | "...")[] = [];
                const windowSize = 2;
                const start = Math.max(0, safePage - windowSize);
                const end = Math.min(pageCount - 1, safePage + windowSize);
                if (start > 0) {
                  pages.push(0);
                  if (start > 1) pages.push("...");
                }
                for (let i = start; i <= end; i++) pages.push(i);
                if (end < pageCount - 1) {
                  if (end < pageCount - 2) pages.push("...");
                  pages.push(pageCount - 1);
                }
                return pages.map((p, idx) =>
                  p === "..." ? (
                    <span key={`e${idx}`} style={{ color: T.mut, padding: "0 4px" }}>
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPage(p)}
                      style={{
                        ...st.pagerBtn,
                        ...(p === safePage
                          ? { background: "rgb(var(--gold))", color: "rgb(var(--bg-base))", borderColor: "rgb(var(--gold))" }
                          : null),
                      }}
                    >
                      {p + 1}
                    </button>
                  ),
                );
              })()}
            </div>
            {/* Row 3: jump-to-page input */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: T.mut, fontSize: 11 }}>Page</span>
              <input
                type="number"
                min={1}
                max={pageCount}
                placeholder={`${safePage + 1}`}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const v = parseInt((e.target as HTMLInputElement).value, 10);
                    if (!isNaN(v) && v >= 1 && v <= pageCount) {
                      setPage(v - 1);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
                style={{
                  width: 56,
                  background: "rgb(var(--bg-elevated))",
                  border: `1px solid ${T.line}`,
                  color: T.ink,
                  padding: "6px 8px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: "inherit",
                  textAlign: "center",
                }}
              />
              <span style={{ color: T.mut, fontSize: 11 }}>of {pageCount}</span>
            </div>
          </div>
        ) : null}
        <div style={st.note}>
          {view === "metrics"
            ? "Click any metric header to sort (click again to flip ▲/▼). Top-3 in each column sit in a gold/blue/indigo shadow box so the leaders stay visible after any sort or filter. The # column shows the current sort rank over the volume rank (Y/V) — switching metrics renumbers rows to match."
            : "Raw pillars — the four integers the engine derives every metric from. Click a header to sort; the last column is total cost ($). Top-3 per column boxed. The # column shows the current sort rank over the yield rank (V/Y)."}
          {totalUsers != null
            ? ` · 25 per page · ${sorted.length} of ${totalUsers} operators.`
            : null}
        </div>
      </div>
    </div>
  );
}

const st: Record<string, React.CSSProperties> = {
  // FRAME FIX (2026-06-28): no own max-width — inherit the page's max-w-6xl <main>
  // container so the board box shares EXACT edges with the WaveHero + LeaderboardKey
  // (the old maxWidth:1180 + margin:auto floated it narrower-and-centered inside the
  // 1152px shell → the staggered-box misalignment). Full width; the table scrolls
  // horizontally inside (overflowX:auto) like BlitzStars.
  wrap: { width: "100%" },
  field: {
    background: T.field,
    border: `1px solid ${T.line}`,
    padding: 20,
    fontFamily: "Roboto, -apple-system, system-ui, sans-serif",
    color: T.ink,
    fontSize: 14,
    lineHeight: 1.45,
    WebkitFontSmoothing: "antialiased",
  },
  headRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 12,
    marginBottom: 18,
    flexWrap: "wrap",
  },
  pager: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 16,
    fontSize: 12,
    flexWrap: "wrap",
  },
  pagerBtn: {
    background: "rgb(var(--bg-elevated))",
    border: `1px solid ${T.line}`,
    color: T.ink,
    padding: "6px 10px",
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    cursor: "pointer",
    fontFamily: "inherit",
    minWidth: 32,
    textAlign: "center" as const,
  },
  pagerOff: { opacity: 0.4, cursor: "not-allowed" },
  pagerInfo: {
    color: T.ink,
    fontVariantNumeric: "tabular-nums",
    letterSpacing: ".02em",
  },
  filters: {
    display: "flex",
    gap: 10,
    alignItems: "flex-end",
    flexWrap: "wrap",
  },
  fieldCol: { display: "flex", flexDirection: "column", gap: 4 },
  flab: {
    color: T.mut,
    fontSize: 10,
    letterSpacing: ".12em",
    textTransform: "uppercase",
  },
  sel: {
    background: "rgb(var(--bg-elevated))",
    border: `1px solid ${T.line}`,
    color: T.ink,
    padding: "7px 12px",
    borderRadius: 8,
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
    minWidth: 132,
  },
  searchInput: {
    background: "rgb(var(--bg-elevated))",
    border: `1px solid ${T.line}`,
    color: T.ink,
    padding: "7px 12px",
    borderRadius: 8,
    fontSize: 12,
    fontFamily: "inherit",
    minWidth: 132,
    outline: "none",
  },
  toggleRow: {
    display: "flex",
    gap: 0,
    border: `1px solid ${T.line}`,
    borderRadius: 6,
    overflow: "hidden",
    width: "fit-content",
    alignSelf: "flex-end",
  },
  modeBtn: {
    background: "transparent",
    border: "none",
    color: T.mut,
    padding: "8px 16px",
    fontSize: 12,
    cursor: "pointer",
    fontFamily: "inherit",
    letterSpacing: ".02em",
  },
  modeOn: {
    background: "rgb(var(--gold) / 0.16)",
    color: T.gold,
    fontWeight: 700,
  },
  table: {
    borderCollapse: "collapse",
    width: "100%",
    fontVariantNumeric: "tabular-nums",
  },
  grp: {
    fontSize: 10,
    letterSpacing: ".13em",
    color: T.mut,
    background: "rgb(var(--bg-base))",
    borderBottom: `1px solid ${T.line}`,
    textAlign: "center",
    padding: "6px 10px",
    fontWeight: 600,
  },
  col: {
    fontSize: 11,
    letterSpacing: ".06em",
    color: T.mut,
    fontWeight: 600,
    textTransform: "uppercase",
    padding: "7px 10px",
    borderBottom: `1px solid ${T.rowLine}`,
    whiteSpace: "nowrap",
  },
  colActive: { color: T.gold, borderBottom: `2px solid ${T.gold}` },
  colSort: { cursor: "pointer", userSelect: "none" as const },
  colL: { textAlign: "left" },
  colR: { textAlign: "right" },
  ic: { opacity: 0.7, marginRight: 4 },
  gdiv: { borderLeft: `1px solid ${T.line}` },
  // STICKY identity (2026-06-28): freeze # + OPERATOR on the left during horizontal
  // scroll so you never lose track of whose row you're reading (better than BlitzStars,
  // which scrolls everything). Each sticky cell needs a solid bg so scrolling content
  // doesn't bleed through, plus a left offset. # is ~46px wide (30 + 2×8 padding), so
  // OPERATOR pins at left:46. z-index keeps them above the scrolling body cells.
  stickyRank: {
    position: "sticky" as const,
    left: 0,
    zIndex: 2,
    background: T.field,
  },
  stickyOp: {
    position: "sticky" as const,
    left: 46,
    zIndex: 2,
    background: T.field,
  },
  // Header variants sit higher (above body sticky cells when both scroll) + use the
  // header's elevated bg so the frozen header corner reads as header, not body.
  stickyRankHead: {
    position: "sticky" as const,
    left: 0,
    zIndex: 3,
    background: "rgb(var(--bg-surface))",
  },
  stickyOpHead: {
    position: "sticky" as const,
    left: 46,
    zIndex: 3,
    background: "rgb(var(--bg-surface))",
  },
  td: {
    padding: "7px 10px",
    borderBottom: `1px solid ${T.rowLine}`,
    whiteSpace: "nowrap",
    fontVariantNumeric: "tabular-nums",
  },
  tdL: { textAlign: "left" },
  tdR: { textAlign: "right" },
  op: { display: "flex", alignItems: "center", gap: 8 },
  opLink: {
    color: T.ink,
    textDecoration: "none",
    display: "flex",
    flexDirection: "column",
    lineHeight: 1.2,
  },
  opName: { color: T.ink, fontSize: 13 },
  opSub: { color: T.mut, fontSize: 11 },
  note: { color: T.mut, fontSize: 11, marginTop: 12 },
};
