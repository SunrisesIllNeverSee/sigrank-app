"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArtworkShareControls } from "./ArtworkShareControls";
import "./bone-holocard.css";

const palettes = ["aqua", "coral", "gold", "violet"] as const;
const brands = [
  ["af-stack", "SignalAF · stacked"], ["af-pixel", "SignalAF · pixel"],
  ["af-terminal", "SignalAF · terminal"], ["rank-gradient", "SigRank · gradient"],
  ["rank-coin", "SigRank · § coin"], ["rank-orbit", "SigRank · orbit"],
  ["rank-morph", "SigRank · mixed font"], ["dual", "SignalAF × SigRank"],
] as const;
type Palette = typeof palettes[number];

export interface BenchmarkMetricCell {
  id: string;
  label: string;
  value: string;
  rank: string;
}

export function BoneHolocard({ codename, name, metrics, children }: {
  codename: string; name: string; metrics: readonly BenchmarkMetricCell[]; children: ReactNode;
}) {
  const [palette, setPalette] = useState<Palette>("aqua");
  const [brand, setBrand] = useState<string>("af-stack");
  const [scale, setScale] = useState(1);
  const viewport = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setScale(Math.min(1, entry.contentRect.width / 1200)));
    observer.observe(el);
    const query = new URLSearchParams(location.search);
    const color = query.get("palette");
    if (palettes.includes(color as Palette)) setPalette(color as Palette);
    const mark = query.get("brand");
    if (brands.some(([key]) => key === mark)) setBrand(mark!);
    return () => observer.disconnect();
  }, []);
  const target = `bone-holocard-${codename}`;
  const href = `/s/${encodeURIComponent(codename)}?palette=${palette}&brand=${brand}#share-bone-holocard`;
  const isRank = brand.startsWith("rank-");
  return <section id="share-bone-holocard" className="bone-holo-studio">
    <h3>Bone × Holographic</h3>
    <div className="bone-holo-options">
      <label>Hologram color <select aria-label="Hologram color" value={palette} onChange={e => setPalette(e.target.value as Palette)}>
        {palettes.map(color => <option key={color} value={color}>{color[0].toUpperCase() + color.slice(1)}</option>)}
      </select></label>
      <label>Brand mark <select aria-label="Bone card brand mark" value={brand} onChange={e => setBrand(e.target.value)}>
        {brands.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
      </select></label>
    </div>
    <div ref={viewport} className="bone-holo-viewport" style={{ height: 627 * scale }}>
      <div id={target} className="bone-holo-card" data-palette={palette} data-brand={brand}
        role="img" aria-label={`Bone holographic share card for ${name}`} style={{ transform: `scale(${scale})` }}>
        {/* the cut-corner shape lives one level in: html-to-image drops clip-path on the captured root */}
        <div className="bone-holo-shape">
        <div className="bone-holo-paper">
          <header className="bone-holo-header">
            <div className="bone-holo-logo">
              {brand === "rank-coin" ? <span className="bone-holo-coin">§</span> : brand === "rank-orbit" ? <span className="bone-holo-orbit">⊙</span> : <span className="bone-holo-pixels" aria-hidden="true"><i/><i/><i/><i/></span>}
              <strong className={brand === "af-stack" ? "bone-holo-stack" : ""}>
                {brand === "af-stack" ? <>SIGNAL<br/><em>AF</em></> : isRank ? "SIGRANK" : brand === "dual" ? "SIGNALAF × SIGRANK" : "SIGNALAF"}
              </strong>
              <small>{brand === "af-stack" ? "AI OPERATOR INTELLIGENCE AND BENCHMARKING" : "AI OPERATOR INTELLIGENCE AND BENCHMARKING"}</small>
            </div>
            <span>RANK / BONE</span>
          </header>
          <div className="bone-holo-copy">
            <div className="bone-holo-headline">A DIFFERENT KIND<br/>OF BENCHMARK.</div>
            <p className="bone-holo-subtitle">Highlighting Users, Not Models.</p>
          </div>
          <div className="bone-holo-ledger" aria-label="18 canonical operator statistics with values and field ranks">
            {metrics.map(metric => (
              <div className="bone-holo-ledger-cell" key={metric.id} title={metric.label}>
                <span className="bone-holo-ledger-label">{metric.label}</span>
                <strong className="bone-holo-ledger-value">{metric.value}</strong>
                <span className="bone-holo-ledger-rank">RANK <b>{metric.rank}</b></span>
              </div>
            ))}
          </div>
          <footer>signalaf.com/user/{codename}</footer>
        </div>
        <div className="bone-holo-live pv2-pcard-scope">{children}</div>
        <div className="bone-holo-plaque" aria-label={`Operator ${name}`}><span>{name}</span></div>
        </div>
      </div>
    </div>
    <ArtworkShareControls target={target} title="Bone holocard" filename={`signalaf-bone-holocard-${codename}-${palette}-${brand}`}
      href={href} animated backgroundColor="transparent" pixelRatio={1} exportWidth={1200} exportHeight={627} gifPanelStart={.65}/>
  </section>;
}
