import { TerminalBlockText } from "@/components/home/TerminalBlockText";
import { getAverageUsersColumn, getPowerUsersColumn, getTopOperatorColumn, AA_BASELINE, type GoldColumn } from "@/lib/marketing/top-operator-column";
import { ArtworkShareControls } from "./ArtworkShareControls";
import "./four-degrees-card.css";

const METRICS: { key: keyof GoldColumn; label: string }[] = [
  { key: "yield_", label: "Υ YIELD" },
  { key: "snr", label: "SNR" },
  { key: "velocity", label: "VELOCITY · O/I" },
  { key: "leverage", label: "LEVERAGE · CR/I" },
  { key: "dev10x", label: "10xDEV · log₁₀" },
  { key: "efficiency", label: "EFFICIENCY · vs AA" },
  { key: "opRatio", label: "CACHE : INPUT : OUTPUT" },
];

export async function FourDegreesShareCard() {
  const [field, power, top] = await Promise.all([getAverageUsersColumn(), getPowerUsersColumn(), getTopOperatorColumn()]);
  const columns = [
    { label: "AA BASELINE", note: "Modeled · 7:2:1 reference", value: AA_BASELINE, color: "#9ba7a0" },
    { label: "THE FIELD", note: "Operator center of mass · median", value: field, color: "#5dded0" },
    { label: "POWER USERS", note: "Top 100 by Yield · median", value: power, color: "#b598ff" },
    { label: "TOP EVAL", note: "Single qualifying top operator", value: top, color: "#efc44c" },
  ];
  return <div className="four-share-wrap">
    <article id="four-degrees-share-card" className="four-share-card" aria-label="Four Degrees of Leverage share card">
      <div className="four-share-mast"><span><i /> SIGNALAF × SIGRANK</span><span>OPERATOR EVALUATION / 04 DEGREES</span></div>
      <header className="four-share-heading">
        <TerminalBlockText text="FOUR DEGREES" />
        <h1>OF LEVERAGE</h1>
        <p>The baseline builds. The field caches. A few compound.</p>
      </header>
      <div className="four-share-degrees">
        {columns.map((column, index) => <section key={column.label} style={{ "--degree-ink": column.color } as React.CSSProperties}>
          <div className="four-share-degree-top"><span>0{index + 1}</span><svg viewBox="0 0 36 28" aria-hidden="true">{Array.from({ length: 4 }, (_, step) => <rect key={step} x={step * 9} y={24 - step * 6} width="6" height={4 + step * 6} fill="currentColor" opacity={step <= index ? 1 : 0.12} />)}</svg></div>
          <h2>{column.label}</h2><p>{column.note}</p>
          <strong>{column.value?.leverage ?? "—"}</strong><span className="four-share-unit">CACHE LEVERAGE</span>
        </section>)}
      </div>
      <table className="four-share-metrics"><caption>THE CASCADE · FOUR REFERENCE POINTS</caption>
        <thead><tr><th scope="col">METRIC</th>{columns.map(column => <th key={column.label} scope="col">{column.label}</th>)}</tr></thead>
        <tbody>{METRICS.map(metric => <tr key={metric.key}><th scope="row">{metric.label}</th>{columns.map(column => <td key={column.label} style={{ color: column.color }}>{String(column.value?.[metric.key] ?? "—")}</td>)}</tr>)}</tbody>
      </table>
      <footer className="four-share-footer"><div><strong>TOKEN COUNTS ONLY. NEVER YOUR PROMPTS.</strong><p>All-time board · qualifying compounding operators · outliers excluded.<br />AA is modeled; field and power values are medians; top eval is one operator.<br />Unavailable measured columns display —. Values reflect this render.</p></div><div><strong>MO§ES™</strong><span>signalaf.com/wiki/four-degrees</span></div></footer>
    </article>
    <ArtworkShareControls target="four-degrees-share-card" title="Four Degrees card" filename="signalaf-four-degrees-card" href="/wiki/four-degrees" />
  </div>;
}
