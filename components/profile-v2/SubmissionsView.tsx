/**
 * components/profile-v2/SubmissionsView.tsx — the SUBMISSIONS tab for the v2
 * profile redesign.
 *
 * Activity-log surface modeled on _workspace/profile-mocks/submissions.html:
 *
 *   1. PLATFORM × WINDOW COVERAGE — grid of latest verified submissions, one
 *      row per platform and one column per window; the operator's primary
 *      platform row is highlighted.
 *   2. SNAPSHOT HISTORY         — per-snapshot yield/SNR/velocity table with
 *      Δ vs the previous snapshot, newest first.
 *   3. SUBMISSION TIMELINE      — horizontal axis with a tick per submission,
 *      including the pre-first-submission gap since the account's day 0.
 *   4. MULTI-WINDOW COMPARISON  — ALL-TIME / 30D / 7D cards recomputed per
 *      window from submissions + history.
 *
 * Server component — all data arrives pre-resolved from the profile page.
 * When `submissions` is empty a graceful empty state replaces the coverage grid.
 */

import type { Operator } from "@/lib/analytics/scoring-types";
import type {
  HistoryPoint,
  OperatorSubmission,
  SnapshotRecord,
} from "@/lib/board";

export interface SubmissionsViewProps {
  operator: Operator;
  submissions: OperatorSubmission[];
  history: HistoryPoint[];
  /** Scored per-submission records (snapshot_submissions) — the expanded
   *  history with windows, platforms, pillars and provenance. Empty on
   *  degraded/mock paths → the legacy yield table renders instead. */
  snapshotRecords?: SnapshotRecord[];
}

const GOLD = "rgb(var(--gold))";
const ACCENT = "rgb(var(--accent))";
const MUTED = "rgb(var(--text-muted))";
const BORDER = "rgb(var(--bg-border))";
const SURF = "rgb(var(--bg-surface))";
const MONO = "var(--font-geist-mono), ui-monospace, monospace";

/* ── format helpers ── */
const fmtTok = (n: number): string =>
  n >= 1e9
    ? `${(n / 1e9).toFixed(1)}B`
    : n >= 1e6
      ? `${(n / 1e6).toFixed(1)}M`
      : n >= 1e3
        ? `${(n / 1e3).toFixed(1)}K`
        : `${Math.round(n)}`;

const fmtYield = (n: number): string =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n >= 100 ? n.toFixed(0) : n.toFixed(1);

const DAY_MS = 86_400_000;

const fmtShortDate = (ms: number): string =>
  new Date(ms)
    .toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })
    .toUpperCase();

const fmtTableDate = (iso: string): string => {
  const ms = Date.parse(iso);
  return Number.isNaN(ms)
    ? iso
    : new Date(ms).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        timeZone: "UTC",
      });
};

/** History rows carry optional token pillars — SNR + velocity derive from them. */
const pillarsOf = (h: HistoryPoint) => {
  const i = h.input_tokens;
  const o = h.output_tokens;
  if (i == null || o == null) return null;
  return {
    input: i,
    output: o,
    total: i + o + (h.cache_read_tokens ?? 0) + (h.cache_creation_tokens ?? 0),
    snr: i + o > 0 ? o / (i + o) : 0,
    velocity: i > 0 ? o / i : 0,
  };
};

/* ── shared chrome ── */
function Module({
  title,
  subtitle,
  tag,
  children,
}: {
  title: string;
  subtitle?: string;
  tag?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border border-bg-border bg-bg-surface p-5">
      <div className="mb-4 flex items-center justify-between gap-3 border-b border-bg-border pb-2.5">
        <div>
          <h3 className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted">
            {title}
          </h3>
          {subtitle && (
            <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.06em] text-text-muted opacity-70">
              {subtitle}
            </p>
          )}
        </div>
        {tag}
      </div>
      {children}
    </section>
  );
}

/* ═══════════════ 1. PLATFORM × WINDOW COVERAGE ═══════════════ */
/** Canonical row order from the mock; extra platforms in the data append below. */
const PLATFORM_ORDER = [
  "claude",
  "gpt",
  "gemini",
  "claude-code",
  "cursor",
  "copilot",
];

/** Submissions arrive with DB platform keys — fold aliases onto the mock rows. */
const normPlatform = (p: string): string => {
  const x = p.toLowerCase();
  if (x === "chatgpt" || x === "openai") return "gpt";
  return x;
};

const WINDOW_COLS: { key: string; label: string; optional?: boolean }[] = [
  { key: "all_time", label: "ALL-TIME" },
  { key: "90d", label: "90D", optional: true },
  { key: "30d", label: "30D" },
  { key: "7d", label: "7D" },
  { key: "today", label: "24H" },
];

function CoverageGrid({
  operator,
  submissions,
}: {
  operator: Operator;
  submissions: OperatorSubmission[];
}) {
  const byKey = new Map<string, OperatorSubmission>();
  for (const s of submissions)
    byKey.set(`${normPlatform(s.platform)}|${s.window}`, s);

  const platforms = [
    ...PLATFORM_ORDER,
    ...[...new Set(submissions.map((s) => normPlatform(s.platform)))]
      .filter((p) => !PLATFORM_ORDER.includes(p))
      .sort(),
  ];
  const windows = WINDOW_COLS.filter(
    (w) => !w.optional || submissions.some((s) => s.window === w.key),
  );

  const activePlatforms = new Set(
    submissions.map((s) => normPlatform(s.platform)),
  );
  const primary = normPlatform(operator.primary_domain ?? "");

  return (
    <Module
      title="Submission Coverage"
      subtitle="Platform × window"
      tag={
        <span className="inline-flex items-center whitespace-nowrap rounded border border-bg-border bg-bg-elevated px-2 py-1 font-mono text-[9px] uppercase tracking-[0.06em] text-text-secondary">
          {activePlatforms.size}/{platforms.length} ACTIVE
        </span>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] border-collapse font-mono text-[11px] tabular-nums">
          <thead>
            <tr>
              <th className="border-b border-bg-border px-3 py-2 text-left text-[8px] font-semibold uppercase tracking-[0.1em] text-text-muted">
                Platform
              </th>
              {windows.map((w) => (
                <th
                  key={w.key}
                  className="border-b border-bg-border px-3 py-2 text-center text-[8px] font-semibold uppercase tracking-[0.1em] text-text-muted"
                >
                  {w.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {platforms.map((p) => {
              const live = p === primary;
              const sole = activePlatforms.size === 1 && activePlatforms.has(p);
              return (
                <tr
                  key={p}
                  className={`border-b border-bg-border-subtle last:border-0 ${
                    live ? "bg-gold/[0.03]" : ""
                  }`}
                >
                  <td className="px-3 py-2.5 text-left">
                    <span className="flex items-center gap-2.5">
                      <span
                        className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded border font-mono text-[8px] font-bold tracking-[0.04em] ${
                          live
                            ? "border-gold bg-gold/10 text-gold"
                            : "border-bg-border bg-bg-elevated text-text-muted"
                        }`}
                      >
                        {p.slice(0, 3).toUpperCase()}
                      </span>
                      <span
                        className={`text-[11px] ${
                          live ? "text-text-primary" : "text-text-secondary"
                        }`}
                      >
                        {p}
                      </span>
                      {sole && (
                        <span className="ml-1 rounded-sm border border-gold bg-gold/10 px-1 py-0.5 font-mono text-[7px] font-bold tracking-[0.1em] text-gold">
                          SOLE
                        </span>
                      )}
                      {!sole && live && (
                        <span className="ml-1 rounded-sm border border-gold/40 bg-gold/10 px-1 py-0.5 font-mono text-[7px] font-bold tracking-[0.1em] text-gold">
                          ACTIVE
                        </span>
                      )}
                    </span>
                  </td>
                  {windows.map((w) => {
                    const cell = byKey.get(`${p}|${w.key}`);
                    return (
                      <td key={w.key} className="px-3 py-2.5 text-center align-middle">
                        {cell ? (
                          <span className="inline-flex min-w-[56px] flex-col items-center gap-1">
                            {cell.yield_ != null ? (
                              <span className="font-mono text-[13px] font-bold tabular-nums text-text-primary">
                                {fmtYield(cell.yield_)}Υ
                              </span>
                            ) : (
                              <span
                                className="font-mono text-[13px] tabular-nums text-text-primary"
                                title="No cache this window — token volume only"
                              >
                                Σ{fmtTok(cell.totalTokens ?? 0)}
                              </span>
                            )}
                            <span className="rounded-full border border-gold/40 bg-gold/10 px-1.5 py-px font-mono text-[8px] font-semibold text-gold">
                              {cell.classTier}
                            </span>
                          </span>
                        ) : (
                          <span className="text-[12px] text-text-dim opacity-50">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-2.5 flex items-center justify-between font-mono text-[8px] uppercase tracking-[0.08em] text-text-muted">
        <span>
          {activePlatforms.size}/{platforms.length} PLATFORMS ACTIVE
        </span>
        <span>BADGE = WINDOW CLASS · Υ = LATEST WINDOW YIELD</span>
      </div>
    </Module>
  );
}

/* ═══════════════ 2. SNAPSHOT HISTORY ═══════════════ */
const HISTORY_LIMIT = 12;

function compactTok(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return "—";
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

/** Expanded per-submission record table — the scored snapshot_submissions
 *  archive with reporting windows, platforms, token pillars, derived metrics
 *  and provenance. Null fields render "—" (unavailable), never 0. */
function SnapshotRecordsTable({ records }: { records: SnapshotRecord[] }) {
  const rows = records.slice(0, HISTORY_LIMIT);
  const latest = rows[0];
  const cell = "px-3 py-2 text-right text-text-secondary";
  const dim = "px-3 py-2 text-right text-text-dim";

  return (
    <Module
      title="Snapshot History"
      subtitle={`${records.length} SCORED SUBMISSIONS${latest ? ` · LATEST ${fmtTableDate(latest.submittedAt.slice(0, 10)).toUpperCase()}` : ""}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] border-collapse font-mono text-[11px] tabular-nums">
          <thead>
            <tr>
              {["Date", "Window", "Platform", "In", "Out", "Cache-R", "Cache-W", "Υ", "SNR", "Vel", "Mode", "Ruleset"].map((h, i) => (
                <th
                  key={h}
                  className={`border-b border-bg-border px-3 py-2 text-[8px] font-semibold uppercase tracking-[0.1em] text-text-muted ${
                    i === 0 || i === 2 ? "text-left" : i === 1 ? "text-center" : "text-right"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.submissionId}
                className="border-b border-bg-border-subtle last:border-0 odd:bg-bg-elevated/40"
              >
                <td className="px-3 py-2 text-left text-text-secondary">
                  {fmtTableDate(r.submittedAt.slice(0, 10))}
                </td>
                <td className="px-3 py-2 text-center text-text-secondary"
                  title={r.periodStart && r.periodEnd ? `${r.periodStart} → ${r.periodEnd}` : undefined}>
                  {r.window.replace(/_/g, " ")}
                </td>
                <td className="px-3 py-2 text-left uppercase text-text-secondary">{r.platform}</td>
                <td className={r.inputTokens == null ? dim : cell}>{compactTok(r.inputTokens)}</td>
                <td className={r.outputTokens == null ? dim : cell}>{compactTok(r.outputTokens)}</td>
                <td className={r.cacheReadTokens == null ? dim : cell}>{compactTok(r.cacheReadTokens)}</td>
                <td className={r.cacheCreateTokens == null ? dim : cell}>{compactTok(r.cacheCreateTokens)}</td>
                <td className="px-3 py-2 text-right font-semibold text-gold">
                  {r.yield_ != null ? `${fmtYield(r.yield_)}Υ` : "—"}
                </td>
                <td className={r.snr == null ? dim : cell}>{r.snr != null ? r.snr.toFixed(3) : "—"}</td>
                <td className={r.velocity == null ? dim : cell}>{r.velocity != null ? r.velocity.toFixed(2) : "—"}</td>
                <td className="px-3 py-2 text-right">
                  {r.workflowMode ? (
                    <span
                      className="rounded border border-gold/40 bg-gold/10 px-1.5 py-px text-[9px] font-semibold uppercase text-gold"
                      title={r.workflowModeVersion ? `mode ${r.workflowModeVersion}` : undefined}
                    >
                      {r.workflowMode === "hitl" ? "HITL" : "AGENTIC"}
                      {r.workflowModeVersion ? ` · ${r.workflowModeVersion}` : ""}
                    </span>
                  ) : (
                    <span className="text-text-dim">—</span>
                  )}
                </td>
                <td className={r.rulesetVersion == null ? dim : cell}>
                  {r.rulesetVersion ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between pt-2.5 font-mono text-[8px] uppercase tracking-[0.08em] text-text-muted">
        <span>
          {rows.length} ROWS{records.length > rows.length ? ` OF ${records.length}` : ""} · SCORED SNAPSHOTS · — = NOT REPORTED
        </span>
        <span className="text-text-secondary">PAGE 1/1</span>
      </div>
    </Module>
  );
}

function HistoryTable({ history }: { history: HistoryPoint[] }) {
  const rows = [...history]
    .sort((a, z) => z.date.localeCompare(a.date))
    .slice(0, HISTORY_LIMIT);
  const latest = rows[0];

  return (
    <Module
      title="Snapshot History"
      subtitle={`${history.length} SUBMISSIONS${latest ? ` · LATEST ${fmtTableDate(latest.date).toUpperCase()}` : ""}`}
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] border-collapse font-mono text-[11px] tabular-nums">
          <thead>
            <tr>
              {["Date", "Yield", "SNR", "Velocity", "Δ"].map((h, i) => (
                <th
                  key={h}
                  className={`border-b border-bg-border px-3 py-2 text-[8px] font-semibold uppercase tracking-[0.1em] text-text-muted ${
                    i === 0 ? "text-left" : "text-right"
                  }`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((h, i) => {
              const p = pillarsOf(h);
              const prev = rows[i + 1];
              const d = prev != null ? h.yield_ - prev.yield_ : null;
              return (
                <tr
                  key={h.date + i}
                  className="border-b border-bg-border-subtle last:border-0 odd:bg-bg-elevated/40"
                >
                  <td className="px-3 py-2 text-left text-text-secondary">
                    {fmtTableDate(h.date)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-gold">
                    {fmtYield(h.yield_)}Υ
                  </td>
                  <td className="px-3 py-2 text-right text-text-secondary">
                    {p ? p.snr.toFixed(3) : "—"}
                  </td>
                  <td className="px-3 py-2 text-right text-text-secondary">
                    {p ? p.velocity.toFixed(2) : "—"}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-semibold ${
                      d == null
                        ? "text-text-dim opacity-60"
                        : d >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                    }`}
                  >
                    {d == null ? "—" : `${d >= 0 ? "+" : "−"}${Math.abs(d).toFixed(1)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-between pt-2.5 font-mono text-[8px] uppercase tracking-[0.08em] text-text-muted">
        <span>
          {rows.length} ROWS{history.length > rows.length ? ` OF ${history.length}` : ""} · Δ = YIELD VS PREV SNAPSHOT
        </span>
        <span className="text-text-secondary">PAGE 1/1</span>
      </div>
    </Module>
  );
}

/* ═══════════════ 3. SUBMISSION TIMELINE ═══════════════ */
function Timeline({
  operator,
  history,
}: {
  operator: Operator;
  history: HistoryPoint[];
}) {
  const subs = history
    .map((h) => Date.parse(h.date))
    .filter((ms) => Number.isFinite(ms))
    .sort((a, b) => a - b);
  if (!subs.length) return null;

  const now = Date.now();
  const joinEst = now - Math.max(0, operator.account_age_days || 0) * DAY_MS;
  const t0 = Math.min(joinEst, subs[0]);
  const t1 = Math.max(now, subs[subs.length - 1]);
  const span = Math.max(t1 - t0, DAY_MS);

  const X0 = 36;
  const X1 = 784;
  const AXIS_Y = 30;
  const xAt = (ms: number): number => X0 + ((ms - t0) / span) * (X1 - X0);

  // Month boundary markers.
  const months: { ms: number; label: string }[] = [];
  {
    const cur = new Date(t0);
    cur.setUTCDate(1);
    cur.setUTCHours(0, 0, 0, 0);
    cur.setUTCMonth(cur.getUTCMonth() + 1);
    while (cur.getTime() <= t1) {
      months.push({
        ms: cur.getTime(),
        label: cur.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" }).toUpperCase(),
      });
      cur.setUTCMonth(cur.getUTCMonth() + 1);
    }
  }

  // Label density: every submission when sparse, ~8 evenly when dense.
  const labelEvery = subs.length <= 9 ? 1 : Math.ceil(subs.length / 8);
  const gapDays = Math.floor((subs[0] - t0) / DAY_MS);
  const showGap = gapDays > 20;

  return (
    <Module
      title="Submission Timeline"
      subtitle={`${subs.length} OBS · ${Math.floor(span / DAY_MS)} DAYS`}
    >
      <svg
        viewBox="0 0 820 64"
        className="block h-auto w-full"
        role="img"
        aria-label={`Timeline of ${subs.length} snapshot submissions from ${fmtShortDate(subs[0])} to ${fmtShortDate(subs[subs.length - 1])}`}
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {/* month markers */}
        {months.map((m) => (
          <g key={m.ms}>
            <line x1={xAt(m.ms)} y1={AXIS_Y - 6} x2={xAt(m.ms)} y2={AXIS_Y} stroke={BORDER} strokeWidth={1} />
            <text x={xAt(m.ms) + 4} y={AXIS_Y - 10} fill={MUTED} fontFamily={MONO} fontSize={7} letterSpacing={0.6} opacity={0.75}>
              {m.label}
            </text>
          </g>
        ))}

        {/* axis */}
        <line x1={X0} y1={AXIS_Y} x2={X1} y2={AXIS_Y} stroke={BORDER} strokeWidth={1} />

        {/* pre-first-submission gap */}
        {showGap && (
          <>
            <line x1={X0 + 8} y1={AXIS_Y} x2={xAt(subs[0]) - 8} y2={AXIS_Y} stroke={MUTED} strokeWidth={1} strokeDasharray="3 4" opacity={0.45} />
            <text x={(X0 + xAt(subs[0])) / 2} y={AXIS_Y + 24} textAnchor="middle" fill={MUTED} fontFamily={MONO} fontSize={7} letterSpacing={0.8} opacity={0.7}>
              NO SUBMISSIONS · {gapDays}D
            </text>
          </>
        )}

        {/* origin */}
        <circle cx={X0} cy={AXIS_Y} r={3} fill="none" stroke={MUTED} strokeWidth={1} />
        <text x={X0} y={AXIS_Y + 24} fill={MUTED} fontFamily={MONO} fontSize={7} letterSpacing={0.8} opacity={0.7}>
          {fmtShortDate(t0)} · DAY 0
        </text>

        {/* submission ticks */}
        {subs.map((ms, i) => {
          const latest = i === subs.length - 1;
          const x = xAt(ms);
          return (
            <g key={ms}>
              <line
                x1={x}
                y1={latest ? AXIS_Y - 10 : AXIS_Y - 8}
                x2={x}
                y2={latest ? AXIS_Y + 10 : AXIS_Y + 8}
                stroke={GOLD}
                strokeWidth={1.5}
              />
              <circle
                cx={x}
                cy={AXIS_Y}
                r={latest ? 3.5 : 3}
                fill={latest ? GOLD : SURF}
                stroke={GOLD}
                strokeWidth={1.5}
              />
              {(i % labelEvery === 0 || latest) && (
                <text
                  x={x}
                  y={AXIS_Y + 24}
                  textAnchor="middle"
                  fill={latest ? GOLD : "rgb(var(--text-secondary))"}
                  fontFamily={MONO}
                  fontSize={7.5}
                  fontWeight={latest ? 700 : 400}
                  letterSpacing={0.4}
                >
                  {fmtShortDate(ms)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </Module>
  );
}

/* ═══════════════ 4. MULTI-WINDOW COMPARISON ═══════════════ */
const WINDOW_CARDS: { key: string; label: string; color: string; ms: number | null }[] = [
  { key: "all_time", label: "ALL-TIME", color: "#facc15", ms: null },
  { key: "30d", label: "30D", color: ACCENT, ms: 30 * DAY_MS },
  { key: "7d", label: "7D", color: GOLD, ms: 7 * DAY_MS },
];

function MultiWindow({
  operator,
  submissions,
  history,
}: {
  operator: Operator;
  submissions: OperatorSubmission[];
  history: HistoryPoint[];
}) {
  const primary = normPlatform(operator.primary_domain ?? "");
  const now = Date.now();

  const cards = WINDOW_CARDS.map((w) => {
    const inWindow = submissions.filter((s) => s.window === w.key);
    const sub =
      inWindow.find((s) => normPlatform(s.platform) === primary) ?? inWindow[0];

    const cutoff = w.ms == null ? -Infinity : now - w.ms;
    const histIn = history.filter((h) => {
      const ms = Date.parse(h.date);
      return Number.isFinite(ms) && ms >= cutoff;
    });
    // newest history point with usable token pillars (SNR + velocity source)
    const hp = [...histIn].reverse().find((h) => pillarsOf(h) != null);
    const p = hp ? pillarsOf(hp) : null;

    const snaps = histIn.length || (sub ? 1 : 0);
    const yield_ = sub?.yield_ ?? hp?.yield_ ?? null;
    const tokens = sub?.totalTokens ?? p?.total ?? null;
    return { w, sub, snaps, yield_, snr: p?.snr ?? null, velocity: p?.velocity ?? null, tokens };
  });

  return (
    <Module
      title="Multi-Window Comparison"
      subtitle="Same operator · different windows"
    >
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {cards.map(({ w, snaps, yield_, snr, velocity, tokens }) => (
          <article
            key={w.key}
            className="relative overflow-hidden rounded-lg border border-bg-border bg-bg-elevated px-4 pb-3 pt-3.5"
          >
            <span
              className="absolute inset-x-0 top-0 h-0.5"
              style={{ background: w.color }}
            />
            <div className="mb-2.5 flex items-center justify-between">
              <span
                className="font-mono text-[10px] font-bold tracking-[0.12em]"
                style={{ color: w.color }}
              >
                {w.label}
              </span>
              <span className="font-mono text-[8px] tracking-[0.06em] text-text-muted">
                {snaps} SNAPSHOT{snaps === 1 ? "" : "S"}
              </span>
            </div>
            <div className="font-mono text-[28px] font-bold leading-none tracking-[-0.03em] text-text-primary">
              {yield_ != null ? fmtYield(yield_) : "—"}
              <span className="text-[15px] font-semibold" style={{ color: w.color }}>
                Υ
              </span>
            </div>
            <ul className="mt-3 border-t border-bg-border">
              {[
                ["SNR", snr != null ? snr.toFixed(3) : "—"],
                ["Velocity", velocity != null ? velocity.toFixed(2) : "—"],
                ["Total Tokens", tokens != null ? fmtTok(tokens) : "—"],
              ].map(([k, v]) => (
                <li
                  key={k}
                  className="flex items-baseline justify-between border-b border-bg-border-subtle py-1.5 last:border-0"
                >
                  <span className="font-mono text-[8px] uppercase tracking-[0.1em] text-text-muted">
                    {k}
                  </span>
                  <b className="font-mono text-[12px] font-semibold tabular-nums text-text-secondary">
                    {v}
                  </b>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
      <div className="mt-3 text-right font-mono text-[8px] uppercase tracking-[0.06em] text-text-muted opacity-75">
        Metrics recomputed independently per window
      </div>
    </Module>
  );
}

/* ═══════════════ VIEW ═══════════════ */
export function SubmissionsView({
  operator,
  submissions,
  history,
  snapshotRecords = [],
}: SubmissionsViewProps) {
  const hasSubs = submissions.length > 0;
  const hasRecords = snapshotRecords.length > 0;
  const hasHistory = history.length > 0 || hasRecords;

  return (
    <div className="flex flex-col gap-4">
      {!hasSubs && (
        <Module title="Submissions" subtitle="Platform × window">
          <p className="font-mono text-xs leading-relaxed text-text-muted">
            No submissions yet — verified cascade submissions feed the
            leaderboard via the local agent.
          </p>
        </Module>
      )}

      {hasSubs && <CoverageGrid operator={operator} submissions={submissions} />}
      {hasRecords
        ? <SnapshotRecordsTable records={snapshotRecords} />
        : history.length > 0 && <HistoryTable history={history} />}
      {history.length > 0 && <Timeline operator={operator} history={history} />}
      <MultiWindow
        operator={operator}
        submissions={submissions}
        history={history}
      />
    </div>
  );
}
