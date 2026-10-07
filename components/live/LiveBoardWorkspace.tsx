"use client";

/**
 * components/live/LiveBoardWorkspace.tsx — React port of the frozen
 * SignalAF live-board reference workspace (live-board-prototype, tag
 * reference-v1): X-rail nav, header, filter bar, optional banner, featured
 * operator dock, leaderboard table, inspector rail, collapsible footer.
 *
 * Port contract (PHASE2B_IMPLEMENTATION_PLAN.md, WS-1):
 *   - markup + class names verbatim; theme system intact via
 *     proto-scoped.css (.lbw-root[data-theme]) — the site's own
 *     documentElement data-theme is left alone
 *   - logic verbatim: numvOf compact parsing, RMAX from initial.fieldMax
 *     (server full-scope maxima — never recomputed from rendered rows),
 *     opRadar, derived movers, tt1..tt3 top-3 heat, workflow pills
 *     (HITL/HYBRID/AGENTIC — the reference's ops/outlier pair, repurposed
 *     per owner; outlier view survives as SORT=10xDEV)
 *   - sort/filter/search are client-side over the supplied array; the table
 *     renders the current page only — PAGE_SIZE = 10 rows, matching the
 *     reference's `ceil(population / 10)` page chrome. The page count derives
 *     from the LOADED rows (never the population denominator — the mount
 *     hydrates the rest of the field lazily); a page click on an incomplete
 *     field re-fires fetchMore, so the pagination chrome doubles as the
 *     retry path when hydration soft-fails (429). (The prototype shipped the
 *     controls as chrome; the port wires the field-side ones: SORT/CLASS/
 *     PLATFORM/SEARCH; WINDOW is route-owned → onWindowChange)
 *   - fetchMore(page) / fetchDetail(codename, hint) are optional async hooks
 *     for the WS-3/WS-4 wiring — the component is fully standalone on
 *     `initial`. fetchDetail defaults to createDetailFetcher(meta.window):
 *     one session-cached fan-out per codename (profile + history + records,
 *     +snapshot-history for claimed/public ops only — the route 404s
 *     otherwise). The resolved detail merges onto the row via mergeDetail,
 *     so verif/supporter/trend/recs reach the rail tile, the row sparkline
 *     and every dock tab; per-channel failures surface as notes inside the
 *     dock while base field data keeps rendering (the 1,649-call
 *     bulk-history prototype pattern is banned — nothing prefetches).
 *   - theme persistence (2C): ?theme= > lbw-theme localStorage > "green",
 *     applied pre-paint by the LBW_THEME_INIT inline script; the reference
 *     had no persistence (query param only). The site's own
 *     documentElement data-theme stays untouched — scoped via
 *     .lbw-root[data-theme].
 *   - account chrome (2C): /api/auth/session via useBoardSession, the same
 *     client-side pattern as AccountMenu/ProfileAuthGate — signed out →
 *     SIGN IN → /login; signed-in-unlinked → CLAIM SIGNAL → /me; linked →
 *     MY SIGNAL / SETTINGS / API KEYS / SIGN OUT (real signOut +
 *     router.refresh). The `account` prop is a demo/QA override that skips
 *     the session fetch entirely.
 *   - COMPARE seeds /compare?a=<codename> from the selected operator (the
 *     reference's in-board compare.html surface is not ported — the
 *     canonical compare page carries that role).
 *
 * Nav note: the task spec fixes the X-rail nav to Leaderboard / Compare /
 * Hall / Field (reference-v1's inert PROFILE/WRAPPED buttons and the
 * share.html link are dropped — Share lives on the dock's SHARE tab).
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  FieldStat,
  LiveBoardInitialState,
  LiveOperator,
} from "@/lib/board/live-types";
import { lbwFontVars } from "./fonts";
import "./proto-scoped.css";
import { BoardHead, BoardRow, type ColMode, type ViewMode } from "./rows";
import { EnterprisePromoPop } from "./EnterprisePromo";
import {
  OperatorDock,
  OperatorProfileTile,
  RadarChart,
  SharePreview,
} from "./OperatorDock";
import { RailIcon, ICON_SETS } from "./PixelIcon";
import type { IconSetName } from "./PixelIcon";
import { PixelBadge, badgeForPct } from "./PixelBadge";
import { RotatingMovers } from "./MoversRail";

import {
  COMPARE_CTA,
  COMPARE_SLOTS,
  CONTROLS,
  COPY,
  LBW_THEME_INIT,
  PAGE_SIZE,
  SORT_ASC,
  SORT_KEY,
  THEMES,
  WINDOW_SLUG,
  computeTT,
  isVerifiedOp,
  opRadar,
  persistLbwTheme,
  profileFor,
  rawRankMap,
  resolveLbwTheme,
  rmaxOf,
  fieldMedianRadarVals,
  windowLabel,
  type ThemeName,
} from "./utils";
import { track } from "@/lib/infra/posthog/events";
import { liveTrack } from "./analytics";
import {
  createDetailFetcher,
  detailFailed,
  mergeDetail,
  type DetailStatus,
  type FetchDetail,
  type LiveOperatorDetail,
} from "./enrich";
import { useBoardSession } from "./session";

export interface LiveBoardWorkspaceProps {
  /** SSR payload — see lib/board/live-types.ts. */
  initial: LiveBoardInitialState;
  /** WS-3: fetch page N of the field; returned rows append to the board. */
  fetchMore?: (
    page: number,
  ) => Promise<LiveOperator[] | void> | LiveOperator[] | void;
  /** WS-4: fetch detail for the selected operator's drill tabs. Defaults to
   *  createDetailFetcher(meta.window) — the session-cached same-origin fan
   *  out in enrich.ts. Pass an explicit no-op/stub to stay fixture-pure. */
  fetchDetail?: FetchDetail;
  /** WINDOW select override — default navigates to /board/<slug>. */
  onWindowChange?: (windowSlug: string) => void;
  /** Account chrome override (demo/QA). Omit → the real /api/auth/session
   *  surface resolves (useBoardSession). */
  account?: { name: string; rank: string };
  /** Mount-side field-hydration state — drives the pagination chrome's
   *  SYNCING / SYNC-FAILED indicators. Omit in standalone/demo usage (a
   *  complete field reads as "ready"). */
  fieldStatus?: LiveFieldStatus;
}

/** Field-hydration lifecycle reported by the mount (live-board-mount.tsx). */
export type LiveFieldStatus = "idle" | "loading" | "ready" | "error";

/* rail module ids — reference module order: field, hall, compare, movers,
   share; "profile" is inserted first while the operator is docked. */
type RailId =
  | "profile"
  | "field"
  | "hall"
  | "honors"
  | "compare"
  | "movers"
  | "share"
  | "soon";
/* Right-rail module order (owner 2026-10-06): interactive share, movement,
   compare, then rotating field stats, hall spotlight, recents/coming-soon —
   the profile module moved to the left sidebar ("banner + op profile"),
   which is why "profile" is absent. */
/* Owner 2026-10-06 (second pass): profile module ↔ top movers swapped —
   movers sit in the left sidebar under the banner; the operator profile
   lives in the inspector rail at movers' old slot. */
/* Third pass (2026-10-06): global stats leave both sidebars entirely
   (owner defers them) — "field"/HOT STATS and the compare module exit
   the inspector; compare moved to the left sidebar. Inspector = share,
   profile, hall, recents/soon. */
const BASE_RAIL_ORDER: RailId[] = ["share", "profile", "honors", "soon"];
const RAIL_TITLE: Record<RailId, string> = {
  profile: "OPERATOR PROFILE",
  field: "HOT STATS",
  hall: "HALL OF SIGNAL",
  honors: "AWARDS & BADGES",
  compare: "COMPARE OPERATORS",
  movers: "TOP MOVERS",
  share: "SHARE YOUR SIGNAL",
  soon: "RECENTS & SOON",
};

/* ---------- HOT STATS (owner 2026-10-06): the rail's field module rotates
   one board stat at a time instead of duplicating the banner's static
   strip. Same fieldStats source, one cell rotating on a timer. ---------- */
/* Rotating medal deck for HALL OF SIGNAL — one box cycling gold /
   silver / bronze brackets (owner: "one box 3 slides"). */
/* Podium grid for HALL OF SIGNAL — owner: one box, three columns, top-3
   gold / silver / bronze all visible at once (like compare's slots). */
function MedalDeck({
  medals,
  ops,
  onSelect,
}: {
  medals: { name: string; list: LiveOperator[] }[];
  ops: LiveOperator[];
  onSelect?: (i: number) => void;
}) {
  return (
    <div className="hbox podium">
      {medals.map((m, mi) => (
        <div className="pod-col" key={m.name}>
          <div className="pod-h">{m.name.toUpperCase()}</div>
          {m.list.slice(0, 3).map((o, ri) => {
            const k = ops.indexOf(o);
            return (
              <button
                key={o.codename}
                type="button"
                className="pod-r"
                onClick={() => onSelect?.(k)}
              >
                <span className="pod-n">{ri + 1}</span>
                <span className="mav">
                  {o.avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={o.avatarUrl} alt="" loading="lazy" />
                  ) : (
                    o.name[0]
                  )}
                </span>
                <span className="tm">{o.name}</span>
              </button>
            );
          })}
          {Array.from({ length: 3 - Math.min(3, m.list.length) }).map(
            (_, i) => (
              <div className="pod-r empty" key={i}>
                <span className="pod-n">
                  {m.list.length + i + 1}
                </span>
                <span className="tm mut">—</span>
              </div>
            ),
          )}
        </div>
      ))}
    </div>
  );
}

/* Small overtime area chart — operator yield series + dashed field
   median line (compare-page "YIELD · OVERTIME" language). */
function TrendSpark({
  series,
  ops,
}: {
  series: number[];
  ops: LiveOperator[];
}) {
  const W = 220;
  const H = 56;
  const P = 4;
  const max = Math.max(...series, 1);
  const min = Math.min(...series, 0);
  const span = Math.max(max - min, 1e-6);
  const px = (i: number) => P + (i / Math.max(series.length - 1, 1)) * (W - P * 2);
  const py = (v: number) => H - P - ((v - min) / span) * (H - P * 2);
  const pts = series.map((v, i) => `${px(i).toFixed(1)},${py(v).toFixed(1)}`);
  /* field median of each op's latest trend point → the dashed avg line */
  const latests = ops
    .map((o) => o.trend?.[o.trend.length - 1])
    .filter((v): v is number => v != null)
    .sort((a, b) => a - b);
  const med = latests.length ? latests[Math.floor(latests.length / 2)] : null;
  const medY = med != null ? py(med) : null;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} aria-hidden>
      <polyline
        points={`${px(0)},${H} ${pts.join(" ")} ${px(series.length - 1)},${H}`}
        fill="color-mix(in srgb, var(--ac) 18%, transparent)"
        stroke="none"
      />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="var(--ac)"
        strokeWidth={1.6}
      />
      {medY != null && (
        <line
          x1={P}
          y1={medY}
          x2={W - P}
          y2={medY}
          stroke="var(--mut)"
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      )}
      {medY != null && (
        <text
          x={W - P}
          y={medY - 3}
          textAnchor="end"
          fill="var(--mut)"
          fontSize={8}
          fontFamily="var(--font-mono)"
        >
          field avg
        </text>
      )}
    </svg>
  );
}

function HotStats({ stats }: { stats: FieldStat[] }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (stats.length < 2) return;
    const t = setInterval(() => setI((x) => (x + 1) % stats.length), 4200);
    return () => clearInterval(t);
  }, [stats.length]);
  if (!stats.length) return <p className="drill-note">— NO FIELD STATS</p>;
  const s = stats[i % stats.length];
  return (
    <div className="hotstat">
      <div className="hs-v">{s.value}</div>
      <div className="hs-l">{s.field.replace(/_/g, " ").toUpperCase()}</div>
      <div className="hs-dots" aria-hidden>
        {stats.map((_, k) => (
          <span key={k} className={k === i ? "on" : ""} />
        ))}
      </div>
    </div>
  );
}

export function LiveBoardWorkspace({
  initial,
  fetchMore,
  fetchDetail,
  onWindowChange,
  account,
  fieldStatus,
}: LiveBoardWorkspaceProps) {
  /* ---------- theme switch (LB-20) — ?theme= > lbw-theme localStorage >
     "green"; state lives on .lbw-root's data-theme (the site's own
     documentElement theme is never touched). LBW_THEME_INIT below rewrites
     the SSR'd attribute pre-paint; clicks persist. ---------- */
  const [theme, setTheme] = useState<ThemeName>(resolveLbwTheme);

  /* Shift+T cycles the WORKSPACE palettes — same gesture as the site-wide
     ThemeCycleShortcut (which still swaps the hidden site theme behind the
     board; harmless — .lbw-root owns its own data-theme). Same guards:
     Shift only, never inside inputs. */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "T" && e.key !== "t") return;
      if (!e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el?.isContentEditable
      )
        return;
      setTheme((t) => {
        const next =
          THEMES[(THEMES.indexOf(t) + 1) % THEMES.length] ?? "green";
        persistLbwTheme(next);
        liveTrack.themeChanged(next);
        return next;
      });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* ---------- field data (all client-side over the supplied array) --- */
  const [extraOps, setExtraOps] = useState<LiveOperator[]>([]);
  const baseOps = useMemo(
    () =>
      extraOps.length
        ? [...initial.operators, ...extraOps]
        : initial.operators,
    [initial.operators, extraOps],
  );

  /* ---------- WS-4 drill-down enrichment (lazy, session-cached) ----------
     One detail fan-out per `${window}:${codename}` — the same key the
     enrich.ts session cache uses, so window switches re-resolve. Resolved
     details overlay onto the base row (mergeDetail) so every surface sees
     enriched fields uniformly. */
  const [details, setDetails] = useState<
    Record<string, { status: DetailStatus; detail?: LiveOperatorDetail }>
  >({});
  const defaultFetcher = useMemo(
    () => createDetailFetcher(initial.meta.window),
    [initial.meta.window],
  );
  const detailFetcher: FetchDetail = fetchDetail ?? defaultFetcher;
  const detailKey = useCallback(
    (codename: string) => `${initial.meta.window}:${codename}`,
    [initial.meta.window],
  );

  const ops = useMemo(() => {
    let touched = false;
    const next = baseOps.map((o) => {
      const e = details[detailKey(o.codename)];
      if (e?.status === "ready" && e.detail) {
        touched = true;
        return mergeDetail(o, e.detail);
      }
      return o;
    });
    return touched ? next : baseOps;
  }, [baseOps, details, detailKey]);
  const rmax = useMemo(() => rmaxOf(initial.fieldMax), [initial.fieldMax]);
  const tt = useMemo(() => computeTT(ops), [ops]);
  const rawRank = useMemo(() => rawRankMap(ops), [ops]);

  /* ---------- board state ---------- */
  const [colMode, setColMode] = useState<ColMode>("metrics");
  /* leftOn = left sidebar (banner + operator profile) visibility — explicit
     title-bar glyph, VS Code panel pattern; never media-query reflow. */
  const [leftOn, setLeftOn] = useState(true);
  const [windowSel, setWindowSel] = useState(() =>
    windowLabel(initial.meta.window),
  );
  const [platformSel, setPlatformSel] = useState<string>(CONTROLS.platforms[0]);
  const [classSel, setClassSel] = useState<string>(CONTROLS.classes[0]);
  /* Workflow pills (owner spec): HITL | HYBRID | AGENTIC — "hybrid" is the
     middle pill and means the COMBINED view (both workflow types + the
     unresolved field — replaces the old "All"), and is the default on
     open. hitl/agentic = only rows carrying that resolved mode. */
  const [wfSel, setWfSel] = useState<"hybrid" | "hitl" | "agentic">(
    "hybrid",
  );
  const [sortSel, setSortSel] = useState<string>(CONTROLS.sorts[0]);
  /* sortFlip = header-click direction toggle (owner: sortable columns);
     re-clicking the active column flips asc/desc off SORT_ASC's default. */
  const [sortFlip, setSortFlip] = useState(false);
  /* Fix (owner report 2026-10-06): never call setSortFlip inside the
     setSortSel updater — StrictMode double-invokes updaters in dev, so the
     flip fired twice and cancelled itself (columns never reversed). */
  const onSortColumn = useCallback(
    (key: string) => {
      if (key === sortSel) {
        setSortFlip((f) => !f);
      } else {
        setSortSel(key);
        setSortFlip(false);
      }
    },
    [sortSel],
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  /* The reference's ops/outlier pill pair is now the workflow filter (owner:
     HITL replaces Operators, Agentic replaces Outliers, Both = combined).
     The outlier VIEW survives as SORT=10xDEV — derive the row cosmetics
     from it so ◆/position ranks/"10×DEV OUTLIER" still fire on a dev sort. */
  const viewMode: ViewMode = sortSel === "10xDEV" ? "out" : "ops";

  /* ?mode=hitl|agentic|hybrid — the pre-2B board's workflow-view URL contract.
     Read post-mount (the page stays static/ISR-cacheable) and re-read on
     window swaps, whose router.push carries the param forward. */
  useEffect(() => {
    const m = new URLSearchParams(window.location.search).get("mode");
    setWfSel(m === "hitl" || m === "agentic" ? m : "hybrid");
  }, [initial.meta.window]);

  /* WINDOW self-heal (R2): the mount normally remounts the workspace on a
     route swap (key={meta.window}), but a prop-driven window change must
     resync the select without relying on that remount. */
  useEffect(() => {
    setWindowSel(windowLabel(initial.meta.window));
  }, [initial.meta.window]);

  /* Any filter/view/sort/search/window change returns to page 1 — the
     visible set shrinks, so a deep page pointer would strand the table. */
  useEffect(() => {
    setPage(1);
  }, [search, classSel, platformSel, wfSel, viewMode, sortSel, initial.meta.window]);

  /* ---------- selected operator + dock ---------- */
  const [selected, setSelected] = useState<number>(() =>
    initial.featured ? -1 : initial.operators.length ? 0 : -1,
  );
  const [docked, setDocked] = useState(true); // reference: starts docked
  const profile = useMemo(
    () => profileFor(initial, ops, selected, rmax),
    [initial, ops, selected, rmax],
  );

  /* dual-radar baseline (owner 2026-10-06, compare-page style): when a
     non-featured operator is selected, overlay the FIELD LEADER's radar
     behind the operator's polygon; featured/no-match falls back to the
     dock's FIELD MAX rim. */
  const featuredRow = useMemo(
    () => ops.find((o) => o.codename === initial.featured?.codename) ?? null,
    [ops, initial.featured],
  );
  const radarBaseline = useMemo(() => {
    if (selected === -1 || !featuredRow) return undefined;
    return {
      label: `#1 ${initial.featured?.name ?? featuredRow.name}`,
      vals: opRadar(featuredRow, rmax),
    };
  }, [selected, featuredRow, initial.featured, rmax]);
  /* owner 2026-10-06: featured selection fell back to FIELD MAX — a rim
     polygon by definition, so the radar read "maxed out". Baseline is the
     field MEDIAN polygon; leader-vs-field keeps the leader comparison
     when another operator is selected. */
  const fieldMedianBaseline = useMemo(
    () => ({ label: "FIELD MEDIAN", vals: fieldMedianRadarVals(ops, rmax) }),
    [ops, rmax],
  );

  /* ---------- selection → enrichment trigger ----------
     A selection (row, featured card, hall hex, mover row) resolves to a
     codename — featured without a field match falls back to the featured
     payload's own codename so the drill still syncs against the API. */
  const selOp = profile?.op ?? null;
  const selCodename =
    selected === -1
      ? (selOp?.codename ?? initial.featured?.codename ?? null)
      : (selOp?.codename ?? null);
  const selEntry = selCodename ? details[detailKey(selCodename)] : undefined;
  const selDetail = selEntry?.detail ?? null;
  const selDetailStatus: DetailStatus = selEntry?.status ?? "idle";

  /* Selection funnel (2D analytics) — fires only on user-initiated picks
     (board row, mover row, hall hex); the featured-operator mount selection
     does NOT count. */
  const handleSelect = useCallback(
    (i: number) => {
      setSelected(i);
      const codename =
        i === -1 ? initial.featured?.codename : ops[i]?.codename;
      if (!codename) return;
      const name =
        i === -1
          ? (initial.featured?.name ?? codename)
          : (ops[i]?.name ?? codename);
      setRecents((r) =>
        [{ codename, name }, ...r.filter((x) => x.codename !== codename)].slice(
          0,
          4,
        ),
      );
      liveTrack.operatorSelected({
        codename,
        rank: i >= 0 ? i + 1 : (initial.featured?.rank ?? null),
      });
    },
    [ops, initial.featured],
  );

  /* board_viewed — parity with LeaderboardTable's instrumentation: fires on
     mount and on window/view swaps (the window prop also remounts via key,
     so this covers route navigation either way). */
  useEffect(() => {
    track.boardViewed(initial.meta.window, {
      view: viewMode,
      total: initial.population.count,
    });
  }, [initial.meta.window, initial.population.count, viewMode]);

  useEffect(() => {
    if (!selCodename) return;
    const key = detailKey(selCodename);
    let alive = true;
    /* functional-set guard: never regress a ready/loading entry — re-select
       of a cached codename replays the resolved promise silently. */
    setDetails((prev) =>
      prev[key] ? prev : { ...prev, [key]: { status: "loading" } },
    );
    Promise.resolve(detailFetcher(selCodename, { claimed: selOp?.claimed }))
      .then((det) => {
        if (!alive) return;
        const d = det || undefined;
        setDetails((prev) => ({
          ...prev,
          [key]:
            d && !detailFailed(d)
              ? { status: "ready", detail: d }
              : d
                ? { status: "error", detail: d }
                : { status: "error" },
        }));
      })
      .catch(() => {
        if (alive) {
          setDetails((prev) => ({
            ...prev,
            [key]: { status: "error" },
          }));
        }
      });
    return () => {
      alive = false;
    };
    /* `details` is deliberately NOT a dep: reads happen inside functional
       updates, and enrich.ts's session cache makes a replayed fetch free —
       re-running on every details write would churn renders; skipping it
       also keeps StrictMode's double-mount from stranding a `loading`
       entry whose in-flight promise belongs to the discarded first run. */
  }, [selCodename, selOp?.claimed, detailKey, detailFetcher]);

  /* ---------- account chrome (2C) — real session surface; the `account`
     prop is a demo/QA override that skips the fetch entirely. ---------- */
  const session = useBoardSession(!account);

  /* ---------- rail module stack (reorderable + hideable) ---------- */
  const [railOrder, setRailOrder] = useState<RailId[]>(BASE_RAIL_ORDER);
  const [hiddenIds, setHiddenIds] = useState<RailId[]>([]);
  const visibleRail = railOrder.filter((id) => !hiddenIds.includes(id));

  /* ⇄ FEATURE flips the drill card between floating (.feat over the board)
     and docked (compact tile in the LEFT sidebar's OPERATOR PROFILE mod —
     owner 2026-10-06 IA: left = banner + op profile, right = share/movers/
     compare/field context). */
  const toggleDock = useCallback(() => setDocked((v) => !v), []);

  const moveModule = useCallback(
    (id: RailId, dir: -1 | 1) => {
      setRailOrder((o) => {
        const vis = o.filter((x) => !hiddenIds.includes(x));
        const pos = vis.indexOf(id);
        const sib = vis[pos + dir];
        if (pos < 0 || sib === undefined) return o;
        const next = [...o];
        const ai = next.indexOf(id);
        const bi = next.indexOf(sib);
        next[ai] = sib;
        next[bi] = id;
        return next;
      });
    },
    [hiddenIds],
  );

  const hideModule = useCallback(
    (id: RailId) => setHiddenIds((h) => (h.includes(id) ? h : [...h, id])),
    [],
  );
  const restoreModule = useCallback(
    (id: RailId) => setHiddenIds((h) => h.filter((x) => x !== id)),
    [],
  );

  /* ---------- derived rails ---------- */

  /* ---------- filtered/ordered row pairs ([op, fieldIndex]) ---------- */
  const ordered = useMemo(() => {
    let arr = ops.map((o, i) => [o, i] as [LiveOperator, number]);
    const q = search.trim().toLowerCase();
    if (q) {
      arr = arr.filter(
        ([o]) =>
          o.codename.toLowerCase().includes(q) ||
          o.name.toLowerCase().includes(q) ||
          o.handle.toLowerCase().includes(q),
      );
    }
    if (classSel !== "All Classes") {
      arr = arr.filter(
        ([o]) => o.klass === classSel || o.klass.startsWith(`${classSel} `),
      );
    }
    if (wfSel !== "hybrid") {
      arr = arr.filter(([o]) => o.wf === wfSel);
    }
    if (platformSel !== "All Platforms") {
      const key = platformSel.toLowerCase().split(" ")[0];
      arr = arr.filter(([o]) => o.platform.toLowerCase().includes(key));
    }
    if (viewMode === "out") {
      return [...arr].sort((a, b) =>
        sortFlip ? a[0].dev - b[0].dev : b[0].dev - a[0].dev,
      );
    }
    const fn = SORT_KEY[sortSel];
    if (fn && (sortSel !== "Yield" || sortFlip)) {
      const asc = SORT_ASC.has(sortSel) !== sortFlip;
      arr = [...arr].sort((a, b) =>
        asc ? fn(a[0]) - fn(b[0]) : fn(b[0]) - fn(a[0]),
      );
    }
    return arr;
  }, [ops, search, classSel, platformSel, wfSel, viewMode, sortSel, sortFlip]);

  /* ---------- chrome state ---------- */
  /* railOn = right inspector rail visibility — explicit toggle only (VS
     Code panel pattern); the rail never reflows below the board. */
  const [railOn, setRailOn] = useState(true);
  const [acctPop, setAcctPop] = useState(false);
  const [epromoOpen, setEpromoOpen] = useState(false);
  const [ftrMin, setFtrMin] = useState(false);
  /* RECENTS (owner 2026-10-06): last-selected operators for the RECENTS &
     SOON rail module; cmpQ = the compare module's add-by-search input. */
  const [recents, setRecents] = useState<{ codename: string; name: string }[]>(
    [],
  );
  const [cmpQ, setCmpQ] = useState("");
  /* icon-set switcher (owner: "toggle through the icons — all 4 or 5
     sets") — cycles pixel / glyph / emoji / minimal / hex-badge rail
     treatments; defaults to the brand pixel set. */
  const [iconSet, setIconSet] = useState<IconSetName>("pixel");
  const [notifOpen, setNotifOpen] = useState(false);
  /* coming-soon votes (owner: "vote button for which gets built first") —
     local tally; wire to a real vote surface when one exists. */
  const [soonVotes, setSoonVotes] = useState<Record<string, number>>({});
  const [soonPop, setSoonPop] = useState<string | null>(null);
  /* awards/badges deck (owner: one box, three slides, bigger graphics) */
  const [awSlide, setAwSlide] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setAwSlide((i) => i + 1), 4000);
    return () => clearInterval(t);
  }, []);
  /* Adjustable sidebars (owner 2026-10-06): the ear-flap on each panel's
     inner edge is a VS Code sash — drag resizes via --lside-w/--rail-w CSS
     vars on .lbw-root; a sub-4px click counts as collapse instead. */
  const rootRef = useRef<HTMLDivElement | null>(null);
  const onDrag = useCallback(
    (side: "l" | "r") => (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      const root = rootRef.current;
      if (!root) return;
      const el = e.currentTarget.parentElement as HTMLElement;
      const startX = e.clientX;
      const startW = el.getBoundingClientRect().width;
      const varName = side === "l" ? "--lside-w" : "--rail-w";
      const move = (ev: PointerEvent) => {
        const dx = ev.clientX - startX;
        const w = Math.round(
          Math.min(480, Math.max(180, side === "l" ? startW + dx : startW - dx)),
        );
        root.style.setProperty(varName, `${w}px`);
      };
      const up = (ev: PointerEvent) => {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
        if (Math.abs(ev.clientX - startX) < 4) {
          if (side === "l") setLeftOn(false);
          else setRailOn(false);
        }
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [],
  );
  const stageRef = useRef<HTMLElement | null>(null);
  const acctRef = useRef<HTMLDivElement | null>(null);
  const snavRef = useRef<HTMLElement | null>(null);

  /* account popover closes on outside click (board.js) */
  useEffect(() => {
    if (!acctPop) return;
    const onDoc = (e: MouseEvent) => {
      if (
        acctRef.current &&
        e.target instanceof Node &&
        !acctRef.current.contains(e.target)
      ) {
        setAcctPop(false);
      }
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [acctPop]);

  /* enterprise promo popover closes on outside click (same contract as
     the account popover) */
  useEffect(() => {
    if (!epromoOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (
        snavRef.current &&
        e.target instanceof Node &&
        !snavRef.current.contains(e.target)
      ) {
        setEpromoOpen(false);
      }
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [epromoOpen]);

  const router = useRouter();
  const onWindowSel = useCallback(
    (label: string) => {
      setWindowSel(label);
      const slug = WINDOW_SLUG[label];
      if (!slug) return;
      if (onWindowChange) {
        onWindowChange(slug);
      } else {
        router.push(`/board/${slug}${wfSel === "hybrid" ? "" : `?mode=${wfSel}`}`);
      }
    },
    [onWindowChange, router, wfSel],
  );

  /* ---------- pagination (LB-19) — real slices, honest counts ----------
     lastPage derives from the LOADED rows (ordered.length): the population
     denominator is the full ranking scope, which the mount hydrates lazily.
     totalPages is the field horizon — a page target beyond the loaded rows
     on an incomplete field triggers fetchMore, and any chrome click while
     the last hydration failed retries it (429 soft-fail path). */
  const filtered = ordered.length !== ops.length;
  const fieldComplete = ops.length >= initial.totalOperators;
  const fieldState: LiveFieldStatus =
    fieldStatus ?? (fieldComplete ? "ready" : "idle");
  const lastPage = Math.max(1, Math.ceil(ordered.length / PAGE_SIZE));
  const totalPages = Math.max(1, Math.ceil(initial.totalOperators / PAGE_SIZE));
  /* the requested page can sit ahead of the loaded horizon while hydration
     is in flight — the display clamps to what's actually loaded until the
     fetch lands. */
  const pageNow = Math.min(Math.max(1, page), lastPage);
  const pageStart = (pageNow - 1) * PAGE_SIZE;
  const pageRows = ordered.slice(pageStart, pageStart + PAGE_SIZE);

  const onPage = useCallback(
    (n: number) => {
      const target = Math.min(Math.max(1, n), totalPages);
      setPage(target);
      if (!fetchMore) return;
      const needsRows = target * PAGE_SIZE > ops.length;
      if (fieldState === "error" || (!fieldComplete && needsRows)) {
        Promise.resolve(fetchMore(target))
          .then((rows) => {
            if (rows && rows.length) {
              setExtraOps((x) => [...x, ...rows]);
            }
          })
          .catch(() => {});
      }
    },
    [fetchMore, fieldComplete, fieldState, ops.length, totalPages],
  );

  /* ---------- client-side CSV export (the reference's .exp chrome, wired) —
     dumps the currently loaded + sorted + filtered field, not just the page. */
  const exportCsv = useCallback(() => {
    if (!ordered.length) return;
    const cell = (v: string | number | null | undefined): string => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const head = [
      "rank",
      "name",
      "codename",
      "handle",
      "class",
      "archetype",
      "yield",
      "leverage",
      "total_tokens",
      "cost_per_m",
      "efficiency",
      "movement_7d",
      "workflow_mode",
      "platform",
      "last_snapshot",
      "verification",
    ];
    const lines = ordered.map(([o, i], d) =>
      [
        viewMode === "ops" ? i + 1 : d + 1,
        o.name,
        o.codename,
        o.handle,
        o.klass,
        o.archetype,
        o.yield,
        o.lev,
        o.total,
        o.cost,
        o.eff,
        o.mv7 ?? "",
        o.wf ?? "",
        o.platform,
        o.last,
        o.verif,
      ]
        .map(cell)
        .join(","),
    );
    const blob = new Blob([head.join(",") + "\n" + lines.join("\n") + "\n"], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `signalaf-board-${initial.meta.window}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    track.boardShared("download", {
      window: initial.meta.window,
      format: "csv",
      rows: ordered.length,
    });
  }, [ordered, viewMode, initial.meta.window]);

  /* account chip — prop override wins (demo); else real session state:
     loading → neutral, signed out → sign-in affordance, unlinked → claim,
     linked → name + live rank (current_rank.global via session.ts). */
  const acct = useMemo(() => {
    if (account)
      return {
        mode: "override" as const,
        name: account.name,
        rank: account.rank,
      };
    if (!session.loaded)
      return { mode: "loading" as const, name: "···", rank: "" };
    if (!session.signedIn)
      return { mode: "out" as const, name: "Sign in", rank: "→" };
    if (!session.codename)
      return { mode: "nolink" as const, name: "Unlinked", rank: "—" };
    return {
      mode: "in" as const,
      name: session.displayName ?? session.codename,
      rank: session.rank != null ? `#${session.rank}` : "—",
    };
  }, [account, session]);

  const acctInitials =
    acct.mode === "out"
      ? "◎"
      : acct.mode === "loading"
        ? "··"
        : acct.name
            .split(/\s+/)
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "·";

  const onSignOut = useCallback(async () => {
    setAcctPop(false);
    try {
      const { signOut } = await import("@/lib/infra/supabase/auth");
      await signOut();
    } catch {
      /* auth unconfigured — nothing to clear */
    }
    router.refresh();
  }, [router]);

  /* compare seed — the canonical /compare page takes ?a=<codename>; the
     in-board slot grid stays the reference's chrome (deeper compare is
     honestly stubbed — the CTA carries the selection). */
  const cmpHref = selOp
    ? `/compare?a=${encodeURIComponent(selOp.slug)}`
    : "/compare";

  const pop = initial.population;
  const fmode = initial.meta.generatedAt
    ? `live data · synced ${initial.meta.generatedAt}`
    : "fixture data";


  const railBody = (id: RailId) => {
    switch (id) {
      case "profile":
        /* operator profile (owner: swapped into the inspector rail) —
           tile + dual radar + earned block badges. The pop-out control
           was removed (owner pass 3: "remove this pop out") — the floating
           dock still opens from row/stage context and docks back via its
           own glyph. */
        return profile ? (
          docked ? (
            <>
              <OperatorProfileTile d={profile} />
              {/* owner: the radar is its own box — it ends here, then a
                  separate AWARDS/BADGES box follows with three rotating
                  slides (awards → badges → medals) at display size. */}
              <div className="radarbox">
                <RadarChart
                  vals={profile.series}
                  baseline={radarBaseline ?? fieldMedianBaseline}
                  size={170}
                />
              </div>
              {/* YIELD · OVERTIME sparkline (owner: "more over-time
                  sparkline charts... a chart that showed multiple
                  items") — operator trend line + dashed field median. */}
              {(selOp?.trend?.length ?? 0) > 1 && (
                <div className="trendbox">
                  <div className="awbox-h">Υ YIELD · OVERTIME</div>
                  <TrendSpark series={selOp!.trend} ops={ops} />
                </div>
              )}
              {(selOp?.recs ?? []).length ? (
                <div className="trph">
                  {(selOp!.recs ?? []).slice(0, 3).map((r) => (
                    <div className="trph-r" key={r.metric}>
                      <span className="ti">🏆</span>
                      <span className="tm">{r.metric}</span>
                      <span className="tv">
                        #{r.rank} · {r.value}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="drill-note">
                  {selDetailStatus === "ready" ? "— NO RECORDS YET" : "— SYNCING…"}
                </p>
              )}
            </>
          ) : (
            <button
              type="button"
              className="btn ghost lside-redock"
              onClick={toggleDock}
              title="dock the operator card back into the profile module"
            >
              ⇄ POPPED OUT — DOCK IT
            </button>
          )
        ) : (
          <p className="drill-note">— SELECT AN OPERATOR</p>
        );
      case "field":
        /* HOT STATS (owner 2026-10-06): the static field grid duplicated
           the banner strip — the rail module now rotates one stat at a
           time from the same source, so nothing repeats visually. */
        return <HotStats stats={initial.fieldStats} />;
      case "hall": {
        /* Hall spotlight + medal tally (owner 2026-10-06: hall of signal
           = who holds the most gold/silver/bronze trophies). The tally
           counts record entries per operator in the hall feed — position
           medal colors (gold/silver/bronze) mark the standing. */
        /* owner 2026-10-06: medal count = top-3 gold / silver / bronze
           holders — not a flat tally. The hall feed carries record
           winners only (no runner-up data), so the brackets ride field
           standing: 🥇 ≥99th pct, 🥈 95–99th, 🥉 90–95th. */
        const byPct = [...ops].sort((a, b) => (b.pct ?? 0) - (a.pct ?? 0));
        const medals = [
          { name: "gold", list: byPct.filter((o) => (o.pct ?? 0) >= 99) },
          {
            name: "silver",
            list: byPct.filter((o) => (o.pct ?? 0) >= 95 && (o.pct ?? 0) < 99),
          },
          {
            name: "bronze",
            list: byPct.filter((o) => (o.pct ?? 0) >= 90 && (o.pct ?? 0) < 95),
          },
        ];
        /* owner: hall is ONE box, three slides — top-3 gold, silver,
           bronze rotate in place (profile graphics on each row). */
        return <MedalDeck medals={medals} ops={ops} onSelect={handleSelect} />;
      }
      case "compare": {
        /* compare-add-by-search (owner): typing an operator offers the
           match as the second slot — view their profile or carry the
           pair into /compare?a=<sel>&b=<match>. */
        const q = cmpQ.trim().toLowerCase();
        const match = q
          ? ops.find(
              (o, k) =>
                k !== selected &&
                (o.name.toLowerCase().includes(q) ||
                  o.codename.toLowerCase().includes(q) ||
                  o.handle.toLowerCase().includes(q)),
            )
          : null;
        const href = selOp
          ? `/compare?a=${encodeURIComponent(selOp.slug)}${match ? `&b=${encodeURIComponent(match.slug)}` : ""}`
          : match
            ? `/compare?a=${encodeURIComponent(match.slug)}`
            : "/compare";
        return (
          <>
            <div className="cmp-slots">
              {Array.from({ length: COMPARE_SLOTS }, (_, k) => {
                const slotOp = k === 0 ? selOp : k === 1 ? match : null;
                return (
                  <div
                    className={`cmp-slot${slotOp ? " filled" : ""}`}
                    key={k}
                    title={slotOp ? slotOp.name : "add an operator"}
                  >
                    {slotOp ? (
                      <span className="cav">
                        {slotOp.avatarUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element --
                             operator avatar URL; 26px fixed tile */
                          <img src={slotOp.avatarUrl} alt="" loading="lazy" />
                        ) : (
                          slotOp.name[0]
                        )}
                      </span>
                    ) : (
                      "+"
                    )}
                  </div>
                );
              })}
            </div>
            <input
              className="cmp-search"
              placeholder="add operator…"
              aria-label="add an operator to compare"
              value={cmpQ}
              onChange={(e) => setCmpQ(e.target.value)}
            />
            {q && (
              <div className="cmp-match mono">
                {match ? (
                  <button
                    type="button"
                    onClick={() => {
                      const k = ops.indexOf(match);
                      if (k >= 0) handleSelect(k);
                      setCmpQ("");
                    }}
                    title="view their profile"
                  >
                    ▸ {match.name}
                  </button>
                ) : (
                  <span className="mut">— no match</span>
                )}
              </div>
            )}
            <a className="btn" href={href}>
              {COMPARE_CTA}
            </a>
          </>
        );
      }
      case "movers":
        /* rotating movers (owner): auto-cycles 7D → 24H → HITL → AGENTIC
           views of the same field. */
        return (
          <RotatingMovers
            ops={ops}
            server={initial.movers}
            onSelect={handleSelect}
          />
        );
      case "share":
        return profile ? (
          <SharePreview d={profile} population={pop} />
        ) : (
          <p className="drill-note">— SELECT AN OPERATOR</p>
        );
      case "honors":
        /* owner pass 3c: awards/medals/badges are their own module — the
           rotating deck box moved out of the operator profile. */
        return profile ? (
          <>
              <div className="awbox">
                <div className="awbox-h">
                  {(["AWARDS", "BADGES", "MEDALS"] as const)[awSlide % 3]}
                  <span className="mut"> · {(awSlide % 3) + 1}/3</span>
                </div>
                {awSlide % 3 === 0 && (
                  /* owner ref (hall medal cards): hex medallion with ★ +
                     a caption strip under it — name + value, lime. */
                  <div className="awards cards">
                    <div className="hxcard">
                      <span className="award hex-gold">★</span>
                      <span className="hx-n">{selOp?.klass ?? "—"}</span>
                      <span className="hx-v">CLASS</span>
                    </div>
                    {(selOp?.pct ?? 0) >= 99 && (
                      <div className="hxcard">
                        <span className="award hex-violet">★</span>
                        <span className="hx-n">TOP 1%</span>
                        <span className="hx-v">LEGEND</span>
                      </div>
                    )}
                    {(selOp?.age ?? 0) >= 100 && (
                      <div className="hxcard">
                        <span className="award hex-cyan">★</span>
                        <span className="hx-n">100 DAYS</span>
                        <span className="hx-v">STREAK</span>
                      </div>
                    )}
                    {(selOp?.recs ?? []).length > 0 && (
                      <div className="hxcard">
                        <span className="award hex-ac">★</span>
                        <span className="hx-n">
                          ×{(selOp?.recs ?? []).length}
                        </span>
                        <span className="hx-v">RECORDS</span>
                      </div>
                    )}
                  </div>
                )}
                {awSlide % 3 === 1 && (
                  <div className="pxbadges big">
                    {isVerifiedOp(selOp?.verif) && (
                      <PixelBadge name="verified" />
                    )}
                    {(() => {
                      const b = selOp ? badgeForPct(selOp.pct) : null;
                      return b ? <PixelBadge name={b} /> : null;
                    })()}
                    {(selOp?.age ?? 0) >= 100 && (
                      <PixelBadge name="days100" />
                    )}
                    {(selOp?.recs ?? []).length > 0 && (
                      <PixelBadge name="tokens10m" />
                    )}
                  </div>
                )}
                {awSlide % 3 === 2 && (
                  <div className="medalct big mono">
                    {(() => {
                      const recs = selOp?.recs ?? [];
                      const g = recs.filter((r) => r.rank === 1).length;
                      const s = recs.filter((r) => r.rank === 2).length;
                      const b = recs.filter((r) => r.rank === 3).length;
                      return (
                        <>
                          <span className="mc g">🥇 {g} GOLD</span>
                          <span className="mc s">🥈 {s} SILVER</span>
                          <span className="mc b">🥉 {b} BRONZE</span>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

          </>
        ) : (
          <p className="drill-note">— SELECT AN OPERATOR</p>
        );
      case "soon":
        return (
          <>
            <div className="soon-h">RECENT</div>
            {recents.length ? (
              recents.map((r) => {
                const rop = ops.find((o) => o.codename === r.codename);
                return (
                  <button
                    key={r.codename}
                    type="button"
                    className="rec-chip"
                    onClick={() => {
                      const k = ops.findIndex(
                        (o) => o.codename === r.codename,
                      );
                      if (k >= 0) handleSelect(k);
                    }}
                  >
                    <span className="rav">
                      {rop?.avatarUrl ? (
                        /* eslint-disable-next-line @next/next/no-img-element --
                           operator avatar URL; 12px chip */
                        <img src={rop.avatarUrl} alt="" loading="lazy" />
                      ) : (
                        r.name[0]
                      )}
                    </span>
                    {r.name}
                  </button>
                );
              })
            ) : (
              <p className="drill-note">— SELECT AN OPERATOR</p>
            )}
            {/* SIGNAL WIRE (owner: "news and updates — welcome people and
                notify of submissions") — newest operator + freshest syncs,
                derived from the live field. */}
            <div className="soon-h">SIGNAL WIRE</div>
            <div className="wire">
              {(() => {
                const newest = [...ops]
                  .filter((o) => o.age != null)
                  .sort((a, b) => (a.age ?? 9e9) - (b.age ?? 9e9))[0];
                const fresh = [...ops]
                  .filter((o) => o.last)
                  .sort((a, b) => (b.last ?? "").localeCompare(a.last ?? ""))
                  .slice(0, 2);
                return (
                  <>
                    {newest && (
                      <p className="wire-line">
                        ◈ welcome <b>{newest.name}</b> — joined the field
                      </p>
                    )}
                    {fresh.map((o) => (
                      <p className="wire-line" key={o.codename}>
                        ▸ <b>{o.name}</b> submitted — {o.last}
                      </p>
                    ))}
                  </>
                );
              })()}
            </div>
            {/* FIELD NOTES (owner: "a text box of the charts or graphs") —
                the board's numbers written as prose, its own box. */}
            <div className="soon-h">FIELD NOTES</div>
            <div className="notes">
              <p className="notes-t">
                {initial.fieldStats
                  .map(
                    (x) =>
                      `${x.field.replace(/_/g, " ").toLowerCase()} ${x.value}`,
                  )
                  .join(" · ")}
              </p>
            </div>
            {/* coming-soon candidates moved to the icon rail (owner pass 3)
                — this module keeps recents only. */}
            <p className="soon-cap">COMING SOON — TEAMS · HACKS · VERSUS live in the rail ↙</p>
          </>
        );
    }
  };

  return (
    <div
      ref={rootRef}
      className={`lbw-root ${lbwFontVars}`}
      data-theme={theme}
      suppressHydrationWarning
    >
      {/* no-flash theme init — applies ?theme=/stored theme to .lbw-root
          pre-paint (SSR always emits "green"); site <html> untouched. */}
      <script dangerouslySetInnerHTML={{ __html: LBW_THEME_INIT }} />
      <div
        className={`app${railOn ? "" : " no-rail"}${leftOn ? "" : " no-left"}`}
      >
        {/* left column: icon rail (owner 2026-10-06 — icons only, hover
            tooltips; signalaf mark = home; avatar at bottom = account/
            settings. Wiki/Blog/Enterprise added; Enterprise → /upsilon,
            the enterprise product surface). Collapse of the labeled
            sidebar is replaced by panel toggles, not a rail-mode. */}
        <aside className="srail min">
          {/* pixel mark (owner 2026-10-06: keep the 4-pixel signalaf mark
              for the board — the § glyph exists in app/icon.svg but the
              pixels are the board's brand). */}
          <Link className="sbrand" href="/" data-tip="signalaf — home" title="signalaf — home">
            <span className="px">
              <i></i>
              <i></i>
              <i></i>
              <i></i>
            </span>
          </Link>
          <nav className="snav" ref={snavRef}>
            {/* icon set (owner 2026-10-06): semantic glyphs — ranked bars,
                scales, trophy, radar rings, ledger, pen, hexagon. */}
            <button
              className="sbtn on"
              data-sec="board"
              data-tip="LEADERBOARD"
              title="LEADERBOARD"
              onClick={() => {
                stageRef.current?.scrollTo({ top: 0 });
              }}
            >
              <RailIcon name="board" set={iconSet} />
            </button>
            <Link className="sbtn" href="/compare" data-tip="COMPARE" title="COMPARE">
              <RailIcon name="compare" set={iconSet} />
            </Link>
            <Link className="sbtn" href="/hall" data-tip="HALL" title="HALL">
              <RailIcon name="hall" set={iconSet} />
            </Link>
            <Link className="sbtn" href="/field" data-tip="FIELD" title="FIELD">
              <RailIcon name="field" set={iconSet} />
            </Link>
            <span className="snav-sep" aria-hidden="true"></span>
            <Link className="sbtn" href="/wiki" data-tip="WIKI" title="WIKI">
              <RailIcon name="wiki" set={iconSet} />
            </Link>
            <Link className="sbtn" href="/blog" data-tip="BLOG" title="BLOG">
              <RailIcon name="blog" set={iconSet} />
            </Link>
            <button
              type="button"
              className="sbtn"
              data-tip="ENTERPRISE"
              title="ENTERPRISE"
              aria-expanded={epromoOpen}
              onClick={(e) => {
                e.stopPropagation();
                setEpromoOpen((v) => !v);
              }}
            >
              <RailIcon name="enterprise" set={iconSet} />
            </button>
            {/* owner (2026-10-06): /enterprise doesn't exist — the icon
                opens a promo card (EKG demo video + blurb → /upsilon). */}
            <EnterprisePromoPop hidden={!epromoOpen} />
            <span className="snav-sep" aria-hidden="true"></span>
            {/* coming-soon candidates live in the rail (owner: "teams
                hacks and versus icons are supposed to be in the nav
                rail") — each opens its mockup description + vote. */}
            {(
              [
                ["teams", "TEAMS"],
                ["hacks", "HACKS"],
                ["versus", "VERSUS"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className="sbtn"
                data-tip={`${label} · SOON`}
                title={`${label} — coming soon`}
                aria-expanded={soonPop === key}
                onClick={(e) => {
                  e.stopPropagation();
                  setSoonPop(soonPop === key ? null : key);
                }}
              >
                <RailIcon name={key} set={iconSet} />
              </button>
            ))}
            {soonPop && (
              <div className="soonpop">
                {(() => {
                  const d = {
                    teams: ["TEAMS", "squad boards + shared stats"],
                    hacks: ["HACKS", "build sprints + vs brackets"],
                    versus: ["VERSUS", "head-to-head operator duels"],
                  }[soonPop as "teams" | "hacks" | "versus"];
                  return (
                    <>
                      <div className="ap-label">{d[0]} — COMING SOON</div>
                      <p className="ap-desc">{d[1]}</p>
                      <button
                        type="button"
                        className="vote"
                        onClick={() =>
                          setSoonVotes((v) => ({
                            ...v,
                            [soonPop]: (v[soonPop] ?? 0) + 1,
                          }))
                        }
                      >
                        ▲ VOTE {soonVotes[soonPop] ?? 0}
                      </button>
                    </>
                  );
                })()}
              </div>
            )}
          </nav>
          <div className="sfoot">
            {/* panel toggles (owner @svg): live in the nav rail and appear
                ONLY when their panel is closed — reopen affordances. */}
            {!leftOn && (
              <button
                type="button"
                className="sbtn laybtn"
                data-tip="SHOW SIDEBAR"
                title="show left sidebar"
                aria-pressed={false}
                onClick={() => setLeftOn(true)}
              >
                <svg width="15" height="15" viewBox="0 0 13 13" aria-hidden="true">
                  <rect x="0.5" y="0.5" width="12" height="12" fill="none" stroke="currentColor" />
                  <rect x="1.5" y="2" width="3.5" height="9" fill="currentColor" stroke="none" />
                </svg>
              </button>
            )}
            {!railOn && (
              <button
                type="button"
                className="sbtn laybtn"
                data-tip="SHOW INSPECTOR"
                title="show inspector rail"
                aria-pressed={false}
                onClick={() => setRailOn(true)}
              >
                <svg width="15" height="15" viewBox="0 0 13 13" aria-hidden="true">
                  <rect x="0.5" y="0.5" width="12" height="12" fill="none" stroke="currentColor" />
                  <rect x="8" y="2" width="3.5" height="9" fill="currentColor" stroke="none" />
                </svg>
              </button>
            )}
            {/* icon-set cycler (owner: "toggle through the icons — all
                4 or 5 sets"): pixel → glyph → emoji → minimal → hex. */}
            <button
              type="button"
              className="sbtn laybtn"
              data-tip={`ICON SET · ${iconSet.toUpperCase()}`}
              title={`rail icons: ${iconSet} — tap to cycle the five sets`}
              onClick={() =>
                setIconSet(
                  ICON_SETS[(ICON_SETS.indexOf(iconSet) + 1) % ICON_SETS.length],
                )
              }
            >
              <span className="gi">⟳</span>
            </button>
            {/* notification bell (owner): placeholder popover until the
                notifications/settings surface exists. */}
            <button
              type="button"
              className="sbtn laybtn"
              data-tip="NOTIFICATIONS"
              title="notifications"
              aria-expanded={notifOpen}
              onClick={(e) => {
                e.stopPropagation();
                setNotifOpen((v) => !v);
              }}
            >
              <svg className="gi" width="15" height="15" viewBox="0 0 14 14" aria-hidden="true">
                <path d="M7 1.5C4.5 1.5 3 3.2 3 5.5c0 2.4-1 3-1 3h10s-1-.6-1-3c0-2.3-1.5-4-4-4Z" fill="none" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M5.6 10.5a1.5 1.5 0 0 0 2.8 0" fill="none" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </button>
            <div className="notifpop" hidden={!notifOpen}>
              <span className="ap-item mut">— NOTHING YET · SIGNAL SOON</span>
            </div>
            {/* owner (pass 3): theme swatches moved into the settings
                menu — the rail foot keeps only utility controls. */}
            <div className="sacct" ref={acctRef}>
              {/* owner: neutral mark when signed out; when signed in the
                  avatar becomes the user's highest achieved block badge.
                  TODO(wire): map acct → operator badge tier when the
                  account payload carries pct/verif. */}
              <button
                className="avatar"
                title="account — settings"
                data-tip={acct.mode === "out" ? "SIGN IN" : acct.name}
                onClick={(e) => {
                  e.stopPropagation();
                  setAcctPop((v) => !v);
                }}
              >
                {/* owner's highest ranking badge — match the signed-in
                    name to the field; falls back to the verified block
                    when the acct doesn't map to a row yet. */}
                {acct.mode === "in" ? (
                  <PixelBadge
                    name={
                      badgeForPct(
                        ops.find((o) => o.name === acct.name)?.pct,
                      ) ?? "verified"
                    }
                  />
                ) : (
                  acctInitials
                )}
              </button>
              <div className="acctpop" hidden={!acctPop}>
                <div className="ap-label">THEMES</div>
                <div className="themesw ap-themes">
                  {THEMES.map((t) => (
                    <button
                      key={t}
                      className={`sw sw-${t}${t === theme ? " on" : ""}`}
                      title={t}
                      onClick={() => {
                        setTheme(t);
                        persistLbwTheme(t);
                        liveTrack.themeChanged(t);
                      }}
                    />
                  ))}
                </div>
                {acct.mode === "out" && (
                  <a className="ap-item" href="/login">
                    SIGN IN →
                  </a>
                )}
                {acct.mode === "loading" && (
                  <span className="ap-item mut">···</span>
                )}
                {(acct.mode === "in" || acct.mode === "override") && (
                  <>
                    <a className="ap-item" href="/me">
                      MY SIGNAL
                    </a>
                    <a className="ap-item" href="/settings">
                      SETTINGS
                    </a>
                    <a className="ap-item" href="/settings">
                      API KEYS
                    </a>
                  </>
                )}
                {acct.mode === "nolink" && (
                  <>
                    <a className="ap-item" href="/me">
                      CLAIM SIGNAL
                    </a>
                    <a className="ap-item" href="/settings">
                      SETTINGS
                    </a>
                  </>
                )}
                {(acct.mode === "in" ||
                  acct.mode === "nolink" ||
                  acct.mode === "override") && (
                  <button
                    className="ap-item mut"
                    type="button"
                    onClick={onSignOut}
                  >
                    SIGN OUT
                  </button>
                )}
              </div>
            </div>
          </div>
        </aside>

        <div className="maincol">
          {/* owner 2026-10-06: no single-bar header — four columns only
              (rail | sidebar | stage | inspector). The title moved to the
              stage top; panel toggles live in the icon rail and appear
              only when their panel is closed. */}

          <div className="mid">
            {/* left sidebar (owner 2026-10-06): banner + operator profile —
                VS Code side-panel anatomy, toggled by the title-bar glyph. */}
            <aside className="lside">
              {/* ear-flap (owner): ghost tab mid-edge — click collapses the
                  sidebar, drag resizes it (VS Code sash pattern). */}
              <button
                type="button"
                className="edge edge-l"
                title="collapse sidebar · drag to resize"
                aria-label="collapse left sidebar; drag to resize"
                onPointerDown={onDrag("l")}
              >
                ◂
              </button>
              {/* single fixed header line — one centered label per column
                  (owner 2026-10-06): SIGNALAF over the left column; its own
                  sidebar sub-header is BURNERS, BUILDERS & 10XERS. */}
              <div className="colhead">SIGNALAF</div>
              <div className="railhead">BURNERS, BUILDERS &amp; 10XERS</div>
              <div className="rail">
                {/* owner 2026-10-06 (annotation): TOP MOVERS swaps places
                    with OPERATOR PROFILE — movers live in the left sidebar
                    under the banner; profile moved to the inspector rail. */}
                <div className="mod">
                  <h3>
                    <span className="sq"></span>TOP MOVERS
                  </h3>
                  <RotatingMovers
                    ops={ops}
                    server={initial.movers}
                    onSelect={handleSelect}
                  />
                </div>
                {/* owner (annotation pass 3): "add compare to this side" —
                    the compare module joins the left sidebar. */}
                <div className="mod">
                  <h3>
                    <span className="sq"></span>COMPARE OPERATORS
                  </h3>
                  {railBody("compare")}
                </div>
                {/* owner (pass 3): "hall of signal is supposed to be in the
                    left sidebar" — spotlight + medal tally join the burners
                    column. */}
                <div className="mod">
                  <h3>
                    <span className="sq"></span>HALL OF SIGNAL
                  </h3>
                  {railBody("hall")}
                </div>
              </div>
            </aside>

            <div className="stagecol">
              {/* page title — stage top, centered over the board column
                  (the top chrome bar is gone; the title is the page h1). */}
              <div className="stitle">
                <h1 className="pagetitle">
                  {COPY.heroTitleA}
                  <em>{COPY.heroTitleB}</em>
                </h1>
              </div>
              {/* filter bar — breaks at leaderboard edge */}
              <div className="fbar">
                <div className="seg">
                  <button
                    className={wfSel === "hitl" ? "on" : ""}
                    onClick={() => {
                      setWfSel("hitl");
                      liveTrack.modeChanged("hitl");
                    }}
                  >
                    HITL
                  </button>
                  <span className="sep"></span>
                  <button
                    className={wfSel === "hybrid" ? "on" : ""}
                    onClick={() => {
                      setWfSel("hybrid");
                      liveTrack.modeChanged("hybrid");
                    }}
                  >
                    Hybrid
                  </button>
                  <span className="sep"></span>
                  <button
                    className={wfSel === "agentic" ? "on" : ""}
                    onClick={() => {
                      setWfSel("agentic");
                      liveTrack.modeChanged("agentic");
                    }}
                  >
                    Agentic
                  </button>
                </div>
                {/* owner 2026-10-06: dropdown labels removed — the selects
                    are self-describing; dropping .fl killed the dead space.
                    SORT select removed too — every column header sorts now;
                    the ▲▼ chip remains as the compact direction control. */}
                <span className="fb">
                  <select
                    aria-label="Window"
                    title="Window"
                    value={windowSel}
                    onChange={(e) => onWindowSel(e.target.value)}
                  >
                    {CONTROLS.windows.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </span>
                <span className="fb">
                  <select
                    aria-label="Platform"
                    title="Platform"
                    value={platformSel}
                    onChange={(e) => setPlatformSel(e.target.value)}
                  >
                    {CONTROLS.platforms.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </span>
                <span className="fb">
                  <select
                    aria-label="Class"
                    title="Class"
                    value={classSel}
                    onChange={(e) => setClassSel(e.target.value)}
                  >
                    {CONTROLS.classes.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </span>
                <span className="fb">
                  <button
                    type="button"
                    className="sdir"
                    title={`${sortSel} — ${SORT_ASC.has(sortSel) !== sortFlip ? "ascending" : "descending"}; click to flip`}
                    aria-label="toggle sort direction"
                    onClick={() => setSortFlip((f) => !f)}
                  >
                    {SORT_ASC.has(sortSel) !== sortFlip ? "▲" : "▼"}
                  </button>
                </span>
                <span className="fb">
                  <input
                    aria-label="Search operators"
                    placeholder="operator or codename…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </span>
                <span className="fb-sp"></span>
              </div>

              <main className="stage" ref={stageRef}>
                <div className="board">
                  {/* LB-03/04/05 operator dock (starts docked in rail) */}
                  {profile && (
                    <OperatorDock
                      key={selected}
                      d={profile}
                      docked={docked}
                      onToggleDock={toggleDock}
                      population={pop}
                      detail={selDetail}
                      detailStatus={selDetailStatus}
                      radarBaseline={radarBaseline}
                    />
                  )}

                  {/* LB-10/11/12 leaderboard table — center stage */}
                  <section className="tablecard">
                    <table className="board-t">
                      <thead>
                        <BoardHead
                          mode={colMode}
                          sortKey={sortSel}
                          sortDir={
                            SORT_ASC.has(sortSel) !== sortFlip
                              ? "asc"
                              : "desc"
                          }
                          onSort={onSortColumn}
                        />
                      </thead>
                      <tbody>
                        {pageRows.map(([o, i], d) => (
                          <BoardRow
                            key={`${i}-${o.codename}`}
                            o={o}
                            i={i}
                            r={viewMode === "ops" ? i + 1 : pageStart + d + 1}
                            viewMode={viewMode}
                            colMode={colMode}
                            tt={tt}
                            rawRank={rawRank[i] ?? i + 1}
                            selected={selected === i}
                            onSelect={handleSelect}
                          />
                        ))}
                        {ordered.length === 0 && (
                          <tr className="board-empty">
                            <td colSpan={colMode === "metrics" ? 13 : 11}>
                              {fieldState === "loading"
                                ? "⟳ SYNCING FIELD…"
                                : filtered
                                  ? "— NO ROWS MATCH THE CURRENT FILTER"
                                  : "— NO OPERATORS IN THIS SCOPE"}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                    <div className="pgn">
                      <span className="pgl">
                        {ordered.length === 0 ? (
                          <>
                            {ops.length === 0
                              ? "No operators on this board"
                              : "No rows match the current filter"}
                          </>
                        ) : (
                          <>
                            Showing {pageStart + 1}–
                            {pageStart + pageRows.length} of{" "}
                            {filtered
                              ? `${ordered.length.toLocaleString()} filtered`
                              : pop.count.toLocaleString()}{" "}
                            operators
                          </>
                        )}{" "}
                        · {pop.tag}
                        {fieldState === "loading" && (
                          <span className="pgstat" role="status">
                            {" "}
                            · ⟳ SYNCING FIELD…
                          </span>
                        )}
                        {fieldState === "error" && (
                          <span className="pgstat pgerr" role="alert">
                            {" "}
                            · FIELD SYNC FAILED — CLICK A PAGE TO RETRY
                          </span>
                        )}
                      </span>
                      {/* owner 2026-10-06: pages centered + clickable; the
                          Metrics/Raw (tokens) toggle lives in the table's
                          chrome row, not the filter bar. */}
                      <div className="seg pgn-seg">
                        <button
                          className={colMode === "metrics" ? "on" : ""}
                          onClick={() => setColMode("metrics")}
                        >
                          Metrics
                        </button>
                        <span className="sep"></span>
                        <button
                          className={colMode === "raw" ? "on" : ""}
                          onClick={() => setColMode("raw")}
                        >
                          Raw
                        </button>
                      </div>
                      <span className="pages">
                        {[1, 2, 3]
                          .filter((n) => n <= lastPage)
                          .map((n) => (
                            <button
                              key={n}
                              className={pageNow === n ? "on" : ""}
                              aria-current={pageNow === n ? "page" : undefined}
                              onClick={() => onPage(n)}
                            >
                              {n}
                            </button>
                          ))}
                        {pageNow > 3 && pageNow < lastPage && (
                          <button
                            className="on"
                            aria-current="page"
                            onClick={() => onPage(pageNow)}
                          >
                            {pageNow}
                          </button>
                        )}
                        {lastPage > 3 && (
                          <button
                            aria-label="Next page"
                            title="Next page"
                            disabled={page >= totalPages}
                            onClick={() => onPage(page + 1)}
                          >
                            …
                          </button>
                        )}
                        {lastPage > 3 && (
                          <button
                            className={pageNow === lastPage ? "on" : ""}
                            aria-current={
                              pageNow === lastPage ? "page" : undefined
                            }
                            onClick={() => onPage(lastPage)}
                          >
                            {lastPage}
                          </button>
                        )}
                      </span>
                      <button
                        type="button"
                        className="exp"
                        disabled={ordered.length === 0}
                        title="Download the loaded + sorted field as CSV"
                        onClick={exportCsv}
                      >
                        ⬇ Export CSV
                      </button>
                    </div>
                  </section>
                </div>
              </main>
            </div>

            {/* right rail: heading + swappable modules (share, movers,
                compare, field, hall — owner 2026-10-06 IA) */}
            <aside className="railcol">
              <button
                type="button"
                className="edge edge-r"
                title="collapse inspector · drag to resize"
                aria-label="collapse inspector rail; drag to resize"
                onPointerDown={onDrag("r")}
              >
                ▸
              </button>
              <div className="colhead">SIGRANK</div>
              <div className="railhead">OPERATOR</div>
              <div className="rail">
                {visibleRail.map((id) =>
                  (
                    <div className="mod" key={id}>
                      <h3>
                        <span className="sq"></span>
                        {RAIL_TITLE[id]}
                        <span className="mvbtns">
                          <button
                            className="mvbtn"
                            title="move up"
                            onClick={() => moveModule(id, -1)}
                          >
                            ▲
                          </button>
                          <button
                            className="mvbtn"
                            title="move down"
                            onClick={() => moveModule(id, 1)}
                          >
                            ▼
                          </button>
                          <button
                            className="xbtn"
                            title="hide module"
                            onClick={() => hideModule(id)}
                          >
                            ✕
                          </button>
                        </span>
                      </h3>
                      {railBody(id)}
                    </div>
                  ),
                )}
                <div className={`rtray${hiddenIds.length ? "" : " rhide"}`}>
                  <span className="rl">HIDDEN MODULES</span>
                  {railOrder
                    .filter((id) => hiddenIds.includes(id))
                    .map((id) => (
                      <button
                        key={id}
                        className="rbtn"
                        onClick={() => restoreModule(id)}
                      >
                        {RAIL_TITLE[id]}
                      </button>
                    ))}
                </div>
              </div>
            </aside>
          </div>

          {/* collapsible footer */}
          <footer className={`ftr${ftrMin ? " min" : ""}`}>
            <button className="fmin" onClick={() => setFtrMin((v) => !v)}>
              {ftrMin ? "▸ LINKS" : "▾ LINKS"}
            </button>
            <div className="flinks">
              <Link href="/board/all">LEADERBOARD</Link>
              <a href={cmpHref}>COMPARE</a>
              <a href="/hall">HALL</a>
              <a href="/me">PROFILE</a>
              {/* WRAPPED dropped — no production surface ships under that
                  name; SHARE renders only when a real /s/<codename> share
                  target exists (no dead "#" anchors). */}
              {selOp && (
                <a href={`/s/${encodeURIComponent(selOp.slug)}`}>SHARE</a>
              )}
              <span className="sep">·</span>
              <a href="/methodology">METHODOLOGY</a>
              <a href="/developers">API</a>
              <a href="/privacy">PRIVACY</a>
              <a href="https://www.npmjs.com/package/sigrank">npx sigrank</a>
            </div>
            <span className="fsig">
              SIGNALAF × SIGRANK — production live board
              {initial.meta.ruleset ? ` · RULESET ${initial.meta.ruleset}` : ""}{" "}
              · <span>{fmode}</span> · POWERED BY MO§ES™ ·{" "}
              <span>{COPY.privacy.toUpperCase()}</span>
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default LiveBoardWorkspace;
