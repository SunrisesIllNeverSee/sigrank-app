"use client";

/**
 * MobileChrome — the phone (<= 760px) frame around a workspace page.
 *
 * Wrap the page's `.app` element:
 *
 *   <MobileChrome active="board" theme={theme} setTheme={setTheme}
 *     iconSet={iconSet} setIconSet={setIconSet}
 *     left={leftModules} leftTitle="BOARD" right={inspectorModules} rightTitle="OPERATOR">
 *     <div className="app">…</div>
 *   </MobileChrome>
 *
 * It renders the top bar (menu, SIGNALAF wordmark, details, theme, account),
 * the children, then the bottom tab bar, plus the drawer / sheet / search
 * overlays. All of the chrome is `display:none` above 760px (mobile-chrome.css),
 * so SSR markup is identical for every viewport and desktop is untouched; JS
 * only owns which overlay is open. `left` / `right` are mounted inside the
 * overlays only while they are open (never twice at once).
 */
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { THEMES, persistLbwTheme, type ThemeName } from "../live/utils";
import { liveTrack } from "../live/analytics";
import { useBoardSession } from "../live/session";
import { PixelBadge } from "../live/PixelBadge";
import { WorkspaceAccountOptions } from "../live/WorkspaceAccountOptions";
import type { RailNavId } from "../live/GroupedRailNav";
import type { IconSetName } from "../live/PixelIcon";
import { BottomTabBar } from "./BottomTabBar";
import { Drawer } from "./Drawer";
import { MenuNav } from "./MenuNav";
import { SearchOverlay } from "./SearchOverlay";
import { Sheet } from "./Sheet";
import { IconMenu, IconPanel, IconTheme } from "./icons";
import "./mobile-chrome.css";

export interface MobileChromeProps {
  /** Which nav item is current (same keys as WorkspaceShell `active`). */
  active: RailNavId;
  theme: ThemeName;
  setTheme: (t: ThemeName) => void;
  iconSet: IconSetName;
  setIconSet: (s: IconSetName) => void;
  /** Left-sidebar modules — shown under the nav in the menu drawer. */
  left?: ReactNode;
  leftTitle?: string;
  /** Right-sidebar / inspector modules — shown in the Details sheet. */
  right?: ReactNode;
  rightTitle?: string;
  /** Bump to open the Details sheet (same contract as WorkspaceShell). */
  rightOpenSignal?: number;
  /** The page's `.app` element. */
  children: ReactNode;
}

const PHONE_MQ = "(max-width: 760px)";

export function MobileChrome({
  active,
  theme,
  setTheme,
  iconSet,
  setIconSet,
  left,
  leftTitle,
  right,
  rightTitle,
  rightOpenSignal,
  children,
}: MobileChromeProps) {
  const [menu, setMenu] = useState(false);
  const [details, setDetails] = useState(false);
  const [search, setSearch] = useState(false);
  const [acct, setAcct] = useState(false);
  const session = useBoardSession(true);

  const closeMenu = useCallback(() => setMenu(false), []);
  const closeDetails = useCallback(() => setDetails(false), []);
  const closeSearch = useCallback(() => setSearch(false), []);
  const closeAcct = useCallback(() => setAcct(false), []);

  // Growing past the phone breakpoint (rotate, resize) closes every overlay.
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(PHONE_MQ);
    const on = () => {
      if (!mq.matches) {
        setMenu(false);
        setDetails(false);
        setSearch(false);
        setAcct(false);
      }
    };
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);

  // A page can pull the inspector open (Hall: picking a record) — on phones that is the sheet.
  const prevSignal = useRef(rightOpenSignal ?? 0);
  useEffect(() => {
    if (rightOpenSignal !== undefined && rightOpenSignal !== prevSignal.current && right != null) {
      if (typeof window.matchMedia === "function" && window.matchMedia(PHONE_MQ).matches) setDetails(true);
    }
    if (rightOpenSignal !== undefined) prevSignal.current = rightOpenSignal;
  }, [rightOpenSignal, right]);

  const cycleTheme = () => {
    const next = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length] ?? "green";
    setTheme(next);
    persistLbwTheme(next);
    liveTrack.themeChanged(next);
  };

  const mode = !session.loaded ? "loading" : !session.signedIn ? "out" : !session.codename ? "nolink" : "in";
  const name = mode === "in" ? (session.displayName ?? session.codename ?? "") : mode === "out" ? "Sign in" : mode === "nolink" ? "Unlinked" : "···";
  const initials =
    mode === "out"
      ? "◎"
      : mode === "loading"
        ? "··"
        : name
            .split(/\s+/)
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "·";
  const profileHref = mode === "in" && session.codename ? `/user/${encodeURIComponent(session.codename)}` : "/me";

  return (
    <>
      <header className="m-top" data-mchrome="top">
        <button
          type="button"
          className="m-ibtn"
          aria-label="Menu"
          aria-haspopup="dialog"
          aria-expanded={menu}
          onClick={() => setMenu(true)}
        >
          <IconMenu />
        </button>
        <Link href="/" className="m-wordmark" aria-label="SignalAF home">
          SIGNALAF
        </Link>
        <span className="m-spacer" />
        {right != null && (
          <button
            type="button"
            className="m-ibtn"
            aria-label={`${rightTitle ?? "Details"} panel`}
            aria-haspopup="dialog"
            aria-expanded={details}
            onClick={() => setDetails(true)}
          >
            <IconPanel />
          </button>
        )}
        <button type="button" className="m-ibtn" aria-label={`Theme: ${theme}. Switch theme`} onClick={cycleTheme}>
          <IconTheme />
        </button>
        <button
          type="button"
          className="m-ibtn m-avatar"
          aria-label="Account"
          aria-haspopup="dialog"
          aria-expanded={acct}
          onClick={() => setAcct(true)}
        >
          <span className="avatar">
            {mode === "in" && session.pixelBadge ? <PixelBadge name={session.pixelBadge} /> : initials}
          </span>
        </button>
      </header>

      {children}

      <BottomTabBar active={active} profileHref={profileHref} searchOpen={search} onSearch={() => setSearch(true)} />

      <Drawer open={menu} onClose={closeMenu} label="Menu" side="left">
        <MenuNav active={active} onNavigate={closeMenu} />
        {left != null && (
          <section className="m-panelblock" aria-label={leftTitle ?? "Page panel"}>
            <div className="m-mlabel">{leftTitle ?? "Page panel"}</div>
            <div className="lside m-inline">
              <div className="rail">{left}</div>
            </div>
          </section>
        )}
      </Drawer>

      <Sheet open={details} onClose={closeDetails} label={rightTitle ?? "Details"}>
        <div className="railcol m-inline">
          <div className="rail">{right}</div>
        </div>
      </Sheet>

      <Sheet open={acct} onClose={closeAcct} label="Account">
        <div className="m-acct">
          <WorkspaceAccountOptions
            mode={mode}
            name={name}
            theme={theme}
            setTheme={setTheme}
            iconSet={iconSet}
            setIconSet={setIconSet}
            close={closeAcct}
          />
        </div>
      </Sheet>

      <SearchOverlay open={search} onClose={closeSearch} />
    </>
  );
}

export default MobileChrome;
