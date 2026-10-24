/**
 * components/history/ComparePanel.tsx — right sidebar on /board/history:
 * compare two July 31 operators side by side. Snapshot rows only; never
 * live Compare data.
 */

import { useState } from "react";
import { compareEntries, type CompareKey } from "@/lib/history/compare";
import { fmtArchived } from "@/lib/history/format";
import type { HistoricalEntry } from "@/lib/history/types";
import { HISTORY_METRIC_COLUMNS } from "./legacy/LeaderboardTable";

type Slots = [HistoricalEntry | null, HistoricalEntry | null];
const KEYS = HISTORY_METRIC_COLUMNS.map((c) => c.key) as CompareKey[];
const LABEL = ["A", "B"] as const;

function Picker({ slot, entries, onPick }: { slot: 0 | 1; entries: HistoricalEntry[]; onPick: (slot: 0 | 1, e: HistoricalEntry) => void }) {
  const [q, setQ] = useState("");
  const sq = q.trim().toLowerCase();
  const hits = sq
    ? entries.filter((e) => [e.anonId, e.codename, e.subLabel ?? ""].join(" ").toLowerCase().includes(sq)).slice(0, 8)
    : [];
  return (
    <div className="hist-cmp-picker">
      <p className="ws-note">Pick an operator</p>
      <input
        type="text"
        aria-label="Find a July 31 operator"
        placeholder="name or @handle…"
        value={q}
        onChange={(ev) => setQ(ev.target.value)}
      />
      {hits.length ? (
        <ul>
          {hits.map((e) => (
            <li key={e.codename}>
              <button type="button" onClick={() => { onPick(slot, e); setQ(""); }}>
                #{e.rank} {e.anonId} <span>{e.codename}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function ComparePanel({
  slots,
  entries,
  onPick,
  onClear,
}: {
  slots: Slots;
  entries: HistoricalEntry[];
  onPick: (slot: 0 | 1, e: HistoricalEntry) => void;
  onClear: (slot: 0 | 1) => void;
}) {
  const [a, b] = slots;
  const rows = a && b ? compareEntries(a, b, KEYS) : null;
  return (
    <div className="mod hist-cmp">
      <div className="mini-h"><span className="sq" />COMPARE · JULY 31</div>
      <div className="hist-cmp-slots">
        {slots.map((e, i) => {
          const slot = i as 0 | 1;
          return (
            <div key={slot} className="hist-cmp-slot">
              <span className="hist-cmp-tag">{LABEL[slot]}</span>
              {e ? (
                <>
                  <span className="hist-cmp-rank" data-testid={`hist-cmp-rank-${slot}`}>#{e.rank}</span>
                  <strong style={{ fontStyle: e.isSeed ? "italic" : "normal" }}>{e.anonId}</strong>
                  <span className="hist-cmp-class">{e.signalClass ?? "—"}</span>
                  <button type="button" className="hist-cmp-clear" aria-label={`Clear ${LABEL[slot]}`} onClick={() => onClear(slot)}>×</button>
                </>
              ) : (
                <Picker slot={slot} entries={entries} onPick={onPick} />
              )}
            </div>
          );
        })}
      </div>
      {rows ? (
        <table className="hist-cmp-table">
          <thead>
            <tr><th scope="col">Metric</th><th scope="col">A</th><th scope="col">B</th></tr>
          </thead>
          <tbody>
            {HISTORY_METRIC_COLUMNS.map((c, i) => {
              const r = rows[i];
              // Mark the better value: higher, except where lower is better ($/1M).
              const better = "lowerIsBetter" in c && c.lowerIsBetter ? (r.higher === "a" ? "b" : r.higher === "b" ? "a" : null) : r.higher;
              return (
                <tr key={c.key} data-cmp-key={c.key}>
                  <th scope="row"><span aria-hidden>{c.icon}</span>{c.label}</th>
                  <td className={better === "a" ? "hi" : ""}>{fmtArchived(r.a, c.key)}</td>
                  <td className={better === "b" ? "hi" : ""}>{fmtArchived(r.b, c.key)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="ws-note">Add two operators from the table or search above. Values are as archived on July 31, 2026.</p>
      )}
    </div>
  );
}
