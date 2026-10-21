"use client";

/* components/live/EarnedMarksModule.tsx — AWARDS & BADGES rail module
   (owner 2026-10-21: "not all of my awards and badges show up").

   The old module auto-rotated three fixed slides (6 pixel badges, medal
   counts, 5 achievement cards) and never saw platform pixels, Hall records or
   the snapshot milestone. This one summarises everything earned — counts plus
   the top few marks — and OPEN shows the full list in a popup (same <dialog>
   pattern as WIRE / NOTES). Selection is the pure selectEarnedMarks(). */

import { useRef, useState } from "react";
import {
  selectEarnedMarks,
  summarizeEarnedMarks,
  type EarnedMark,
  type EarnedMarksInput,
} from "@/lib/live/earned-marks";
import { PixelPatternBadge } from "./PixelBadge";
import { SignalMedal } from "./SignalHardware";

function MarkArt({ m, size = 1 }: { m: EarnedMark; size?: number }) {
  if (m.pattern) return <PixelPatternBadge pattern={m.pattern} label={m.label} />;
  if (m.rank === 1 || m.rank === 2 || m.rank === 3)
    return <SignalMedal rank={m.rank} size={Math.round(24 * size)} />;
  return (
    <span className="em-sigil" aria-hidden="true">
      {m.sigil ?? "◆"}
    </span>
  );
}

export function EarnedMarksModule({ input }: { input: EarnedMarksInput }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [opened, setOpened] = useState(false);
  const marks = selectEarnedMarks(input);
  const sum = summarizeEarnedMarks(marks, 4);
  const open = () => {
    dialog.current?.showModal();
    setOpened(true);
  };
  const close = () => dialog.current?.close();
  const groups = (["Pixel badges", "Records & medals", "Standing & milestones"] as const)
    .map((g) => [g, marks.filter((m) => m.group === g)] as const)
    .filter(([, list]) => list.length);

  return (
    <div className="earned-marks">
      <div className="em-counts" aria-label="Earned marks">
        <span><b className="mono">{sum.total}</b> EARNED</span>
        <span><b className="mono">{sum.pixels}</b> PIXEL</span>
        <span><b className="mono">{sum.records}</b> RECORDS</span>
      </div>
      {sum.top.length ? (
        <div className="em-top">
          {sum.top.map((m) => (
            <span className="em-cell" key={m.id} title={`${m.label} — ${m.detail}`}>
              <MarkArt m={m} />
              <small>{m.label}</small>
            </span>
          ))}
        </div>
      ) : (
        <p className="drill-note">— NOTHING EARNED YET</p>
      )}
      <button
        type="button"
        className="em-open"
        aria-haspopup="dialog"
        aria-label="Open all awards and badges"
        onClick={open}
      >
        OPEN ↗
      </button>
      <dialog
        ref={dialog}
        className="briefing-dialog em-dialog"
        aria-labelledby="earned-marks-title"
        onClose={() => setOpened(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <div className="briefing-dialog-card">
          <div className="briefing-dialog-head">
            <h2 id="earned-marks-title">Awards &amp; Badges · {sum.total}</h2>
            <button type="button" onClick={close} aria-label="Close Awards and Badges">
              ✕
            </button>
          </div>
          {opened &&
            (groups.length ? (
              groups.map(([g, list]) => (
                <section key={g} className="em-group" aria-label={g}>
                  <h3>
                    {g} <span className="mut">· {list.length}</span>
                  </h3>
                  <ul>
                    {list.map((m) => (
                      <li key={m.id}>
                        <MarkArt m={m} size={1.2} />
                        <span className="em-t">
                          <b>{m.label}</b>
                          <small>{m.detail}</small>
                        </span>
                      </li>
                    ))}
                  </ul>
                </section>
              ))
            ) : (
              <p className="briefing-detail">Nothing earned yet.</p>
            ))}
        </div>
      </dialog>
    </div>
  );
}
