"use client";

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
import { EnterprisePromoPop } from "./EnterprisePromo";
import { RailIcon, ICON_SETS } from "./PixelIcon";
import type { IconSetName, PixelIconName } from "./PixelIcon";
import { PixelBadge } from "./PixelBadge";
import {
  LBW_THEME_INIT,
  THEMES,
  persistLbwTheme,
  resolveLbwTheme,
  type ThemeName,
} from "./utils";
import { liveTrack } from "./analytics";
import { useBoardSession } from "./session";

/** Rail nav keys — the workspace's canonical site navigation. */
export type WorkspaceNav =
  | "board"
  | "compare"
  | "hall"
  | "field"
  | "wiki"
  | "blog";

const NAV_LINKS: { key: WorkspaceNav; href: string; tip: string }[] = [
  { key: "board", href: "/board/all", tip: "LEADERBOARD" },
  { key: "compare", href: "/compare", tip: "COMPARE" },
  { key: "hall", href: "/hall", tip: "HALL" },
  { key: "field", href: "/fieldhub", tip: "FIELD" },
];

const NAV_LINKS_2: { key: WorkspaceNav; href: string; tip: string }[] = [
  { key: "wiki", href: "/wiki", tip: "WIKI" },
  { key: "blog", href: "/blog", tip: "BLOG" },
];

export interface WorkspaceShellProps {
  /** Which rail icon renders `.on`. */
  active: WorkspaceNav;
  /** Stage-top page title (h1.pagetitle). Omit to skip the title strip. */
  title?: ReactNode;
  /** Render the h1 visually-hidden instead of the .stitle strip — for pages
   *  whose hero is the visible title (Field Hub, Blog index). */
  bareTitle?: boolean;
  /** Optional filter-bar strip under the title (the board's .fbar slot). */
  toolbar?: ReactNode;
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
  /** Stage content. */
  children: ReactNode;
}

const SOON_ITEMS: Record<string, [string, string]> = {
  teams: ["TEAMS", "squad boards + shared stats"],
  hacks: ["HACKS", "build sprints + vs brackets"],
  versus: ["VERSUS", "head-to-head operator duels"],
};

export function WorkspaceShell({
  active,
  title,
  bareTitle = false,
  toolbar,
  leftTitle,
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
  children,
}: WorkspaceShellProps) {
  /* ---------- theme — identical contract to LiveBoardWorkspace ---------- */
  const [theme, setTheme] = useState<ThemeName>(resolveLbwTheme);
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
  const [leftOn, setLeftOn] = useState(leftDefaultOpen && left != null);
  const [railOn, setRailOn] = useState(rightDefaultOpen && right != null);
  const [acctPop, setAcctPop] = useState(false);
  const [epromoOpen, setEpromoOpen] = useState(false);
  const [ftrMin, setFtrMin] = useState(false);
  const [iconSet, setIconSet] = useState<IconSetName>("pixel");
  const [notifOpen, setNotifOpen] = useState(false);
  const [soonVotes, setSoonVotes] = useState<Record<string, number>>({});
  const [soonPop, setSoonPop] = useState<string | null>(null);

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
  const acctRef = useRef<HTMLDivElement | null>(null);
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

  const navBtn = (n: { key: WorkspaceNav; href: string; tip: string }) => (
    <Link
      key={n.key}
      className={`sbtn${active === n.key ? " on" : ""}`}
      href={n.href}
      data-tip={n.tip}
      title={n.tip}
      aria-current={active === n.key ? "page" : undefined}
    >
      <RailIcon name={n.key as PixelIconName} set={iconSet} />
    </Link>
  );

  return (
    <div
      ref={rootRef}
      className={`lbw-root ${lbwFontVars}`}
      data-theme={theme}
      suppressHydrationWarning
      style={
        {
          ...(leftWidth ? { "--lside-w": `${leftWidth}px` } : {}),
          ...(rightWidth ? { "--rail-w": `${rightWidth}px` } : {}),
        } as React.CSSProperties
      }
    >
      <script dangerouslySetInnerHTML={{ __html: LBW_THEME_INIT }} />
      <div
        className={`app${railOn ? "" : " no-rail"}${leftOn ? "" : " no-left"}`}
      >
        {/* icon rail — identical contract to the board's .srail.min */}
        <aside className="srail min">
          <Link
            className="sbrand"
            href="/"
            data-tip="signalaf — home"
            title="signalaf — home"
          >
            <span className="px">
              <i></i>
              <i></i>
              <i></i>
              <i></i>
            </span>
          </Link>
          <nav className="snav" ref={snavRef}>
            {NAV_LINKS.map(navBtn)}
            <span className="snav-sep" aria-hidden="true"></span>
            {NAV_LINKS_2.map(navBtn)}
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
            <EnterprisePromoPop hidden={!epromoOpen} />
            <span className="snav-sep" aria-hidden="true"></span>
            {(["teams", "hacks", "versus"] as const).map((key) => (
              <button
                key={key}
                type="button"
                className="sbtn"
                data-tip={`${SOON_ITEMS[key][0]} · SOON`}
                title={`${SOON_ITEMS[key][0]} — coming soon`}
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
                <div className="ap-label">{SOON_ITEMS[soonPop][0]} — COMING SOON</div>
                <p className="ap-desc">{SOON_ITEMS[soonPop][1]}</p>
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
              </div>
            )}
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
                data-tip={acct.mode === "out" ? "SIGN IN" : acct.name}
                onClick={(e) => {
                  e.stopPropagation();
                  setAcctPop((v) => !v);
                }}
              >
                {acct.mode === "in" ? (
                  <PixelBadge name="verified" />
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
                {acct.mode === "in" && (
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
                {(acct.mode === "in" || acct.mode === "nolink") && (
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
          <div className="mid">
            {leftOn && left != null && (
              <aside className="lside">
                <button
                  type="button"
                  className="edge edge-l"
                  title="collapse sidebar · drag to resize"
                  aria-label="collapse left sidebar; drag to resize"
                  onPointerDown={onDrag("l")}
                >
                  ◂
                </button>
                <div className="colhead">{colheadLeft}</div>
                <div className="railhead">
                  <span className="sq"></span>
                  {leftTitle}
                </div>
                <div className="rail">{left}</div>
              </aside>
            )}

            <div className="stagecol">
              {title != null &&
                (bareTitle ? (
                  <h1 className="sr-only">{title}</h1>
                ) : (
                  <div className="stitle">
                    <h1 className="pagetitle">{title}</h1>
                  </div>
                ))}
              {toolbar != null && <div className="fbar">{toolbar}</div>}
              <main className="stage">
                <div className="board">{children}</div>
              </main>
            </div>

            {railOn && right != null && (
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
                <div className="colhead">{colheadRight}</div>
                <div className="railhead">
                  <span className="sq"></span>
                  {rightTitle}
                </div>
                <div className="rail">{right}</div>
              </aside>
            )}
          </div>

          <footer className={`ftr${ftrMin ? " min" : ""}`}>
            <button className="fmin" onClick={() => setFtrMin((v) => !v)}>
              {ftrMin ? "▸ LINKS" : "▾ LINKS"}
            </button>
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
    </div>
  );
}

export default WorkspaceShell;
