"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { FieldStat, HallEntry, LiveOperator, MoverEntry } from "@/lib/board/live-types";

/* owner 2026-10-21: "Wire / Notes rotates real updates". Every slide is
   derived from data the board already holds (ops, fieldStats, movers, hall,
   featured); a category with no data produces no slide — nothing is invented.
   Follow-up owner 2026-10-21: newest badge (operator_badges awarded_at, via
   initial.newestBadge) and newest article (blog-index, passed from the board
   page's server component) are wired in; each hides when absent. */
export interface BriefingUpdate {
  key: string;
  kind: string;
  text: string;
  /** Operator codename to link to in the popup, when the update is about one. */
  codename?: string;
  /** Operator display name inside `text`, so the popup can link just that part. */
  name?: string;
  /** Non-profile link (e.g. /blog/<slug>) for the whole slide, when it has one. */
  href?: string;
}

export interface NewestBadge { codename: string; name: string; badge: string; date: string }
export interface NewestPost { slug: string; title: string }

/** Real sort key for a submission: ISO date when projected, else the legacy
 *  "MM/DD/YY" display string rebuilt as YYYY-MM-DD (never compared raw —
 *  "12/30/25" would outrank "01/02/26"). */
function lastKey(o: LiveOperator): string {
  if (o.lastIso) return o.lastIso;
  const m = /^(\d{2})\/(\d{2})\/(\d{2})$/.exec(o.last ?? "");
  return m ? `20${m[3]}-${m[1]}-${m[2]}` : "";
}

const STAT_LABEL: Record<string, string> = {
  total_operators: "Operators on the board",
  median_yield: "Median Yield",
  top_yield: "Top Yield",
};
const ROTATE_MS = 6000;

export function buildUpdates(
  ops: LiveOperator[],
  stats: FieldStat[],
  movers: MoverEntry[] = [],
  hall: HallEntry[] = [],
  leader: { codename: string; name: string } | null = null,
  badge: NewestBadge | null = null,
  post: NewestPost | null = null,
): BriefingUpdate[] {
  const out: BriefingUpdate[] = [];
  const nameOf = (codename: string, fallback?: string) =>
    ops.find((o) => o.codename === codename)?.name ?? fallback ?? codename;
  [...ops].filter((o) => o.last)
    .sort((a, b) => lastKey(b).localeCompare(lastKey(a))).slice(0, 3)
    .forEach((o) => out.push({ key: `sub-${o.codename}`, kind: "Submission",
      text: `${o.name} submitted — ${o.last}`, codename: o.codename, name: o.name }));
  const newest = [...ops].filter((o) => o.age != null)
    .sort((a, b) => (a.age ?? 9e9) - (b.age ?? 9e9))[0];
  if (newest) out.push({ key: `new-${newest.codename}`, kind: "New operator",
    text: `Welcome ${newest.name} — joined the field`, codename: newest.codename, name: newest.name });
  if (leader) out.push({ key: `lead-${leader.codename}`, kind: "Field leader",
    text: `${leader.name} holds #1 on the board`, codename: leader.codename, name: leader.name });
  const mover = movers.find((m) => m.mv7 > 0);
  if (mover) {
    const name = nameOf(mover.codename, mover.handle);
    out.push({ key: `mv-${mover.codename}`, kind: "Rank move",
      text: `${name} ${mover.delta}`, codename: mover.codename, name });
  }
  if (badge) out.push({ key: `badge-${badge.codename}-${badge.badge}`, kind: "New badge",
    text: `${badge.name} earned ${badge.badge}`, codename: badge.codename, name: badge.name });
  if (post) out.push({ key: `post-${post.slug}`, kind: "New article",
    text: post.title, href: `/blog/${post.slug}` });
  hall.slice(0, 2).forEach((h, i) => out.push({ key: `hall-${i}`, kind: "Record",
    text: `${h.metric ? `${h.metric}: ` : ""}${h.value}`, codename: h.codename }));
  stats.filter((s) => STAT_LABEL[s.field] && s.value)
    .forEach((s) => out.push({ key: `stat-${s.field}`, kind: "Field stat",
      text: `${STAT_LABEL[s.field]} ${s.value}` }));
  return out;
}

export function BoardBriefings({ ops, stats, movers, hall, leader, newestBadge, newestPost }: {
  ops: LiveOperator[];
  stats: FieldStat[];
  movers?: MoverEntry[];
  hall?: HallEntry[];
  leader?: { codename: string; name: string } | null;
  newestBadge?: NewestBadge | null;
  newestPost?: NewestPost | null;
}) {
  const [slide, setSlide] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [opened, setOpened] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const updates = useMemo(() => buildUpdates(ops, stats, movers, hall, leader, newestBadge, newestPost),
    [ops, stats, movers, hall, leader, newestBadge, newestPost]);
  const count = updates.length;
  const current = updates[count ? slide % count : 0];

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (hovered || focused || opened || reducedMotion || count < 2) return;
    const timer = setInterval(() => setSlide((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(timer);
  }, [hovered, focused, opened, reducedMotion, count]);

  const open = () => { dialog.current?.showModal(); setOpened(true); };
  const close = () => dialog.current?.close();
  const step = (d: number) => setSlide((i) => (i + d + count) % count);

  return (
    <div className="mod board-briefings" onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)} onFocus={() => setFocused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }}>
      <h3><span className="sq" />WIRE / NOTES</h3>
      <button type="button" className="briefing-preview" aria-haspopup="dialog"
        aria-label={`Open Wire / Notes: ${current ? current.kind : "no updates"}`} onClick={open}>
        <span className="briefing-label">{current?.kind ?? "Wire / Notes"}
          {count > 0 && <span>{(slide % count) + 1} / {count}</span>}</span>
        <span className="briefing-excerpt" aria-live={hovered || focused ? "polite" : "off"}>
          {current ? current.text : "No recent updates in this board view."}
        </span>
        <span className="briefing-hint">OPEN ↗</span>
      </button>
      {count > 1 && <div className="briefing-switch" aria-label="Choose update">
        <button type="button" onClick={() => step(-1)} aria-label="Previous update">‹ Prev</button>
        <button type="button" onClick={() => step(1)} aria-label="Next update">Next ›</button>
      </div>}
      <dialog ref={dialog} className="briefing-dialog" aria-labelledby="board-briefing-title"
        onClose={() => setOpened(false)} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
        <div className="briefing-dialog-card">
          <div className="briefing-dialog-head">
            <h2 id="board-briefing-title">Wire / Notes</h2>
            <button type="button" onClick={close} aria-label="Close Wire / Notes">✕</button>
          </div>
          <section aria-label="All updates" className="briefing-detail">
            {count ? updates.map((u, i) => <p key={u.key} data-current={i === slide % count || undefined}>
              <span className="briefing-kind">{u.kind}</span>{" "}
              {u.href
                ? <Link href={u.href}>{u.text}</Link>
                : u.codename && u.name && u.text.startsWith(u.name)
                ? <><Link href={`/user/${encodeURIComponent(u.codename)}`}>{u.name}</Link>{u.text.slice(u.name.length)}</>
                : u.text.startsWith("Welcome ") && u.codename && u.name
                  ? <>Welcome <Link href={`/user/${encodeURIComponent(u.codename)}`}>{u.name}</Link>{u.text.slice(8 + u.name.length)}</>
                  : u.text}
            </p>) : <p>No recent updates in this board view.</p>}
          </section>
        </div>
      </dialog>
    </div>
  );
}
