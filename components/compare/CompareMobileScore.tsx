"use client";

/**
 * components/compare/CompareMobileScore.tsx — phone-only score card for /compare
 * (owner 2026-10-21, mobile spec T4): metric wins, rank · Υ, throughput and a
 * Share button (navigator.share, copy-link fallback). Hidden above 760px by CSS
 * (.cmp-m-score), so desktop and tablet are unchanged.
 */
import { useEffect, useRef, useState } from "react";

export type MobileScoreSide = { name: string; rank: number; yieldStr: string; thr: string };

export function CompareMobileScore({
  a,
  b,
  aWins,
  bWins,
  href,
}: {
  a: MobileScoreSide;
  b: MobileScoreSide;
  aWins: number;
  bWins: number;
  href: string;
}) {
  const [note, setNote] = useState("");
  const noteTimer = useRef<number | undefined>(undefined);
  // owner 2026-10-21: clear the pending note timer on unmount.
  useEffect(() => () => window.clearTimeout(noteTimer.current), []);

  const share = async () => {
    const url = new URL(href, window.location.origin).toString();
    const title = `${a.name} vs ${b.name} · SignalAF`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title, url });
        return;
      }
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return; // user dismissed the sheet
    }
    window.clearTimeout(noteTimer.current);
    let copied = true;
    try {
      await navigator.clipboard.writeText(url);
      setNote("Link copied");
    } catch {
      copied = false;
      setNote(url); // fallback: leave the URL up so it can be selected and copied
    }
    if (copied) noteTimer.current = window.setTimeout(() => setNote(""), 2500);
  };

  return (
    <section className="cmp-m-score" aria-label="Matchup score">
      <div className="cmp-m-wins">
        <b className="a">{aWins}</b>
        <span>METRIC WINS</span>
        <b className="b">{bWins}</b>
      </div>
      <div className="cmp-m-kv">
        <b className="a">#{a.rank} · {a.yieldStr}</b>
        <span>RANK · Υ</span>
        <b className="b">#{b.rank} · {b.yieldStr}</b>
      </div>
      <div className="cmp-m-kv">
        <b className="a">{a.thr}</b>
        <span>THROUGHPUT</span>
        <b className="b">{b.thr}</b>
      </div>
      <button type="button" className="cmp-m-share" onClick={share}>
        Share ↗
      </button>
      <p className="cmp-m-note" role="status" aria-live="polite">{note}</p>
    </section>
  );
}
