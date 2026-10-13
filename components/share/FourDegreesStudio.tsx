"use client";

import { useState, type ReactNode } from "react";
import { ArtworkShareControls } from "./ArtworkShareControls";

const THEMES = [
  { id: "cobalt", label: "Cobalt", background: "#ffffff" },
  { id: "midnight", label: "Midnight", background: "#101827" },
  { id: "editorial", label: "Editorial", background: "#fff6e8" },
] as const;

export function FourDegreesStudio({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<typeof THEMES[number]>(THEMES[0]);
  const [format, setFormat] = useState("linkedin");
  return <div className="four-share-wrap" data-card-theme={theme.id} data-card-format={format}>
    <div className="four-studio-options"><fieldset><legend>Color theme</legend>{THEMES.map(option => <button key={option.id} type="button" aria-pressed={theme.id === option.id} onClick={() => setTheme(option)}>{option.label}</button>)}</fieldset>
      <fieldset><legend>Post format</legend><button type="button" aria-pressed={format === "linkedin"} onClick={() => setFormat("linkedin")}>LinkedIn · square</button><button type="button" aria-pressed={format === "x"} onClick={() => setFormat("x")}>X · landscape</button></fieldset></div>
    {children}
    <ArtworkShareControls target="four-degrees-share-card" title="AI comparison card" filename={`signalaf-comparison-${format}-${theme.id}`} href="/wiki/four-degrees" backgroundColor={theme.background} pixelRatio={1} />
    <div className="four-studio-options"><a href="https://www.canva.com/d/HDdsEbXADRKAAfA" target="_blank" rel="noopener noreferrer">Edit LinkedIn themes in Canva ↗</a><a href="https://www.canva.com/d/iKe9GRSsLIu7e5q" target="_blank" rel="noopener noreferrer">Edit X themes in Canva ↗</a></div>
  </div>;
}
