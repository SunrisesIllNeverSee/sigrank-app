"use client";

/**
 * components/profile-v2/RecordDetailList.tsx — clickable record rows for the
 * profile right rail (owner checklist items 9+10).
 *
 * Each row carries a three-state visual treatment built on the owner's
 * hexagon medallion artwork (RecordMarks — same geometry as BadgeArtwork's
 * AchievementArtwork):
 *   earned      — hexagon medallion: metal ring by standing rank
 *                 (gold/silver/bronze; hall gold for curated awards) with the
 *                 metric/hall sigil inside
 *   pending     — dashed hexagon + clock hands + progress note
 *   unavailable — dim hexagon + lock
 *
 * Clicking a row opens a <dialog> with the record's detail card:
 * definition, value, cohort, period, date, and evidence link when available.
 * Native <dialog> gives Esc/backdrop close + focus containment for free.
 */

import { useRef, useState } from "react";
import { MedalHex, PendingHex, LockedHex } from "./RecordMarks";
import { UnifiedShare } from "@/components/share/UnifiedShare";

export interface RailRecord {
  id: string;
  state: "earned" | "pending" | "unavailable";
  /** Medal rank for earned records (1/2/3 → gold/silver/bronze ring). */
  rank?: number;
  /** Catalog sigil for earned medallions (metric mark or hall award glyph). */
  sigil?: string;
  /** Sigil ink color (metric family accent); defaults to the ring color. */
  ink?: string;
  /** Short row title (metric name or badge title). */
  title: string;
  /** Row value (e.g. "976.9KΥ", "12/500"). */
  value: string;
  /** Detail card fields. */
  definition: string;
  cohort: string;
  period: string;
  date: string;
  /** Evidence link (board/hall URL) or null. */
  evidenceHref?: string;
  evidenceLabel?: string;
  /** Optional progress fraction 0..1 for pending rows. */
  progress?: number;
  progressLabel?: string;
}

function RecordIcon({ r, size = 23 }: { r: RailRecord; size?: number }) {
  if (r.state === "earned") return <MedalHex rank={r.rank} sigil={r.sigil ?? "◆"} ink={r.ink} size={size} />;
  if (r.state === "pending") return <PendingHex size={size} />;
  return <LockedHex size={size} />;
}

export function RecordDetailList({ records }: { records: RailRecord[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<RailRecord | null>(null);

  const open = (r: RailRecord) => {
    setActive(r);
    dialogRef.current?.showModal();
  };
  const close = () => dialogRef.current?.close();

  return (
    <>
      <ul className="prl-recs" aria-label="Operator records">
        {records.map((r) => (
          <li key={r.id} id={"record-" + encodeURIComponent(r.id)}>
            <button
              type="button"
              className={`prl-rec prl-rec--${r.state}`}
              onClick={() => open(r)}
              aria-haspopup="dialog"
            >
              <span className="prl-rec-icon">
                <RecordIcon r={r} />
              </span>
              <span className="prl-rec-body">
                <span className="prl-rec-name" title={r.title}>{r.title}</span>
                {r.progress != null && (
                  <span className="prl-rec-bar" aria-hidden="true">
                    <span style={{ width: `${Math.min(100, Math.max(0, r.progress * 100))}%` }} />
                  </span>
                )}
              </span>
              <span className="prl-rec-val">{r.value}</span>
              <span className="prl-rec-chev" aria-hidden="true">›</span>
            </button>
          </li>
        ))}
      </ul>

      <dialog ref={dialogRef} className="prl-dialog" onClose={() => setActive(null)}
        onClick={(e) => { if (e.target === dialogRef.current) close(); }}>
        {active && (
          <div className="prl-dialog-card">
            <div className="prl-dialog-head">
              <span className="prl-rec-icon">
                <RecordIcon r={active} size={24} />
              </span>
              <div className="prl-dialog-titles">
                <strong>{active.title}</strong>
                <span>{active.state === "earned" ? "CURRENT RECORD" : active.state === "pending" ? "IN PROGRESS" : "UNAVAILABLE"}</span>
              </div>
              {active.state === "earned" && <UnifiedShare title={"SignalAF · " + active.title + " record"} href={"#record-" + encodeURIComponent(active.id)}
                screenshotTarget=".prl-dialog[open] .prl-dialog-card" compact />}
              <button type="button" className="prl-dialog-x" onClick={close} aria-label="Close record details">✕</button>
            </div>
            <dl className="prl-dialog-dl">
              <div><dt>DEFINITION</dt><dd>{active.definition}</dd></div>
              <div><dt>VALUE</dt><dd>{active.value}</dd></div>
              <div><dt>COHORT</dt><dd>{active.cohort}</dd></div>
              <div><dt>PERIOD</dt><dd>{active.period}</dd></div>
              <div><dt>DATE</dt><dd>{active.date}</dd></div>
              {active.progress != null && (
                <div><dt>PROGRESS</dt><dd>{active.progressLabel ?? `${Math.round(active.progress * 100)}%`}</dd></div>
              )}
              {active.evidenceHref && (
                <div><dt>EVIDENCE</dt><dd>
                  <a
                    href={active.evidenceHref}
                    {...(active.evidenceHref.startsWith("/") ? {} : { target: "_blank", rel: "noreferrer" })}
                  >
                    {active.evidenceLabel ?? "View source"} ↗
                  </a>
                </dd></div>
              )}
            </dl>
          </div>
        )}
      </dialog>
    </>
  );
}
