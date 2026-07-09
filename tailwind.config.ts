import type { Config } from "tailwindcss";

// Colors resolve to CSS variables defined in app/globals.css (channel triples),
// so every utility supports Tailwind alpha modifiers AND swaps with data-theme.
// Keep token names in sync with components/sigrank/tokens.ts (which points at the
// same vars for inline-styled components).
const v = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "bg-base": v("bg-base"),
        "bg-surface": v("bg-surface"),
        "bg-elevated": v("bg-elevated"),
        "bg-hover": v("bg-hover"),
        "bg-border": v("bg-border"),
        "bg-border-subtle": v("bg-border-subtle"),

        "text-primary": v("text-primary"),
        "text-secondary": v("text-secondary"),
        "text-muted": v("text-muted"),
        "text-accent": v("accent"),
        "text-gold": v("gold"),
        "text-dim": v("text-dim"),

        "class-transmitter": v("class-transmitter"),
        "class-archplus": v("class-archplus"),
        "class-arch": v("class-arch"),
        "class-power": v("class-power"),
        "class-base": v("class-base"),
        "class-seeker": v("class-seeker"),
        "class-refiner": v("class-refiner"),
        "class-bearer": v("class-bearer"),
        "class-igniter": v("class-igniter"),

        "platform-chatgpt": v("platform-chatgpt"),
        "platform-claude": v("platform-claude"),
        "platform-pi": v("platform-pi"),
        "platform-gemini": v("platform-gemini"),

        "rank-1": v("rank-1"),
        "rank-2": v("rank-2"),
        "rank-3": v("rank-3"),
        "rank-low": v("rank-low"),

        "bar-high": v("bar-high"),
        "bar-mid": v("bar-mid"),
        "bar-low": v("bar-low"),

        gold: v("gold"),
        accent: v("accent"),
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Geist", "system-ui", "sans-serif"],
        mono: [
          "var(--font-geist-mono)",
          "Geist Mono",
          "ui-monospace",
          "monospace",
        ],
      },
      boxShadow: {
        card: "var(--shadow-card)",
      },
      keyframes: {
        // Seamless marquee: the track is rendered twice; translating by -50%
        // lands the second copy exactly where the first began.
        ticker: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        ticker: "ticker 40s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
