import Link from "next/link";
import { getLeaderboard } from "@/lib/board";
import { getAverageUsersColumn, getPowerUsersColumn, AA_BASELINE, type GoldColumn } from "@/lib/marketing/top-operator-column";
import { fourDegreesHighs } from "@/lib/share/four-degrees-highs";
import { ArtworkShareControls } from "./ArtworkShareControls";
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
  return <div className="four-share-wrap">
    <article id="four-degrees-share-card" className="four-share-card" aria-label="AI operator comparison share card">
      <header className="four-share-heading"><div className="four-share-brand"><span className="four-share-symbol">S</span> SignalAF <span>AI operator evaluation</span></div>
        <h1>Same AI. Different outcomes.</h1><p>How does the way you use AI compare?</p>
      </header>
      <table className="four-share-metrics"><caption>Four degrees of leverage · find where you fit</caption>
        <colgroup><col className="four-share-label-col" /><col /><col /><col className="four-share-you-col" /><col /><col /><col /></colgroup>
        <thead><tr className="four-share-groups"><th colSpan={5} /><th colSpan={2} scope="colgroup">SignalAF · metric highs</th></tr>
          <tr><th scope="col">The cascade</th><th scope="col">Average world user<span>Modeled baseline*</span></th><th scope="col">Our field<span>Typical operator · median</span></th>
            <th scope="col" className="four-share-cta-head">Ever wondered how you use AI vs. someone else?<Link href="/board/all">Find your rank ↗</Link></th>
            <th scope="col">Power users<span>Top 100 · median</span></th><th scope="col">OITL<span>Operator in the loop</span></th><th scope="col">Auto†<span>Autonomous / review</span></th></tr>
        </thead>
        <tbody>{METRICS.map(metric => <tr key={metric.key}><th scope="row">{metric.label}<span>{metric.detail}</span></th>{values.map((column, index) => <td key={index} className={index === 2 ? "four-share-question" : index >= 4 ? "four-share-high" : ""}>{index === 2 ? <span aria-label="Your score is waiting">?</span> : String(column?.[metric.key] ?? "—")}</td>)}</tr>)}</tbody>
      </table>
      <div className="four-share-bottom"><strong>Your tool is only half the story.<br /><span>Measure the operator.</span></strong><Link href="/board/all">Find your rank <span>signalaf.com</span><b aria-hidden="true">↗</b></Link></div>
      <footer className="four-share-footer"><p>*World-user reference is the AA 7:2:1 modeled baseline, not a measured worldwide average. Field & power users: medians of qualifying compounding operators, excluding outliers. OITL/Auto: per-metric highs on the claimed all-time board; highs can belong to different operators. Operating ratio uses each cohort’s Yield leader.</p><p>†Auto follows the board’s filter and includes unresolved review candidates; this does not verify autonomy. Hybrid rows can appear in both groups. — = unavailable. Values captured at render.</p><span>Source & methodology: signalaf.com/wiki/four-degrees · Token counts only. Never your prompts.</span></footer>
    </article>
    <ArtworkShareControls target="four-degrees-share-card" title="AI comparison card" filename="signalaf-ai-comparison-linkedin" href="/wiki/four-degrees" backgroundColor="#ffffff" />
  </div>;
}
