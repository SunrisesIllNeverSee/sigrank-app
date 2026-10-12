"use client";

/**
 * components/profile-v2/RecordDetailList.tsx — clickable record rows for the
 * profile right rail (owner checklist items 9+10).
 *
 * Each row carries a three-state visual treatment:
 *   earned      — medal disc (gold/silver/bronze for #1/#2/#3 standings,
 *                 gold for curated Hall records)
 *   pending     — dashed outline + progress note (in-progress milestones)
 *   unavailable — locked grey (records not reachable yet, e.g. pending ops)
 *
 * Clicking a row opens a <dialog> with the record's detail card:
 * definition, value, cohort, period, date, and evidence link when available.
 * Native <dialog> gives Esc/backdrop close + focus containment for free.
 */

import { useRef, useState } from "react";

export interface RailRecord {
  id: string;
  state: "earned" | "pending" | "unavailable";
  /** Medal rank for earned records (1/2/3 → gold/silver/bronze disc). */
  rank?: number;
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

const MEDAL: Record<number, string> = { 1: "#FFD700", 2: "#C0C0C0", 3: "#CD7F32" };

function MedalDot({ rank, color }: { rank?: number; color: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M8.2 2.5 12 7l3.8-4.5 2.3 1-3 5.2-3.1-1.6-3.1 1.6-3-5.2z" fill={color} opacity="0.55" />
      <circle cx="12" cy="15" r="7.2" fill="none" stroke={color} strokeWidth="1.8" />
      <circle cx="12" cy="15" r="4.8" fill={color} opacity="0.2" />
      {rank != null && (
        <text x="12" y="18.4" textAnchor="middle" fill={color} fontSize="8" fontWeight="700" fontFamily="monospace">
          {rank}
        </text>
      )}
    </svg>
  );
}

function PendingGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeDasharray="3 3" opacity="0.8" />
      <path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function LockedGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0 }}>
      <rect x="5" y="11" width="14" height="9" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
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
          <li key={r.id}>
            <button
              type="button"
              className={`prl-rec prl-rec--${r.state}`}
              onClick={() => open(r)}
              aria-haspopup="dialog"
            >
              <span className="prl-rec-icon">
                {r.state === "earned" ? (
                  <MedalDot rank={r.rank} color={r.rank != null ? MEDAL[r.rank] ?? "#FFD700" : "#FFD700"} />
                ) : r.state === "pending" ? (
                  <PendingGlyph />
                ) : (
                  <LockedGlyph />
                )}
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
                {active.state === "earned" ? (
                  <MedalDot rank={active.rank} color={active.rank != null ? MEDAL[active.rank] ?? "#FFD700" : "#FFD700"} />
                ) : active.state === "pending" ? (
                  <PendingGlyph />
                ) : (
                  <LockedGlyph />
                )}
              </span>
              <div className="prl-dialog-titles">
                <strong>{active.title}</strong>
                <span>{active.state === "earned" ? "CURRENT RECORD" : active.state === "pending" ? "IN PROGRESS" : "UNAVAILABLE"}</span>
              </div>
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
