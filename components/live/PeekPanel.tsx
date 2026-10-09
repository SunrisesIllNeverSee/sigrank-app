"use client";
/**
 * components/live/PeekPanel.tsx — the aux quickview rail.
 *
 * Owner 2026-10-08: peek at another operator without disturbing the
 * current selection — "a new sidebar screen replicating the profile
 * sidebar; the new user shows up." Slides in as a fourth column between
 * the stage and the inspector rail; nothing else moves or unmounts.
 *
 * Same module stack as the profile rail (tile → dual radar / column
 * ranks → COMBO/SINGLE history → rotating line carousel → records),
 * fed by the same detail fetcher + session cache, but with its own
 * mode/selection state so the peek never mutates the real selection.
 *
 * Actions: SEE PROFILE → /user/<codename> · COMPARE → /compare?a=sel&b=peek
 * · WATCH — shared WatchButton (real row when signed in, local pin
 *   otherwise). The same ProfileActions row renders under the selected
 *   operator's profile in the inspector rail.
 */
import { useState } from "react";
import type { LiveOperator } from "@/lib/board/live-types";
import type { ProfileView } from "./utils";
import type { SignalSeries, SignalMetricKey } from "./CombinedSignal";
import { CombinedSignal } from "./CombinedSignal";
import { ColumnRanks } from "./ColumnRanks";
import { DualSignatureRadar } from "./DualSignatureRadar";
import { LineCarousel } from "./FiveStats";
import type { FiveStatRow } from "./FiveStats";
import type { DetailStatus } from "./enrich";
import { OperatorProfileTile } from "./OperatorDock";
import { ProfileActions } from "./ProfileActions";
import { ProfileSlides } from "./LiveBoardWorkspace";
import { sixFactsOf, fieldSixMedian } from "./LiveBoardWorkspace";

export function PeekPanel({
  op,
  profile,
  ops,
  statRows,
  detailStatus,
  selSlug,
  onClose,
}: {
  /** peeked operator, merged with its fetched detail */
  op: LiveOperator;
  profile: ProfileView;
  ops: LiveOperator[];
  /** same fiveStatRows feed the profile rail consumes (daily-closed) */
  statRows: FiveStatRow[];
  detailStatus: DetailStatus;
  /** currently-selected operator's slug → COMPARE pairs a=sel&b=peek */
  selSlug: string | null;
  onClose: () => void;
}) {
  const [sigMode, setSigMode] = useState<"combined" | "individual">(
    "combined",
  );
  const [sigSel, setSigSel] = useState<SignalMetricKey>("YIELD");

  const sigSeries = Object.fromEntries(
    statRows.map((r) => [r.name, r.history]),
  ) as unknown as SignalSeries;
  const latestYs = ops
    .map((o) => o.trend?.[o.trend.length - 1])
    .filter((v): v is number => v != null)
    .sort((a, b) => a - b);
  const fieldMedY = latestYs.length
    ? latestYs[Math.floor(latestYs.length / 2)]
    : null;
  const compareHref = selSlug
    ? `/compare?a=${encodeURIComponent(selSlug)}&b=${encodeURIComponent(op.slug)}`
    : `/compare?a=${encodeURIComponent(op.slug)}`;

  return (
    <aside className="peekcol" aria-label={`Quickview — ${op.name}`}>
      <div className="colhead">
        PEEK
        <button
          type="button"
          className="peek-x"
          title="close quickview (Esc)"
          aria-label="close quickview"
          onClick={onClose}
        >
          ✕
        </button>
      </div>
      <div className="rail">
        <div className="mod">
          <h3>
            <span className="sq"></span>OPERATOR PROFILE
          </h3>
          <OperatorProfileTile d={profile} />
          <ProfileSlides
            visual={
              <DualSignatureRadar
                operator={sixFactsOf(op)}
                fieldMedian={fieldSixMedian(ops)}
                label={op.name}
              />
            }
            stats={<ColumnRanks op={op} ops={ops} />}
          />
          <CombinedSignal
            series={sigSeries}
            mode={sigMode}
            selected={sigSel}
            onMode={setSigMode}
            onSelect={setSigSel}
            fieldMedianYield={fieldMedY}
          />
          <LineCarousel
            rows={statRows}
            onSelect={(k) => {
              setSigSel(k);
              setSigMode("individual");
            }}
          />
          {(op.recs ?? []).length ? (
            <div className="trph">
              {(op.recs ?? []).slice(0, 3).map((r) => (
                <div className="trph-r" key={r.metric}>
                  <span className="ti">🏆</span>
                  <span className="tm">{r.metric}</span>
                  <span className="tv">
                    #{r.rank} · {r.value}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="drill-note">
              {detailStatus === "ready" ? "— NO RECORDS YET" : "— SYNCING…"}
            </p>
          )}
          <ProfileActions op={op} compareHref={compareHref} />
        </div>
      </div>
    </aside>
  );
}
