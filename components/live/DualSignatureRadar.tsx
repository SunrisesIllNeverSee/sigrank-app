/* components/live/DualSignatureRadar.tsx — LB-G06 approved variant C
 * (SOLAR / ULTRAVIOLET): six-axis operator signature + real field-median
 * overlay, 271×271 fixed.
 *
 * Axis contract = the original /user/[codename] profile radar:
 *   SNR /1 · Velocity /50 · Leverage /200 · 10xDEV /5 · Scale V /9 ·
 *   Efficiency /5 — fixed display ceilings, NOT field-max normalization
 *   (field-max made the field leader a regular pentagon; owner wants the
 *   real signal shape back).
 *
 * Colors: operator = solar gold (solid polygon, circle markers); field
 * median = ultraviolet (dashed polygon, diamond markers) — readable
 * without color per the review candidate. The median is computed from the
 * actual loaded field; when no real reference exists it is simply omitted,
 * never synthesized.
 */
const AXES = [
  { key: "snr", name: "SNR", cap: 1 },
  { key: "velocity", name: "VELOCITY", cap: 50 },
  { key: "leverage", name: "LEVERAGE", cap: 200 },
  { key: "dev10x", name: "10xDEV", cap: 5 },
  { key: "scaleV", name: "SCALE V", cap: 9 },
  { key: "efficiency", name: "EFFICIENCY", cap: 5 },
] as const;

export interface SixAxisFacts {
  snr: number | null;
  velocity: number | null;
  leverage: number | null;
  dev10x: number | null;
  scaleV: number | null;
  efficiency: number | null;
}

const THEME = { operator: "#ffcd52", reference: "#a78bfa", grid: "#4d3a57" };

const pt = (r: number, i: number, c = 135): [number, number] => [
  c + Math.cos(-Math.PI / 2 + (i * Math.PI) / 3) * r,
  c + Math.sin(-Math.PI / 2 + (i * Math.PI) / 3) * r,
];
const joinPts = (pts: [number, number][]) =>
  pts.map((x) => x.map((v) => v.toFixed(1)).join(",")).join(" ");
const good = (v: number | null | undefined): v is number =>
  typeof v === "number" && Number.isFinite(v) && v >= 0;

export function DualSignatureRadar({
  operator,
  fieldMedian,
  label,
}: {
  operator: SixAxisFacts;
  fieldMedian: SixAxisFacts | null;
  label: string;
}) {
  const norm = (facts: SixAxisFacts) =>
    AXES.map((a) => {
      const n = facts[a.key];
      return good(n) ? Math.min(1, n / a.cap) : null;
    });
  const op = norm(operator);
  const ref = fieldMedian ? norm(fieldMedian) : null;
  const opReady = op.every((x) => x !== null);
  const refReady = ref?.every((x) => x !== null) ?? false;
  if (!opReady)
    return <div className="dusradar f4-no-data">SIX-AXIS SIGNAL UNAVAILABLE</div>;
  const xy = (points: (number | null)[]) =>
    points.map((x, i) => pt(75 * (x ?? 0), i));
  return (
    <div className="dusradar">
      <svg
        viewBox="0 0 271 271"
        role="img"
        aria-label={`${label}: six-axis operator radar${refReady ? ", compared with real field median" : ""}`}
      >
        <text x="12" y="16" fill={THEME.operator} fontSize="8">
          ▣ {label.slice(0, 18)} · DUAL SIGNATURE
        </text>
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <polygon
            key={r}
            points={joinPts(AXES.map((_, i) => pt(75 * r, i)))}
            fill="none"
            stroke={THEME.grid}
            strokeWidth=".8"
          />
        ))}
        {AXES.map((_, i) => {
          const [x, y] = pt(75, i);
          return (
            <line
              key={i}
              x1="135"
              y1="135"
              x2={x}
              y2={y}
              stroke={THEME.grid}
              strokeWidth=".8"
            />
          );
        })}
        {refReady && ref && (
          <g>
            <polygon
              points={joinPts(xy(ref))}
              fill={THEME.reference}
              fillOpacity=".10"
              stroke={THEME.reference}
              strokeDasharray="4 3"
              strokeWidth="2.4"
            />
            {xy(ref).map(([x, y], i) => (
              <rect
                key={i}
                x={x - 2.7}
                y={y - 2.7}
                width="5.4"
                height="5.4"
                fill={THEME.reference}
                transform={`rotate(45 ${x} ${y})`}
              />
            ))}
          </g>
        )}
        <polygon
          points={joinPts(xy(op))}
          fill={THEME.operator}
          fillOpacity=".14"
          stroke={THEME.operator}
          strokeWidth="2.4"
        />
        {xy(op).map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3.4" fill={THEME.operator}>
            <title>{`${AXES[i].name}: ${operator[AXES[i].key]} / display ceiling ${AXES[i].cap}`}</title>
          </circle>
        ))}
        {/* cap saturation is exposed, never implied: a measured value
            above a fixed display ceiling gets an outward triangle marker
            — the clipped vertex is not presented as the exact value. */}
        {AXES.map((a, i) => {
          const value = operator[a.key];
          if (value === null || !Number.isFinite(value) || value <= a.cap)
            return null;
          const angle = -Math.PI / 2 + (i * Math.PI) / 3;
          const c = Math.cos(angle);
          const s = Math.sin(angle);
          const [cx, cy] = pt(86, i);
          const tx = -s;
          const ty = c;
          return (
            <polygon
              key={`overflow-${a.key}`}
              points={joinPts([
                [cx + c * 5, cy + s * 5],
                [cx - c * 3 + tx * 3, cy - s * 3 + ty * 3],
                [cx - c * 3 - tx * 3, cy - s * 3 - ty * 3],
              ])}
              fill={THEME.operator}
            >
              <title>{`${a.name} exceeds display ceiling: ${value} (cap ${a.cap})`}</title>
            </polygon>
          );
        })}
        {AXES.map((a, i) => {
          const [x, y] = pt(99, i);
          return (
            <text
              key={a.key}
              x={x}
              y={y}
              fill="#dee9ec"
              fontSize="9"
              textAnchor={i === 0 || i === 3 ? "middle" : i === 1 || i === 2 ? "start" : "end"}
              dominantBaseline="middle"
            >
              {a.name}
            </text>
          );
        })}
        <circle cx="28" cy="253" r="3" fill={THEME.operator} />
        <text x="36" y="256" fill="#dee9ec" fontSize="7.5">
          OPERATOR
        </text>
        {refReady && (
          <g>
            <rect
              x="123"
              y="250"
              width="6"
              height="6"
              fill={THEME.reference}
              transform="rotate(45 126 253)"
            />
            <text x="136" y="256" fill="#dee9ec" fontSize="7.5">
              FIELD MEDIAN
            </text>
          </g>
        )}
        <text x="256" y="268" fill="#dee9ec" fontSize="6.4" textAnchor="end" opacity=".8">
          ▲ = ABOVE AXIS CEILING
        </text>
      </svg>
    </div>
  );
}
