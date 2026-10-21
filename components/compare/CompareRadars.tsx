/**
 * components/compare/CompareRadars.tsx — /compare radars (owner ask 2026-10-21).
 *
 *  A. CompareRadars (primary, one per operator, under that operator's column):
 *     the operator's OWN composite, independent of the opponent. Each axis is the
 *     operator's percentile in the field the page is showing (0-100, outward =
 *     higher; cost per 1M inverted). 7 cascade metrics solid, the 5 raw pillars
 *     as a faint ghost layer underneath (the "dual signature" idea).
 *  B. CompareHeadToHead (secondary, full-width band): two radars with A and B
 *     overlaid — "Cascade stages" on a shared log scale and "Token mix" as a share
 *     of each operator's own total.
 *
 * These describe token-flow relationships, not quality, skill or effort. Missing
 * telemetry is drawn as missing, never as zero. Pure server components over rows
 * the page already loaded; no fetch.
 */
import type { LeaderboardRow } from "@/lib/board";
import { operatorDisplayName } from "@/lib/identity/operator-name";
import { COMPARE_OPERAND_COLORS } from "./compare-palette";
import { RadarSvg, RadarTable, type RadarAxis, type RadarLayer } from "./CompareRadarSvg";
import {
  COMPOSITE_METRICS,
  COMPOSITE_PILLARS,
  cascadeStages,
  compactNumber,
  decadeLabel,
  logScale,
  percentilesFor,
  sampleFromRow,
  sqrtShare,
  tokenMix,
  type FieldSample,
} from "@/lib/compare/radar-math";

const pLabel = (pct: number | null) => (pct === null ? "n/a" : String(Math.round(pct)));
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
  field: FieldSample[];
}) {
  const name = operatorDisplayName(row);
  const color = COMPARE_OPERAND_COLORS[side];
  const sample = sampleFromRow(row);
  const metrics = percentilesFor(sample, field, COMPOSITE_METRICS);
  const pillars = percentilesFor(sample, field, COMPOSITE_PILLARS);

  const axes: RadarAxis[] = metrics.map((m) => ({
    title: `${m.label}: ${m.pct === null ? "missing" : `percentile ${pLabel(m.pct)}`}, value ${full(m.raw)}`,
    lines: [
      { text: m.short },
      { text: m.pct === null ? "n/a" : pLabel(m.pct), color: m.pct === null ? undefined : color, bold: true, muted: m.pct === null,
        title: `${m.label}: value ${full(m.raw)}` },
    ],
  }));
  const layers: RadarLayer[] = [
    {
      name: `${name} raw pillars`,
      color,
      ghost: true,
      points: pillars.map((p) => (p.pct === null ? null : p.pct / 100)),
      titles: pillars.map((p) => `${p.label}: ${p.pct === null ? "missing" : `percentile ${pLabel(p.pct)}`} · ${full(p.raw)}`),
    },
    {
      name: `${name} cascade metrics`,
      color,
      points: metrics.map((m) => (m.pct === null ? null : m.pct / 100)),
      titles: metrics.map((m) => `${m.label}: ${m.pct === null ? "missing" : `percentile ${pLabel(m.pct)}`} · ${full(m.raw)}`),
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
        rings={[{ r: 0.25 }, { r: 0.5 }, { r: 0.75 }, { r: 1 }]}
        layers={layers}
        ariaLabel={`${title}: percentile in the field for seven cascade metrics (solid) and five raw token pillars (faint)`}
      />
      <p className="cmp-rd-pillars" aria-hidden="true">
        <span className="cmp-rd-ghostkey" style={{ borderColor: color }} />
        Raw:{" "}
        {pillars.map((p, i) => (
          <span key={p.key}>
            {i ? " · " : ""}
            {p.key === "total" ? "Σ" : p.short} <b style={{ color: p.pct === null ? undefined : color }}>{pLabel(p.pct)}</b>
          </span>
        ))}
      </p>
      <p className="cmp-rd-caption">
        Outward = higher in the field ({field.length} operators). Cost per 1M is inverted.
        Token-flow shape, not a quality score.
      </p>
      <RadarTable
        caption={`${title}: percentile in the field of ${field.length} operators (0 to 100, higher is further out; cost per 1M inverted so cheaper is higher)`}
        columns={["Measure", "Value", "Percentile"]}
        rows={[
          ...metrics.map((m) => [m.label, full(m.raw), m.pct === null ? "missing" : pLabel(m.pct)]),
          ...pillars.map((p) => [`${p.label} (raw pillar)`, full(p.raw), p.pct === null ? "missing" : pLabel(p.pct)]),
        ]}
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

function StagesRadar({ a, b, nameA, nameB }: { a: FieldSample; b: FieldSample; nameA: string; nameB: string }) {
  const sa = cascadeStages(a);
  const sb = cascadeStages(b);
  const defs = [
    { key: "transmission", label: "Transmission", formula: "output ÷ input" },
    { key: "commitment", label: "Commitment", formula: "cache write ÷ output" },
    { key: "reuse", label: "Reuse", formula: "cache read ÷ cache write" },
    { key: "leverage", label: "Leverage", formula: "T × C × R = cache read ÷ input" },
    { key: "yield_", label: "Υ Yield", formula: "Leverage × Transmission = cache read × output ÷ input²" },
  ] as const;
  const all = defs.flatMap((d) => [sa[d.key], sb[d.key]]);
  const scale = logScale(all);
  const colA = COMPARE_OPERAND_COLORS.a;
  const colB = COMPARE_OPERAND_COLORS.b;

  const axes: RadarAxis[] = defs.map((d) => {
    const va = sa[d.key];
    const vb = sb[d.key];
    const winner = va !== null && vb !== null && va !== vb ? (va > vb ? "a" : "b") : null;
    const mk = (v: number | null, who: "a" | "b", nm: string) => ({
      text: `${winner === who ? "● " : ""}${compactNumber(v)}`,
      color: v === null ? undefined : who === "a" ? colA : colB,
      bold: winner === who,
      muted: v === null,
      title: `${nm}: ${d.label} = ${full(v)}${winner === who ? " (higher)" : ""}`,
    });
    return {
      title: `${d.label} = ${d.formula}`,
      lines: [{ text: d.label }, mk(va, "a", nameA), mk(vb, "b", nameB)],
    };
  });
  const layer = (s: typeof sa, color: string, nm: string): RadarLayer => ({
    name: nm,
    color,
    points: defs.map((d) => scale.project(s[d.key])),
    titles: defs.map((d) => `${nm}: ${d.label} = ${full(s[d.key])}`),
  });
  const title = "Cascade stages";
  return (
    <figure className="cmp-radar cmp-h2h-radar" aria-label={`${title}, ${nameA} versus ${nameB}`}>
      <figcaption className="cmp-radar-heading">{title} <small>log scale</small></figcaption>
      <Legend nameA={nameA} nameB={nameB} />
      <RadarSvg
        width={420}
        height={310}
        cx={210}
        cy={160}
        radius={96}
        labelGap={10}
        axes={axes}
        rings={scale.ticks.map((e) => ({
          r: (e - scale.loExp) / (scale.hiExp - scale.loExp),
          label: decadeLabel(e),
        }))}
        layers={[layer(sa, colA, nameA), layer(sb, colB, nameB)]}
        ariaLabel={`${title}: ${nameA} versus ${nameB} on a shared logarithmic scale from ${decadeLabel(scale.loExp)} to ${decadeLabel(scale.hiExp)}`}
      />
      <p className="cmp-rd-caption">
        Where a Yield gap comes from. Transmission × Commitment × Reuse = Leverage (cache read ÷ input);
        Υ = Leverage × Transmission. Dot = higher on that axis. Rings are powers of ten, shared by every axis.
      </p>
      <RadarTable
        caption={`${title}, shared logarithmic scale`}
        columns={["Stage", "Formula", nameA, nameB, "Higher"]}
        rows={defs.map((d) => {
          const va = sa[d.key];
          const vb = sb[d.key];
          return [d.label, d.formula, full(va), full(vb),
            va === null || vb === null || va === vb ? "none" : va > vb ? nameA : nameB];
        })}
      />
    </figure>
  );
}

function MixRadar({ a, b, nameA, nameB }: { a: FieldSample; b: FieldSample; nameA: string; nameB: string }) {
  const ma = tokenMix(a);
  const mb = tokenMix(b);
  const defs = [
    { key: "input", label: "Input" },
    { key: "output", label: "Output" },
    { key: "cacheWrite", label: "Cache write" },
    { key: "cacheRead", label: "Cache read" },
  ] as const;
  const colA = COMPARE_OPERAND_COLORS.a;
  const colB = COMPARE_OPERAND_COLORS.b;
  const pct = (v: number | undefined) =>
    v === undefined ? "—" : v > 0 && v < 0.01 ? "<0.01%" : v >= 10 ? `${v.toFixed(0)}%` : v >= 1 ? `${v.toFixed(1)}%` : `${v.toFixed(2)}%`;
  const axes: RadarAxis[] = defs.map((d) => ({
    title: `${d.label}: share of the operator's own total tokens`,
    lines: [
      { text: d.label },
      { text: pct(ma?.[d.key]), color: ma ? colA : undefined, muted: !ma, title: `${nameA}: ${d.label} ${ma ? ma[d.key].toFixed(3) + "% of total" : "missing"}` },
      { text: pct(mb?.[d.key]), color: mb ? colB : undefined, muted: !mb, title: `${nameB}: ${d.label} ${mb ? mb[d.key].toFixed(3) + "% of total" : "missing"}` },
    ],
  }));
  const layer = (m: typeof ma, color: string, nm: string): RadarLayer => ({
    name: nm,
    color,
    points: defs.map((d) => (m ? sqrtShare(m[d.key]) : null)),
    titles: defs.map((d) => `${nm}: ${d.label} ${m ? m[d.key].toFixed(3) + "% of own total" : "missing"}`),
  });
  const title = "Token mix";
  return (
    <figure className="cmp-radar cmp-h2h-radar" aria-label={`${title}, ${nameA} versus ${nameB}`}>
      <figcaption className="cmp-radar-heading">{title} <small>share of own total</small></figcaption>
      <Legend nameA={nameA} nameB={nameB} />
      <RadarSvg
        width={420}
        height={310}
        cx={210}
        cy={160}
        radius={96}
        labelGap={10}
        axes={axes}
        rings={[
          { r: Math.sqrt(0.01), label: "1%" },
          { r: Math.sqrt(0.1), label: "10%" },
          { r: Math.sqrt(0.5), label: "50%" },
          { r: 1, label: "100%" },
        ]}
        layers={[layer(ma, colA, nameA), layer(mb, colB, nameB)]}
        ariaLabel={`${title}: share of input, output, cache write and cache read in each operator's own total, ${nameA} versus ${nameB}`}
      />
      <p className="cmp-rd-caption">
        How each operates, not how much. Each shape sums to 100% of that operator&apos;s own tokens
        (square-root rings so small shares stay visible). A composition, not a contest, so no winner.
      </p>
      <RadarTable
        caption={`${title}: percent of each operator's own total tokens`}
        columns={["Pillar", nameA, nameB]}
        rows={defs.map((d) => [d.label, ma ? `${ma[d.key].toFixed(2)}%` : "missing", mb ? `${mb[d.key].toFixed(2)}%` : "missing"])}
      />
    </figure>
  );
}

export function CompareHeadToHead({ a, b }: { a: LeaderboardRow; b: LeaderboardRow }) {
  const sa = sampleFromRow(a);
  const sb = sampleFromRow(b);
  const nameA = operatorDisplayName(a);
  const nameB = operatorDisplayName(b);
  return (
    <section className="cmp-h2h" aria-label="Head to head radars">
      <h2 className="cmp-h2h-title">Head to head</h2>
      <div className="cmp-h2h-grid">
        <StagesRadar a={sa} b={sb} nameA={nameA} nameB={nameB} />
        <MixRadar a={sa} b={sb} nameA={nameA} nameB={nameB} />
      </div>
    </section>
  );
}
