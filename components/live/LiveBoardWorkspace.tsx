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
 *     opRadar, derived movers, tt1..tt3 top-3 heat, ops/outliers view
 *   - workspace renders ALL operators it is given; sort/filter/search are
 *     client-side over the supplied array (the prototype shipped the
 *     controls as chrome; the port wires the field-side ones: SORT/CLASS/
 *     PLATFORM/SEARCH; WINDOW is route-owned → onWindowChange)
 *   - fetchMore(page) / fetchDetail(codename) are optional async hooks for
 *     the WS-3/WS-4 wiring — the component is fully standalone on `initial`
 *
 * Nav note: the task spec fixes the X-rail nav to Leaderboard / Compare /
 * Hall / Field (reference-v1's inert PROFILE/WRAPPED buttons and the
 * share.html link are dropped — Share lives on the dock's SHARE tab).
 */
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
import { OperatorDock, OperatorProfileTile, SharePreview } from "./OperatorDock";
import { MoversRail, moverRows } from "./MoversRail";
import { HallRail, hallRows } from "./HallRail";
import {
  COMPARE_CTA,
  COMPARE_SLOTS,
  CONTROLS,
  COPY,
  SORT_ASC,
  SORT_KEY,
  THEMES,
  WINDOW_SLUG,
  computeTT,
  profileFor,
  rawRankMap,
  rmaxOf,
  windowLabel,
  type ThemeName,
} from "./utils";

export interface LiveBoardWorkspaceProps {
  /** SSR payload — see lib/board/live-types.ts. */
  initial: LiveBoardInitialState;
  /** WS-3: fetch page N of the field; returned rows append to the board. */
  fetchMore?: (
    page: number,
  ) => Promise<LiveOperator[] | void> | LiveOperator[] | void;
  /** WS-4: fetch detail for the selected operator's drill tabs. */
  fetchDetail?: (
    codename: string,
  ) => Promise<Partial<LiveOperator> | void> | Partial<LiveOperator> | void;
  /** WINDOW select override — default navigates to /board/<slug>. */
  onWindowChange?: (windowSlug: string) => void;
  /** LB-01 account chrome (D-A01/D-A02 placeholder identity). */
  account?: { name: string; rank: string };
}

/* rail module ids — reference module order: field, hall, compare, movers,
   share; "profile" is inserted first while the operator is docked. */
type RailId = "profile" | "field" | "hall" | "compare" | "movers" | "share";
const BASE_RAIL_ORDER: RailId[] = ["field", "hall", "compare", "movers", "share"];
const RAIL_TITLE: Record<RailId, string> = {
  profile: "OPERATOR PROFILE",
  field: "FIELD",
  hall: "HALL OF SIGNAL",
  compare: "COMPARE OPERATORS",
  movers: "TOP MOVERS · 7D",
  share: "SHARE YOUR SIGNAL",
};

const DEFAULT_ACCOUNT = { name: "Alex Operator", rank: "#842" };

export function LiveBoardWorkspace({
  initial,
  fetchMore,
  fetchDetail,
  onWindowChange,
  account = DEFAULT_ACCOUNT,
}: LiveBoardWorkspaceProps) {
  /* ---------- theme switch (LB-20) — ?theme= param, state lives on the
     .lbw-root element's data-theme (prototype used documentElement; the
     port scopes it so the site theme on <html> is untouched) ---------- */
  const [theme, setTheme] = useState<ThemeName>(() => {
    if (typeof window === "undefined") return "green";
    const q = new URLSearchParams(window.location.search).get("theme");
    return (THEMES as readonly string[]).includes(q ?? "")
      ? (q as ThemeName)
      : "green";
  });

  /* ---------- field data (all client-side over the supplied array) --- */
  const [extraOps, setExtraOps] = useState<LiveOperator[]>([]);
  const ops = useMemo(
    () => (extraOps.length ? [...initial.operators, ...extraOps] : initial.operators),
    [initial.operators, extraOps],
  );
  const rmax = useMemo(() => rmaxOf(initial.fieldMax), [initial.fieldMax]);
  const tt = useMemo(() => computeTT(ops), [ops]);
  const rawRank = useMemo(() => rawRankMap(ops), [ops]);

  /* ---------- board state ---------- */
  const [viewMode, setViewMode] = useState<ViewMode>("ops");
  const [colMode, setColMode] = useState<ColMode>("metrics");
  const [bannerOn, setBannerOn] = useState(false);
  const [windowSel, setWindowSel] = useState(() =>
    windowLabel(initial.meta.window),
  );
  const [platformSel, setPlatformSel] = useState<string>(CONTROLS.platforms[0]);
  const [classSel, setClassSel] = useState<string>(CONTROLS.classes[0]);
  const [sortSel, setSortSel] = useState<string>(CONTROLS.sorts[0]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  /* ---------- selected operator + dock ---------- */
  const [selected, setSelected] = useState<number>(() =>
    initial.featured ? -1 : initial.operators.length ? 0 : -1,
  );
  const [docked, setDocked] = useState(true); // reference: starts docked
  const profile = useMemo(
    () => profileFor(initial, ops, selected, rmax),
    [initial, ops, selected, rmax],
  );

  /* ---------- rail module stack (reorderable + hideable) ---------- */
  const [railOrder, setRailOrder] = useState<RailId[]>([
    "profile",
    ...BASE_RAIL_ORDER,
  ]);
  const [hiddenIds, setHiddenIds] = useState<RailId[]>([]);
  const visibleRail = railOrder.filter((id) => !hiddenIds.includes(id));

  const toggleDock = useCallback(() => {
    setDocked((prev) => {
      const next = !prev;
      setRailOrder((o) =>
        next
          ? ["profile", ...o.filter((id) => id !== "profile")]
          : o.filter((id) => id !== "profile"),
      );
      return next;
    });
  }, []);

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
          o.handle.toLowerCase().includes(q),
      );
    }
    if (classSel !== "All Classes") {
      arr = arr.filter(
        ([o]) => o.klass === classSel || o.klass.startsWith(`${classSel} `),
      );
    }
    if (platformSel !== "All Platforms") {
      const key = platformSel.toLowerCase().split(" ")[0];
      arr = arr.filter(([o]) => o.platform.toLowerCase().includes(key));
    }
    if (viewMode === "out") {
      return [...arr].sort((a, b) => b[0].dev - a[0].dev);
    }
    const fn = SORT_KEY[sortSel];
    if (fn && sortSel !== "Yield") {
      const asc = SORT_ASC.has(sortSel);
      arr = [...arr].sort((a, b) =>
        asc ? fn(a[0]) - fn(b[0]) : fn(b[0]) - fn(a[0]),
      );
    }
    return arr;
  }, [ops, search, classSel, platformSel, viewMode, sortSel]);

  /* ---------- chrome state ---------- */
  const [railMin, setRailMin] = useState(false);
  const [acctPop, setAcctPop] = useState(false);
  const [ftrMin, setFtrMin] = useState(false);
  const stageRef = useRef<HTMLElement | null>(null);
  const acctRef = useRef<HTMLDivElement | null>(null);

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

  const router = useRouter();
  const onWindowSel = useCallback(
    (label: string) => {
      setWindowSel(label);
      const slug = WINDOW_SLUG[label];
      if (!slug) return;
      if (onWindowChange) {
        onWindowChange(slug);
      } else {
        router.push(`/board/${slug}`);
      }
    },
    [onWindowChange, router],
  );

  const onPage = useCallback(
    (n: number) => {
      setPage(n);
      if (!fetchMore) return;
      Promise.resolve(fetchMore(n))
        .then((rows) => {
          if (rows && rows.length) {
            setExtraOps((x) => [...x, ...rows]);
          }
        })
        .catch(() => {});
    },
    [fetchMore],
  );

  const acctInitials = account.name
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const pop = initial.population;
  const lastPage = Math.ceil(pop.count / 10);
  const fmode = initial.meta.generatedAt
    ? `live data · synced ${initial.meta.generatedAt}`
    : "fixture data";
  const shown =
    ordered.length > 10
      ? ordered.length.toLocaleString()
      : ordered.length === 0
        ? "0"
        : `1–${ordered.length}`;

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
        return <HallRail rows={hall} onSelect={setSelected} />;
      case "compare":
        return (
          <>
            <div className="cmp-slots">
              {Array.from({ length: COMPARE_SLOTS }, (_, k) => (
                <div className="cmp-slot" key={k}>
                  +
                </div>
              ))}
            </div>
            <a className="btn" href="/compare">
              {COMPARE_CTA}
            </a>
          </>
        );
      case "movers":
        return <MoversRail rows={movers} onSelect={setSelected} />;
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
      <div className="app">
        {/* left column: brand / nav / account (collapsible to icons) */}
        <aside className={`srail${railMin ? " min" : ""}`}>
          <div className="sbrand">
            <span className="px">
              <i></i>
              <i></i>
              <i></i>
              <i></i>
            </span>
            <span className="sbname">signalaf</span>
          </div>
          <nav className="snav">
            <button
              className="sbtn on"
              data-sec="board"
              onClick={() => {
                stageRef.current?.scrollTo({ top: 0 });
              }}
            >
              <span className="gi">▦</span>
              <span className="gl">LEADERBOARD</span>
            </button>
            <a className="sbtn" href="/compare">
              <span className="gi">⧉</span>
              <span className="gl">COMPARE</span>
            </a>
            <a className="sbtn" href="/hall">
              <span className="gi">⬡</span>
              <span className="gl">HALL</span>
            </a>
            <a className="sbtn" href="/field">
              <span className="gi">▤</span>
              <span className="gl">FIELD</span>
            </a>
          </nav>
          <div className="sfoot">
            <div className="themesw">
              {THEMES.map((t) => (
                <button
                  key={t}
                  className={`sw sw-${t}${t === theme ? " on" : ""}`}
                  title={t}
                  onClick={() => setTheme(t)}
                />
              ))}
            </div>
            <div className="sacct" ref={acctRef}>
              <button
                className="avatar"
                title="account"
                onClick={(e) => {
                  e.stopPropagation();
                  setAcctPop((v) => !v);
                }}
              >
                {acctInitials}
              </button>
              <div className="aid">
                <span className="aname">{account.name}</span>
                <span className="arank mono">{account.rank}</span>
              </div>
              <div className="acctpop" hidden={!acctPop}>
                <a className="ap-item" href="/me">
                  MY SIGNAL
                </a>
                <a className="ap-item" href="/settings">
                  SETTINGS
                </a>
                <button className="ap-item" type="button">
                  API KEYS
                </button>
                <button className="ap-item mut" type="button">
                  SIGN OUT
                </button>
              </div>
            </div>
            <button
              className="smin"
              title={railMin ? "expand sidebar" : "collapse to icons"}
              onClick={() => setRailMin((v) => !v)}
            >
              {railMin ? "»" : "«"}
            </button>
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
            </div>
          </header>

          <div className="mid">
            <div className="stagecol">
              {/* filter bar — breaks at leaderboard edge */}
              <div className="fbar">
                <div className="seg">
                  <button
                    className={viewMode === "ops" ? "on" : ""}
                    onClick={() => setViewMode("ops")}
                  >
                    Operators
                  </button>
                  <span className="sep"></span>
                  <button
                    className={viewMode === "out" ? "on" : ""}
                    onClick={() => setViewMode("out")}
                  >
                    Outliers
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
                    onChange={(e) => setSortSel(e.target.value)}
                  >
                    {CONTROLS.sorts.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
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
                <button
                  className={`ctlbtn${bannerOn ? " on" : ""}`}
                  title="toggle banner block"
                  onClick={() => setBannerOn((v) => !v)}
                >
                  {bannerOn ? "▣ BANNER" : "▢ BANNER"}
                </button>
              </div>

              <main className="stage" ref={stageRef}>
                {/* optional banner block (user toggle) */}
                <div className="banner" hidden={!bannerOn}>
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

                <div className="board">
                  {/* LB-03/04/05 operator dock (starts docked in rail) */}
                  {profile && (
                    <OperatorDock
                      key={selected}
                      d={profile}
                      docked={docked}
                      onToggleDock={toggleDock}
                      population={pop}
                      fetchDetail={fetchDetail}
                    />
                  )}

                  {/* LB-10/11/12 leaderboard table — center stage */}
                  <section className="tablecard">
                    <table className="board-t">
                      <thead>
                        <BoardHead mode={colMode} />
                      </thead>
                      <tbody>
                        {ordered.map(([o, i], d) => (
                          <BoardRow
                            key={`${i}-${o.codename}`}
                            o={o}
                            i={i}
                            r={viewMode === "ops" ? i + 1 : d + 1}
                            viewMode={viewMode}
                            colMode={colMode}
                            tt={tt}
                            rawRank={rawRank[i] ?? i + 1}
                            selected={selected === i}
                            onSelect={setSelected}
                          />
                        ))}
                      </tbody>
                    </table>
                    <div className="pgn">
                      Showing {shown} of {pop.count.toLocaleString()} operators
                      · {pop.tag}
                      <span className="pages">
                        {[1, 2, 3].map((n) => (
                          <button
                            key={n}
                            className={page === n ? "on" : ""}
                            onClick={() => onPage(n)}
                          >
                            {n}
                          </button>
                        ))}
                        <button
                          className={page === -1 ? "on" : ""}
                          onClick={() => setPage(-1)}
                        >
                          …
                        </button>
                        <button
                          className={page === lastPage ? "on" : ""}
                          onClick={() => onPage(lastPage)}
                        >
                          {lastPage}
                        </button>
                      </span>
                      <span className="exp">⬇ Export CSV</span>
                    </div>
                  </section>
                </div>
              </main>
            </div>

            {/* right dock: heading + swappable modules */}
            <aside className="railcol">
              <div className="railhead">
                <span className="sq"></span>OPERATOR DOCK
              </div>
              <div className="rail">
                {visibleRail.map((id) =>
                  id === "profile" && !profile ? null : (
                    <div className="mod" key={id}>
                      <h3>
                        <span className="sq"></span>
                        {RAIL_TITLE[id]}
                        {id === "profile" && (
                          <button className="dock" onClick={toggleDock}>
                            ⇄ FEATURE
                          </button>
                        )}
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
              <a href="#">LEADERBOARD</a>
              <a href="/compare">COMPARE</a>
              <a href="/hall">HALL</a>
              <a href="/me">PROFILE</a>
              <a href="#">WRAPPED</a>
              <a href="#">SHARE</a>
              <span className="sep">·</span>
              <a href="/methodology">METHODOLOGY</a>
              <a href="#">API</a>
              <a href="/privacy">PRIVACY</a>
              <a href="#">npx sigrank</a>
            </div>
            <span className="fsig">
              SIGNALAF × SIGRANK — live-board prototype ·{" "}
              <span>{fmode}</span> · not production · POWERED BY MO§ES™ ·{" "}
              <span>{COPY.privacy.toUpperCase()}</span>
            </span>
          </footer>
        </div>
      </div>
    </div>
  );
}

export default LiveBoardWorkspace;
