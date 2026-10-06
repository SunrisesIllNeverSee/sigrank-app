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
 *
 * Display name: the reference rendered `o.codename`, but its synced payload
 * stored the DISPLAY NAME in codename (sync.py `e.get("display_name") or
 * e["codename"]`). Production's MoverEntry.codename is the API identity
 * ("signal-…" for unnamed operators), so the rail renders `handle` — the
 * resolved display identity (@handle or operatorDisplayName) — and falls
 * back to codename only when the handle slot is empty.
 */
import type { LiveOperator, MoverEntry } from "@/lib/board/live-types";
import { deriveMovers } from "./utils";

export interface MoverRow {
  /** display name — resolved handle, codename as honest fallback. */
  name: string;
  /** API codename — identity key for opIndex lookup + React keys. */
  codename: string;
  /** movement_7d spots — always a real number (null-mv7 rows never enter
   *  the movers set; an unmoved row is not a mover). */
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
      return {
        name: m.handle || m.codename,
        codename: m.codename,
        mv: m.mv7,
        opIndex: k >= 0 ? k : null,
      };
    });
  }
  return deriveMovers(ops).map((m) => ({
    name: m.o.handle || m.o.codename,
    codename: m.o.codename,
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
      {rows.map((m, i) => {
        const clickable = m.opIndex != null && onSelect != null;
        return (
          <div
            key={`${m.codename}-${i}`}
            className="mv"
            data-op={m.opIndex ?? undefined}
            role={clickable ? "button" : undefined}
            tabIndex={clickable ? 0 : undefined}
            onClick={clickable ? () => onSelect(m.opIndex!) : undefined}
            onKeyDown={
              clickable
                ? (e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      onSelect(m.opIndex!);
                    }
                  }
                : undefined
            }
          >
            <span className="mav">
              {m.name[0] === "@" ? (m.name[1] ?? "·") : (m.name[0] ?? "·")}
            </span>
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
        );
      })}
      {rows.length === 0 && (
        <p className="drill-note">— NO MOVEMENT IN THIS SCOPE</p>
      )}
      {/* reference renders a decorative "ALL MOVERS →" anchor here; no movers
          destination exists in production, so the dead link is dropped. */}
    </>
  );
}
