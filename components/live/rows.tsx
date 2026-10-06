/**
 * components/live/rows.tsx — 1:1 JSX port of board.js `rows(mode)`,
 * `HEAD_METRICS` / `HEAD_RAW`, `spark`, `avatarCols` and the rank-cell
 * hover detail (`rtip`) from the frozen reference workspace (reference-v1).
 *
 * Verbatim behavior preserved:
 *   - metrics/raw column sets, `yv` + `tt1..tt3` top-3 heat classes
 *   - rank marks "▲" (ops view) / "◆" (outliers view) on rows 1–3
 *   - `∑` raw-volume sub-rank inside every rank cell
 *   - avatar color = `avatarCols[i % 7]` (position in the supplied field)
 *   - ✓ vchk iff verif is "verified"/"audited" — real verification_status
 *     bound by the projection (2C: replaces the reference's @-handle
 *     heuristic — the mark is never unconditional)
 *   - nc (non-compounding) rows render "—" for canonical cascade metrics;
 *     raw pillars still show real values (contract §11a)
 *
 * Production-parity deltas (owner checklist 2026-10-06, all additive):
 *   - thead carries a column-group super-header row (tr.grph): IDENTITY &
 *     SCALE / CASCADE YIELD / COMPOSITION & COST / ACTIVITY on the metrics
 *     head; RAW TOKEN PILLARS replaces CASCADE YIELD on the raw head —
 *     same boundaries as LeaderboardTable.tsx's two theads.
 *   - every column header gets a mono-glyph icon (Υ/⚙/⚡/▲/✧/∑/$/…) + an
 *     hc-* palette color class; labels adopt prod's `<icon> LABEL` order
 *     (reference "YIELD Υ" → "Υ YIELD").
 *   - BoardHead accepts OPTIONAL sort wiring (sortKey/sortDir/onSort);
 *     sortable columns map to the utils.ts SORT_KEY names. Without onSort
 *     the head renders static — the workspace's <BoardHead mode=…> call
 *     is unchanged until sorting is wired.
 *   - ∑ TOTAL cell gains the I·O·W·R pillar sub-line (o.pillars, null on
 *     nc rows) and the operator cell gains the `◍ location` tertiary
 *     line — both fields populated by the WS-2 projection.
 *
 * Pure presentational module — no "use client"; state lives in
 * LiveBoardWorkspace.
 */
import { memo } from "react";
import "./board-cols.css";
import { PixelBadge, badgeForPct } from "./PixelBadge";
import type { LiveOperator } from "@/lib/board/live-types";
import {
  avatarStyle,
  isVerifiedOp,
  sparkGeom,
  tc,
  type TopSets,
} from "./utils";

export type ViewMode = "ops" | "out";
export type ColMode = "metrics" | "raw";

/** Exact-rate token throughput tooltip on the ∑ TOTAL cell — the pre-2B
 *  board's exact-calendar rates (processed/output per day) surfaced without
 *  changing the reference column set. */
const throughputTip = (o: LiveOperator): string | undefined =>
  o.ptpd
    ? `throughput ${o.ptpd} processed · ${o.otpd ?? "—"} output`
    : undefined;

/* ---------- spark (board.js) ---------- */
export function Sparkline({
  arr,
  w = 56,
  h = 18,
}: {
  arr: number[];
  w?: number;
  h?: number;
}) {
  const g = sparkGeom(arr, w, h);
  return (
    <svg className="spark" width={w} height={h} aria-hidden>
      {g && (
        <polyline
          points={g.points}
          fill="none"
          stroke={g.up ? "var(--up)" : "var(--dn)"}
          strokeWidth={1.4}
        />
      )}
    </svg>
  );
}

/* ---------- thead (board.js HEAD_METRICS / HEAD_RAW + production delta) --
   The reference's flat label row is preserved as the SECOND thead row; a
   first row now carries the production column-group super-headers
   (LeaderboardTable.tsx: IDENTITY & SCALE / CASCADE YIELD / COMPOSITION &
   COST / ACTIVITY — the raw head swaps the middle band to RAW TOKEN
   PILLARS, same as prod's raw thead). Every column renders a mono-glyph
   icon + an hc-* palette class (board-cols.css). Sortable columns map to
   the SORT_KEY names in utils.ts; the wiring is opt-in via props. */
interface HeadCol {
  /** Mono-glyph icon chip (prod convention: Υ YIELD, ⚡ VEL, $ /1M…). */
  icon: string;
  /** Header label text (icon excluded — see `<icon> LABEL` ordering). */
  label: string;
  /** hc-* palette class from board-cols.css. */
  cls: string;
  /** Left-aligned cell (the reference's `className="l"` slots). */
  l?: boolean;
  /** SORT_KEY name when the column is sortable; absent = static. */
  k?: string;
  /** Hover tooltip. */
  tip?: string;
}

interface HeadGroup {
  label: string;
  span: number;
  /** Accent-tint the group label (CASCADE YIELD — the rank-metric band). */
  ac?: boolean;
}

const HEAD_GROUPS: Record<ColMode, HeadGroup[]> = {
  metrics: [
    { label: "IDENTITY & SCALE", span: 3 },
    { label: "CASCADE YIELD", span: 5, ac: true },
    { label: "COMPOSITION & COST", span: 3 },
    { label: "ACTIVITY", span: 2 },
  ],
  /* Raw head columns: RANK, OPERATOR, CLASS, INPUT, OUTPUT, CACHE-READ,
     CACHE-WRITE, ∑ TOKENS, $/1M, PLATFORM, LAST, TREND. */
  raw: [
    { label: "IDENTITY & SCALE", span: 3 },
    { label: "RAW TOKEN PILLARS", span: 5 },
    { label: "COMPOSITION & COST", span: 2 },
    { label: "ACTIVITY", span: 2 },
  ],
};

/* Identity columns are never sortable (rank/operator/class are positional);
   sortable columns key into utils.ts SORT_KEY verbatim. */
/* Tooltip glossary (owner 2026-10-06): every column carries its metric
   definition on hover — the canonical formulas live in live-types.ts. */
const HEAD_COLS: Record<ColMode, HeadCol[]> = {
  metrics: [
    { icon: "#", label: "RANK", cls: "hc-rank", l: true, tip: "Rank position in this window" },
    { icon: "◉", label: "OPERATOR", cls: "hc-op", l: true, tip: "Operator — display name, codename & location" },
    { icon: "◈", label: "CLASS", cls: "hc-class", tip: "Signal class tier" },
    { icon: "Υ", label: "YIELD", cls: "hc-yield", k: "Yield", tip: "Υ = cache_read × output ÷ input² — cascade efficiency; the rank metric" },
    { icon: "⚙", label: "LEVERAGE", cls: "hc-lev", k: "Leverage", tip: "cache_read ÷ input — amplification over raw input" },
    { icon: "⚡", label: "VELOCITY", cls: "hc-vel", k: "Velocity", tip: "output ÷ input — generation per prompt token" },
    { icon: "▲", label: "SNR", cls: "hc-snr", k: "SNR", tip: "output ÷ (input + output) — signal fraction, 0–1" },
    { icon: "✧", label: "10×DEV", cls: "hc-dev", k: "10xDEV", tip: "log₁₀(leverage) — dev-mode intensity; the outlier sort" },
    { icon: "∑", label: "TOKENS", cls: "hc-tot", k: "Total", tip: "Total observed tokens (I+O+W+R)" },
    { icon: "$", label: "/1M", cls: "hc-cost", k: "$/1M", tip: "Cost per 1M tokens — lower is better" },
    { icon: "⬡", label: "PLATFORM", cls: "hc-platform", tip: "Primary AI surface" },
    { icon: "◷", label: "LAST", cls: "hc-last", tip: "Days since the last snapshot" },
    { icon: "↗", label: "TREND", cls: "hc-trend", tip: "Yield history sparkline" },
  ],
  raw: [
    { icon: "#", label: "RANK", cls: "hc-rank", l: true, tip: "Rank position in this window" },
    { icon: "◉", label: "OPERATOR", cls: "hc-op", l: true, tip: "Operator — display name, codename & location" },
    { icon: "◈", label: "CLASS", cls: "hc-class", tip: "Signal class tier" },
    { icon: "→", label: "INPUT", cls: "hc-i", k: "Input", tip: "Prompt tokens sent (I)" },
    { icon: "←", label: "OUTPUT", cls: "hc-o", k: "Output", tip: "Tokens generated (O)" },
    { icon: "↺", label: "CACHE-READ", cls: "hc-cr", k: "Cache-read", tip: "Cache-hit tokens read (R)" },
    { icon: "✎", label: "CACHE-WRITE", cls: "hc-cw", k: "Cache-write", tip: "Cache-miss tokens written (W)" },
    { icon: "∑", label: "TOKENS", cls: "hc-tot", k: "Total", tip: "Total observed tokens (I+O+W+R)" },
    { icon: "$", label: "/1M", cls: "hc-cost", k: "$/1M", tip: "Cost per 1M tokens — lower is better" },
    { icon: "⬡", label: "PLATFORM", cls: "hc-platform", tip: "Primary AI surface" },
    { icon: "◷", label: "LAST", cls: "hc-last", tip: "Days since the last snapshot" },
    { icon: "↗", label: "TREND", cls: "hc-trend", tip: "Yield history sparkline" },
  ],
};

export interface BoardHeadProps {
  mode: ColMode;
  /** Optional sort wiring — the workspace passes the active SORT_KEY name
   *  (e.g. "Yield"), the direction, and a click handler. When `onSort` is
   *  absent the head renders static (reference-v1 behavior); when present,
   *  sortable header cells render as buttons and the active column shows
   *  the ▼/▲ caret. */
  sortKey?: string | null;
  sortDir?: "asc" | "desc" | null;
  onSort?: (key: string) => void;
}

export function BoardHead({ mode, sortKey, sortDir, onSort }: BoardHeadProps) {
  const groups = HEAD_GROUPS[mode];
  const cols = HEAD_COLS[mode];
  return (
    <>
      <tr className="grph">
        {groups.map((g, gi) => (
          <th
            key={g.label}
            colSpan={g.span}
            className={`${gi === 0 ? "l" : "gd"}${g.ac ? " grp-y" : ""}`}
          >
            {g.label}
          </th>
        ))}
      </tr>
      <tr>
        {cols.map((c) => {
          const active = c.k != null && c.k === sortKey;
          const inner = (
            <>
              <span className="hi" aria-hidden>
                {c.icon}
              </span>
              {c.label}
              {active ? (sortDir === "asc" ? " ▲" : " ▼") : ""}
            </>
          );
          return (
            <th
              key={c.label}
              className={`${c.cls}${c.l ? " l" : ""}${active ? " sorted" : ""}`}
              title={c.tip}
              aria-sort={
                active
                  ? sortDir === "asc"
                    ? "ascending"
                    : "descending"
                  : undefined
              }
            >
              {onSort && c.k ? (
                <button
                  type="button"
                  className="hsort"
                  onClick={() => onSort(c.k!)}
                >
                  {inner}
                </button>
              ) : (
                inner
              )}
            </th>
          );
        })}
      </tr>
    </>
  );
}

/* ---------- row (board.js rows(), verbatim cell order) ---------- */
export interface BoardRowProps {
  o: LiveOperator;
  /** index into the full supplied operators array (the field rank base). */
  i: number;
  /** display rank — i+1 in ops view, position+1 in outliers view. */
  r: number;
  viewMode: ViewMode;
  colMode: ColMode;
  tt: TopSets;
  /** ∑ raw-volume rank for this operator index. */
  rawRank: number;
  selected: boolean;
  onSelect: (i: number) => void;
}

export const BoardRow = memo(function BoardRow({
  o,
  i,
  r,
  viewMode,
  colMode,
  tt,
  rawRank,
  selected,
  onSelect,
}: BoardRowProps) {
  const cls = r === 1 ? "top1" : r === 2 ? "top2" : r === 3 ? "top3" : "";
  const viewLabel = viewMode === "ops" ? "Υ PERFORMANCE" : "10×DEV OUTLIER";
  const mark = viewMode === "ops" ? "▲" : "◆";
  const nc = o.nc;
  return (
    <tr
      className={`${cls}${selected ? " sel-op" : ""}`.trim() || undefined}
      data-op={i}
      onClick={() => onSelect(i)}
      /* keyboard parity with the reference's click-to-swap — the row keeps
         its <tr> semantics (no role swap) and gains focus + Enter/Space;
         aria-current marks the row feeding the operator dock. */
      tabIndex={0}
      aria-current={selected || undefined}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(i);
        }
      }}
    >
      <td>
        <div className="ranks">
          <span className="r-main">
            {r <= 3 ? mark : ""}
            {r}
          </span>
          <span className="r-sub">∑{rawRank}</span>
          <div className="rtip">
            <b>{viewLabel} RANK</b> #{r}
            <br />
            <b>∑ RAW-VOLUME RANK</b> #{rawRank}
          </div>
        </div>
      </td>
      <td className="l">
        <div className="op">
          <span className="av" style={avatarStyle(i)}>
            {o.avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element --
                 operator avatar URL; 24px fixed tile, no loader needed */
              <img src={o.avatarUrl} alt="" loading="lazy" />
            ) : (
              o.name[0]
            )}
            {/* verified badge — top-left corner of the avatar (owner:
                block badges go in the corner + next to names) */}
            {isVerifiedOp(o.verif) ? (
              <span className="avbd">
                <PixelBadge name="verified" />
              </span>
            ) : null}
          </span>
          <span>
            <span className="nm">
              {o.name}
              {isVerifiedOp(o.verif) ? (
                <>
                  {" "}
                  <span className="vchk">✓</span>
                </>
              ) : null}
              {(() => {
                const b = badgeForPct(o.pct);
                return b ? (
                  <>
                    {" "}
                    <PixelBadge name={b} />
                  </>
                ) : null;
              })()}
            </span>
            <br />
            <span className="hd">
              {o.handle.startsWith("@") ? o.handle : o.codename}
            </span>
            {/* production parity: `◍ location` tertiary line under the
                handle — operator-supplied public location, absent unless
                the projection carries it (null-safe). */}
            {o.location ? (
              <span className="opl">◍ {o.location}</span>
            ) : null}
          </span>
        </div>
      </td>
      <td>
        <span className="tag">{o.klass}</span>
      </td>
      {colMode === "metrics" ? (
        <>
          <td className={`yv${tc(tt.yield, i)}`}>{nc ? "—" : o.yield}</td>
          <td className={tc(tt.lev, i) || undefined}>{nc ? "—" : o.lev}</td>
          <td className={tc(tt.vel, i) || undefined}>{nc ? "—" : o.vel}</td>
          <td className={tc(tt.snr, i) || undefined}>{nc ? "—" : o.snr}</td>
          <td className={tc(tt.dev, i) || undefined}>{nc ? "—" : o.dev}</td>
          <td
            className={tc(tt.tot, i) || undefined}
            title={throughputTip(o)}
          >
            {o.total}
            {/* production parity: the I·O·W·R pillar sub-line under Σ TOTAL
                (LeaderboardTable.tsx renders the same breakdown; null on nc
                rows per the contract). */}
            {o.pillars ? (
              <span
                className="pils"
                title="Raw pillars: I=input · O=output · W=cache-write · R=cache-read"
              >
                I {o.pillars.i} · O {o.pillars.o} · W {o.pillars.w} · R{" "}
                {o.pillars.r}
              </span>
            ) : null}
          </td>
          <td className={tc(tt.cost, i) || undefined}>{o.cost}</td>
        </>
      ) : (
        <>
          <td className={tc(tt.i, i) || undefined}>{o.raw.i}</td>
          <td className={tc(tt.o, i) || undefined}>{o.raw.o}</td>
          <td className={tc(tt.cr, i) || undefined}>{o.raw.cr}</td>
          <td className={tc(tt.cw, i) || undefined}>{o.raw.cw}</td>
          <td
            className={tc(tt.tot, i) || undefined}
            title={throughputTip(o)}
          >
            {o.total}
            {o.pillars ? (
              <span
                className="pils"
                title="Raw pillars: I=input · O=output · W=cache-write · R=cache-read"
              >
                I {o.pillars.i} · O {o.pillars.o} · W {o.pillars.w} · R{" "}
                {o.pillars.r}
              </span>
            ) : null}
          </td>
          <td className={tc(tt.cost, i) || undefined}>{o.cost}</td>
        </>
      )}
      <td>
        {o.platform}
        {o.wf ? <span className="wftag">{o.wf.toUpperCase()}</span> : null}
      </td>
      <td>{o.last}</td>
      <td>
        <Sparkline arr={o.trend ?? []} />
      </td>
    </tr>
  );
});
