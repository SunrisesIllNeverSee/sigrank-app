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
  LiveBoardInitialState,
  LiveOperator,
} from "@/lib/board/live-types";
import { lbwFontVars } from "./fonts";
import "./proto-scoped.css";
import { BoardHead, BoardRow, type ColMode, type ViewMode } from "./rows";
import { EnterprisePromoPop } from "./EnterprisePromo";
import { OperatorDock, OperatorProfileTile, SharePreview } from "./OperatorDock";
import { MoversRail, moverRows } from "./MoversRail";
import { HallRail, hallRows } from "./HallRail";
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
  opRadar,
  persistLbwTheme,
  profileFor,
  rawRankMap,
  resolveLbwTheme,
  rmaxOf,
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
type RailId = "profile" | "field" | "hall" | "compare" | "movers" | "share";
/* Right-rail module order (owner 2026-10-06): interactive share, movement,
   compare, then field context — the profile module moved to the left
   sidebar ("banner + op profile"), which is why "profile" is absent. */
const BASE_RAIL_ORDER: RailId[] = ["share", "movers", "compare", "field", "hall"];
const RAIL_TITLE: Record<RailId, string> = {
  profile: "OPERATOR PROFILE",
  field: "FIELD",
  hall: "HALL OF SIGNAL",
  compare: "COMPARE OPERATORS",
  movers: "TOP MOVERS · 7D",
  share: "SHARE YOUR SIGNAL",
};

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
  const onSortColumn = useCallback((key: string) => {
    setSortSel((prev) => {
      if (prev === key) {
        setSortFlip((f) => !f);
        return prev;
      }
      setSortFlip(false);
      return key;
    });
  }, []);
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
  const movers = useMemo(() => moverRows(initial.movers, ops), [initial.movers, ops]);
  const hall = useMemo(
    () => hallRows(initial.hall, ops, initial.featured?.name),
    [initial.hall, ops, initial.featured],
  );

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

  const emStat = (field: string) => field === "top_yield";

  const railBody = (id: RailId) => {
    switch (id) {
      case "profile":
        return profile ? <OperatorProfileTile d={profile} /> : null;
      case "field":
        return (
          <div className="fgrid">
            {initial.fieldStats.map((s) => (
              <div className="fcell" key={s.field}>
                <div className="n">
                  {emStat(s.field) ? <em>{s.value}</em> : s.value}
                </div>
                <div className="l">
                  {s.field.replace(/_/g, " ").toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        );
      case "hall":
        return <HallRail rows={hall} onSelect={handleSelect} />;
      case "compare":
        return (
          <>
            <div className="cmp-slots">
              {Array.from({ length: COMPARE_SLOTS }, (_, k) => (
                <div className="cmp-slot" key={k}>
                  {k === 0 && selOp ? selOp.codename[0] : "+"}
                </div>
              ))}
            </div>
            <a className="btn" href={cmpHref}>
              {COMPARE_CTA}
            </a>
          </>
        );
      case "movers":
        return <MoversRail rows={movers} onSelect={handleSelect} />;
      case "share":
        return profile ? (
          <SharePreview d={profile} population={pop} />
        ) : (
          <p className="drill-note">— SELECT AN OPERATOR</p>
        );
    }
  };

  return (
    <div
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
          <Link className="sbrand" href="/" data-tip="signalaf — home" title="signalaf — home">
            <span className="px">
              <i></i>
              <i></i>
              <i></i>
              <i></i>
            </span>
          </Link>
          <nav className="snav" ref={snavRef}>
            <button
              className="sbtn on"
              data-sec="board"
              data-tip="LEADERBOARD"
              title="LEADERBOARD"
              onClick={() => {
                stageRef.current?.scrollTo({ top: 0 });
              }}
            >
              <span className="gi">▦</span>
            </button>
            <Link className="sbtn" href="/compare" data-tip="COMPARE" title="COMPARE">
              <span className="gi">⇄</span>
            </Link>
            <Link className="sbtn" href="/hall" data-tip="HALL" title="HALL">
              <span className="gi">⬡</span>
            </Link>
            <Link className="sbtn" href="/field" data-tip="FIELD" title="FIELD">
              <span className="gi">◎</span>
            </Link>
            <span className="snav-sep" aria-hidden="true"></span>
            <Link className="sbtn" href="/wiki" data-tip="WIKI" title="WIKI">
              <span className="gi">▤</span>
            </Link>
            <Link className="sbtn" href="/blog" data-tip="BLOG" title="BLOG">
              <span className="gi">✎</span>
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
              <span className="gi">▣</span>
            </button>
            {/* owner (2026-10-06): /enterprise doesn't exist — the icon
                opens a promo card (EKG demo video + blurb → /upsilon). */}
            <EnterprisePromoPop hidden={!epromoOpen} />
          </nav>
          <div className="sfoot">
            <div className="themesw">
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
            <div className="sacct" ref={acctRef}>
              <button
                className="avatar"
                title="account — settings"
                data-tip={acct.mode === "out" ? "SIGN IN" : acct.name}
                onClick={(e) => {
                  e.stopPropagation();
                  setAcctPop((v) => !v);
                }}
              >
                {acctInitials}
              </button>
              <div className="acctpop" hidden={!acctPop}>
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
          {/* header: page title left, kicker right */}
          <header className="nav">
            <span className="pagetitle">
              {COPY.heroTitleA}
              <em>{COPY.heroTitleB}</em>
            </span>
            <div className="nav-right">
              <span className="hkicker">{COPY.heroKicker}</span>
              {/* layout toggles (VS Code quick-pick pattern): left sidebar +
                  inspector rail on/off — explicit control, never media-query. */}
              <button
                type="button"
                className={`layout-tg${leftOn ? " on" : ""}`}
                title={leftOn ? "hide left sidebar" : "show left sidebar"}
                aria-pressed={leftOn}
                onClick={() => setLeftOn((v) => !v)}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true">
                  <rect x="0.5" y="0.5" width="12" height="12" fill="none" stroke="currentColor" />
                  <rect x="1.5" y="2" width="3.5" height="9" fill="currentColor" stroke="none" />
                </svg>
              </button>
              <button
                type="button"
                className={`layout-tg${railOn ? " on" : ""}`}
                title={railOn ? "hide inspector rail" : "show inspector rail"}
                aria-pressed={railOn}
                onClick={() => setRailOn((v) => !v)}
              >
                <svg width="13" height="13" viewBox="0 0 13 13" aria-hidden="true">
                  <rect x="0.5" y="0.5" width="12" height="12" fill="none" stroke="currentColor" />
                  <rect x="8" y="2" width="3.5" height="9" fill="currentColor" stroke="none" />
                </svg>
              </button>
            </div>
          </header>

          <div className="mid">
            {/* left sidebar (owner 2026-10-06): banner + operator profile —
                VS Code side-panel anatomy, toggled by the title-bar glyph. */}
            <aside className="lside">
              <div className="railhead">
                <span className="sq"></span>SIGNALAF
              </div>
              <div className="rail">
                <div className="mod">
                  <h3>
                    <span className="sq"></span>BANNER
                  </h3>
                  <div className="lside-banner">
                    <section className="hero">
                      <div className="kicker">{COPY.heroKicker}</div>
                      <h1>
                        {COPY.heroTitleA}
                        <em>{COPY.heroTitleB}</em>
                      </h1>
                    </section>
                    <section className="strip">
                      {initial.fieldStats.map((s) => (
                        <div className="cell" key={s.field}>
                          <div className="v">
                            {emStat(s.field) ? <em>{s.value}</em> : s.value}
                          </div>
                          <div className="l">
                            {s.field.replace(/_/g, " ").toUpperCase()}
                          </div>
                        </div>
                      ))}
                    </section>
                  </div>
                </div>
                <div className="mod">
                  <h3>
                    <span className="sq"></span>OPERATOR PROFILE
                    <button className="dock" onClick={toggleDock}>
                      ⇄ FEATURE
                    </button>
                  </h3>
                  {profile ? (
                    docked ? (
                      <OperatorProfileTile d={profile} />
                    ) : (
                      <button
                        type="button"
                        className="btn ghost lside-redock"
                        onClick={toggleDock}
                        title="re-dock the operator card"
                      >
                        ⇄ FLOATING — RE-DOCK
                      </button>
                    )
                  ) : (
                    <p className="drill-note">— SELECT AN OPERATOR</p>
                  )}
                </div>
              </div>
            </aside>

            <div className="stagecol">
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
                <span className="fb">
                  <span className="fl">WINDOW</span>
                  <select
                    value={windowSel}
                    onChange={(e) => onWindowSel(e.target.value)}
                  >
                    {CONTROLS.windows.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </span>
                <span className="fb">
                  <span className="fl">PLATFORM</span>
                  <select
                    value={platformSel}
                    onChange={(e) => setPlatformSel(e.target.value)}
                  >
                    {CONTROLS.platforms.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </span>
                <span className="fb">
                  <span className="fl">CLASS</span>
                  <select
                    value={classSel}
                    onChange={(e) => setClassSel(e.target.value)}
                  >
                    {CONTROLS.classes.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </span>
                <span className="fb">
                  <span className="fl">SORT</span>
                  <select
                    value={sortSel}
                    onChange={(e) => {
                      setSortSel(e.target.value);
                      setSortFlip(false);
                    }}
                  >
                    {CONTROLS.sorts.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                  {/* direction chip — symmetric with the select; flips the
                      effective asc/desc off the column's SORT_ASC default. */}
                  <button
                    type="button"
                    className="sdir"
                    title={`direction — ${SORT_ASC.has(sortSel) !== sortFlip ? "ascending" : "descending"}; click to flip`}
                    aria-label="toggle sort direction"
                    onClick={() => setSortFlip((f) => !f)}
                  >
                    {SORT_ASC.has(sortSel) !== sortFlip ? "▲" : "▼"}
                  </button>
                </span>
                <span className="fb">
                  <span className="fl">SEARCH</span>
                  <input
                    placeholder="operator or codename…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </span>
                <span className="fb-sp"></span>
                <div className="seg">
                  <button
                    className={colMode === "metrics" ? "on" : ""}
                    onClick={() => setColMode("metrics")}
                  >
                    Metrics · the cascade
                  </button>
                  <span className="sep"></span>
                  <button
                    className={colMode === "raw" ? "on" : ""}
                    onClick={() => setColMode("raw")}
                  >
                    Raw · the fuel
                  </button>
                </div>
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
              <div className="railhead">
                <span className="sq"></span>INSPECTOR
              </div>
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
