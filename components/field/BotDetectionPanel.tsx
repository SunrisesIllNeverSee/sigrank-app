/**
 * BotDetectionPanel — SVG scatter + table of flagged outliers.
 *
 * SNR vs total tokens scatter with flagged outliers highlighted in red.
 * Table of confirmed outliers with their signals. Pure inline SVG + styled
 * HTML table, no chart libraries.
 *
 * Note: the component name retains "Bot" for git-history continuity, but the
 * display text says "outliers" — the 17 former bots/suspects are now lumped
 * into the 113 outliers (owner 2026-07-17: no separate bot category).
 */

import type { FieldOperator } from "@/lib/analytics/field-types";

const FLAG = "#c0392b";
const CASCADE = "#8b5cf6";
const GOLD = "#c4923a";
const INK = "#e0e0d0";
const MUT = "#7d7461";
const LINE = "#332d20";
const BG = "#0d0b08";

export interface BotDetectionPanelProps {
  operators: FieldOperator[];
  bots?: FieldOperator[]; // deprecated — kept for backward compat, unused
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000_000_000_000) return `${(n / 1e15).toFixed(1)}Q`;
  if (n >= 1_000_000_000_000) return `${(n / 1e12).toFixed(1)}T`;
  if (n >= 1_000_000_000) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1e6).toFixed(1)}M`;
  return n.toFixed(0);
}

export default function BotDetectionPanel({
  operators,
}: BotDetectionPanelProps) {
  // Flagged outliers are operators with a `classification` field (former
  // bot/suspect category, now lumped into outliers).
  const flaggedOutliers = operators.filter((o) => o.classification != null);

  // Scatter: SNR vs total_tokens (log scale)
  const humanPoints = operators
    .filter((o) => o.total_tokens > 0 && o.snr > 0 && o.classification == null)
    .map((o) => ({
      tokens: o.total_tokens,
      snr: o.snr,
    }));

  const outlierPoints = flaggedOutliers
    .filter((b) => b.total_tokens > 0)
    .map((b) => ({
      handle: b.handle,
      tokens: b.total_tokens,
      snr: Math.max(b.snr, 0.0001),
      classification: b.classification!,
    }));

  if (humanPoints.length === 0) return null;

  const logTxMin = Math.log10(Math.min(...humanPoints.map((p) => p.tokens)));
  const logTxMax = Math.log10(Math.max(...humanPoints.map((p) => p.tokens)));
  const logSnrMin = Math.log10(Math.min(...humanPoints.map((p) => p.snr)));
  const logSnrMax = Math.log10(Math.max(...humanPoints.map((p) => p.snr)));

  // Layout for scatter
  const width = 800;
  const scatterH = 320;
  const padL = 60;
  const padR = 24;
  const padT = 44;
  const padB = 50;
  const plotW = width - padL - padR;
  const plotH = scatterH - padT - padB;

  const xFor = (tokens: number) =>
    padL + ((Math.log10(tokens) - logTxMin) / (logTxMax - logTxMin)) * plotW;
  const yFor = (snr: number) =>
    padT +
    plotH -
    ((Math.log10(snr) - logSnrMin) / (logSnrMax - logSnrMin)) * plotH;

  const confirmedOutliers = flaggedOutliers.filter(
    (b) => b.classification === "bot",
  );

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${scatterH}`}
        width="100%"
        role="img"
        aria-label="Outlier detection scatter — SNR vs total tokens"
        style={{ background: BG, border: `1px solid ${LINE}` }}
      >
        {/* Title */}
        <text x={padL} y={26} fontSize={13} fill={FLAG} fontWeight={700}>
          OUTLIER DETECTION — SNR vs TOTAL TOKENS
        </text>
        <text
          x={width - padR}
          y={26}
          fontSize={11}
          fill={MUT}
          textAnchor="end"
        >
          {humanPoints.length} humans · {outlierPoints.length} flagged outliers
        </text>

        {/* Grid X */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const x = padL + f * plotW;
          const val = 10 ** (logTxMin + f * (logTxMax - logTxMin));
          return (
            <g key={`xg-${f}`}>
              <line
                x1={x}
                y1={padT}
                x2={x}
                y2={padT + plotH}
                stroke={LINE}
                strokeWidth={1}
                opacity={0.3}
              />
              <text
                x={x}
                y={padT + plotH + 18}
                fontSize={10}
                fill={MUT}
                textAnchor="middle"
              >
                {fmtTokens(val)}
              </text>
            </g>
          );
        })}

        {/* Grid Y */}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => {
          const y = padT + plotH - f * plotH;
          const val = 10 ** (logSnrMin + f * (logSnrMax - logSnrMin));
          return (
            <g key={`yg-${f}`}>
              <line
                x1={padL}
                y1={y}
                x2={padL + plotW}
                y2={y}
                stroke={LINE}
                strokeWidth={1}
                opacity={0.3}
              />
              <text
                x={padL - 8}
                y={y}
                fontSize={10}
                fill={MUT}
                textAnchor="end"
                dominantBaseline="middle"
              >
                {(val * 100).toFixed(2)}%
              </text>
            </g>
          );
        })}

        {/* Human points */}
        {humanPoints.map((p, i) => (
          <circle
            key={`h-${i}`}
            cx={xFor(p.tokens).toFixed(1)}
            cy={yFor(p.snr).toFixed(1)}
            r={2}
            fill={CASCADE}
            opacity={0.3}
          />
        ))}

        {/* Outlier points */}
        {outlierPoints.map((b, i) => (
          <g key={`b-${i}`}>
            <circle
              cx={xFor(b.tokens).toFixed(1)}
              cy={yFor(b.snr).toFixed(1)}
              r={5}
              fill={FLAG}
              stroke={BG}
              strokeWidth={1}
              opacity={b.classification === "bot" ? 1 : 0.6}
            />
            {b.classification === "bot" && (
              <text
                x={xFor(b.tokens) + 8}
                y={yFor(b.snr) - 4}
                fontSize={9}
                fill={FLAG}
                fontWeight={700}
              >
                {b.handle.length > 14
                  ? `${b.handle.slice(0, 13)}…`
                  : b.handle}
              </text>
            )}
          </g>
        ))}

        {/* Axis titles */}
        <text
          x={padL + plotW / 2}
          y={scatterH - 8}
          fontSize={11}
          fill={INK}
          textAnchor="middle"
        >
          Total Tokens (log scale)
        </text>
        <text
          x={16}
          y={padT + plotH / 2}
          fontSize={11}
          fill={INK}
          textAnchor="middle"
          transform={`rotate(-90 16 ${padT + plotH / 2})`}
        >
          SNR (log scale)
        </text>
      </svg>

      {/* Outlier table */}
      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse font-sans text-sm">
          <thead>
            <tr style={{ borderBottom: `2px solid ${LINE}` }}>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider" style={{ color: FLAG }}>
                Handle
              </th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider" style={{ color: MUT }}>
                Classification
              </th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider" style={{ color: MUT }}>
                Outlier Score
              </th>
              <th className="px-3 py-2 text-right text-xs font-bold uppercase tracking-wider" style={{ color: MUT }}>
                Total Tokens
              </th>
              <th className="px-3 py-2 text-left text-xs font-bold uppercase tracking-wider" style={{ color: MUT }}>
                Signals
              </th>
            </tr>
          </thead>
          <tbody>
            {confirmedOutliers.map((b) => (
              <tr
                key={b.handle}
                style={{ borderBottom: `1px solid ${LINE}` }}
              >
                <td className="px-3 py-2 font-mono font-bold" style={{ color: INK }}>
                  {b.handle}
                </td>
                <td className="px-3 py-2">
                  <span
                    className="rounded px-2 py-0.5 text-xs font-bold uppercase"
                    style={{
                      background: `${FLAG}22`,
                      color: FLAG,
                      border: `1px solid ${FLAG}55`,
                    }}
                  >
                    {b.classification}
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono" style={{ color: GOLD }}>
                  {b.bot_score}/6
                </td>
                <td className="px-3 py-2 text-right font-mono" style={{ color: INK }}>
                  {fmtTokens(b.total_tokens)}
                </td>
                <td className="px-3 py-2 text-xs" style={{ color: MUT }}>
                  {b.signals?.join(" · ") ?? "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
