"use client";

import Link from "next/link";
import type { RailNavId } from "../live/GroupedRailNav";

/**
 * MenuNav — the nav groups inside the top bar's menu drawer. Everything the
 * bottom tab bar does not carry (owner 2026-10-21): Hall, SigRank, Field,
 * Articles, Blog, Wiki, Original Board, Methodology, Settings.
 */
const GROUPS: { label: string; items: { key?: RailNavId; label: string; href: string; prefetch?: false }[] }[] = [
  {
    label: "Operators",
    items: [{ key: "hall", label: "Hall", href: "/hall" }],
  },
  {
    label: "Writings",
    items: [
      { key: "home", label: "SigRank", href: "/sigrank" },
      { key: "field", label: "Field", href: "/fieldhub" },
      { key: "articles", label: "Articles", href: "/articles" },
      { key: "blog", label: "Blog", href: "/blog" },
      { key: "wiki", label: "Wiki", href: "/wiki" },
      { key: "history", label: "Original Board", href: "/board/history", prefetch: false },
      { label: "Methodology", href: "/methodology" },
    ],
  },
  {
    label: "Account",
    items: [{ label: "Settings", href: "/settings" }],
  },
];

export function MenuNav({ active, onNavigate }: { active: RailNavId; onNavigate: () => void }) {
  return (
    <nav className="m-menunav" aria-label="Site">
      {GROUPS.map((g) => (
        <div key={g.label} role="group" aria-label={g.label} className="m-mgroup">
          <div className="m-mlabel" aria-hidden="true">{g.label}</div>
          {g.items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              prefetch={it.prefetch}
              className={`m-mlink${it.key && it.key === active ? " on" : ""}`}
              aria-current={it.key && it.key === active ? "page" : undefined}
              onClick={onNavigate}
            >
              {it.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
