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
import { useEffect, useMemo, useState } from "react";
import type { LiveOperator, MoverEntry } from "@/lib/board/live-types";
import { deriveMovers, isVerifiedOp, numvOf } from "./utils";
import { PixelBadge } from "./PixelBadge";

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
  /** profile graphic (owner 2026-10-06: "show their profile graphic") —
   *  avatar_url resolved through the operators array; null → initial tile. */
  avatarUrl?: string | null;
  /** verified flag for the avatar-corner block badge. */
  verified?: boolean;
  /** optional right-side note — raw stat modes (e.g. token counts) render
      this instead of the Δ rank chip. */
  note?: string;
}

/** Resolve server-provided movers, else derive client-side from the field. */
export function moverRows(
  movers: MoverEntry[] | undefined,
  ops: LiveOperator[],
): MoverRow[] {
  const of = (k: number | null, o?: LiveOperator) => {
    const op = o ?? (k != null && k >= 0 ? ops[k] : undefined);
    return {
      avatarUrl: op?.avatarUrl ?? null,
      verified: isVerifiedOp(op?.verif),
    };
  };
  if (movers && movers.length) {
    return movers.map((m) => {
      const k = ops.findIndex((o) => o.codename === m.codename);
      return {
        name: m.handle || m.codename,
        codename: m.codename,
        mv: m.mv7,
        opIndex: k >= 0 ? k : null,
        ...of(k >= 0 ? k : null),
      };
    });
  }
  return deriveMovers(ops).map((m) => ({
    name: m.o.handle || m.o.codename,
    codename: m.o.codename,
    mv: m.mv,
    opIndex: m.i,
    ...of(null, m.o),
  }));
}

export function MoversRail({
  rows,
  onSelect,
  tag = "7d",
  boxHead,
}: {
  rows: MoverRow[];
  onSelect?: (opIndex: number) => void;
  /** movement window label on each row ("7d" | "24h"). */
  tag?: string;
  /** header line rendered inside the box (rotation mode). */
  boxHead?: string;
}) {
  return (
    /* owner: the movers list is a proper text box — bordered frame, mode
       header inside, rows flex with name truncating instead of wrapping. */
    <div className="mbox">
      {boxHead ? (
        <div className="mbox-h">
          {boxHead}
          <span className="mut"> · AUTO</span>
        </div>
      ) : null}
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
              {m.avatarUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element --
                   operator avatar URL; fixed tile */
                <img src={m.avatarUrl} alt="" loading="lazy" />
              ) : m.name[0] === "@" ? (
                (m.name[1] ?? "·")
              ) : (
                (m.name[0] ?? "·")
              )}
              {m.verified ? (
                <span className="avbd">
                  <PixelBadge name="verified" />
                </span>
              ) : null}
            </span>
            <span>
              {m.name}{" "}
              <span className="mut mono" style={{ fontSize: 9 }}>
                {tag}
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
    </div>
  );
}

/* ---------- RotatingMovers (owner 2026-10-06): the movers module cycles
   between windows and workflow facets on a timer — 7D → 24H → HITL →
   AGENTIC — instead of pinning a static 7d list. 24H derives client-side
   from ops' mv24 (server ships mv7 only); workflow facets filter the
   resolved mover rows through ops' wf. ---------- */
/* owner 2026-10-06: five rows per slide + a raw-tokens mode —
   "even random stats like highest tokens... add raw token counts". */
const MOVER_MODES = ["7D · ALL", "24H · ALL", "7D · HITL", "7D · AGENTIC", "Σ TOKENS"] as const;

export function RotatingMovers({
  ops,
  server,
  onSelect,
}: {
  ops: LiveOperator[];
  server?: MoverEntry[];
  onSelect?: (opIndex: number) => void;
}) {
  const [mi, setMi] = useState(0);
  useEffect(() => {
    const t = setInterval(
      () => setMi((i) => (i + 1) % MOVER_MODES.length),
      5000,
    );
    return () => clearInterval(t);
  }, []);
  const mode = MOVER_MODES[mi];

  const rows = useMemo<MoverRow[]>(() => {
    if (mode === "Σ TOKENS") {
      return ops
        .map((o, i) => ({ o, i }))
        .filter((x) => numvOf(x.o.total) > 0)
        .sort((a, b) => numvOf(b.o.total) - numvOf(a.o.total))
        .slice(0, 5)
        .map((x) => ({
          name: x.o.handle || x.o.name,
          codename: x.o.codename,
          mv: 0,
          opIndex: x.i,
          avatarUrl: x.o.avatarUrl ?? null,
          verified: isVerifiedOp(x.o.verif),
          note: x.o.total,
        }));
    }
    if (mode === "24H · ALL") {
      return ops
        .map((o, i) => ({ o, i }))
        .filter((x) => x.o.mv24 != null && x.o.mv24 !== 0)
        .sort(
          (a, b) => Math.abs(b.o.mv24 ?? 0) - Math.abs(a.o.mv24 ?? 0),
        )
        .slice(0, 5)
        .map((x) => ({
          name: x.o.handle || x.o.name,
          codename: x.o.codename,
          mv: x.o.mv24 ?? 0,
          opIndex: x.i,
          avatarUrl: x.o.avatarUrl ?? null,
          verified: isVerifiedOp(x.o.verif),
        }));
    }
    const base = moverRows(server, ops);
    const wf =
      mode === "7D · HITL" ? "hitl" : mode === "7D · AGENTIC" ? "agentic" : null;
    const out = wf
      ? base.filter((r) => r.opIndex != null && ops[r.opIndex]?.wf === wf)
      : base;
    return out.slice(0, 5);
  }, [mode, ops, server]);

  return (
    <>
      <MoversRail
        boxHead={mode}
        rows={rows}
        onSelect={onSelect}
        tag={mode === "Σ TOKENS" ? "Σ" : mode.startsWith("24H") ? "24h" : "7d"}
      />
    </>
  );
}
