"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { IconBoard, IconCompare, IconProfile, IconRankMe, IconSearch } from "./icons";
import type { RailNavId } from "../live/GroupedRailNav";

/**
 * BottomTabBar — the phone tabs: Board / Compare / Rank me / Profile / Search.
 * Rank me (2026-11-11) opens the two CLI steps — the phone's conversion path.
 * A real <nav> (aria-label "Primary"); the current page's tab carries
 * aria-current="page". Board, Compare and Profile are links; Search is a
 * button that opens the SearchOverlay. Each target is >= 44px tall.
 */
export function BottomTabBar({
  active,
  profileHref,
  searchOpen,
  onSearch,
  rankMeOpen,
  onRankMe,
}: {
  active: RailNavId;
  /** Signed-in operator → /user/<codename>; otherwise /me (it routes to sign-in / claim). */
  profileHref: string;
  searchOpen: boolean;
  onSearch: () => void;
  rankMeOpen: boolean;
  onRankMe: () => void;
}) {
  const tab = (key: string, label: string, icon: ReactNode, href: string) => (
    <Link
      key={key}
      href={href}
      className={`m-tab${active === key ? " on" : ""}`}
      aria-current={active === key ? "page" : undefined}
    >
      {icon}
      <span>{label}</span>
    </Link>
  );
  return (
    <nav className="m-tabs" aria-label="Primary">
      {tab("board", "Board", <IconBoard />, "/board/all")}
      {tab("compare", "Compare", <IconCompare />, "/compare")}
      <button
        type="button"
        className="m-tab"
        aria-haspopup="dialog"
        aria-expanded={rankMeOpen}
        onClick={onRankMe}
      >
        <IconRankMe />
        <span>Rank me</span>
      </button>
      {tab("profile", "Profile", <IconProfile />, profileHref)}
      <button
        type="button"
        className="m-tab"
        aria-haspopup="dialog"
        aria-expanded={searchOpen}
        onClick={onSearch}
      >
        <IconSearch />
        <span>Search</span>
      </button>
    </nav>
  );
}
