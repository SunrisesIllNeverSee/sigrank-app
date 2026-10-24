/**
 * components/history/MiniProfile.tsx — left sidebar on /board/history: the
 * selected row exactly as archived on July 31, 2026. No link to a live
 * profile; claiming goes through the existing email path (claim-contact).
 */

import { claimMailto } from "@/lib/identity/claim-contact";
import { fmtArchived } from "@/lib/history/format";
import type { HistoricalEntry } from "@/lib/history/types";
import { HISTORY_METRIC_COLUMNS } from "./legacy/LeaderboardTable";

export function MiniProfile({
  entry,
  onAddToCompare,
}: {
  entry: HistoricalEntry | null;
  onAddToCompare: (e: HistoricalEntry) => void;
}) {
  if (!entry) {
    return (
      <div className="mod hist-mini">
        <div className="mini-h"><span className="sq" />OPERATOR</div>
        <p className="ws-note">Select an operator</p>
      </div>
    );
  }
  const platforms = entry.platforms?.length ? entry.platforms.join(", ") : entry.platform ?? "—";
  return (
    <div className="mod hist-mini">
      <div className="mini-h"><span className="sq" />OPERATOR</div>
      <p className="hist-mini-banner">Snapshot from July 31, 2026. Not linked to a live profile.</p>
      <div className="hist-mini-id">
        <span className="hist-mini-rank" data-testid="hist-archived-rank">#{entry.rank}</span>
        <span className="hist-mini-names">
          <strong style={{ fontStyle: entry.isSeed ? "italic" : "normal" }}>{entry.anonId}</strong>
          {entry.subLabel ? <span>{entry.subLabel}</span> : null}
          <code>{entry.codename}</code>
        </span>
      </div>
      <dl className="hist-mini-facts">
        <dt>Class</dt><dd>{entry.signalClass ?? "—"}</dd>
        <dt>Platform</dt><dd>{platforms}</dd>
        <dt>Status</dt><dd>{entry.status ?? "—"}</dd>
        <dt>Seeded</dt><dd>{entry.isSeed ? "yes" : "no"}</dd>
        <dt>Account age</dt><dd>{entry.acctAge || "—"}</dd>
        <dt>Last seen</dt><dd>{entry.lastSeen ? entry.lastSeen.slice(0, 10) : "—"}</dd>
      </dl>
      <dl className="hist-mini-metrics">
        {HISTORY_METRIC_COLUMNS.map((c) => (
          <div key={c.key} data-testid={`hist-metric-${c.key}`}>
            <dt><span aria-hidden>{c.icon}</span>{c.label}</dt>
            <dd>{fmtArchived(entry[c.key] as number | null | undefined, c.key)}</dd>
          </div>
        ))}
      </dl>
      <div className="hist-mini-actions">
        <button type="button" className="hist-btn" onClick={() => onAddToCompare(entry)}>Add to compare</button>
        <a className="hist-btn ghost" href={claimMailto(entry.codename)}>Claim this profile</a>
      </div>
    </div>
  );
}
