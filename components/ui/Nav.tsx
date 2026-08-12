"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AccountMenu } from "./AccountMenu";
import { MobileNav } from "./MobileNav";
import { NavLinks } from "./NavLinks";

// Launch nav set. /hall is in launch. (/metrics was in launch per 2026-06-19 but was
// archived + removed in the 2026-06-22 sweep (ITEM 2) — its content lives in /wiki now.)
// /transmitters + /circles archived + removed 2026-06-22 (owner: "disconnect from the site —
// they'll prob come back"; /circles = the planned clans/groups/teams/guilds feature). Sources in
// _archive. /wrapped (/operators/<codename>/wrapped) stays a deferred-but-present route.
// /submit + /pro removed in the 2026-06-22 sweep (ITEM 1, archived). /hall-of-signal = legacy redirect.
// Order + labels per owner 2026-06-21 (no asterisks remain after the sweep). Brand "◈ SIGRANK"
// link to / is rendered separately below.
const LINKS: { href: string; label: string }[] = [
  { href: "/board/all", label: "Leaderboard" },
  { href: "/field", label: "Field" },
  { href: "/compare", label: "Compare" },
  { href: "/hall", label: "Hall" },
  { href: "/wiki", label: "Wiki" },
  { href: "/blog", label: "Blog" },
];

/**
 * Top navigation chrome. Hides on scroll down, reappears on scroll up.
 * The ThemeToggle island is the only other client piece.
 */
export function Nav() {
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 80) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="sticky top-0 z-40 w-full border-b backdrop-blur-md transition-transform duration-300"
      style={{
        background: "rgb(var(--nav-accent))",
        borderBottomColor: "rgb(var(--nav-accent))",
        transform: hidden ? "translateY(-100%)" : "translateY(0)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:gap-6">
        {/* Mobile: hamburger (links collapse here below md). */}
        <MobileNav links={LINKS} />

        <Link
          href="/"
          className="font-mono text-sm font-bold tracking-tight"
          style={{ color: "rgb(var(--nav-text))" }}
        >
          <span style={{ opacity: 0.7 }}>◈</span> SIGRANK
        </Link>

        {/* Desktop: inline links (hidden on mobile — MobileNav covers it).
            NavLinks is a client island that highlights the active route. */}
        <NavLinks links={LINKS} />

        <div className="ml-auto">
          <AccountMenu />
        </div>
      </div>
    </nav>
  );
}
