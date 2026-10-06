/**
 * components/live/MoversRail.tsx — LB-15 "TOP MOVERS · 7D" rail module.
 *
 * Ports data.js `deriveMovers` + board.js `#movers` render. The workspace
 * resolves the entries itself (server `initial.movers` — derived from the
 * FULL ranking scope — wins; falls back to `deriveMovers(operators)` so the
 * component is standalone-correct either way). Each row carries the
 * operator's index into the supplied field so a click swaps the docked
 * profile — the reference already styled `.mv[data-op]` for exactly this.
 *
 * Delta sign: fixture mv7 values were all ≥0 so the reference hardcoded
 * "▲ +N"; live movement can be negative, so the arrow/chevron follows the
 * sign (same mono slot, same classes: `dlt up|dn`).
 */
import type { LiveOperator, MoverEntry } from "@/lib/board/live-types";
import { deriveMovers } from "./utils";

export interface MoverRow {
  /** display name — codename verbatim. */
  name: string;
  /** movement_7d spots (0 when unknown). */
  mv: number;
  /** index into the workspace operators array, or null when unresolvable. */
  opIndex: number | null;
}

/** Resolve server-provided movers, else derive client-side from the field. */
export function moverRows(
  movers: MoverEntry[] | undefined,
  ops: LiveOperator[],
): MoverRow[] {
  if (movers && movers.length) {
    return movers.map((m) => {
      const k = ops.findIndex((o) => o.codename === m.codename);
      return { name: m.codename, mv: m.mv7, opIndex: k >= 0 ? k : null };
    });
  }
  return deriveMovers(ops).map((m) => ({
    name: m.o.codename,
    mv: m.mv,
    opIndex: m.i,
  }));
}

export function MoversRail({
  rows,
  onSelect,
}: {
  rows: MoverRow[];
  onSelect?: (opIndex: number) => void;
}) {
  return (
    <>
      {rows.map((m, i) => (
        <div
          key={`${m.name}-${i}`}
          className="mv"
          data-op={m.opIndex ?? undefined}
          onClick={
            m.opIndex != null && onSelect ? () => onSelect(m.opIndex!) : undefined
          }
        >
          <span className="mav">{m.name[0]}</span>
          <span>
            {m.name}{" "}
            <span className="mut mono" style={{ fontSize: 9 }}>
              7d
            </span>
          </span>
          <span className={`dlt ${m.mv >= 0 ? "up" : "dn"}`}>
            {m.mv >= 0 ? `▲ +${m.mv}` : `▼ −${Math.abs(m.mv)}`}
          </span>
          <span className="rk-pos">&nbsp;#{i + 1}</span>
        </div>
      ))}
      <a className="more" href="#">
        ALL MOVERS →
      </a>
    </>
  );
}
