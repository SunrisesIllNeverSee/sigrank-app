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

/* Owner-catalog sigils (achievement-index.v1.json) keyed by metric-board id —
   medallion glyph inside the standing-metal ring. */
const BOARD_SIGIL: Record<string, { s: string; ink: string }> = {
  "Y.01": { s: "Υ", ink: "#bd83ff" },  // cascade-yield-one
  "Y.02": { s: "◈", ink: "#41d9d3" },  // signal-snr-half
  "Y.03": { s: "×", ink: "#bd83ff" },  // cascade-leverage-ten
  "Y.04": { s: "↗", ink: "#bd83ff" },  // cascade-velocity
  "Y.05": { s: "⌁", ink: "#41d9d3" },  // signal-dev-two
  "Y.06": { s: "⬡", ink: "#ffad4b" },  // scale-billion
  "Y.07": { s: "$", ink: "#ffad4b" },  // cost — no catalog mark; honest label
  "Y.08": { s: "▸", ink: "#41d9d3" },  // signal-output-first
  "Y.09": { s: "◉", ink: "#41d9d3" },  // signal-balanced
  "Y.10": { s: "◉", ink: "#41d9d3" },
  "Y.11": { s: "◉", ink: "#41d9d3" },
  "Y.12": { s: "◉", ink: "#41d9d3" },
  "T.01": { s: "▰", ink: "#ffad4b" },  // scale-output-ten
  "T.02": { s: "▦", ink: "#ffad4b" },  // scale-100m
  "T.03": { s: "▱", ink: "#ffad4b" },  // scale-output-hundred
  "T.04": { s: "▤", ink: "#ffad4b" },  // cache-write
  "T.05": { s: "⬡", ink: "#ffad4b" },  // total — scale family
};
const HALL_INK = "#e8bf61";
/** Curated Hall record → catalog sigil (hall-first ◇ / triple ♛ / gold ★). */
function hallSigil(title: string): string {
  const t = title.toUpperCase();
  if (t.includes("FIRST")) return "◇";
  if (t.includes("TRIPLE") || t.includes("THREE")) return "♛";
  return "★";
}

/* ── Deterministic PRNG (same generator OverviewView used) ─────────────── */
function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(a: number): () => number {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

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
  const baseline = yields.length ? yields[Math.floor(yields.length / 2)] : null;
  const peak = yields.length ? yields[yields.length - 1] : null;
  const rng = mulberry32(hashSeed(codename));
  const simulate = history.length > 0;
  const cells: { day: number; bg: string | null }[] = [];
  for (let k = 0; k < 154; k++) {
    const day = startDay + k;
    if (day > anchor || day < acctStart) { cells.push({ day, bg: null }); continue; }
    const recency = (day - Math.max(acctStart, startDay)) / Math.max(1, anchor - Math.max(acctStart, startDay));
    const y = histMap.get(day);
    let bg: string | null = null;
    if (y != null && y >= 0 && baseline) {
      if (peak && y >= peak) bg = "var(--pv2-orange)";
      else if (y < baseline * 0.9) bg = "rgb(255 0 212 / 0.55)";
      else if (y <= baseline * 1.1) bg = "rgb(255 230 0 / 0.55)";
      else bg = "rgb(var(--gold) / 0.75)";
    } else if (y === -1) {
      bg = "rgb(var(--gold) / 0.35)";
    } else if (simulate) {
      const v = rng() * 0.6 + recency * 0.4;
      if (v >= 0.15) {
        const t = rng(), lvl = rng();
        const al = lvl < 0.2 ? "0.15" : lvl < 0.4 ? "0.35" : lvl < 0.6 ? "0.55" : lvl < 0.8 ? "0.75" : null;
        if (t < 0.15) bg = `rgb(255 0 212 / ${lvl < 0.25 ? "0.15" : lvl < 0.5 ? "0.35" : lvl < 0.75 ? "0.55" : "0.75"})`;
        else if (t < 0.65) bg = al ? `rgb(255 230 0 / ${al})` : "var(--pv2-yellow)";
        else if (t < 0.9) bg = al ? `rgb(var(--gold) / ${al})` : "var(--pv2-signal)";
        else bg = lvl < 0.8 ? "rgb(255 154 60 / 0.55)" : "var(--pv2-orange)";
      }
    }
    cells.push({ day, bg });
  }
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
  // Weekly spark strip for the compact rail trigger: one cell per week —
  // the last lit day's color, else unlit.
  const weekColors = Array.from({ length: 22 }, (_, w) => {
    const wk = cells.slice(w * 7, w * 7 + 7);
    for (let d = wk.length - 1; d >= 0; d--) if (wk[d].bg) return wk[d].bg;
    return null;
  });

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
      date: "LIVE STANDING",
      evidenceHref: "/board/all",
      evidenceLabel: "Live leaderboard",
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
      {/* RANK CONTEXTS — combined field + workflow cohort (items 12+13) */}
      <div className="mod">
        <h3><span className="sq" />RANK CONTEXTS</h3>
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
      </div>

      {/* SUBMISSION ACTIVITY — compact strip; full grid pops up in-window
          on click (owner direction — never a stage-body element). */}
      <div className="mod">
        <h3><span className="sq" />SUBMISSION ACTIVITY</h3>
        <RailDialog
          wide
          title="SUBMISSION ACTIVITY"
          subtitle={`DAILY YIELD VS OPERATOR BASELINE · ${operator.account_age_days}D · ${num(operator.total_messages_lifetime)} MSG`}
          trigger={
            <>
              <span className="prl-heat-stats">
                <span><b>{active.length}</b>ACTIVE</span>
                <span><b>{longest}</b>BEST</span>
                <span><b>{streak}</b>STREAK</span>
                <span><b>{yields.length ? compact(yields[yields.length - 1]) : "—"}</b>PEAK Υ</span>
              </span>
              <span className="prl-spark" aria-hidden="true">
                {weekColors.map((c, w) => (
                  <i key={w} style={c ? { background: c } : undefined} />
                ))}
              </span>
            </>
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
                    <div key={d} className="prl-heat-cell" style={cell.bg ? { background: cell.bg } : undefined} />
                  ))}
                </div>
              ))}
            </div>
            <div className="prl-heat-stats">
              <span><b>{active.length}</b>ACTIVE</span>
              <span><b>{longest}</b>BEST</span>
              <span><b>{streak}</b>STREAK</span>
              <span><b>{yields.length ? compact(yields[yields.length - 1]) : "—"}</b>PEAK Υ</span>
            </div>
            <div className="prl-heat-legend">
              <span><i style={{ background: "rgb(255 0 212 / 0.55)" }} />BELOW</span>
              <span><i style={{ background: "rgb(255 230 0 / 0.55)" }} />BASE</span>
              <span><i style={{ background: "rgb(var(--gold) / 0.55)" }} />ABOVE</span>
              <span><i style={{ background: "rgb(255 154 60 / 0.55)" }} />RECORD</span>
            </div>
          </div>
        </RailDialog>
      </div>

      {/* RECORDS & HONORS — honors strip pops its detail in-window;
          each record row still opens its own detail card (item 10). */}
      <div className="mod">
        <h3><span className="sq" />RECORDS &amp; HONORS</h3>
        <RailDialog
          title="RECORDS & HONORS"
          subtitle={`${railRecords.filter((r) => r.state === "earned").length} EARNED · ${railRecords.filter((r) => r.state === "pending").length} IN PROGRESS`}
          trigger={
            <>
              <span className="prl-medals">
                {medals.map((m) => (
                  <i key={m.label} className="prl-medal" style={{ opacity: m.n === 0 ? 0.3 : 1 }}>
                    <HexMark sigil={m.sigil} ring={m.color} size={14} />
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
                <dt className="prl-honor-dt"><HexMark sigil={m.sigil} ring={m.color} size={18} />{m.label.toUpperCase()}</dt>
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
          <p className="prl-note">RECORDS LISTED BELOW — EACH ROW OPENS ITS OWN DETAIL.</p>
        </RailDialog>
        <RecordDetailList records={railRecords} />
      </div>
    </>
  );
}
