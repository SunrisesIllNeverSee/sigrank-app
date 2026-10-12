/**
 * components/live/fonts.ts — the prototype's six typefaces, loaded via
 * next/font and scoped to the live-board workspace subtree.
 *
 * proto.css expects literal family names ("Space Grotesk", "Silkscreen",
 * ...). next/font emits hashed family names, so the scoped stylesheet
 * resolves each prototype token through a --font-lbw-* variable with the
 * literal name as fallback:
 *
 *   --font-ui:   var(--font-lbw-sg,"Space Grotesk"), ...
 *   --font-disp: var(--font-lbw-silk,"Silkscreen"), ...   (per theme)
 *
 * The variable classNames are applied to the .lbw-root element, so the
 * font files only load where the workspace renders. preload:false keeps
 * all six faces off the critical path of non-board routes.
 *
 * Weight coverage matches proto.css usage (prototype's Space Grotesk 800
 * request resolves to 700 — Google doesn't ship an 800 face; the CSS
 * font-weight:800 declarations render as synthesized/700 either way).
 */
import {
  Space_Grotesk,
  JetBrains_Mono,
  Silkscreen,
  Unbounded,
  Instrument_Serif,
  Orbitron,
} from "next/font/google";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lbw-sg",
  display: "swap",
  preload: false,
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-lbw-jb",
  display: "swap",
  preload: false,
});

const silkscreen = Silkscreen({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-lbw-silk",
  display: "swap",
  preload: false,
});

const unbounded = Unbounded({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-lbw-unb",
  display: "swap",
  preload: false,
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-lbw-serif",
  display: "swap",
  preload: false,
});

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["600", "800"],
  variable: "--font-lbw-orb",
  display: "swap",
  preload: false,
});

/** Spread onto the .lbw-root element's className. */
export const lbwFontVars = [
  spaceGrotesk.variable,
  jetBrainsMono.variable,
  silkscreen.variable,
  unbounded.variable,
  instrumentSerif.variable,
  orbitron.variable,
].join(" ");
