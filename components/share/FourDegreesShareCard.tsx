import Link from "next/link";
import { getLeaderboard } from "@/lib/board";
import { getAverageUsersColumn, getPowerUsersColumn, AA_BASELINE, type GoldColumn } from "@/lib/marketing/top-operator-column";
import { fourDegreesHighs } from "@/lib/share/four-degrees-highs";
import { FourDegreesStudio } from "./FourDegreesStudio";
import "./four-degrees-card.css";

const METRICS: { key: keyof GoldColumn; label: string; detail: string }[] = [
  { key: "yield_", label: "Yield", detail: "Υ · cascade output" },
  { key: "snr", label: "Signal-to-noise", detail: "SNR" },
  { key: "velocity", label: "Velocity", detail: "Output / Input" },
  { key: "leverage", label: "Leverage", detail: "Cache-read / Input" },
  { key: "dev10x", label: "10xDEV", detail: "log₁₀ Leverage" },
  { key: "efficiency", label: "Efficiency", detail: "Relative to AA" },
  { key: "opRatio", label: "Operating ratio", detail: "Cache : Input : Output" },
];

export async function FourDegreesShareCard() {
  const [field, power, board] = await Promise.all([
    getAverageUsersColumn(), getPowerUsersColumn(),
    getLeaderboard({ window: "all_time", windowFilter: true, operatorTotal: true, claimedOnly: true, mode: "all" }),
  ]);
  const oitl = fourDegreesHighs(board, "hitl");
  const auto = fourDegreesHighs(board, "agentic");
  const values = [AA_BASELINE, field, null, power, oitl, auto];
  return <FourDegreesStudio>
    <article id="four-degrees-share-card" className="four-share-card" aria-label="AI operator comparison share card">
      <header className="four-share-heading"><div className="four-share-brand"><span className="four-share-prism-mark" aria-hidden="true"><i /><i /><i /><i /></span> SIGNALAF <span>OPERATOR INTELLIGENCE / FOUR DEGREES</span></div>
        <h1>Same tools. <span>Different leverage.</span></h1>
      </header>
      <table className="four-share-metrics"><caption>Four degrees of leverage · find where you fit</caption>
        <colgroup><col className="four-share-label-col" /><col /><col /><col className="four-share-you-col" /><col /><col /><col /></colgroup>
        <thead><tr className="four-share-groups"><th colSpan={5} /><th colSpan={2} scope="colgroup">SignalAF · metric highs</th></tr>
          <tr><th scope="col">The cascade</th><th scope="col">World user*<span>Modeled baseline</span></th><th scope="col">Our field<span>Typical operator · median</span></th>
            <th scope="col" className="four-share-cta-head">Your AI workflow has a signature.<Link href="/board/all">See your signal ↗</Link></th>
            <th scope="col">Power users<span>Top 100 · median</span></th><th scope="col">OITL<span>Operator in the loop</span></th><th scope="col">Auto†<span>Autonomous / review</span></th></tr>
        </thead>
        <tbody>{METRICS.map(metric => <tr key={metric.key} className={metric.key === "opRatio" ? "four-share-ratio-row" : ""}><th scope="row">{metric.label}<span>{metric.detail}</span></th>{values.map((column, index) => <td key={index} className={index === 2 ? "four-share-question" : index >= 4 ? "four-share-high" : ""}>{index === 2 ? <span aria-label="Your score is waiting">?</span> : String(column?.[metric.key] ?? "—")}</td>)}</tr>)}</tbody>
      </table>
      <footer className="four-share-footer"><p>*World: AA modeled reference, not a measured global average. Field & power: qualifying medians, outliers excluded. OITL/Auto: per-metric highs; operating ratio uses each Yield leader.</p><p>†Auto includes unresolved review candidates, not verified autonomy. Hybrid overlaps both groups. — = unavailable. Values captured at render.</p><span>signalaf.com/wiki/four-degrees · Token counts only. Never your prompts.</span></footer>
    </article>
  </FourDegreesStudio>;
}
