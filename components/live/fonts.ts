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
import localFont from "next/font/local";

const spaceGrotesk = localFont({
  src: [{path: "../../public/fonts/space_grotesk-400-normal.woff2", weight: "400", style: "normal"}, {path: "../../public/fonts/space_grotesk-500-normal.woff2", weight: "500", style: "normal"}, {path: "../../public/fonts/space_grotesk-600-normal.woff2", weight: "600", style: "normal"}, {path: "../../public/fonts/space_grotesk-700-normal.woff2", weight: "700", style: "normal"}],
  variable: "--font-lbw-sg",
  display: "swap",
  preload: false,
});

const jetBrainsMono = localFont({
  src: [{path: "../../public/fonts/jetbrains_mono-400-normal.woff2", weight: "400", style: "normal"}, {path: "../../public/fonts/jetbrains_mono-600-normal.woff2", weight: "600", style: "normal"}, {path: "../../public/fonts/jetbrains_mono-700-normal.woff2", weight: "700", style: "normal"}],
  variable: "--font-lbw-jb",
  display: "swap",
  preload: false,
});

const silkscreen = localFont({
  src: [{path: "../../public/fonts/silkscreen-400-normal.woff2", weight: "400", style: "normal"}, {path: "../../public/fonts/silkscreen-700-normal.woff2", weight: "700", style: "normal"}],
  variable: "--font-lbw-silk",
  display: "swap",
  preload: false,
});

const unbounded = localFont({
  src: [{path: "../../public/fonts/unbounded-500-normal.woff2", weight: "500", style: "normal"}, {path: "../../public/fonts/unbounded-700-normal.woff2", weight: "700", style: "normal"}, {path: "../../public/fonts/unbounded-900-normal.woff2", weight: "900", style: "normal"}],
  variable: "--font-lbw-unb",
  display: "swap",
  preload: false,
});

const instrumentSerif = localFont({
  src: [{path: "../../public/fonts/instrument_serif-400-italic.woff2", weight: "400", style: "italic"}, {path: "../../public/fonts/instrument_serif-400-normal.woff2", weight: "400", style: "normal"}],
  variable: "--font-lbw-serif",
  display: "swap",
  preload: false,
});

const orbitron = localFont({
  src: [{path: "../../public/fonts/orbitron-600-normal.woff2", weight: "600", style: "normal"}, {path: "../../public/fonts/orbitron-800-normal.woff2", weight: "800", style: "normal"}],
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
