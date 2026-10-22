/**
 * components/compare/CompareRadars.tsx — /compare radars (owner ask 2026-10-21).
 *
 *  A. CompareRadars (primary, one per operator, under that operator's column):
 *     the operator's OWN composite, independent of the opponent: 7 cascade metrics.
 *  B. CompareHeadToHead (secondary, full-width band): two radars with A and B
 *     overlaid — "Cascade stages" and "Token mix".
 *
 * Every axis is roto points among the live field (lib/radar/points, owner
 * 2026-10-22): 1 to N, outward = more (cost and input share: less). White lines
 * are the board's first, middle and last operator.
 *
 * These describe token-flow relationships, not quality, skill or effort. Missing
 * telemetry is drawn as missing, never as zero. Pure server components over rows
 * the page already loaded; no fetch.
 */
import type { LeaderboardRow } from "@/lib/board";
import { operatorDisplayName } from "@/lib/identity/operator-name";
import { COMPARE_OPERAND_COLORS } from "./compare-palette";
import { RadarSvg, RadarTable, type RadarAxis, type RadarLayer, type RadarRefLine } from "./CompareRadarSvg";
import {
  COMPOSITE_METRICS,
  cascadeStages,
  compactNumber,
  sampleFromRow,
  tokenMix,
  type FieldSample,
} from "@/lib/compare/radar-math";
import { RADAR_REF_STYLE, radarFractions, type RadarField } from "@/lib/radar/points";

const pLabel = (p: number | null) => (p === null ? "n/a" : Number.isInteger(p) ? String(p) : p.toFixed(1));
const RINGS = [{ r: 0.25 }, { r: 0.5 }, { r: 0.75 }, { r: 1 }];

/** The field's first / middle / last operator as white reference lines. */
export function refLines(field: RadarField): RadarRefLine[] {
  return field.refs.map((r) => ({
    role: r.role,
    points: radarFractions(r.pts, field.max),
    title: `${RADAR_REF_STYLE[r.role].label}: #${r.rank} ${r.name}`,
  }));
}

const ptsOf = (field: RadarField, row: LeaderboardRow) =>
  field.points[row.operator.codename] ?? field.labels.map(() => null);

export function RefKey({ field }: { field: RadarField }) {
  return (
    <p className="cmp-rd-refkey">
      {field.refs.map((r) => (
        <span key={r.role} data-ref={r.role}>
          <i />#{r.rank} {r.name}
        </span>
      ))}
    </p>
  );
}
const full = (n: number | null) => (n === null ? "missing" : n.toLocaleString("en-US", { maximumFractionDigits: 4 }));

/* ------------------------------------------------------------------ */
/* A. Composite                                                        */
/* ------------------------------------------------------------------ */

export function CompareRadars({
  row,
  side,
  field,
}: {
  row: LeaderboardRow;
  side: "a" | "b";
  field: RadarField;
}) {
  const name = operatorDisplayName(row);
  const color = COMPARE_OPERAND_COLORS[side];
  const sample = sampleFromRow(row);
  const pts = ptsOf(field, row);
  const metrics = COMPOSITE_METRICS.map((m, i) => ({ ...m, raw: sample[m.key], pts: pts[i] ?? null }));

  const axes: RadarAxis[] = metrics.map((m) => ({
    title: `${m.label}: ${m.pts === null ? "missing" : `${pLabel(m.pts)} of ${field.max} points`}, value ${full(m.raw)}`,
    lines: [
      { text: m.short },
      { text: pLabel(m.pts), color: m.pts === null ? undefined : color, bold: true, muted: m.pts === null,
        title: `${m.label}: value ${full(m.raw)}` },
    ],
  }));
  const layers: RadarLayer[] = [
    {
      name: `${name} cascade metrics`,
      color,
      points: radarFractions(pts, field.max),
      titles: metrics.map((m) => `${m.label}: ${m.pts === null ? "missing" : `${pLabel(m.pts)} of ${field.max}`} · ${full(m.raw)}`),
    },
  ];

  const title = `${name} · composite`;
  return (
    <figure className="cmp-radar cmp-composite" data-compare-operator={side} aria-label={title}>
      <figcaption className="cmp-radar-heading" style={{ color }}>
        {title}
      </figcaption>
      <RadarSvg
        width={270}
        height={250}
        cx={135}
        cy={122}
        radius={76}
        labelGap={6}
        lineHeight={11}
        axes={axes}
        rings={RINGS}
        refs={refLines(field)}
        layers={layers}
        ariaLabel={`${title}: points among ${field.size} live operators for seven cascade metrics, with the field's first, middle and last operator as reference lines`}
      />
      <RefKey field={field} />
      <p className="cmp-rd-caption">
        Points among {field.size} live operators (1 to {field.max}); outward = more. Cost per 1M: cheaper is outward.
        Token-flow shape, not a quality score.
      </p>
      <RadarTable
        caption={`${title}: points among ${field.size} live operators (1 to ${field.max}, higher is further out; cost per 1M inverted so cheaper is higher)`}
        columns={["Measure", "Value", "Points"]}
        rows={metrics.map((m) => [m.label, full(m.raw), m.pts === null ? "missing" : pLabel(m.pts)])}
      />
    </figure>
  );
}

/* ------------------------------------------------------------------ */
/* B. Head to head                                                     */
/* ------------------------------------------------------------------ */

function Legend({ nameA, nameB }: { nameA: string; nameB: string }) {
  return (
    <p className="cmp-rd-legend">
      <span><i style={{ background: COMPARE_OPERAND_COLORS.a }} />{nameA}</span>
      <span><i style={{ background: COMPARE_OPERAND_COLORS.b }} />{nameB}</span>
    </p>
  );
}

interface H2HDef { label: string; formula: string; value: (s: FieldSample) => string }

/** Head-to-head radar on roto points: both operators overlaid on the field references. */
function H2HRadar({
  a, b, field, defs, title, small, caption,
}: {
  a: LeaderboardRow; b: LeaderboardRow; field: RadarField; defs: H2HDef[]; title: string; small: string; caption: string;
}) {
  const nameA = operatorDisplayName(a);
  const nameB = operatorDisplayName(b);
  const sa = sampleFromRow(a);
  const sb = sampleFromRow(b);
  const pa = ptsOf(field, a);
  const pb = ptsOf(field, b);
  const colA = COMPARE_OPERAND_COLORS.a;
  const colB = COMPARE_OPERAND_COLORS.b;

  const axes: RadarAxis[] = defs.map((d, i) => {
    const va = pa[i] ?? null;
    const vb = pb[i] ?? null;
    const winner = va !== null && vb !== null && va !== vb ? (va > vb ? "a" : "b") : null;
    const mk = (v: number | null, who: "a" | "b", nm: string, s: FieldSample) => ({
      text: `${winner === who ? "● " : ""}${pLabel(v)}`,
      color: v === null ? undefined : who === "a" ? colA : colB,
      bold: winner === who,
      muted: v === null,
      title: `${nm}: ${d.label} = ${d.value(s)} · ${pLabel(v)} of ${field.max} points${winner === who ? " (more)" : ""}`,
    });
    return {
      title: `${d.label} = ${d.formula}`,
      lines: [{ text: d.label }, mk(va, "a", nameA, sa), mk(vb, "b", nameB, sb)],
    };
  });
  const layer = (p: (number | null)[], color: string, nm: string, s: FieldSample): RadarLayer => ({
    name: nm,
    color,
    points: radarFractions(p, field.max),
    titles: defs.map((d, i) => `${nm}: ${d.label} = ${d.value(s)} · ${pLabel(p[i] ?? null)} of ${field.max}`),
  });
  return (
    <figure className="cmp-radar cmp-h2h-radar" aria-label={`${title}, ${nameA} versus ${nameB}`}>
      <figcaption className="cmp-radar-heading">{title} <small>{small}</small></figcaption>
      <Legend nameA={nameA} nameB={nameB} />
      <RadarSvg
        width={420}
        height={310}
        cx={210}
        cy={160}
        radius={96}
        labelGap={10}
        axes={axes}
        rings={RINGS}
        refs={refLines(field)}
        layers={[layer(pa, colA, nameA, sa), layer(pb, colB, nameB, sb)]}
        ariaLabel={`${title}: ${nameA} versus ${nameB}, points among ${field.size} live operators, with the field's first, middle and last operator as reference lines`}
      />
      <RefKey field={field} />
      <p className="cmp-rd-caption">{caption}</p>
      <RadarTable
        caption={`${title}: points among ${field.size} live operators (1 to ${field.max})`}
        columns={["Axis", "Formula", nameA, nameB, "More"]}
        rows={defs.map((d, i) => {
          const va = pa[i] ?? null;
          const vb = pb[i] ?? null;
          return [d.label, d.formula, `${d.value(sa)} (${pLabel(va)})`, `${d.value(sb)} (${pLabel(vb)})`,
            va === null || vb === null || va === vb ? "none" : va > vb ? nameA : nameB];
        })}
      />
    </figure>
  );
}

const stage = (k: keyof ReturnType<typeof cascadeStages>) => (s: FieldSample) => compactNumber(cascadeStages(s)[k]);
const STAGE_DEFS: H2HDef[] = [
  { label: "Transmission", formula: "output ÷ input", value: stage("transmission") },
  { label: "Commitment", formula: "cache write ÷ output", value: stage("commitment") },
  { label: "Reuse", formula: "cache read ÷ cache write", value: stage("reuse") },
  { label: "Leverage", formula: "T × C × R = cache read ÷ input", value: stage("leverage") },
  { label: "Υ Yield", formula: "Leverage × Transmission = cache read × output ÷ input²", value: stage("yield_") },
];

const mixPct = (k: "input" | "output" | "cacheWrite" | "cacheRead") => (s: FieldSample) => {
  const v = tokenMix(s)?.[k];
  return v === undefined ? "—" : v > 0 && v < 0.01 ? "<0.01%" : v >= 10 ? `${v.toFixed(0)}%` : v >= 1 ? `${v.toFixed(1)}%` : `${v.toFixed(2)}%`;
};
const MIX_DEFS: H2HDef[] = [
  { label: "Input ↓", formula: "input share of own total (less is outward)", value: mixPct("input") },
  { label: "Output", formula: "output share of own total", value: mixPct("output") },
  { label: "Cache write", formula: "cache write share of own total", value: mixPct("cacheWrite") },
  { label: "Cache read", formula: "cache read share of own total", value: mixPct("cacheRead") },
];

export function CompareHeadToHead({
  a,
  b,
  stages,
  mix,
}: {
  a: LeaderboardRow;
  b: LeaderboardRow;
  stages: RadarField;
  mix: RadarField;
}) {
  return (
    <section className="cmp-h2h" aria-label="Head to head radars">
      <h2 className="cmp-h2h-title">Head to head</h2>
      <div className="cmp-h2h-grid">
        <H2HRadar a={a} b={b} field={stages} defs={STAGE_DEFS} title="Cascade stages" small="points in the field"
          caption="Where a Yield gap comes from. Transmission × Commitment × Reuse = Leverage (cache read ÷ input); Υ = Leverage × Transmission. Dot = more points on that axis." />
        <H2HRadar a={a} b={b} field={mix} defs={MIX_DEFS} title="Token mix" small="share of own total"
          caption="How each operates, not how much: each pillar's share of the operator's own tokens, ranked against the field. Input share is flipped, so less input is outward." />
      </div>
    </section>
  );
}
