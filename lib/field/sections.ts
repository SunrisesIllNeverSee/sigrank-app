/**
 * lib/field/sections.ts — the field analysis section registry.
 *
 * Each section is a sub-page under /field/<slug>. The hub page at /field
 * renders blurbs + hero previews from this config; the [slug] route
 * renders the full section content.
 */

export type FieldSection = {
  slug: string;
  title: string;
  blurb: string;
  chart?: string;
  order: number;
};

export const FIELD_SECTIONS: FieldSection[] = [
  {
    slug: "volume-vs-yield",
    title: "Volume ≠ Yield",
    blurb:
      "The operator with the most tokens has a yield of 0. The operator with the highest yield ranks #697 by volume. Volume is noise. Yield is signal.",
    chart: "/field-charts/volume-vs-yield.svg",
    order: 1,
  },
  {
    slug: "token-cascade",
    title: "The Token Cascade",
    blurb:
      "The median operator puts in 238M tokens of fresh input and reads 4.77B from cache. That last number is the harvest: 20.5× the seed. This is leverage.",
    order: 2,
  },
  {
    slug: "snr-separation",
    title: "The SNR Separation",
    blurb:
      "Signal-to-Noise Ratio measures what fraction of your interaction produced output versus prompt overhead. One number separates signal producers from token burners.",
    chart: "/field-charts/snr-distribution.svg",
    order: 3,
  },
  {
    slug: "leverage-velocity",
    title: "Leverage × Velocity",
    blurb:
      "Leverage (cache_read / input) × Velocity (output / input) = the yield rectangle. The top-right quadrant is the architectural elite.",
    chart: "/field-charts/leverage-vs-velocity.svg",
    order: 4,
  },
  {
    slug: "platform-dominance",
    title: "Platform Dominance",
    blurb:
      "98.5% of the highest-yield operators use Claude as their primary platform. The platform you choose shapes the ceiling of your yield architecture.",
    chart: "/field-charts/platform-yield-quartile.svg",
    order: 5,
  },
  {
    slug: "cascade-composition",
    title: "Cascade Composition",
    blurb:
      "Four notable operators, four radically different cascade architectures. The stacked bars show how each composes their token spend across the four pillars.",
    chart: "/field-charts/cascade-composition.svg",
    order: 6,
  },
  {
    slug: "yield-quartiles",
    title: "Yield Quartile Box Plots",
    blurb:
      "Leverage jumps from ~5× in Q1 to ~200× in Q4. SNR stays flat. The yield gap is a leverage gap, not a talent gap.",
    chart: "/field-charts/yield-quartile-boxplots.svg",
    order: 7,
  },
  {
    slug: "eighty-percent",
    title: "Where 80% of Operators Live",
    blurb:
      "The yield distribution is heavily right-skewed. 80% of human operators fall within a narrow band. The long tail is where the AMPLIFIERS live.",
    order: 8,
  },
  {
    slug: "where-are-you",
    title: "Where Are You?",
    blurb:
      "The percentile ladder shows the yield thresholds for each tier. The median is where most operators land. The top 1% is where cache architecture becomes an art form.",
    order: 9,
  },
  {
    slug: "ghost-ranks",
    title: "Ghost Ranks: The Hidden Operators",
    blurb:
      "Ghost-rank operators are invisible on volume-based leaderboards but dominate yield-based rankings. They have skill, not just spend.",
    chart: "/field-charts/ghost-rank-quadrant.svg",
    order: 10,
  },
  {
    slug: "build-archetypes",
    title: "Build Archetypes",
    blurb:
      "The field separates into 10 build archetypes across four families: Convergence, Generation, Reuse Depth, and Active Construction.",
    order: 11,
  },
  {
    slug: "outlier-detection",
    title: "Outlier Detection",
    blurb:
      "A 6-signal outlier-likelihood score identifies operators with inhuman throughput, zero cache usage, single-model fixation, and zero sessions.",
    chart: "/field-charts/outlier-detection.svg",
    order: 12,
  },
];

export const FIELD_SECTION_MAP = new Map(
  FIELD_SECTIONS.map((s) => [s.slug, s]),
);
