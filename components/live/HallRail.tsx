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
import type { HallEntry, LiveOperator } from "@/lib/board/live-types";
import { MEDAL_FILLS } from "./utils";

export interface HallRow {
  /** raw "Name — value" teaser line, verbatim. */
  value: string;
  /** index into operators (-1 = featured card), or null when unresolvable. */
  opIndex: number | null;
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
    return { value: h.value, opIndex: idx };
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
