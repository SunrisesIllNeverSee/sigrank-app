"use client";

import Link from "next/link";
import { RailIcon, type IconSetName, type PixelIconName } from "./PixelIcon";
import "./rail-extras.css";
import { useBoardSession } from "./session";
import { PixelBadge } from "./PixelBadge";
import { challengesEnabled } from "@/lib/features";

export type RailNavId = "home" | "board" | "profile" | "compare" | "hall" | "field" | "articles" | "blog" | "wiki" | "versus";
const groups: { label: string; items: { key: RailNavId; label: string; href: string }[] }[] = [
  { label: "Operators", items: [
    { key: "board", label: "LEADERBOARD", href: "/board/all" },
    { key: "profile", label: "PROFILE", href: "/me" },
    { key: "compare", label: "COMPARE", href: "/compare" },
    { key: "hall", label: "HALL", href: "/hall" },
  ] },
  { label: "Writings", items: [
    { key: "home", label: "SIGRANK", href: "/sigrank" },
    { key: "field", label: "FIELD", href: "/fieldhub" },
    { key: "articles", label: "ARTICLES", href: "/articles" },
    { key: "blog", label: "BLOG", href: "/blog" },
    { key: "wiki", label: "WIKI", href: "/wiki" },
  ] },
];

export function GroupedRailNav({ active, iconSet, onBoard }: { active: RailNavId; iconSet: IconSetName; onBoard?: () => void }) {
  const session = useBoardSession();
  return <>
    {groups.map((group) => <div key={group.label} role="group" aria-label={group.label} className="rail-nav-group">
      {group.items.map((item) => {
        const props = { className: `sbtn${active === item.key ? " on" : ""}`, "data-tip": item.label, title: item.label, "aria-label": item.label };
        const icon = item.key === "profile" && session.signedIn && session.pixelBadge ? <PixelBadge name={session.pixelBadge} /> : item.key === "home" ? <span className="gi" aria-hidden="true">§</span> : <RailIcon name={item.key as PixelIconName} set={iconSet} />;
        return item.key === "board" && onBoard ? <button key={item.key} {...props} type="button" aria-current="page" onClick={onBoard}>{icon}</button>
          : <Link key={item.key} {...props} href={item.href} aria-current={active === item.key ? "page" : undefined}>{icon}</Link>;
      })}
      <span className="snav-sep" aria-hidden="true" />
    </div>)}
    <div role="group" aria-label="Coming soon" className="rail-nav-group">
      {challengesEnabled() && <Link className={`sbtn${active === "versus" ? " on" : ""}`} data-tip="VS" title="VS" aria-label="VS" href="/arena" aria-current={active === "versus" ? "page" : undefined}><RailIcon name="versus" set={iconSet} /></Link>}
      {/* VS is the challenges entry (owner 2026-10-13): live only when GATE_CHALLENGES + GATE_ARENA are on. */}
      {([['hacks','HACKS'],...(challengesEnabled() ? [] : [['versus','VS']] as const),['teams','TEAMS']] as const).map(([key,label]) => <button key={key} type="button" disabled className="sbtn rail-unavailable" aria-label={`${label} — coming soon`} data-tip={`${label} · COMING SOON`} title={`${label} — coming soon`}><RailIcon name={key} set={iconSet} /></button>)}
    </div>
  </>;
}
