"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { FieldStat, LiveOperator } from "@/lib/board/live-types";

const TITLES = ["Signal Wire", "Field Notes"] as const;

export function BoardBriefings({ ops, stats }: { ops: LiveOperator[]; stats: FieldStat[] }) {
  const [slide, setSlide] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [opened, setOpened] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (hovered || focused || opened || reducedMotion) return;
    const timer = setInterval(() => setSlide((i) => 1 - i), 12000);
    return () => clearInterval(timer);
  }, [hovered, focused, opened, reducedMotion]);

  const newest = [...ops].filter((o) => o.age != null)
    .sort((a, b) => (a.age ?? 9e9) - (b.age ?? 9e9))[0];
  const fresh = [...ops].filter((o) => o.last)
    .sort((a, b) => (b.last ?? "").localeCompare(a.last ?? "")).slice(0, 2);
  const notes = stats.map((x) => `${x.field.replace(/_/g, " ").toLowerCase()} ${x.value}`).join(" · ");
  const open = () => { dialog.current?.showModal(); setOpened(true); };
  const close = () => dialog.current?.close();

  return (
    <div className="mod board-briefings" onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)} onFocus={() => setFocused(true)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setFocused(false); }}>
      <h3><span className="sq" />WIRE / NOTES</h3>
      <button type="button" className="briefing-preview" aria-haspopup="dialog"
        aria-label={`Open ${TITLES[slide]}`} onClick={open}>
        <span className="briefing-label">{TITLES[slide]} <span>{slide + 1} / 2</span></span>
        <span className="briefing-excerpt">
          {slide === 0 ? (fresh.length ? fresh.map((o) => `${o.name} submitted — ${o.last}`).join("\n\n")
            : newest ? `Welcome ${newest.name} — joined the field` : "No recent operator activity in this board view.")
            : notes || "No field notes available for this board view."}
        </span>
        <span className="briefing-hint">OPEN ↗</span>
      </button>
      <div className="briefing-switch" aria-label="Choose briefing">
        {TITLES.map((title, i) => <button key={title} type="button" aria-pressed={slide === i}
          onClick={() => { setSlide(i); open(); }}>{title}</button>)}
      </div>
      <dialog ref={dialog} className="briefing-dialog" aria-labelledby="board-briefing-title"
        onClose={() => setOpened(false)} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
        <div className="briefing-dialog-card">
          <div className="briefing-dialog-head">
            <h2 id="board-briefing-title">Wire / Notes</h2>
            <button type="button" onClick={close} aria-label="Close Wire / Notes">✕</button>
          </div>
          <div className="briefing-switch" aria-label="Popup briefing">
            {TITLES.map((title, i) => <button key={title} type="button" aria-pressed={slide === i}
              onClick={() => setSlide(i)}>{title}</button>)}
          </div>
          {slide === 0 ? <section aria-label="Signal Wire" className="briefing-detail">
            {newest && <p>◈ Welcome <Link href={`/user/${encodeURIComponent(newest.codename)}`}>{newest.name}</Link> — joined the field</p>}
            {fresh.map((o) => <p key={o.codename}>▸ <Link href={`/user/${encodeURIComponent(o.codename)}`}>{o.name}</Link> submitted — {o.last}</p>)}
            {!newest && fresh.length === 0 && <p>No recent operator activity in this board view.</p>}
          </section> : <section aria-label="Field Notes" className="briefing-detail">
            {stats.length ? <dl>{stats.map((stat, i) => <div key={`${stat.field}-${i}`}>
              <dt>{stat.field.replace(/_/g, " ")}</dt><dd>{stat.value}</dd>
            </div>)}</dl> : <p>No field notes available for this board view.</p>}
          </section>}
        </div>
      </dialog>
    </div>
  );
}
