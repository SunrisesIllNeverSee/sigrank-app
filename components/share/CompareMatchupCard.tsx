"use client";

/**
 * components/share/CompareMatchupCard.tsx — the downloadable matchup + radars card.
 *
 * Sibling of CompareShareCard. Combines the CompareMatchup (identity + 3 facts
 * per operator) and the compare radars (per-operator composite + cascade stages)
 * into a single 1200×900 social card. Dark top section for the matchup, terminal-black
 * bottom section with CRT scanlines for the dual radars.
 *
 * Radars use the /compare page math (lib/compare/radar-math.ts) with static hex SVG
 * (owner 2026-10-21): each operator's percentile composite with a raw-pillar ghost,
 * plus the head-to-head cascade stages on a log scale.
 *
 * Same html-to-image approach as CompareShareCard — off-screen element
 * captured to PNG, no server route / Satori.
 */

import { Fragment, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { track } from "@/lib/infra/posthog/events";
import type { LeaderboardRow } from "@/lib/board";
import { operatorDisplayName } from "@/lib/identity/operator-name";
import { deriveFacts, type OperatorFact } from "@/lib/analytics/compare-facts";
import { glyphFor } from "@/lib/identity/canon-ids";
import type { SignalClass } from "@/components/sigrank/types";
import { COMPARE_OPERAND_COLORS } from "@/components/compare/compare-palette";
import {
  COMPOSITE_METRICS,
  COMPOSITE_PILLARS,
  cascadeStages,
  compactNumber,
  decadeLabel,
  logScale,
  percentilesFor,
  sampleFromRow,
  type FieldSample,
} from "@/lib/compare/radar-math";

// ── Palette (static hex — html-to-image can't resolve CSS vars) ──────────────
const INK = "#0a0a0a";
const C_GREEN = "#8ae89a";
const C_GOLD = "#f0c862";
const C_DULL = "#6e8a6e";
const C_BONE = "#e9e3d5"; // matches --text-primary
const C_LINE = "#332d20"; // matches --bg-border
const A_COLOR = COMPARE_OPERAND_COLORS.a;
const B_COLOR = COMPARE_OPERAND_COLORS.b;

// Class → hex (static for the card; can't use CSS vars in html-to-image reliably)
const CLASS_HEX: Record<string, string> = {
  TRANSMITTER: "#c4923a",
  "ARCH+": "#e8a0d0",
  ARCH: "#7ab8e8",
  POWER: "#e87a7a",
  BASE: "#a8a8a8",
  SEEKER: "#f0c862",
  REFINER: "#8ae89a",
  BEARER: "#c8a8e8",
  IGNITER: "#e8c87a",
};

function classColor(cls: string): string {
  return CLASS_HEX[cls] ?? CLASS_HEX.BASE;
}

function yieldStr(r: LeaderboardRow): string {
  const c = r.snapshot.cascade;
  if (!c || c.nonCompounding) return "—";
  const y = c.yield_;
  if (y >= 1000) return `${(y / 1000).toFixed(1)}K`;
  if (y >= 1) return y.toFixed(0);
  return y.toFixed(2);
}

function tally(
  a: LeaderboardRow,
  b: LeaderboardRow,
): { aWins: number; bWins: number } {
  const ca = a.snapshot.cascade;
  const cb = b.snapshot.cascade;
  const ta = a.telemetry;
  const tb = b.telemetry;
  const comp = (c: typeof ca, pick: (x: NonNullable<typeof ca>) => number) =>
    c && !c.nonCompounding ? pick(c) : 0;
  const raw = (c: typeof ca, pick: (x: NonNullable<typeof ca>) => number) =>
    c ? pick(c) : 0;
  const tel = (t: typeof ta, pick: (x: NonNullable<typeof ta>) => number) =>
    t ? pick(t) : 0;
  const axes: Array<[number, number, boolean]> = [
    [comp(ca, (x) => x.yield_), comp(cb, (x) => x.yield_), true],
    [raw(ca, (x) => x.snr), raw(cb, (x) => x.snr), true],
    [comp(ca, (x) => x.leverage), comp(cb, (x) => x.leverage), true],
    [raw(ca, (x) => x.velocity), raw(cb, (x) => x.velocity), true],
    [comp(ca, (x) => x.dev10x ?? 0), comp(cb, (x) => x.dev10x ?? 0), true],
    [raw(ca, (x) => x.costPerMillion), raw(cb, (x) => x.costPerMillion), false],
    [tel(ta, (x) => x.fresh_input), tel(tb, (x) => x.fresh_input), true],
    [tel(ta, (x) => x.output), tel(tb, (x) => x.output), true],
    [tel(ta, (x) => x.cache_read), tel(tb, (x) => x.cache_read), true],
    [tel(ta, (x) => x.cache_create), tel(tb, (x) => x.cache_create), true],
  ];
  let aWins = 0,
    bWins = 0;
  for (const [av, bv, higherWins] of axes) {
    if (av === bv) continue;
    const aBetter = higherWins ? av > bv : av < bv;
    if (aBetter) aWins++;
    else bWins++;
  }
  return { aWins, bWins };
}

// ── Card radars (owner 2026-10-21) ───────────────────────────────────────────
// Same math as the /compare page radars (lib/compare/radar-math.ts): a per-operator
// COMPOSITE (percentile in the field, 7 cascade metrics solid, 5 raw pillars as a
// faint ghost) and a head-to-head CASCADE STAGES overlay on a shared log scale.
// The page SVG (CompareRadarSvg) styles itself through theme CSS classes, which
// html-to-image cannot carry into the export, so the card draws its own SVG with
// static hex and inline attributes.

const MONO = 'ui-monospace, "SF Mono", Menlo, monospace';
const SERIF = 'Georgia, "Times New Roman", serif';

interface CardAxisLine {
  text: string;
  color?: string;
  bold?: boolean;
}

interface CardLayer {
  color: string;
  ghost?: boolean;
  /** 0..1 radial position per axis of THIS layer; null = missing (no vertex). */
  points: (number | null)[];
}

/** Render Υ in a serif italic so it reads as Greek upsilon, not Latin Y. */
function Glyphs({ text }: { text: string }) {
  if (!text.includes("Υ")) return <>{text}</>;
  const parts = text.split("Υ");
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 ? (
            <tspan fontFamily={SERIF} fontStyle="italic" fontWeight={700}>
              Υ
            </tspan>
          ) : null}
        </Fragment>
      ))}
    </>
  );
}

function CardRadarSvg({
  width,
  height,
  radius,
  axes,
  rings,
  layers,
  labelGap = 12,
  lineHeight = 14,
}: {
  width: number;
  height: number;
  radius: number;
  axes: CardAxisLine[][];
  rings: { r: number; label?: string }[];
  layers: CardLayer[];
  labelGap?: number;
  lineHeight?: number;
}) {
  const n = axes.length;
  const cx = width / 2;
  const cy = height / 2;
  const ang = (i: number, count: number) => -Math.PI / 2 + (i * 2 * Math.PI) / count;
  const pt = (i: number, count: number, f: number): [number, number] => [
    cx + Math.cos(ang(i, count)) * radius * f,
    cy + Math.sin(ang(i, count)) * radius * f,
  ];
  const fmt = (p: [number, number]) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`;
  const ordered = [...layers].sort((p, q) => Number(!!q.ghost) - Number(!!p.ghost));

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      {rings.map((ring, k) => (
        <polygon
          key={`ring-${k}`}
          points={axes.map((_, i) => fmt(pt(i, n, ring.r))).join(" ")}
          fill="none"
          stroke={C_LINE}
          strokeWidth={1}
          opacity={ring.r >= 1 ? 0.9 : 0.6}
        />
      ))}
      {axes.map((_, i) => {
        const [x, y] = pt(i, n, 1);
        return <line key={`sp-${i}`} x1={cx} y1={cy} x2={x} y2={y} stroke={C_LINE} strokeWidth={1} opacity={0.5} />;
      })}
      {ordered.map((layer, li) => {
        const c = layer.points.length;
        const pts = layer.points
          .map((v, i) => (v === null ? null : pt(i, c, v)))
          .filter((p): p is [number, number] => p !== null);
        return (
          <g key={li}>
            {pts.length >= 3 ? (
              <polygon
                points={pts.map(fmt).join(" ")}
                fill={layer.color}
                fillOpacity={layer.ghost ? 0.12 : 0.17}
                stroke={layer.color}
                strokeOpacity={layer.ghost ? 0.5 : 1}
                strokeWidth={layer.ghost ? 1.2 : 2.5}
                strokeDasharray={layer.ghost ? "3 3" : undefined}
                strokeLinejoin="round"
              />
            ) : pts.length === 2 ? (
              <polyline points={pts.map(fmt).join(" ")} fill="none" stroke={layer.color} strokeWidth={2.5} />
            ) : null}
            {layer.points.map((v, i) => {
              if (v === null) return null;
              const [x, y] = pt(i, c, v);
              return layer.ghost ? (
                <circle key={i} cx={x} cy={y} r={2.4} fill="none" stroke={layer.color} strokeOpacity={0.7} strokeWidth={1} />
              ) : (
                <circle key={i} cx={x} cy={y} r={3.6} fill={layer.color} />
              );
            })}
          </g>
        );
      })}
      {/* owner 2026-10-21: ring labels drawn after the layers, with a dark halo, so polygons never overdraw them */}
      {rings.map((ring, k) =>
        ring.label ? (
          <text key={`rl-${k}`} x={cx + 6} y={cy - radius * ring.r + 10} fontSize={9} fill={C_DULL} fontFamily={MONO} stroke="#050605" strokeWidth={3} paintOrder="stroke" strokeLinejoin="round">
            {ring.label}
          </text>
        ) : null,
      )}
      {axes.map((lines, i) => {
        const a = ang(i, n);
        const cos = Math.cos(a);
        const sin = Math.sin(a);
        const [px, py] = pt(i, n, 1);
        const lx = px + cos * labelGap;
        const ly = py + sin * labelGap;
        const anchor = Math.abs(cos) < 0.25 ? "middle" : cos > 0 ? "start" : "end";
        const count = lines.length;
        let y0: number;
        if (sin < -0.5) y0 = ly - (count - 1) * lineHeight - 2;
        else if (sin > 0.5) y0 = ly + lineHeight * 0.85;
        else y0 = ly - ((count - 1) * lineHeight) / 2 + 4;
        return (
          <g key={`ax-${i}`}>
            {lines.map((line, j) => (
              <text
                key={j}
                x={lx}
                y={y0 + j * lineHeight}
                textAnchor={anchor}
                fontSize={12}
                fontFamily={MONO}
                fontWeight={line.bold || j === 0 ? 700 : 500}
                fill={line.color ?? (j === 0 ? C_BONE : C_DULL)}
              >
                <Glyphs text={line.text} />
              </text>
            ))}
          </g>
        );
      })}
    </svg>
  );
}

const pctText = (pct: number | null) => (pct === null ? "n/a" : String(Math.round(pct)));

function CompositeRadar({ sample, field, color }: { sample: FieldSample; field: FieldSample[]; color: string }) {
  const metrics = percentilesFor(sample, field, COMPOSITE_METRICS);
  const pillars = percentilesFor(sample, field, COMPOSITE_PILLARS);
  const axes: CardAxisLine[][] = metrics.map((m) => [
    { text: m.short },
    { text: pctText(m.pct), color: m.pct === null ? undefined : color, bold: true },
  ]);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
      <CardRadarSvg
        width={380}
        height={420}
        radius={110}
        labelGap={10}
        axes={axes}
        rings={[{ r: 0.25 }, { r: 0.5 }, { r: 0.75 }, { r: 1 }]}
        layers={[
          { color, ghost: true, points: pillars.map((p) => (p.pct === null ? null : p.pct / 100)) },
          { color, points: metrics.map((m) => (m.pct === null ? null : m.pct / 100)) },
        ]}
      />
      <div style={{ fontSize: 10.5, color: C_DULL, textAlign: "center", lineHeight: 1.5 }}>
        <span
          style={{
            display: "inline-block",
            width: 14,
            height: 0,
            borderTop: `1.5px dashed ${color}`,
            marginRight: 6,
            verticalAlign: "middle",
          }}
        />
        RAW{" "}
        {pillars.map((p, i) => (
          <span key={p.key}>
            {i ? " · " : ""}
            {p.key === "total" ? "Σ" : p.short} <b style={{ color: p.pct === null ? C_DULL : color }}>{pctText(p.pct)}</b>
          </span>
        ))}
      </div>
    </div>
  );
}

const STAGE_DEFS = [
  { key: "transmission", label: "Transmission" },
  { key: "commitment", label: "Commitment" },
  { key: "reuse", label: "Reuse" },
  { key: "leverage", label: "Leverage" },
  { key: "yield_", label: "Υ Yield" },
] as const;

function StagesRadar({ a, b }: { a: FieldSample; b: FieldSample }) {
  const sa = cascadeStages(a);
  const sb = cascadeStages(b);
  const scale = logScale(STAGE_DEFS.flatMap((d) => [sa[d.key], sb[d.key]]));
  const axes: CardAxisLine[][] = STAGE_DEFS.map((d) => {
    const va = sa[d.key];
    const vb = sb[d.key];
    const winner = va !== null && vb !== null && va !== vb ? (va > vb ? "a" : "b") : null;
    return [
      { text: d.label },
      { text: `${winner === "a" ? "● " : ""}${compactNumber(va)}`, color: va === null ? undefined : A_COLOR, bold: winner === "a" },
      { text: `${winner === "b" ? "● " : ""}${compactNumber(vb)}`, color: vb === null ? undefined : B_COLOR, bold: winner === "b" },
    ];
  });
  const layer = (s: typeof sa, color: string): CardLayer => ({
    color,
    points: STAGE_DEFS.map((d) => scale.project(s[d.key])),
  });
  return (
    <CardRadarSvg
      width={440}
      height={460}
      radius={132}
      labelGap={12}
      axes={axes}
      rings={scale.ticks.map((e) => ({
        r: (e - scale.loExp) / (scale.hiExp - scale.loExp),
        label: decadeLabel(e),
      }))}
      layers={[layer(sa, A_COLOR), layer(sb, B_COLOR)]}
    />
  );
}


// ── Fact line for the card ───────────────────────────────────────────────────

function FactLine({ fact }: { fact: OperatorFact }) {
  const mark =
    fact.polarity === "up" ? "✦" : fact.polarity === "down" ? "△" : "·";
  const markColor =
    fact.polarity === "up"
      ? C_GOLD
      : fact.polarity === "down"
        ? C_DULL
        : "#4a6a4a";
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span
        style={{
          fontSize: 11,
          color: markColor,
          fontFamily: "ui-monospace, monospace",
          flexShrink: 0,
        }}
      >
        {mark}
      </span>
      <span
        style={{
          fontSize: 12,
          fontFamily: "ui-monospace, monospace",
          lineHeight: 1.4,
          minWidth: 0,
        }}
      >
        <span style={{ fontWeight: 700, color: C_BONE }}>{fact.label}</span>
        <span style={{ color: "#7d7461" }}> · {fact.detail}</span>
      </span>
    </div>
  );
}

// ── The card itself ──────────────────────────────────────────────────────────

function Card({
  cardRef,
  a,
  b,
  field,
}: {
  cardRef: React.RefObject<HTMLDivElement | null>;
  a: LeaderboardRow;
  b: LeaderboardRow;
  field: FieldSample[];
}) {
  const nameA = operatorDisplayName(a).toUpperCase();
  const nameB = operatorDisplayName(b).toUpperCase();
  const clsA = a.snapshot.class_tier as SignalClass;
  const clsB = b.snapshot.class_tier as SignalClass;
  const colA = classColor(clsA);
  const colB = classColor(clsB);
  const { aWins, bWins } = tally(a, b);
  const winner: "a" | "b" | null =
    aWins === bWins ? null : aWins > bWins ? "a" : "b";
  const factsA = deriveFacts(a, b).slice(0, 3);
  const factsB = deriveFacts(b, a).slice(0, 3);

  const sampleA = sampleFromRow(a);
  const sampleB = sampleFromRow(b);

  return (
    <div
      ref={cardRef}
      style={{
        width: 1200,
        height: 903,
        background: "#050605",
        fontFamily: 'ui-monospace, "SF Mono", Menlo, monospace',
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* ═══ TOP — matchup on dark background (300px = 1/3) ═══ */}
      <div
        style={{
          height: 300,
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        {/* header strip — operator names flank the title so name length
            doesn't affect the matchup box widths below */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px 24px",
            borderBottom: "1px solid #1a3a1a",
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: 0.5,
            color: C_DULL,
          }}
        >
          <span
            style={{
              color: colA,
              fontSize: 16,
              fontWeight: 900,
              letterSpacing: 0.5,
            }}
          >
            {nameA}
          </span>
          <span
            style={{
              color: C_GREEN,
              textShadow: "0 0 8px rgba(138,232,154,0.5)",
              letterSpacing: 3,
              fontSize: 13,
            }}
          >
            MANUS AD MANUM
          </span>
          <span
            style={{
              color: colB,
              fontSize: 16,
              fontWeight: 900,
              letterSpacing: 0.5,
            }}
          >
            {nameB}
          </span>
        </div>

        {/* matchup panels — 5 columns: identity | facts | VS | facts | identity */}
        <div style={{ flex: 1, display: "flex", alignItems: "stretch" }}>
          {/* A identity (outboard = left) */}
          <div
            style={{
              width: 200,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              padding: "14px 20px",
              justifyContent: "space-evenly",
              alignItems: "center",
              textAlign: "center",
              background:
                winner === "a"
                  ? `linear-gradient(105deg, ${colA}22, transparent 72%)`
                  : `linear-gradient(105deg, ${colA}11, transparent 72%)`,
            }}
          >
            <span style={{ fontSize: 32, color: colA, lineHeight: 1 }}>
              {glyphFor(clsA)}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: colA,
                letterSpacing: 0.3,
              }}
            >
              {clsA} · #{a.global_rank}
            </span>
            <span
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: C_GOLD,
                lineHeight: 1,
              }}
            >
              {yieldStr(a)}
            </span>
            <span style={{ fontSize: 9, color: "#7d7461" }}>Υ YIELD</span>
            {winner === "a" && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: C_GOLD,
                  border: "1px solid " + C_GOLD + "66",
                  borderRadius: 999,
                  padding: "2px 8px",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                ◆ Leads {aWins}–{bWins}
              </span>
            )}
          </div>

          {/* A facts (inboard) */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "12px 16px",
              justifyContent: "space-evenly",
              minWidth: 0,
            }}
          >
            {factsA.map((f, i) => (
              <FactLine key={i} fact={f} />
            ))}
          </div>

          {/* VS divider */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "0 16px",
              flexShrink: 0,
              width: 90,
            }}
          >
            <span
              style={{
                fontSize: 32,
                fontWeight: 900,
                color: "#7d7461",
                letterSpacing: 4,
              }}
            >
              VS
            </span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: "#4a6a4a",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {aWins}–{bWins}
            </span>
          </div>

          {/* B facts (inboard) */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              padding: "12px 16px",
              justifyContent: "space-evenly",
              minWidth: 0,
              alignItems: "flex-end",
              textAlign: "right",
            }}
          >
            {factsB.map((f, i) => (
              <FactLine key={i} fact={f} />
            ))}
          </div>

          {/* B identity (outboard = right) */}
          <div
            style={{
              width: 200,
              flexShrink: 0,
              display: "flex",
              flexDirection: "column",
              gap: 4,
              padding: "14px 20px",
              justifyContent: "space-evenly",
              alignItems: "center",
              textAlign: "center",
              background:
                winner === "b"
                  ? `linear-gradient(255deg, ${colB}22, transparent 72%)`
                  : `linear-gradient(255deg, ${colB}11, transparent 72%)`,
            }}
          >
            <span style={{ fontSize: 32, color: colB, lineHeight: 1 }}>
              {glyphFor(clsB)}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: colB,
                letterSpacing: 0.3,
              }}
            >
              {clsB} · #{b.global_rank}
            </span>
            <span
              style={{
                fontSize: 36,
                fontWeight: 800,
                color: C_GOLD,
                lineHeight: 1,
              }}
            >
              {yieldStr(b)}
            </span>
            <span style={{ fontSize: 9, color: "#7d7461" }}>Υ YIELD</span>
            {winner === "b" && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: C_GOLD,
                  border: "1px solid " + C_GOLD + "66",
                  borderRadius: 999,
                  padding: "2px 8px",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                ◆ Leads {bWins}–{aWins}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ═══ DIVIDER — between matchup and radars ═══ */}
      <div
        style={{
          height: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "linear-gradient(90deg, transparent, #1a3a1a 15%, #2a5a2a 50%, #1a3a1a 85%, transparent)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 10,
            height: 10,
            background: "#2a5a2a",
            transform: "rotate(45deg)",
            boxShadow: "0 0 12px rgba(42,90,42,0.5)",
          }}
        />
      </div>

      {/* ═══ BOTTOM — dual radars on terminal black (600px = 2/3) ═══ */}
      <div
        style={{
          height: 600,
          background: INK,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* CRT scanlines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 3px)",
          }}
        />

        {/* radar labels */}
        <div
          style={{
            display: "flex",
            padding: "10px 15px 0",
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: 1,
            color: C_DULL,
            position: "relative",
            zIndex: 2,
          }}
        >
          <span style={{ width: 380, textAlign: "center", color: A_COLOR }}>{nameA} · COMPOSITE</span>
          <span style={{ width: 410, textAlign: "center" }}>CASCADE STAGES · LOG SCALE</span>
          <span style={{ width: 380, textAlign: "center", color: B_COLOR }}>{nameB} · COMPOSITE</span>
        </div>

        {/* radars */}
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            zIndex: 2,
            padding: "0 15px",
          }}
        >
          <CompositeRadar sample={sampleA} field={field} color={A_COLOR} />
          <div style={{ width: 410, display: "flex", justifyContent: "center", marginLeft: 0 }}>
            <StagesRadar a={sampleA} b={sampleB} />
          </div>
          <CompositeRadar sample={sampleB} field={field} color={B_COLOR} />
        </div>

        {/* footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "8px 28px",
            borderTop: "1px solid #1a3a1a",
            fontSize: 11,
            fontWeight: 700,
            position: "relative",
            zIndex: 2,
          }}
        >
          <span style={{ color: A_COLOR }}>{aWins} WINS</span>
          <span style={{ color: "#4a6a4a", fontSize: 9 }}>
            COMPOSITE = PERCENTILE IN FIELD OF {field.length} · $/1M INVERTED · DASHED = RAW PILLARS · ● = HIGHER STAGE · TOKEN-FLOW SHAPE, NOT A QUALITY SCORE
          </span>
          <span style={{ color: C_GOLD }}>{bWins} WINS</span>
        </div>
        <div
          style={{
            textAlign: "center",
            fontSize: 11,
            color: C_GREEN,
            letterSpacing: 1,
            paddingBottom: 10,
            position: "relative",
            zIndex: 2,
            textShadow: "0 0 8px rgba(138,232,154,0.4)",
          }}
        >
          ▸ CLAIM YOUR SCORE AT SIGNALAF.COM ▸
        </div>
      </div>
    </div>
  );
}

// ── Exported component with buttons ──────────────────────────────────────────

export interface CompareMatchupCardProps {
  a: LeaderboardRow;
  b: LeaderboardRow;
  href: string;
  /** Field samples for the composites, same as the page: board.map(sampleFromRow). */
  field: FieldSample[];
}

export function CompareMatchupCard({ a, b, href, field }: CompareMatchupCardProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);

  const shareLink = async () => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://signalaf.com";
    const full = `${origin}${href}`;
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${operatorDisplayName(a)} vs ${operatorDisplayName(b)} · SigRank`,
          url: full,
        });
        track.compareShared("copy", { href, method: "native_share" });
        return;
      } catch {
        /* user cancelled or share failed, fall back to clipboard */
      }
    }
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(full);
      } else {
        const input = document.createElement("input");
        input.value = full;
        document.body.appendChild(input);
        input.select();
        document.execCommand("copy");
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      track.compareShared("copy", { href });
    } catch {
      /* clipboard blocked, prompt user */
      if (typeof window !== "undefined") {
        window.prompt("Copy link to share this matchup:", full);
      }
    }
  };

  const download = async () => {
    if (!cardRef.current) return;
    setBusy(true);
    try {
      const dataUrl = await toPng(cardRef.current, {
        width: 1200,
        height: 903,
        pixelRatio: 2,
        cacheBust: true,
      });
      const slugA = (a.operator.codename || "op-a").toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
      const slugB = (b.operator.codename || "op-b").toLowerCase().replace(/[^a-z0-9_-]+/g, "-");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `sigrank-matchup-${slugA}-vs-${slugB}.png`;
      link.click();
      track.compareShared("download");
    } finally {
      setBusy(false);
    }
  };

  const btn =
    "rounded-md border border-bg-border bg-bg-surface px-3 py-1.5 font-mono text-xs text-text-primary transition-colors hover:bg-bg-hover hover:border-gold/50 disabled:opacity-50";

  return (
    <div className="flex items-center justify-end gap-2">
      <button type="button" onClick={shareLink} className={btn}>
        {copied ? "Copied ✓" : "Share matchup"}
      </button>
      <button type="button" onClick={() => setPreview(true)} className={btn}>
        Preview
      </button>
      <button type="button" onClick={download} disabled={busy} className={btn}>
        {busy ? "Rendering…" : "Download matchup card"}
      </button>

      <div
        style={{
          position: "fixed",
          left: -99999,
          top: 0,
          pointerEvents: "none",
        }}
        aria-hidden
      >
        <Card cardRef={cardRef} a={a} b={b} field={field} />
      </div>

      {preview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreview(false)}
        >
          <div
            className="relative max-h-full max-w-full overflow-auto rounded-lg border border-bg-border"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreview(false)}
              className="absolute right-2 top-2 z-10 rounded-md border border-bg-border bg-bg-surface px-2 py-1 font-mono text-xs text-text-primary transition-colors hover:bg-bg-hover"
            >
              Close ✕
            </button>
            <div
              style={{
                transform:
                  "scale(min(1, calc((100vw - 2rem) / 1200), calc((100vh - 2rem) / 903)))",
                transformOrigin: "top left",
              }}
            >
              <Card cardRef={cardRef} a={a} b={b} field={field} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
