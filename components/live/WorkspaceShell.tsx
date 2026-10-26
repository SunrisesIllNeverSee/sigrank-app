"use client";

import { WorkspaceAccountOptions } from "./WorkspaceAccountOptions";

import { GroupedRailNav } from "./GroupedRailNav";
import { GlobalSearch } from "./GlobalSearch";

/**
 * components/live/WorkspaceShell.tsx — the shared SignalAF workspace frame
 * for non-board pages (Hall, Compare, Wiki, Field, Blog…).
 *
 * Same chrome contract as LiveBoardWorkspace (the frozen reference-v1 port):
 * X-rail nav (board/compare/hall/field/wiki/blog + enterprise promo +
 * coming-soon vote pops), left panel with colhead+railhead+.mod boxes,
 * center stage (page title + optional filter bar + scroll surface), right
 * inspector rail, collapsible footer strip. Theme system identical —
 * .lbw-root[data-theme], ?theme=/localStorage persistence, Shift+T cycle,
 * swatches in the account popover, icon-set cycler, edge-drag panel resize
 * (--lside-w/--rail-w, clamped 180–480), panel toggles that appear in the
 * rail foot only when their panel is closed.
 *
 * The board itself stays untouched — this component reuses the same CSS
 * (proto-scoped.css, imported here too; CSS imports dedupe), RailIcon set
 * cycler, EnterprisePromoPop, PixelBadge account avatar, useBoardSession
 * chrome, and the LBW_THEME_INIT no-flash script. Content is slot-driven
 * (left/right module children + stage children) so pages wire their own
 * real components — nothing board-specific leaks in.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { lbwFontVars } from "./fonts";
import "./proto-scoped.css";
import { useRailIconSet } from "./useRailIconSet";
import { PanelReopenTab, usePanelFocus } from "./PanelReopenTab";
import { PixelBadge } from "./PixelBadge";
import { usePhone } from "../board-mobile/usePhone";
import { EditorialHeaderNav, type WorkspaceTopic } from "./EditorialSidebar";
import {
  LBW_THEME_INIT,
  THEMES,
  persistLbwTheme,
  resolveLbwTheme,
  type ThemeName,
} from "./utils";
import { liveTrack } from "./analytics";
import { useBoardSession } from "./session";
import { MobileChrome } from "../mobile/MobileChrome";

/** Rail nav keys — the workspace's canonical site navigation. */
export type WorkspaceNav =
  | "home"
  | "board"
  | "profile"
  | "articles"
  | "compare"
  | "hall"
  | "field"
  | "wiki"
  | "blog"
  | "history";


export interface WorkspaceShellProps {
  /** Which rail icon renders `.on`. */
  active: WorkspaceNav;
  /** Stage-top page title (h1.pagetitle). Omit to skip the title strip. */
  title?: ReactNode;
  /** Optional controls alongside the visible stage title. */
  titleControls?: ReactNode;
  /** Skip the .stitle strip — for pages whose hero (WaveHero/WaveHeroTitle)
   *  or content renders the page's visible h1 (Field Hub, Blog index, posts).
   *  The shell emits NO h1 in this mode so the page keeps exactly one h1;
   *  pass `srOnlyTitle` too when the content has no h1 of its own. */
  bareTitle?: boolean;
  /** With `bareTitle`: render `title` as a visually-hidden h1 — for pages
   *  whose visible heading is not an h1 (wiki topic pages use an h2). */
  srOnlyTitle?: boolean;
  /** Edge-to-edge stage hero band (WaveHero), rendered above the board
   *  content and bleeding to the sidebar borders. Pass with bareTitle. */
  hero?: ReactNode;
  /** Optional filter-bar strip under the title (the board's .fbar slot). */
  toolbar?: ReactNode;
  /** Five-topic editorial selector in the left railhead (only when supplied). */
  topic?: WorkspaceTopic;
  /** Left panel railhead label (e.g. "HALL OF SIGNAL"). */
  leftTitle?: string;
  /** Left panel content — .mod boxes. Omit → panel collapsed + toggle hidden. */
  left?: ReactNode;
  /** Right panel railhead label (e.g. "OPERATOR"). */
  rightTitle?: string;
  /** Right inspector content — .mod boxes. Omit → rail collapsed + toggle hidden. */
  right?: ReactNode;
  /** colhead over the left column (default SIGNALAF). */
  colheadLeft?: string;
  /** colhead over the right column (default SIGRANK). */
  colheadRight?: string;
  /** Left panel initial visibility (default true). */
  leftDefaultOpen?: boolean;
  /** Right inspector initial visibility (default true — Hall passes false). */
  rightDefaultOpen?: boolean;
  /** Initial --lside-w px (drag clamp is 180–480; sub-range intents clamp up). */
  leftWidth?: number;
  /** Initial --rail-w px. */
  rightWidth?: number;
  /** Right rail visibility flag exposed upward so pages can open the
   *  inspector on selection (Hall: closed until a record is picked). */
  onRightOpenChange?: (open: boolean) => void;
  /** Imperative open control — when this flips true→true (already) no-op;
   *  pass a counter/key bump to force open. Use `rightOpenSignal`. */
  rightOpenSignal?: number;
  /** Footer status text (the .fsig right slot). */
  status?: ReactNode;
  /** Consistent centered editorial layout for text/research pages only. */
  editorialStage?: boolean;
  /** Page-specific entry palette. An explicit ?theme= still overrides it;
   * user theme controls still work after entering this page. */
  defaultTheme?: ThemeName;
  /** Stage content. */
  children: ReactNode;
}


export function WorkspaceShell({
  active,
  title,
  titleControls,
  bareTitle = false,
  srOnlyTitle = false,
  hero,
  toolbar,
  leftTitle,
  topic,
  left,
  rightTitle,
  right,
  colheadLeft = "SIGNALAF",
  colheadRight = "SIGRANK",
  leftDefaultOpen = true,
  rightDefaultOpen = true,
  leftWidth,
  rightWidth,
  rightOpenSignal,
  status,
  editorialStage = false,
  defaultTheme,
  children,
}: WorkspaceShellProps) {
  /* ---------- theme — identical contract to LiveBoardWorkspace ---------- */
  const [theme, setTheme] = useState<ThemeName>(() => {
    if (!defaultTheme) return resolveLbwTheme();
    if (typeof window !== "undefined") {
      try {
        const explicit = new URLSearchParams(window.location.search).get("theme");
        if (THEMES.includes(explicit as ThemeName)) return explicit as ThemeName;
      } catch { /* no query access: use page-specific default */ }
    }
    return defaultTheme;
  });
  const themeBoot = defaultTheme
    ? `(function(){try{var ok=${JSON.stringify(THEMES)},q=new URLSearchParams(location.search).get("theme"),t=ok.indexOf(q)>=0?q:${JSON.stringify(defaultTheme)};var el=document.currentScript&&document.currentScript.parentElement;if(el)el.setAttribute("data-theme",t);}catch(e){}})();`
    : LBW_THEME_INIT;
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

  /* ---------- panel + popover chrome ---------- */
  const phone = usePhone();
  const [leftOn, setLeftOn] = useState(leftDefaultOpen && left != null);
  const [railOn, setRailOn] = useState(rightDefaultOpen && right != null);
  /* Narrow screens (owner 2026-10-21, generalizing the 2026-10-16 text-page
     rule): at <=1050px every page opens with both panels collapsed — the
     stage gets the full width and there is no horizontal pan. On tablets the
     panels then open as overlay drawers (reopen tab / rail toggle); on phones
     they are replaced by MobileChrome's menu drawer + Details sheet.
     `phoneInit` is true in SSR and the first client render (no hydration
     mismatch); CSS hides the panels while it is set, so there is no flash
     before this effect collapses them. Desktop (>1050px) is unchanged. */
  const [phoneInit, setPhoneInit] = useState(true);
  useEffect(() => {
    if (typeof window.matchMedia === "function" && window.matchMedia("(max-width: 1050px)").matches) {
      setLeftOn(false);
      setRailOn(false);
    }
    setPhoneInit(false);
  }, []);
  /* tablet drawers close on Esc */
  useEffect(() => {
    if (!leftOn && !railOn) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || typeof window.matchMedia !== "function" || !window.matchMedia("(min-width: 761px) and (max-width: 1050px)").matches) return;
      setLeftOn(false);
      setRailOn(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [leftOn, railOn]);
  const [acctPop, setAcctPop] = useState(false);
  const [ftrMin, setFtrMin] = useState(false);
  const [pagesPop, setPagesPop] = useState(false);
  const [iconSet, setIconSet] = useRailIconSet();
  const [notifOpen, setNotifOpen] = useState(false);

  const router = useRouter();
  const session = useBoardSession(true);

  /* rightOpenSignal bumps → open the inspector (Hall: record selection
     pulls the closed inspector open). */
  const prevSignal = useRef(rightOpenSignal ?? 0);
  useEffect(() => {
    if (
      right != null &&
      rightOpenSignal !== undefined &&
      rightOpenSignal !== prevSignal.current
    ) {
      setRailOn(true);
    }
    if (rightOpenSignal !== undefined) prevSignal.current = rightOpenSignal;
  }, [rightOpenSignal, right]);

  /* Edge sash — same VS Code pattern as the board: drag resizes via
     --lside-w/--rail-w on .lbw-root (clamped 180–480); a sub-4px click
     counts as collapse. */
  const rootRef = useRef<HTMLDivElement | null>(null);
  /* Text-page masthead compacts once the reader scrolls (owner 2026-10-17):
     full hero at the top, a slim pinned band (title / animated wordmark only)
     after ~300px; back to full near the top. The band is sticky and in flow,
     so the scroll position is corrected by the height it gives up — content
     doesn't jump — and the wide hysteresis gap keeps it from flapping. */
  const stageElRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const st = stageElRef.current;
    if (!editorialStage || !st) return;
    let compact = false;
    let raf = 0;
    const hero = () => st.querySelector<HTMLElement>(".board>.ws-hero, .board header.wave-hero");
    const apply = (next: boolean) => {
      const h = hero();
      if (!h) return;
      // Keep the content that follows the masthead visually still. Chrome's
      // scroll anchoring may already compensate; Safari doesn't — so measure
      // where the following content actually lands and correct only the rest.
      const anchor = (h.nextElementSibling ?? h.parentElement?.nextElementSibling) as HTMLElement | null;
      const before = anchor?.getBoundingClientRect().top ?? 0;
      st.toggleAttribute("data-compact", next);
      compact = next;
      if (!next || !anchor) return;
      requestAnimationFrame(() => {
        const drift = anchor.getBoundingClientRect().top - before;
        if (Math.abs(drift) > 1) st.scrollTop += drift;
      });
    };
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = st.scrollTop;
        if (!compact && y > 300) apply(true);
        else if (compact && y < 8) apply(false);
      });
    };
    st.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      st.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [editorialStage]);
  const focusAfter = usePanelFocus(leftOn, railOn);
  const collapse = useCallback(
    (side: "l" | "r") => {
      focusAfter(side === "l" ? ".reopen-l" : ".reopen-r");
      if (side === "l") setLeftOn(false);
      else setRailOn(false);
    },
    [focusAfter],
  );
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
          collapse(side);
        }
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [collapse],
  );
  const acctRef = useRef<HTMLDivElement | null>(null);
  const pagesRef = useRef<HTMLDivElement | null>(null);

  /* footer PAGES popover — same outside-click contract as the account pop. */
  useEffect(() => {
    if (!pagesPop) return;
    const onDoc = (e: MouseEvent) => {
      if (
        pagesRef.current &&
        e.target instanceof Node &&
        !pagesRef.current.contains(e.target)
      ) {
        setPagesPop(false);
      }
    };
    document.addEventListener("click", onDoc);
    return () => document.removeEventListener("click", onDoc);
  }, [pagesPop]);
  const snavRef = useRef<HTMLElement | null>(null);

  /* account + enterprise popovers close on outside click (same contract). */
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

  /* account chip — real session surface (no ops array here, so the signed-in
     avatar falls back to the verified badge — the board's documented
     fallback when the acct doesn't map to a field row). */
  const acct = !session.loaded
    ? { mode: "loading" as const, name: "···" }
    : !session.signedIn
      ? { mode: "out" as const, name: "Sign in" }
      : !session.codename
        ? { mode: "nolink" as const, name: "Unlinked" }
        : {
            mode: "in" as const,
            name: session.displayName ?? session.codename,
          };
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


  return (
    <div
      ref={rootRef}
      className={`lbw-root ${lbwFontVars}`}
      data-theme={theme}
      suppressHydrationWarning
      style={
        {
          // Compact editorial rails; users can still resize via the sash.
          ...(editorialStage
            ? { "--lside-w": "264px",
                "--rail-w": "264px" }
            : {
                ...(leftWidth ? { "--lside-w": leftWidth + "px" } : {}),
                ...(rightWidth ? { "--rail-w": rightWidth + "px" } : {}),
              }),
        } as React.CSSProperties
      }
    >
      <script dangerouslySetInnerHTML={{ __html: themeBoot }} />
      <MobileChrome
        active={active}
        theme={theme}
        setTheme={setTheme}
        iconSet={iconSet}
        setIconSet={setIconSet}
        left={left}
        leftTitle={leftTitle}
        right={right}
        rightTitle={rightTitle}
        rightOpenSignal={rightOpenSignal}
      >
      <div
        className={`app${railOn ? "" : " no-rail"}${leftOn ? "" : " no-left"}`}
        data-phone-init={phoneInit ? "" : undefined}
      >
        {/* icon rail — identical contract to the board's .srail.min */}
        <aside className="srail min">
          <nav className="snav" ref={snavRef}>
            <GroupedRailNav active={active} iconSet={iconSet} />
          </nav>
          <div className="sfoot">
            {left != null && !leftOn && (
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
            {right != null && !railOn && (
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
            <div className="sacct" ref={acctRef}>
              <button
                className="avatar"
                title="account — settings"
                aria-label="Account"
                aria-haspopup="dialog"
                aria-expanded={acctPop}
                aria-controls="workspace-account-options"
                data-tip={acct.mode === "out" ? "SIGN IN" : acct.name}
                onClick={(e) => {
                  e.stopPropagation();
                  setNotifOpen(false);
                  setAcctPop((v) => !v);
                }}
              >
                {acct.mode === "in" && session.pixelBadge ? (
                  <PixelBadge name={session.pixelBadge} />
                ) : (
                  acctInitials
                )}
              </button>
              <div id="workspace-account-options" className="acctpop" hidden={!acctPop}>
                {acctPop && <WorkspaceAccountOptions mode={acct.mode} name={acct.name}
                  theme={theme} setTheme={setTheme} iconSet={iconSet} setIconSet={setIconSet} close={() => setAcctPop(false)} />}
              </div>
            </div>
          </div>
        </aside>

        <div className="maincol">
          <div className="mid">
            {/* owner 2026-10-21: collapsed panels leave a labelled accent tab on
                the stage edge (the rail-foot toggles alone were easy to miss). */}
            {((leftOn && left != null) || (railOn && right != null)) && (
              <button type="button" className="m-tscrim" aria-label="Close panel" tabIndex={-1}
                onClick={() => { setLeftOn(false); setRailOn(false); }} />
            )}
            {!leftOn && left != null && (
              <PanelReopenTab side="l" label={leftTitle ?? "SIDEBAR"} onOpen={() => { focusAfter(".edge-l"); setLeftOn(true); }} />
            )}
            {!railOn && right != null && (
              <PanelReopenTab side="r" label={rightTitle ?? "OPERATOR"} onOpen={() => { focusAfter(".edge-r"); setRailOn(true); }} />
            )}
            {leftOn && left != null && (
              <aside id="lbw-left-panel" className={`lside${topic ? " ws-editorial-sidebar" : ""}`}>
                <button
                  type="button"
                  className="edge edge-l"
                  title="collapse sidebar · drag to resize"
                  aria-label="collapse left sidebar; drag to resize"
                  aria-expanded="true"
                  aria-controls="lbw-left-panel"
                  data-label="HIDE"
                  onPointerDown={onDrag("l")}
                  onClick={(e) => { if (e.detail === 0) collapse("l"); }}
                >
                  ◂
                </button>
                <div className="colhead">{topic ? <EditorialHeaderNav label={colheadLeft} /> : colheadLeft}</div>
                <div className="railhead">
                  <span className="sq"></span>
                  <span className="rh-t">{leftTitle}</span>
                </div>
                <div className="rail">{phone ? null : left /* owner 2026-10-21: the phone drawer owns the modules */}</div>
                {topic && (
                  <nav className="ws-rail-bottom-nav" aria-label="Page navigation">
                    <button type="button" aria-label="Back to previous page"
                      onClick={() => {
                        if (window.history.length > 1) router.back();
                        else router.push("/");
                      }}>
                      <span aria-hidden="true">←</span> BACK
                    </button>
                    <Link href="/" aria-label="Home — live leaderboard">
                      <span aria-hidden="true">⌂</span> HOME
                    </Link>
                  </nav>
                )}
              </aside>
            )}

            <div className="stagecol">
              {/* owner 2026-10-21: site-wide search sits at the right end of the title
                  row so it is never hidden by a collapsed sidebar; bare/untitled
                  pages get a search-only row. */}
              {title != null && !bareTitle ? (
                <div className="stitle">
                  <div className="stitle-main">
                    <h1 className="pagetitle">{title}</h1>
                    {titleControls}
                  </div>
                  <GlobalSearch label="Search operators and pages" />
                </div>
              ) : (
                <div className="stitle">
                  {title != null && srOnlyTitle && <h1 className="sr-only">{title}</h1>}
                  <GlobalSearch label="Search operators and pages" />
                </div>
              )}
              {toolbar != null && <div className="fbar">{toolbar}</div>}
              <main ref={stageElRef} className={`stage${editorialStage ? " ws-editorial-stage" : ""}`}>
                <div className="board">
                  {hero && <div className="ws-hero">{hero}</div>}
                  {children}
                  {editorialStage && <footer className="ws-editorial-credit" aria-label="Writing credits">
                    <span>Written by <Link href="/about">Deric J. McHenry</Link></span>
                    <span>Published by SignalAF · SigRank</span>
                  </footer>}
                </div>
              </main>
            </div>

            {railOn && right != null && (
              <aside id="lbw-right-panel" className="railcol">
                <button
                  type="button"
                  className="edge edge-r"
                  title="collapse inspector · drag to resize"
                  aria-label="collapse inspector rail; drag to resize"
                  aria-expanded="true"
                  aria-controls="lbw-right-panel"
                  data-label="HIDE"
                  onPointerDown={onDrag("r")}
                  onClick={(e) => { if (e.detail === 0) collapse("r"); }}
                >
                  ▸
                </button>
                <div className="colhead">{colheadRight}</div>
                <div className="railhead">
                  <span className="sq"></span>
                  <span className="rh-t">{rightTitle}</span>
                </div>
                <div className="rail">{right}</div>
              </aside>
            )}
          </div>

          <footer className={`ftr${ftrMin ? " min" : ""}`}>
            <button className="fmin" onClick={() => setFtrMin((v) => !v)}>
              {ftrMin ? "▸ LINKS" : "▾ LINKS"}
            </button>
            <div className="fpages" ref={pagesRef}>
              <button className="fmin" onClick={() => setPagesPop((v) => !v)}>
                {pagesPop ? "▾ PAGES" : "▸ PAGES"}
              </button>
              <div className="ftrpop" hidden={!pagesPop}>
                <div className="fgroup">
                  <span className="fhead">PRODUCT</span>
                  <Link href="/board/all">Leaderboard</Link>
                  <Link href="/compare">Compare</Link>
                  <Link href="/hall">Hall of Signal</Link>
                  <Link href="/score">Get scored</Link>
                  <Link href="/live">Live board</Link>
                </div>
                <div className="fgroup">
                  <span className="fhead">DOCS</span>
                  <Link href="/about">About</Link>
                  <Link href="/methodology">Methodology</Link>
                  <Link href="/wiki">Wiki</Link>
                  <Link href="/faq">FAQ</Link>
                  <Link href="/mcp">MCP</Link>
                </div>
                <div className="fgroup">
                  <span className="fhead">SUPPORT</span>
                  <Link href="/support">Support</Link>
                  <Link href="/contact">Contact</Link>
                  <Link href="/developers">Developers</Link>
                  <Link href="/pricing">Pricing</Link>
                  <Link href="/settings">Settings</Link>
                </div>
                <div className="fgroup">
                  <span className="fhead">LEGAL</span>
                  <Link href="/privacy">Privacy</Link>
                  <Link href="/terms">Terms</Link>
                  <Link href="/eula">EULA</Link>
                </div>
              </div>
            </div>
            <div className="flinks">
              <Link href="/board/all">LEADERBOARD</Link>
              <a href="/compare">COMPARE</a>
              <a href="/hall">HALL</a>
              <a href="/me">PROFILE</a>
              <span className="sep">·</span>
              <a href="/methodology">METHODOLOGY</a>
              <a href="/developers">API</a>
              <a href="/privacy">PRIVACY</a>
              <a href="https://www.npmjs.com/package/sigrank">npx sigrank</a>
            </div>
            <span className="fsig">
              {status ?? (
                <>
                  SIGNALAF × SIGRANK · POWERED BY MO§ES™
                </>
              )}
            </span>
          </footer>
        </div>
      </div>
      </MobileChrome>
    </div>
  );
}

export default WorkspaceShell;
