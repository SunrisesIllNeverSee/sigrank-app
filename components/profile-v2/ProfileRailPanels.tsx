/**
 * components/profile-v2/ProfileRailPanels.tsx — the right-rail data modules
 * for /user/[codename] (owner checklist items 7, 8, 9, 10, 13).
 *
 * Renders inside ProfileWorkspace's `right` prop, streamed in its own
 * Suspense — the modules need the same operator-scoped data ProfileBody
 * fetches for the tabs, so this component re-issues the SAME cached calls
 * (getOperatorHistory / getHallOfSignal / getLeaderboard claimed-only /
 * getOperatorWatchCount / getOperatorSnapshotRecords). Identical arguments
 * hit the unstable_cache entries the body already warmed — no extra DB work.
 *
 * Modules:
 *   RANK CONTEXTS   — combined-field rank + workflow-cohort rank via
 *                     lib/analytics/workflow-cohort (the board's own
 *                     hitl/agentic inclusion rules; hybrid = combined field).
 *   SUBMISSION ACTIVITY — the 22-week heatmap moved out of Overview.
 *   RECORDS & HONORS — medals + verified/supporter badges + clickable
 *                     record list (earned / pending / unavailable states).
 *
 * Everything derives from the displayed operator's live rows — no fabricated
 * records, no invented ranks; pending operators get honest locked rows.
 */

import type { LeaderboardRow } from "@/lib/board";
import {
  getOperatorHistory,
  getOperatorSnapshotRecords,
  getOperatorWatchCount,
  getHallOfSignal,
  getLeaderboard,
} from "@/lib/board";
import { sortValue } from "@/lib/analytics/sort-value";
import { recordValue } from "@/lib/analytics/record-value";
import { DISPLAY_METRICS, DISPLAY_RAW, REWARDS } from "@/lib/identity/canon-ids";
import { workflowCohortRank } from "@/lib/analytics/workflow-cohort";
import { WorkflowMark } from "./WorkflowMark";
import { RecordDetailList, type RailRecord } from "./RecordDetailList";
import { HexMark } from "./RecordMarks";
import { RailDialog } from "./RailDialog";

import { BOARD_SIGIL, HALL_INK, hallSigil } from "@/lib/profile/record-artwork";
import { proratedDailyTokens } from "@/lib/profile/prorated-activity";

const compact = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (a >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${(n / 1e6).toFixed(a < 1e7 ? 2 : 1)}M`;
  if (a >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(Math.round(n));
};
const num = (n: number) => Math.round(n).toLocaleString("en-US");
const dayMs = 86400000;
const toDay = (iso: string) => Math.floor(Date.parse(iso.slice(0, 10) + "T00:00:00Z") / dayMs);
const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
const fmtDate = (iso: string) => {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return `${MONTHS[(m ?? 1) - 1] ?? "?"} ${d ?? "?"} ${y ?? "?"}`;
};

const SNAPSHOT_MILESTONE = 500;

export async function ProfileRailPanels({ row }: { row: LeaderboardRow }) {
  const { operator, snapshot } = row;
  const codename = operator.codename;

  const [history, snapshotRecords, watchCount, boardRows, hallRecords] =
    await Promise.all([
      getOperatorHistory(codename),
      getOperatorSnapshotRecords(codename),
      getOperatorWatchCount(codename),
      // Same call ProfileBody makes → same unstable_cache entry: the claimed
      // all-time combined field the visible board ranks on.
      getLeaderboard({ window: "all_time", operatorTotal: true, claimedOnly: true, mode: "all" }),
      getHallOfSignal(),
    ]);

  /* ── Rank contexts (item 13) ─────────────────────────────────────────── */
  // onField = membership in the combined-field boardRows — the same source
  // /board/all ranks. row.global_rank (claimedRankMap) is NOT the gate: it
  // only covers resolved-mode snapshots, so unresolved review candidates who
  // are legitimately on the field would read "UNRANKED" / "#0" here.
  const boardRow = boardRows.find((r) => r.operator.codename === codename);
  const onField = !!boardRow && boardRow.global_rank > 0;
  const cohort = workflowCohortRank(boardRows, codename);

  /* ── Activity heatmap (item 7 — moved from OverviewView) ─────────────── */
  const anchorIso = history.length
    ? history[history.length - 1].date
    : (snapshot.snapshot_date ?? "2026-01-01");
  const anchor = toDay(anchorIso);
  const startDay = anchor - 153;
  const acctStart = anchor - operator.account_age_days;
  const histMap = new Map<number, number>();
  for (const h of history) {
    const d = toDay(h.date);
    if (h.yield_ > 0) histMap.set(d, h.yield_);
    else if (!histMap.has(d)) histMap.set(d, -1);
  }
  const yields = [...histMap.values()].filter((v) => v > 0).sort((a, b) => a - b);
  const peak = yields.length ? yields[yields.length - 1] : null;
  // Proration is anchored in REAL scored token windows, not seeded random
  // colors. It does NOT establish observed per-day submissions or streaks.
  const dailyRates = Array.from({ length: 154 }, (_, k) => proratedDailyTokens(snapshotRecords, startDay + k));
  const measuredRates = dailyRates.filter((v): v is number => v != null && v > 0).sort((a,b) => a-b);
  const midRate = measuredRates.length ? measuredRates[Math.floor(measuredRates.length / 2)] : null;
  const cells: { day: number; bg: string | null; estimated: boolean }[] = [];
  for (let k = 0; k < 154; k++) {
    const day = startDay + k;
    if (day > anchor || day < acctStart) { cells.push({ day, bg: null, estimated: false }); continue; }
    const y = histMap.get(day);
    const rate = dailyRates[k];
    let bg: string | null = null;
    const estimated = rate != null && rate > 0 && midRate != null;
    if (estimated) {
      const relative = rate! / midRate!;
      if (relative < 0.8) bg = "rgb(255 0 212 / 0.55)";
      else if (relative <= 1.1) bg = "rgb(255 230 0 / 0.55)";
      else if (relative < 1.8) bg = "rgb(var(--gold) / 0.75)";
      else bg = "var(--pv2-orange)";
    } else if (y != null) {
      // An observed snapshot date is visible; its date is evidence, but
      // never misrepresented as measured continuous daily activity.
      bg = y > 0 && peak && y >= peak ? "var(--pv2-orange)" : "rgb(var(--gold) / 0.35)";
    }
    cells.push({ day, bg, estimated });
  }
  const modeledDays = cells.filter((c) => c.estimated).length;
  const isEstimated = modeledDays > 0;
  const activityNotice = isEstimated
    ? `PRORATED ESTIMATE — ${modeledDays} days covered. Recorded token totals divided evenly across their reporting-window days; the narrowest available window is used. Colors are NOT observed daily submissions. Active, best and streak-like spans are hypothetical coverage, not verified session streaks.`
    : "NO DAILY OBSERVATIONS — insufficient history for modeled activity; no daily activity or streak is assumed.";
  const displayEstimate = (n: number) => isEstimated ? `~${n}` : String(n);
  const active = cells.filter((x) => x.bg);
  let longest = 0, run = 0;
  for (const x of cells) { run = x.bg ? run + 1 : 0; longest = Math.max(longest, run); }
  let streak = 0;
  for (let k = cells.length - 1; k >= 0; k--) { if (cells[k].day > anchor) continue; if (!cells[k].bg) break; streak++; }
  const monthSet: string[] = [];
  for (let w = 0; w < 22; w++) {
    const ab = new Date((startDay + w * 7) * dayMs).toUTCString().slice(8, 11).toUpperCase();
    if (monthSet[monthSet.length - 1] !== ab) monthSet.push(ab);
  }
  /* The full 154-cell grid renders scaled inside the rail trigger and again
     (same cells) inside the centered popup — no separate preview data. */

  /* ── Records (items 8–10): static Hall + dynamic top-3 standings ─────── */
  const names = new Set<string>([codename]);
  if (operator.display_name) names.add(operator.display_name);
  const staticRecs = hallRecords.filter((r) => names.has(r.operator_codename));

  const ALL_BOARDS = [...DISPLAY_METRICS, ...DISPLAY_RAW];
  const dynamicRecs: { id: string; name: string; rank: number; value: string }[] = [];
  if (onField) {
    for (const board of ALL_BOARDS) {
      const sorted = [...boardRows]
        .sort((a, z) => sortValue(z, board.key) - sortValue(a, board.key))
        .slice(0, 3);
      const idx = sorted.findIndex((r) => r.operator.codename === codename);
      if (idx === -1) continue;
      const value = recordValue(sorted[idx], board.id);
      if (value === "—") continue;
      dynamicRecs.push({ id: board.id, name: board.name, rank: idx + 1, value });
    }
    dynamicRecs.sort((a, b) => a.rank - b.rank);
  }

  const railRecords: RailRecord[] = [
    ...staticRecs.map((r, i) => ({
      id: `hall-${r.reward_id}-${i}`,
      state: "earned" as const,
      rank: undefined,
      sigil: hallSigil(r.title),
      ink: HALL_INK,
      title: r.title,
      value: r.value || "—",
      definition: REWARDS[r.reward_id]?.reward ?? r.title,
      cohort: "HALL OF SIGNAL",
      period: "CURATED AWARD",
      date: r.date ? fmtDate(r.date) : "—",
      evidenceHref: "/hall",
      evidenceLabel: "Hall of Signal",
    })),
    ...dynamicRecs.map((r) => ({
      id: `dyn-${r.id}`,
      state: "earned" as const,
      rank: r.rank,
      sigil: BOARD_SIGIL[r.id]?.s ?? "◆",
      ink: BOARD_SIGIL[r.id]?.ink,
      title: r.name,
      value: r.value,
      definition: `Top-${r.rank} standing on the ${r.name} metric board`,
      cohort: "COMBINED FIELD · CLAIMED OPERATORS",
      period: "ALL-TIME",
      date: boardRow?.snapshot.snapshot_date ? fmtDate(boardRow.snapshot.snapshot_date) : "DATE NOT REPORTED",
      evidenceHref: boardRow?.source_submission_id &&
        snapshotRecords.some((record) => record.submissionId === boardRow.source_submission_id)
        ? `/user/${encodeURIComponent(codename)}?tab=submissions#submission-${encodeURIComponent(boardRow.source_submission_id)}`
        : "/board/all",
      evidenceLabel: boardRow?.source_submission_id &&
        snapshotRecords.some((record) => record.submissionId === boardRow.source_submission_id)
        ? "Scored source snapshot" : "Current leaderboard",
    })),
  ];
  if (snapshotRecords.length < SNAPSHOT_MILESTONE) {
    railRecords.push({
      id: "ms-500",
      state: "pending",
      title: "500TH SNAPSHOT MILESTONE",
      value: `${snapshotRecords.length}/500`,
      definition: "Milestone badge awarded at the 500th scored snapshot.",
      cohort: "OPERATOR MILESTONES",
      period: "CUMULATIVE",
      date: "IN PROGRESS",
      progress: snapshotRecords.length / SNAPSHOT_MILESTONE,
      progressLabel: `${snapshotRecords.length} OF ${SNAPSHOT_MILESTONE} SCORED SNAPSHOTS`,
      evidenceHref: `/user/${encodeURIComponent(codename)}?tab=badges`,
      evidenceLabel: "Badges tab",
    });
  }
  if (railRecords.length === 0) {
    railRecords.push({
      id: "locked",
      state: "unavailable",
      title: "RECORDS",
      value: "—",
      definition: onField
        ? "No top-3 metric standings or curated awards yet — rank on a board metric to hold one."
        : "Metric-board standings and curated awards unlock after the first scored snapshot.",
      cohort: "—",
      period: "—",
      date: "—",
    });
  }

  const medals = [
    { n: staticRecs.length + dynamicRecs.filter((r) => r.rank === 1).length, color: "var(--pv2-medal)", label: "gold", sigil: "★", def: "#1 standing on a metric board or curated Hall award" },
    { n: dynamicRecs.filter((r) => r.rank === 2).length, color: "var(--pv2-silver)", label: "silver", sigil: "✧", def: "#2 standing on a metric board" },
    { n: dynamicRecs.filter((r) => r.rank === 3).length, color: "var(--pv2-bronze)", label: "bronze", sigil: "◆", def: "#3 standing on a metric board" },
  ];

  return (
    <>
      {/* RANK CONTEXTS — combined field + workflow cohort (items 12+13).
          owner 2026-10-21: compact box shows the FIELD rank; the workflow
          cohort rank, mark and notes open in a popup. */}
      <div className="mod">
        <h3><span className="sq" />RANK CONTEXTS</h3>
        <RailDialog
          title="RANK CONTEXTS"
          subtitle={onField ? "COMBINED FIELD + WORKFLOW COHORT" : undefined}
          hint="OPEN ▸"
          trigger={
            <div className="prl-ctx">
              <div className="prl-ctx-row">
                <span className="prl-ctx-k">FIELD</span>
                <b className="prl-ctx-v">{onField ? `#${boardRow.global_rank}` : "UNRANKED"}</b>
                <span className="prl-ctx-n">HYBRID · COMBINED{boardRows.length ? ` · OF ${boardRows.length}` : ""}</span>
              </div>
            </div>
          }
        >
          <div className="prl-ctx">
            <div className="prl-ctx-row">
              <span className="prl-ctx-k">FIELD</span>
              <b className="prl-ctx-v">{onField ? `#${boardRow.global_rank}` : "UNRANKED"}</b>
              <span className="prl-ctx-n">HYBRID · COMBINED{boardRows.length ? ` · OF ${boardRows.length}` : ""}</span>
            </div>
            {onField && cohort && (
              <div className="prl-ctx-row">
                <span className="prl-ctx-k">{cohort.cohortShort}</span>
                <b className="prl-ctx-v">{cohort.rank != null ? `#${cohort.rank}` : "—"}</b>
                <span className="prl-ctx-n">{cohort.cohortLabel} · OF {cohort.size}</span>
              </div>
            )}
            {onField && cohort && (
              <div className="prl-ctx-mark">
                <WorkflowMark mode={cohort.mode} size="full" />
                {cohort.mode === null && (
                  <span className="prl-ctx-note">REVIEW CANDIDATE — NOT VERIFIED AUTOMATION</span>
                )}
              </div>
            )}
            {!onField && (
              <div className="prl-ctx-note">
                {snapshotRecords.length === 0
                  ? "AWAITING FIRST SCORED SNAPSHOT"
                  : "NOT PLACED ON COMBINED FIELD"}
              </div>
            )}
          </div>
        </RailDialog>
      </div>

      {/* SUBMISSION ACTIVITY — the whole 22-week grid scaled into the
          sidebar; click pops the same map centered in-window with the
          legend (owner direction — never a stage-body element). */}
      <div className="mod">
        <h3><span className="sq" />SUBMISSION ACTIVITY <span title={activityNotice} style={{ color: "var(--pv2-orange)", fontSize: "9px", letterSpacing: ".06em", marginLeft: "5px" }}>{isEstimated ? "PRORATED · ESTIMATED" : "NO DAILY DATA"}</span></h3>
        <RailDialog
          wide
          title="SUBMISSION ACTIVITY"
          subtitle={`${isEstimated ? "PRORATED TOKEN ACTIVITY" : "AVAILABLE SNAPSHOT DATES"} · ${operator.account_age_days}D · ${num(operator.total_messages_lifetime)} MSG`}
          trigger={
            <div className="prl-heat prl-heat--rail">
              <div className="prl-heat-grid">
                {Array.from({ length: 22 }, (_, w) => (
                  <div key={w} className="prl-heat-col">
                    {cells.slice(w * 7, w * 7 + 7).map((cell, d) => (
                      <div key={d} className="prl-heat-cell" title={cell.estimated ? "PRORATED TOKEN RATE · estimated evenly across reporting window; no observed daily submission" : cell.bg ? "AVAILABLE SNAPSHOT DATE" : "NO DAILY OBSERVATION"} style={cell.bg ? { background: cell.bg } : undefined} />
                    ))}
                  </div>
                ))}
              </div>
              <div className="prl-heat-stats">
                <span><b>{displayEstimate(active.length)}</b>{isEstimated ? "EST. COVERED" : "ACTIVE"}</span>
                <span><b>{displayEstimate(longest)}</b>{isEstimated ? "EST. LONGEST" : "BEST"}</span>
                <span><b>{displayEstimate(streak)}</b>{isEstimated ? "EST. CURRENT" : "STREAK"}</span>
                <span><b>{yields.length ? compact(yields[yields.length - 1]) : "—"}</b>PEAK Υ</span>
              </div>
              <p className="ws-note" style={{ marginTop: "6px", lineHeight: 1.4 }}>{activityNotice}</p>
            </div>
          }
        >
          <div className="prl-heat">
            <div className="prl-heat-months">
              {monthSet.map((m, i) => <span key={i}>{m}</span>)}
            </div>
            <div className="prl-heat-grid">
              {Array.from({ length: 22 }, (_, w) => (
                <div key={w} className="prl-heat-col">
                  {cells.slice(w * 7, w * 7 + 7).map((cell, d) => (
                    <div key={d} className="prl-heat-cell" title={cell.estimated ? "PRORATED TOKEN RATE · estimated evenly across reporting window; no observed daily submission" : cell.bg ? "AVAILABLE SNAPSHOT DATE" : "NO DAILY OBSERVATION"} style={cell.bg ? { background: cell.bg } : undefined} />
                  ))}
                </div>
              ))}
            </div>
            <div className="prl-heat-stats">
              <span><b>{displayEstimate(active.length)}</b>{isEstimated ? "EST. COVERED" : "ACTIVE"}</span>
              <span><b>{displayEstimate(longest)}</b>{isEstimated ? "EST. LONGEST" : "BEST"}</span>
              <span><b>{displayEstimate(streak)}</b>{isEstimated ? "EST. CURRENT" : "STREAK"}</span>
              <span><b>{yields.length ? compact(yields[yields.length - 1]) : "—"}</b>PEAK Υ</span>
            </div>
            <p className="ws-note" style={{ marginTop: "8px", lineHeight: 1.5 }}>{activityNotice}</p>
            <div className="prl-heat-legend">
              <span><i style={{ background: "rgb(255 0 212 / 0.55)" }} />BELOW</span>
              <span><i style={{ background: "rgb(255 230 0 / 0.55)" }} />BASE</span>
              <span><i style={{ background: "rgb(var(--gold) / 0.55)" }} />ABOVE</span>
              <span><i style={{ background: "rgb(255 154 60 / 0.55)" }} />RECORD</span>
            </div>
          </div>
        </RailDialog>
      </div>

      {/* RECORDS & HONORS — honors strip pops its detail in-window; the
          record list (owner 2026-10-21: compact sidebar) lives in that
          popup and each row still opens its own detail card (item 10). */}
      <div className="mod">
        <h3><span className="sq" />TROPHIES &amp; RECORDS</h3>
        <RailDialog
          title="TROPHIES & RECORDS"
          subtitle={`${railRecords.filter((r) => r.state === "earned").length} EARNED · ${railRecords.filter((r) => r.state === "pending").length} IN PROGRESS`}
          trigger={
            <>
              <span className="prl-medals">
                {medals.map((m) => (
                  <i key={m.label} className="prl-medal" style={{ opacity: m.n === 0 ? 0.3 : 1 }}>
                    <HexMark sigil={m.sigil} ring={m.color} size={22} />
                    <b style={{ color: m.color }}>{m.n}</b>
                    <i>{m.label}</i>
                  </i>
                ))}
                <i className="prl-watched">WATCHED {watchCount}</i>
              </span>
              <span className="prl-badges">
                {operator.verification_status !== "unverified" && (
                  <i className="prl-badge prl-badge--v">✓ VERIFIED</i>
                )}
                {operator.current_supporter_tier !== "free" && (
                  <i className="prl-badge prl-badge--s">◆ SUPPORTER</i>
                )}
              </span>
            </>
          }
        >
          <dl className="prl-dialog-dl">
            {medals.map((m) => (
              <div key={m.label}>
                <dt className="prl-honor-dt"><HexMark sigil={m.sigil} ring={m.color} size={24} />{m.label.toUpperCase()}</dt>
                <dd>{m.n} — {m.def}</dd>
              </div>
            ))}
            {operator.verification_status !== "unverified" && (
              <div><dt className="prl-honor-dt">✓ VERIFIED</dt><dd>Identity verified/audited operator status.</dd></div>
            )}
            {operator.current_supporter_tier !== "free" && (
              <div><dt className="prl-honor-dt">◆ SUPPORTER</dt><dd>Active supporter tier: {operator.current_supporter_tier}.</dd></div>
            )}
            <div><dt className="prl-honor-dt">WATCHED</dt><dd>{watchCount} operator{watchCount === 1 ? "" : "s"} watching this profile.</dd></div>
          </dl>
          <p className="prl-note">EACH RECORD ROW OPENS ITS OWN DETAIL.</p>
          <RecordDetailList records={railRecords} />
        </RailDialog>
      </div>
    </>
  );
}
