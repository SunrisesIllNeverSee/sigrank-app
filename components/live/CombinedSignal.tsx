"use client";
/* components/live/CombinedSignal.tsx — addendum 2026-10-08: COMBO/SINGLE
 * switch for the large signal-history module (was "Υ YIELD · OVERTIME").
 * Ported from CombinedSignalAddendum.tsx — integration deltas:
 *  - the five original minis are the FiveStats rows (profile slide 2);
 *    they drive `selected`/`mode` through controlled props instead of a
 *    duplicated mini strip.
 *  - module shell is the rail's .trendbox slot (271 wide); chart box is
 *    a fixed 215px so COMBO↔SINGLE never resizes the rail module.
 *
 * DATA CONTRACT (unchanged): accepted dated observations only —
 * LiveOperatorDetail.history (date/score/yieldv/rank) and
 * .snapshots (submittedAt/leverage/velocity). null breaks a trace;
 * measured 0 stays 0; no interpolation, no index alignment. Rank inverts
 * (smaller number = better). Overlay normalization is per-series
 * min→0/max→100 for SHAPE comparison only — raw values live in the
 * inspector/legend.
 */
import { useId, useMemo, useState, type CSSProperties } from "react";

export type SignalMetricKey =
  | "YIELD"
  | "SCORE"
  | "RANK"
  | "LEVERAGE"
  | "VELOCITY";

export interface SignalPoint {
  /** UTC ms from an authoritative observation — never an array index. */
  timestamp: number;
  /** null = missing; finite 0 remains a valid measurement. */
  value: number | null;
}

export type SignalSeries = Record<SignalMetricKey, readonly SignalPoint[]>;

const METRICS: readonly {
  id: SignalMetricKey;
  color: string;
  kind: "line" | "barsDense" | "step" | "bars";
}[] = [
  { id: "YIELD", color: "#acff04", kind: "line" },
  { id: "SCORE", color: "#ffd35b", kind: "barsDense" },
  { id: "RANK", color: "#53dced", kind: "step" },
  { id: "LEVERAGE", color: "#af7aff", kind: "bars" },
  { id: "VELOCITY", color: "#fa9e48", kind: "line" },
];

const good = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

const ordered = (p: readonly SignalPoint[]) =>
  [...p].filter((x) => good(x.timestamp)).sort((a, b) => a.timestamp - b.timestamp);

/** Per-series 0–1 overlay normalization; null rather than invented. */
export function normalizeSignal(
  values: readonly SignalPoint[],
  value: number | null,
  isRank: boolean,
): number | null {
  if (!good(value)) return null;
  const finite = values.filter((p) => good(p.value)).map((p) => p.value as number);
  if (finite.length === 0) return null;
  const lo = Math.min(...finite);
  const hi = Math.max(...finite);
  const normalized = hi === lo ? 0.5 : (value - lo) / (hi - lo);
  return isRank ? 1 - normalized : normalized;
}

export const signalLabel = (id: SignalMetricKey, v: number | null): string => {
  if (!good(v)) return "—";
  if (id === "RANK") return "#" + Math.round(v);
  if (id === "LEVERAGE") return v.toFixed(1) + "×";
  return v.toFixed(id === "SCORE" ? 1 : id === "VELOCITY" ? 2 : 3);
};

export function CombinedSignal({
  series,
  mode,
  selected,
  onMode,
  onSelect,
  fieldMedianYield,
}: {
  series: SignalSeries;
  /** controlled from the profile block so the FiveStats rows can drive it */
  mode: "combined" | "individual";
  selected: SignalMetricKey;
  onMode: (m: "combined" | "individual") => void;
  onSelect: (m: SignalMetricKey) => void;
  /** real field median of operators' latest yield trend points — drawn on
      the Yield single view only; never invented for the other metrics. */
  fieldMedianYield?: number | null;
}) {
  const [enabled, setEnabled] = useState<SignalMetricKey[]>(
    METRICS.map((m) => m.id),
  );
  /* pointer x in viewBox units — each visible trace resolves its own
     nearest observation against its own span. */
  const [focusX, setFocusX] = useState<number | null>(null);
  const id = useId().replace(/:/g, "");

  const lines = useMemo(() => {
    const result = {} as Record<SignalMetricKey, SignalPoint[]>;
    for (const metric of METRICS) result[metric.id] = ordered(series[metric.id]);
    return result;
  }, [series]);

  /* owner 2026-10-08 — each trace spans its OWN observed window. A shared
     chronological axis compressed the two timestamp families against each
     other (day-precision history vs second-precision snapshots): whichever
     family covered less wall-time collapsed into an edge sliver and the
     shapes the carousel shows could not be seen here. Per-series x-extent
     mirrors the carousel's grammar; x positions stay strictly chronological
     inside each trace, raw dates stay in the inspector. */
  const spans = useMemo(() => {
    const s = {} as Record<SignalMetricKey, { lo: number; hi: number }>;
    for (const m of METRICS) {
      const ts = lines[m.id].map((p) => p.timestamp);
      s[m.id] = { lo: Math.min(...ts), hi: Math.max(...ts) };
    }
    return s;
    /* xOf(m) maps a real timestamp onto the plot width using THAT series'
       own extent; a single-point series gets a zero-width domain → 0.5 */
  }, [lines]);
  const xOf = (mid: SignalMetricKey) => {
    const { lo, hi } = spans[mid];
    return (date: number) =>
      11 + (hi > lo ? (date - lo) / (hi - lo) : 0.5) * 224;
  };
  const hasData = METRICS.some(
    (m) => lines[m.id].filter((p) => good(p.value)).length > 0,
  );
  const y = (value: number) => 101 - value * 88;

  const visible =
    mode === "combined"
      ? METRICS.filter((m) => enabled.includes(m.id))
      : METRICS.filter((m) => m.id === selected);

  /* can't hide the last visible series */
  const toggle = (metric: SignalMetricKey) =>
    setEnabled((old) =>
      old.includes(metric)
        ? old.length > 1
          ? old.filter((k) => k !== metric)
          : old
        : [...old, metric],
    );

  const pathFor = (
    points: readonly SignalPoint[],
    mid: SignalMetricKey,
  ): string[] => {
    const obs = ordered(points);
    const sx = xOf(mid);
    const paths: string[] = [];
    let d = "";
    const flush = () => {
      if (d) paths.push(d);
      d = "";
    };
    for (const pt of obs) {
      const value = normalizeSignal(obs, pt.value, mid === "RANK");
      if (value === null) {
        flush();
        continue;
      }
      const a = sx(pt.timestamp).toFixed(2);
      const b = y(value).toFixed(2);
      if (!d) d = `M${a} ${b}`;
      else if (mid === "RANK") d += ` H${a} V${b}`;
      else d += ` L${a} ${b}`;
    }
    flush();
    return paths;
  };

  const chart = (m: (typeof METRICS)[number]) => {
    const pts = lines[m.id];
    const bars = m.kind === "barsDense" || m.kind === "bars";
    /* bars keep their original encoding only in the individual view —
       COMBO is always five unfilled traces so overlaps stay readable */
    if (mode === "individual" && bars) {
      const barWidth = m.kind === "barsDense" ? 2.5 : 5.5;
      return pts
        .filter((p) => good(p.value))
        .map((p, i) => {
          const v = normalizeSignal(pts, p.value, m.id === "RANK") ?? 0;
          const xx = xOf(m.id)(p.timestamp);
          const yy = y(v);
          return (
            <rect
              key={i}
              x={xx - barWidth / 2}
              y={yy}
              height={Math.max(0.2, 101 - yy)}
              width={barWidth}
              fill={m.color}
              fillOpacity={0.9}
            />
          );
        });
    }
    return pathFor(pts, m.id).map((d, i) => (
      <path
        key={i}
        d={d}
        stroke={m.color}
        fill="none"
        strokeWidth={m.id === "YIELD" ? 2.1 : 1.6}
        strokeDasharray={
          mode === "combined"
            ? m.id === "RANK"
              ? "3 2"
              : m.id === "SCORE"
                ? "1 1.5"
                : m.id === "LEVERAGE"
                  ? "5 2.5"
                  : undefined
            : undefined
        }
      />
    ));
  };

  /* owner's shaded large Yield treatment returns in SINGLE · YIELD */
  const shaded = mode === "individual" && selected === "YIELD";

  if (!hasData)
    return (
      <div className="csa-large">
        <div className="csa-no-data" role="status">
          DATED HISTORY UNAVAILABLE
        </div>
      </div>
    );

  /* per-series nearest point to the hovered x — each trace has its own
     x-domain, so "nearest" is resolved inside that trace's span and the
     inspector reports the point's REAL date (they may differ across
     series; each row carries its own in the title). */
  const hovered = focusX !== null
    ? visible.map((m) => {
        const pts = lines[m.id];
        let best: SignalPoint | null = null;
        let bestD = Infinity;
        const sx = xOf(m.id);
        for (const p of pts) {
          const d = Math.abs(sx(p.timestamp) - focusX);
          if (d < bestD) {
            bestD = d;
            best = p;
          }
        }
        return { m, point: best };
      })
    : null;

  const inspector =
    hovered !== null ? (
      <>
        <small>
          {hovered[0]?.point
            ? new Date(hovered[0].point.timestamp).toISOString().slice(0, 10)
            : "—"}
        </small>
        {hovered.map(({ m, point }) => (
          <span
            key={m.id}
            className="csa-inspect-row"
            title={
              point
                ? `${new Date(point.timestamp).toISOString()} · ${m.id}`
                : `${m.id}: no observation`
            }
          >
            <i style={{ color: m.color }}>{m.id.slice(0, 3)}</i>
            <b>{signalLabel(m.id, point?.value ?? null)}</b>
          </span>
        ))}
      </>
    ) : null;

  return (
    <section className="csa-large" aria-label="Operator signal history">
      <header>
        <span>
          {mode === "combined"
            ? "◈ COMBINED SIGNAL · OVERTIME"
            : `◇ ${selected} · OVERTIME`}
        </span>
        <div className="csa-mode" aria-label="Large chart mode">
          <button
            type="button"
            onClick={() => onMode("combined")}
            aria-pressed={mode === "combined"}
          >
            COMBO
          </button>
          <button
            type="button"
            onClick={() => onMode("individual")}
            aria-pressed={mode === "individual"}
          >
            SINGLE
          </button>
        </div>
      </header>
      <div className="csa-legend">
        {METRICS.map((m) => (
          <button
            key={m.id}
            type="button"
            style={{ "--csa": m.color } as CSSProperties}
            aria-pressed={
              mode === "combined" ? enabled.includes(m.id) : selected === m.id
            }
            onClick={() =>
              mode === "combined" ? toggle(m.id) : onSelect(m.id)
            }
          >
            <i />
            {m.id}
          </button>
        ))}
      </div>
      <svg
        viewBox="0 0 245 121"
        role="img"
        aria-label={
          mode === "combined"
            ? "Five normalized operator metric traces"
            : `${selected} individual timeline`
        }
      >
        <defs>
          {METRICS.map((m) => (
            <linearGradient
              key={m.id}
              id={`${id}-${m.id}`}
              x1="0"
              x2="0"
              y1="0"
              y2="1"
            >
              <stop offset="0%" stopColor={m.color} stopOpacity=".28" />
              <stop offset="100%" stopColor={m.color} stopOpacity=".02" />
            </linearGradient>
          ))}
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((t) => (
          <line
            key={t}
            x1="11"
            x2="235"
            y1={y(t)}
            y2={y(t)}
            stroke="#334933"
            strokeDasharray="2 4"
            strokeWidth=".6"
          />
        ))}
        {shaded &&
          pathFor(lines[selected], selected).map((path, i) => {
            /* never fill across a null gap — close each contiguous
               segment against the baseline by its own endpoints */
            const tokens = path.match(/-?\d+(?:\.\d+)?/g) ?? [];
            if (tokens.length < 4) return null;
            const xStart = Number(tokens[0]);
            const xEnd = Number(tokens[tokens.length - 2]);
            return (
              <path
                key={i}
                d={`${path} L${xEnd} 101 L${xStart} 101 Z`}
                fill={`url(#${id}-${selected})`}
                stroke="none"
              />
            );
          })}
        {/* real field-median reference — Yield single view only */}
        {shaded &&
          fieldMedianYield != null &&
          (() => {
            const v = normalizeSignal(lines.YIELD, fieldMedianYield, false);
            return v == null ? null : (
              <line
                x1="11"
                x2="235"
                y1={y(v)}
                y2={y(v)}
                stroke="var(--mut)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
            );
          })()}
        {visible.flatMap((m) => chart(m))}
        {focusX !== null && (
          <line
            x1={focusX}
            x2={focusX}
            y1="13"
            y2="101"
            stroke="#c5ed9b"
            strokeWidth=".7"
          />
        )}
        <rect
          x="11"
          y="13"
          width="224"
          height="88"
          fill="transparent"
          onPointerMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setFocusX(
              11 +
                Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) *
                  224,
            );
          }}
          onPointerLeave={() => setFocusX(null)}
        />
      </svg>
      <footer>
        <span className="csa-tip" aria-live="polite">
          {inspector ??
            (mode === "combined"
              ? "RELATIVE 0–100 · PER-TRACE SPAN"
              : "SOURCE VALUES / DATE")}
        </span>
        <span>DATED OBS.</span>
      </footer>
    </section>
  );
}
