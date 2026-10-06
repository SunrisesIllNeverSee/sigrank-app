/**
 * components/live/HallRail.tsx — LB-13 "HALL OF SIGNAL" rail module.
 *
 * Ports board.js `#hall`: hexagon medal tiles (gold/silver/bronze star
 * badges) built from the hall teaser entries, plus the canonical link
 * "VIEW ALL RECORDS →" → /hall (locked: canonical route is /hall, NOT
 * /hall-of-signal; rail label is "Hall", H1 copy reads "Hall of Signal").
 *
 * Hex clicks select the operator (reference mapped entries positionally
 * onto [-1 featured, ops[1], ops[2]]); the port resolves each entry to a
 * field index by codename — via HallEntry.codename first, then the
 * "Name — value" label — with the featured card reachable at index -1.
 * Unresolvable entries render the tile without a data-op target.
 */
import { useEffect, useState } from "react";
import type { HallEntry, LiveOperator } from "@/lib/board/live-types";
import { MEDAL_FILLS, isVerifiedOp } from "./utils";
import { PixelBadge } from "./PixelBadge";

export interface HallRow {
  /** raw "Name — value" teaser line, verbatim. */
  value: string;
  /** index into operators (-1 = featured card), or null when unresolvable. */
  opIndex: number | null;
  /** profile graphic + verified flag for the spotlight tile (owner:
      "randomize users and just show their profile graphic"). */
  avatarUrl?: string | null;
  verified?: boolean;
}

/** Resolve hall entries to field indexes — replaces fixture hallOps [-1,1,2]. */
export function hallRows(
  hall: HallEntry[],
  ops: LiveOperator[],
  featuredName?: string,
): HallRow[] {
  return hall.map((h) => {
    const label = h.value.split(" — ")[0];
    let idx: number | null = null;
    if (h.codename) {
      const k = ops.findIndex((o) => o.codename === h.codename);
      if (k >= 0) idx = k;
    }
    if (idx === null) {
      // Label is a display name post-2B; match name or codename.
      const k = ops.findIndex(
        (o) => o.name === label || o.codename === label,
      );
      if (k >= 0) idx = k;
    }
    if (idx === null && featuredName && label === featuredName) idx = -1;
    const op = idx != null && idx >= 0 ? ops[idx] : undefined;
    return {
      value: h.value,
      opIndex: idx,
      avatarUrl: op?.avatarUrl ?? null,
      verified: isVerifiedOp(op?.verif),
    };
  });
}

/* board.js medal() — star-in-hexagon, gold/silver/bronze */
function Medal({ i }: { i: number }) {
  return (
    <svg width={26} height={29} viewBox="0 0 26 29" aria-hidden>
      <polygon
        points="13,1.5 24,8 24,21 13,27.5 2,21 2,8"
        fill={MEDAL_FILLS[i % MEDAL_FILLS.length]}
      />
      <text
        x={13}
        y={18}
        textAnchor="middle"
        fontSize={11}
        fill="#0b0f0a"
        fontWeight={800}
      >
        ★
      </text>
    </svg>
  );
}

export function HallRail({
  rows,
  onSelect,
}: {
  rows: HallRow[];
  onSelect?: (opIndex: number) => void;
}) {
  return (
    <>
      <div className="hexrow">
        {rows.map((h, i) => {
          const [hn, hv] = h.value.split(" — ");
          const clickable = h.opIndex != null && onSelect != null;
          return (
            <div
              key={i}
              className="hex hexmed"
              data-op={h.opIndex ?? undefined}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={clickable ? () => onSelect(h.opIndex!) : undefined}
              onKeyDown={
                clickable
                  ? (e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelect(h.opIndex!);
                      }
                    }
                  : undefined
              }
            >
              <span className="medal">
                <Medal i={i} />
              </span>
              <span className="hn">{hn}</span>
              <span className="hv">{hv ?? ""}</span>
            </div>
          );
        })}
      </div>
      {rows.length === 0 && (
        <p className="drill-note">— NO RECORDS IN THIS SCOPE</p>
      )}
      <a className="more" href="/hall">
        VIEW ALL RECORDS →
      </a>
    </>
  );
}

/* ---------- HallSpot (owner 2026-10-06): the hall module randomizes
   record-holding operators and shows just their profile graphic — a
   rotating spotlight tile (gradient avatar + record line) instead of the
   static hex row. Clicking still selects the operator. ---------- */
export function HallSpot({
  rows,
  onSelect,
}: {
  rows: HallRow[];
  onSelect?: (opIndex: number) => void;
}) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (rows.length < 2) {
      setIdx(0);
      return;
    }
    setIdx(Math.floor(Math.random() * rows.length));
    const t = setInterval(() => {
      setIdx((i) => {
        let n = Math.floor(Math.random() * rows.length);
        if (n === i) n = (n + 1) % rows.length;
        return n;
      });
    }, 5200);
    return () => clearInterval(t);
  }, [rows.length]);

  if (!rows.length) {
    return <p className="drill-note">— NO RECORDS IN THIS SCOPE</p>;
  }
  const h = rows[idx % rows.length];
  const [hn, hv] = h.value.split(" — ");
  const clickable = h.opIndex != null && onSelect != null;

  return (
    <>
      <div
        className={`hspot${clickable ? " clickable" : ""}`}
        role={clickable ? "button" : undefined}
        tabIndex={clickable ? 0 : undefined}
        onClick={clickable ? () => onSelect(h.opIndex!) : undefined}
        onKeyDown={
          clickable
            ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(h.opIndex!);
                }
              }
            : undefined
        }
      >
        <span className="hav">
          {h.avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element --
               operator avatar URL; fixed tile */
            <img src={h.avatarUrl} alt="" loading="lazy" />
          ) : (
            (hn ?? "·")[0]
          )}
          {h.verified ? (
            <span className="avbd">
              <PixelBadge name="verified" />
            </span>
          ) : null}
        </span>
        <span className="hsp">
          <span className="hsn">{hn}</span>
          <span className="hsv mono">{hv ?? ""}</span>
        </span>
      </div>
      <div className="hs-dots" aria-hidden>
        {rows.map((_, k) => (
          <span key={k} className={k === idx % rows.length ? "on" : ""} />
        ))}
      </div>
      <a className="more" href="/hall">
        VIEW ALL RECORDS →
      </a>
    </>
  );
}
