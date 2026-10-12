import type { HistoryPoint } from "@/lib/board/types";
import { datedTokenVolumes, observationSpanDays } from "@/lib/board/compare-token-longevity";
import type { DatedTokenVolume } from "@/lib/board/compare-token-longevity";

interface Props {
  historyA: HistoryPoint[];
  historyB: HistoryPoint[];
  nameA: string;
  nameB: string;
  colorA: string;
  colorB: string;
}

function formatTokens(n: number): string {
  if (n >= 1e12) return (n / 1e12).toFixed(1) + "T";
  if (n >= 1e9) return (n / 1e9).toFixed(1) + "B";
  if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
  if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
  return n.toFixed(0);
}

export function CompareTokenLongevity({
  historyA, historyB, nameA, nameB, colorA, colorB,
}: Props) {
  const seriesA = datedTokenVolumes(historyA);
  const seriesB = datedTokenVolumes(historyB);
  const timeline = [...new Set([...seriesA, ...seriesB].map(p => p.date))].sort();
  const maxTokens = Math.max(1, ...seriesA.map(p => p.tokens), ...seriesB.map(p => p.tokens));
  const W = 1120, H = 204;
  const l = 64, r = 42, top = 30, bottom = 32;
  const chartW = W - l - r, chartH = H - top - bottom;
  const xDate = (date: string) => l + chartW *
    (timeline.length > 1 ? timeline.indexOf(date) / (timeline.length - 1) : 0.5);
  // Human-readable logarithmic-scale token observations, not lifetime cumulative values.
  const logMax = Math.log10(maxTokens + 1);
  const yToken = (n: number) => top + chartH * (1 - Math.log10(n + 1) / logMax);
  const pathOf = (points: DatedTokenVolume[]) =>
    points.map((p, i) => (i === 0 ? "M" : "L") +
      xDate(p.date).toFixed(2) + "," + yToken(p.tokens).toFixed(2)).join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1];
  const spanA = observationSpanDays(seriesA);
  const spanB = observationSpanDays(seriesB);

  const trace = (points: DatedTokenVolume[], color: string, key: string) => (
    <g data-compare-series={key}>
      {points.length >= 2 ? (
        <path d={pathOf(points)} fill="none" stroke={color} strokeWidth={2.5}
          strokeLinejoin="round" strokeLinecap="round" />
      ) : null}
      {points.map(p => (
        <circle key={p.date} cx={xDate(p.date)} cy={yToken(p.tokens)}
          r={points.length === 1 ? 5 : 3.5} fill={color} stroke="var(--panel)"
          strokeWidth={1.6} aria-label={p.date + " · " + formatTokens(p.tokens) + " tokens observed"} />
      ))}
    </g>
  );

  return (
    <section className="cmp-token-longevity" aria-label="Token longevity timeline">
      <header className="cmp-longevity-head">
        <span className="cmp-longevity-title">TOKEN LONGEVITY <small>· DATED OBSERVATIONS</small></span>
        <div className="cmp-longevity-legend">
          <span style={{ color: colorA }}><i aria-hidden style={{ backgroundColor: colorA }} />{nameA}
            <em>{spanA === null ? seriesA.length + " point" : spanA + " days"}</em>
          </span>
          <span style={{ color: colorB }}><i aria-hidden style={{ backgroundColor: colorB }} />{nameB}
            <em>{spanB === null ? seriesB.length + " point" : spanB + " days"}</em>
          </span>
        </div>
      </header>
      {timeline.length > 0 ? (
        <svg viewBox={"0 0 " + W + " " + H} role="img"
          aria-label="Dated token volume for each live operator, logarithmic axis"
          preserveAspectRatio="xMidYMid meet" className="cmp-longevity-svg">
          {ticks.map(v => {
            const y = top + chartH * (1 - v);
            const quantity = Math.pow(10, v * logMax) - 1;
            return <g key={v}>
              <line x1={l} x2={W-r} y1={y} y2={y}
                stroke="rgb(var(--bg-border))" strokeDasharray="3 6" />
              <text x={l-8} y={y+4} textAnchor="end"
                fontSize={10} fill="rgb(var(--text-muted))">{formatTokens(quantity)}</text>
            </g>;
          })}
          {trace(seriesA, colorA, "a")}
          {trace(seriesB, colorB, "b")}
          {timeline.length > 1 ? (
            <>
              <text x={l} y={H-8} fontSize={11} fill="rgb(var(--text-muted))">
                {timeline[0]}</text>
              <text x={W-r} y={H-8} textAnchor="end" fontSize={11}
                fill="rgb(var(--text-muted))">{timeline[timeline.length-1]}</text>
            </>
          ) : (
            <text x={W/2} y={H-8} textAnchor="middle" fontSize={11}
              fill="rgb(var(--text-muted))">{timeline[0]}</text>
          )}
        </svg>
      ) : (
        <div className="cmp-longevity-empty">DATED TOKEN HISTORY UNAVAILABLE · No measured timeline yet.</div>
      )}
      <footer className="cmp-longevity-note">
        Per-date recorded token volume (I + O + W + R). Not a cumulative lifetime sum.
        A line requires two distinct dates; single observations remain visible as points.
      </footer>
    </section>
  );
}
