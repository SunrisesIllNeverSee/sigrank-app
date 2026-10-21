"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { IconBoard, IconCompare, IconProfile, IconSearch } from "./icons";
import type { RailNavId } from "../live/GroupedRailNav";

/**
 * BottomTabBar — the four phone tabs: Board / Compare / Profile / Search.
 * A real <nav> (aria-label "Primary"); the current page's tab carries
 * aria-current="page". Board, Compare and Profile are links; Search is a
 * button that opens the SearchOverlay. Each target is >= 44px tall.
 */
export function BottomTabBar({
  active,
  profileHref,
  searchOpen,
  onSearch,
}: {
  active: RailNavId;
  /** Signed-in operator → /user/<codename>; otherwise /me (it routes to sign-in / claim). */
  profileHref: string;
  searchOpen: boolean;
  onSearch: () => void;
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
