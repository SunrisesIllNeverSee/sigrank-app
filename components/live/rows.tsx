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
 * Pure presentational module — no "use client"; state lives in
 * LiveBoardWorkspace.
 */
import { memo } from "react";
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

/* ---------- thead (board.js HEAD_METRICS / HEAD_RAW, verbatim) ---------- */
export function BoardHead({ mode }: { mode: ColMode }) {
  return mode === "metrics" ? (
    <tr>
      <th className="l">RANK</th>
      <th className="l">OPERATOR</th>
      <th>CLASS</th>
      <th>YIELD Υ</th>
      <th>LEVERAGE</th>
      <th>VELOCITY</th>
      <th>SNR</th>
      <th>10×DEV</th>
      <th>∑ TOKENS</th>
      <th>$/1M</th>
      <th>PLATFORM</th>
      <th>LAST</th>
      <th>TREND</th>
    </tr>
  ) : (
    <tr>
      <th className="l">RANK</th>
      <th className="l">OPERATOR</th>
      <th>CLASS</th>
      <th>INPUT</th>
      <th>OUTPUT</th>
      <th>CACHE-READ</th>
      <th>CACHE-WRITE</th>
      <th>∑ TOKENS</th>
      <th>$/1M</th>
      <th>PLATFORM</th>
      <th>LAST</th>
      <th>TREND</th>
    </tr>
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
            {o.codename[0]}
          </span>
          <span>
            <span className="nm">
              {o.codename}
              {isVerifiedOp(o.verif) ? (
                <>
                  {" "}
                  <span className="vchk">✓</span>
                </>
              ) : null}
            </span>
            <br />
            <span className="hd">{o.handle}</span>
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
          <td className={tc(tt.tot, i) || undefined}>{o.total}</td>
          <td className={tc(tt.cost, i) || undefined}>{o.cost}</td>
        </>
      ) : (
        <>
          <td className={tc(tt.i, i) || undefined}>{o.raw.i}</td>
          <td className={tc(tt.o, i) || undefined}>{o.raw.o}</td>
          <td className={tc(tt.cr, i) || undefined}>{o.raw.cr}</td>
          <td className={tc(tt.cw, i) || undefined}>{o.raw.cw}</td>
          <td className={tc(tt.tot, i) || undefined}>{o.total}</td>
          <td className={tc(tt.cost, i) || undefined}>{o.cost}</td>
        </>
      )}
      <td>{o.platform}</td>
      <td>{o.last}</td>
      <td>
        <Sparkline arr={o.trend ?? []} />
      </td>
    </tr>
  );
});
