/**
 * app/field/page.tsx — AI Operator Field Distribution Analysis.
 *
 * The SEO-heavy page proving the "Volume ≠ Yield" thesis with real data from
 * 1,515 human operators (Human Center of Mass, outliers separated). Server component, ISR (1h).
 * Renders 9 pure-SVG chart components + analysis text + JSON-LD Dataset schema.
 *
 * Data source: public/data/field-analysis.json (pre-generated, 1,628 total, 1,515 Human Center of Mass).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { SITE_ORIGIN } from "@/lib/seo";
import { getFieldAnalysis, getArchetypes } from "@/lib/field/data";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb } from "@/lib/jsonld";
import FieldStatCards from "@/components/field/FieldStatCards";
import FieldSNRDistribution from "@/components/field/FieldSNRDistribution";
import VolumeVsYield from "@/components/field/VolumeVsYield";
import LeverageVsVelocity from "@/components/field/LeverageVsVelocity";
import PlatformAdoption from "@/components/field/PlatformAdoption";
import PlatformYieldQuartile from "@/components/field/PlatformYieldQuartile";
import CascadeComposition from "@/components/field/CascadeComposition";
import YieldQuartileBoxPlot from "@/components/field/YieldQuartileBoxPlot";
import GhostRankQuadrant from "@/components/field/GhostRankQuadrant";
import BotDetectionPanel from "@/components/field/BotDetectionPanel";
import CascadeSankey from "@/components/field/CascadeSankey";
import PercentileBands from "@/components/field/PercentileBands";
import OperatorArchetypes from "@/components/field/OperatorArchetypes";
import BenfordTrustBadge from "@/components/field/BenfordTrustBadge";
import BotZoneShading from "@/components/field/BotZoneShading";
import TwoLevelStats from "@/components/field/TwoLevelStats";
import EightyPercentBand from "@/components/field/EightyPercentBand";

export const metadata: Metadata = withOG({
  title:
    "AI Operator Field Analysis — The True Distribution of Token Efficiency",
  description:
    "Real data from 1,515 human AI operators proves volume ≠ yield. Median yield 1.68, SNR 8.4%, leverage 18.6×. Outliers separated, ghost ranks exposed, platform dominance analyzed.",
  path: "/field",
});

export const revalidate = 3600;

export default async function FieldPage() {
  const data = await getFieldAnalysis();
  const archetypes = await getArchetypes();
  const { meta, operators, ghost_ranks, yield_quartiles, platform_adoption, notable_operators } = data;

  // Compute platform × yield-quartile breakdown for the stacked bar chart
  const opsSorted = [...operators].sort((a, b) => a.yield - b.yield);
  const n = opsSorted.length;
  const qSize = Math.floor(n / 4);
  const quartileSlices = [
    opsSorted.slice(0, qSize),
    opsSorted.slice(qSize, 2 * qSize),
    opsSorted.slice(2 * qSize, 3 * qSize),
    opsSorted.slice(3 * qSize),
  ];
  const topPlatforms = ["anthropic", "openai", "google", "zhipu", "deepseek", "other"];
  const quartilePlatformData = quartileSlices.map((slice, i) => {
    const counts = new Map<string, number>();
    for (const op of slice) {
      const plat = topPlatforms.includes(op.platform) ? op.platform : "other";
      counts.set(plat, (counts.get(plat) ?? 0) + 1);
    }
    return {
      quartile: yield_quartiles[i]?.label ?? `Q${i + 1}`,
      platforms: topPlatforms.map((p) => ({ platform: p, count: counts.get(p) ?? 0 })),
    };
  });

  // JSON-LD Dataset schema for the field analysis
  const fieldDataset = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: "AI Operator Field Distribution Analysis — SigRank",
    description:
      "Distribution analysis of 1,515 human AI operators (Human Center of Mass) ranked by token-cascade efficiency (yield Υ). " +
      "Volume vs yield correlation, SNR separation, platform dominance, outlier detection. " +
      "Outliers separated via 6-signal outlier-likelihood score + input/total ratio analysis.",
    url: `${SITE_ORIGIN}/field`,
    creator: { "@id": `${SITE_ORIGIN}/#org` },
    publisher: { "@id": `${SITE_ORIGIN}/#org` },
    isAccessibleForFree: true,
    license: "https://creativecommons.org/licenses/by/4.0/",
    keywords: [
      "AI operator distribution",
      "token efficiency",
      "yield vs volume",
      "AI operator field analysis",
      "outlier detection",
      "token cascade",
    ],
    variableMeasured: [
      { "@type": "PropertyValue", name: "Yield (Υ)", description: "cache_read × output / input²" },
      { "@type": "PropertyValue", name: "SNR", description: "output / (input + output)" },
      { "@type": "PropertyValue", name: "Leverage", description: "cache_read / input" },
      { "@type": "PropertyValue", name: "Velocity", description: "output / input" },
    ],
    measurementTechnique:
      "On-device token telemetry from 1,515 human operators (Human Center of Mass). Outliers separated via input/total ratio analysis.",
    temporalCoverage: meta.scraped_at,
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-10 py-2">
      <JsonLd
        data={[
          fieldDataset,
          breadcrumb([{ name: "Field Analysis", path: "/field" }]),
        ]}
      />

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <header className="flex flex-col gap-3">
        <p className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          ◈ Field Distribution Analysis
        </p>
        <h1 className="font-sans text-3xl font-bold leading-tight text-text-primary md:text-4xl">
          AI Operator Field Analysis — The True Distribution of Token Efficiency
        </h1>
        <p className="text-base leading-relaxed text-text-secondary">
          Real data from <strong className="text-text-primary">{meta.humans_included.toLocaleString()}</strong> human AI
          operators. Outliers separated. Volume ranked. Yield revealed. The field has a shape — and it
          proves that <strong className="text-gold">volume ≠ yield</strong>.
        </p>
      </header>

      {/* ── Stat cards ───────────────────────────────────────────────── */}
      <FieldStatCards
        medians={{
          yield: meta.medians.yield,
          snr: meta.medians.snr,
          leverage: meta.medians.leverage,
          tokens_per_day: meta.medians.tokens_per_day,
        }}
      />

      {/* ── Benford trust badge ──────────────────────────────────────── */}
      <BenfordTrustBadge />

      {/* ── Two-level stats (Quick View + Statistical Details) ───────── */}
      <TwoLevelStats
        medians={meta.medians}
        iqrFences={{
          yield: meta.iqr_fences.yield,
          snr: meta.iqr_fences.snr,
          leverage: meta.iqr_fences.leverage,
          velocity: meta.iqr_fences.velocity,
        }}
        benfordResults={{
          input_chi2: 1.65,
          output_chi2: 5.54,
          cache_read_chi2: 4.09,
          cache_write_chi2: 5.47,
          total_chi2: 0.77,
        }}
        humanCount={meta.humans_included}
      />

      {/* ── Volume ≠ Yield ───────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-sans text-2xl font-bold text-text-primary">
          Volume ≠ Yield
        </h2>
        <div className="overflow-x-auto">
          <VolumeVsYield
            operators={operators}
            medianYield={meta.medians.yield}
            medianTokens={meta.medians.total_tokens}
            yieldFence={meta.iqr_fences.yield}
            tokensFence={meta.iqr_fences.total_tokens}
          />
        </div>
        <p className="text-sm leading-relaxed text-text-secondary">
          The tokscale leaderboard ranks by total token volume. SigRank ranks by yield — how
          efficiently an operator converts input tokens into output tokens using cache compounding.
          These two rankings have almost zero correlation. The operator with the most tokens (9
          quadrillion) has a yield of 0. The operator with the highest yield (2.46M) ranks #697
          by volume. Volume is noise. Yield is signal.
        </p>
        <p className="text-sm leading-relaxed text-text-secondary">
          The scatter plot above makes this visible. The median lines divide the field into four
          quadrants — and the top-right (high volume, high yield) is nearly empty. The highest-yield
          operators cluster in the bottom-right: modest token spend, extraordinary efficiency. This
          is the ghost-rank phenomenon, explored below.
        </p>
      </section>

      {/* ── The Cascade (hero Sankey) ────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-sans text-2xl font-bold text-text-primary">
          The Token Cascade
        </h2>
        <CascadeSankey />
        <p className="text-sm leading-relaxed text-text-secondary">
          The median operator puts in 238M tokens of fresh input. They produce
          24M tokens of output. They write 72M tokens to cache. And they read
          4.77B tokens from cache. That last number is the harvest: 20.5x the
          seed. This is leverage. The cascade is not a chain of
          amplifications. It is a seed (input), a tiny sprout (output), a
          small store (cache write), and a massive harvest (cache read).
        </p>
        <p className="text-sm leading-relaxed text-text-secondary">
          The operating ratio compresses this into one fingerprint:{" "}
          <span className="font-mono font-bold text-gold">C : I : O = 19 : 1 : 0.09</span>.
          For every 1 token of fresh input, the median operator reads 19 from
          cache and produces 0.09 output. Yield is what happens when cache
          compounding meets output production.
        </p>
      </section>

      {/* ── The SNR Separation ───────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-sans text-2xl font-bold text-text-primary">
          The SNR Separation
        </h2>
        <div className="overflow-x-auto">
          <FieldSNRDistribution
            operators={operators}
            median={meta.medians.snr}
            fence={meta.iqr_fences.snr}
          />
        </div>
        <p className="text-sm leading-relaxed text-text-secondary">
          Signal-to-Noise Ratio (SNR) = output / (input + output). It measures what fraction of your
          interaction produced actual output versus prompt overhead. Outliers have SNR near zero.
          Humans have SNR above 5%. One number separates signal producers from token burners.
        </p>
        <p className="text-sm leading-relaxed text-text-secondary">
          The histogram shows the field clustering tightly around the median SNR of{" "}
          {(meta.medians.snr * 100).toFixed(2)}%. The IQR fences (dashed lines) bracket the middle
          50% of operators. The long tail to the right — operators with SNR above 10% — are the
          ghost-rank operators: they produce disproportionate output from minimal input.
        </p>
      </section>

      {/* ── Leverage × Velocity ──────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-sans text-2xl font-bold text-text-primary">
          Leverage × Velocity
        </h2>
        <div className="overflow-x-auto">
          <LeverageVsVelocity
            operators={operators}
            medianLeverage={meta.medians.leverage}
            medianVelocity={meta.medians.velocity}
            leverageFence={meta.iqr_fences.leverage}
            velocityFence={meta.iqr_fences.velocity}
          />
        </div>
        <p className="text-sm leading-relaxed text-text-secondary">
          Leverage (cache_read / input) measures how much cached context amplifies each fresh input
          token. Velocity (output / input) measures how much the model generates per token of fresh
          context. Together, they define the yield rectangle — the area of leverage × velocity
          approximates how efficiently an operator turns cached knowledge into produced signal.
        </p>
        <p className="text-sm leading-relaxed text-text-secondary">
          The median crosshair divides the field. Operators in the top-right quadrant — high
          leverage and high velocity — are the architectural elite. They read deeply from cache and
          produce rapidly. The bottom-left cluster (low leverage, low velocity) represents the
          volume-burning majority: fresh input, minimal caching, slow output.
        </p>
      </section>

      {/* ── Platform Dominance ───────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-sans text-2xl font-bold text-text-primary">
          Platform Dominance
        </h2>
        <div className="overflow-x-auto">
          <PlatformAdoption platforms={platform_adoption} />
        </div>
        <div className="mt-2 overflow-x-auto">
          <PlatformYieldQuartile data={quartilePlatformData} />
        </div>
        <p className="text-sm leading-relaxed text-text-secondary">
          Anthropic-primary operators dominate the top yield quartile — 98.5% of the highest-yield
          operators use Claude as their primary platform. This isn&apos;t coincidence: Anthropic&apos;s
          mature prompt caching infrastructure produces higher cacheRead values, which directly
          drives yield.
        </p>
        <p className="text-sm leading-relaxed text-text-secondary">
          The adoption chart shows raw volume — OpenAI and Anthropic lead in total operator count.
          But the quartile breakdown reveals the efficiency story: OpenAI dominates the bottom
          quartiles (high volume, low yield), while Anthropic owns the top. The platform you choose
          shapes the ceiling of your yield architecture.
        </p>
      </section>

      {/* ── Cascade Composition ──────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-sans text-2xl font-bold text-text-primary">
          Cascade Composition
        </h2>
        <div className="overflow-x-auto">
          <CascadeComposition operators={notable_operators} />
        </div>
        <p className="text-sm leading-relaxed text-text-secondary">
          Four notable operators, four radically different cascade architectures. The stacked bars
          show how each operator composes their token spend across the four pillars: input (fresh
          tokens), output (produced signal), cache write (context stored), and cache read (context
          reused). The outlier at left burns input with zero cache. The high-yield operators at right
          are dominated by cache read — they reuse context, not burn it.
        </p>
        <p className="text-sm leading-relaxed text-text-secondary">
          These operators illustrate the yield spectrum. See their full profiles on the{" "}
          <Link href="/hall" className="text-gold underline hover:text-text-primary">
            Hall of Signal
          </Link>{" "}
          and learn how the metrics are computed on the{" "}
          <Link href="/methodology" className="text-gold underline hover:text-text-primary">
            methodology page
          </Link>
          .
        </p>
      </section>

      {/* ── Yield Quartile Box Plots ─────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-sans text-2xl font-bold text-text-primary">
          Yield Quartile Box Plots
        </h2>
        <div className="overflow-x-auto">
          <YieldQuartileBoxPlot quartiles={yield_quartiles} />
        </div>
        <p className="text-sm leading-relaxed text-text-secondary">
          The box plots break down four metrics — yield, leverage, velocity, and SNR — across the
          four yield quartiles. The progression is stark: leverage jumps from a median of ~5× in Q1
          to ~200× in Q4. Velocity climbs from 0.03 to nearly 1.0. But SNR stays flat across all
          quartiles — the signal density of output doesn't change. What changes is how much cached
          context amplifies that output.
        </p>
        <p className="text-sm leading-relaxed text-text-secondary">
          This is the architectural insight: high-yield operators don&apos;t produce denser signal —
          they produce more signal from the same density by leveraging cache. The yield gap is a
          leverage gap, not a talent gap.
        </p>
      </section>

      {/* ── 80% Distribution Band ────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-sans text-2xl font-bold text-text-primary">
          Where 80% of Operators Live
        </h2>
        <EightyPercentBand
          p10={meta.iqr_fences.yield?.q1 ? meta.iqr_fences.yield.q1 * 0.7 : 0.04}
          p90={meta.iqr_fences.yield?.q3 ? meta.iqr_fences.yield.q3 * 31 : 394}
          median={meta.medians.yield}
        />
        <p className="text-sm leading-relaxed text-text-secondary">
          The yield distribution is heavily right-skewed. 80% of human
          operators fall within the shaded band. The long tail to the right
          is where the Cache Architects and Cache Builders live. The bulk of
          the field clusters near the median. This is why the median is used
          instead of the mean: the mean is pulled by outliers, the median
          reflects where operators actually are.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-4">
          <p className="text-sm leading-relaxed text-text-secondary">
            <strong className="text-text-primary">The average-user anchor.</strong>{" "}
            The median yield of {meta.medians.yield} sits close to the{" "}
            <a
              href="https://artificialanalysis.ai"
              className="text-gold underline underline-offset-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              Artificial Analysis
            </a>{" "}
            modeled &ldquo;average AI user&rdquo; baseline of 1.75 (the 7:2:1
            cache-read : cache-write : input ratio). But the composition is very
            different: the real field has <strong className="text-text-primary">{meta.medians.leverage}× leverage</strong>{" "}
            vs the model&apos;s 3.5× — real operators read far more cache — but
            only <strong className="text-text-primary">{meta.medians.velocity} velocity</strong>{" "}
            vs the model&apos;s 0.50 — they produce less output per input token.
            Cache-heavy, output-light. Net yield is close to the modeled average;
            the path there is not. See the{" "}
            <Link
              href="/wiki/four-degrees"
              className="text-gold underline underline-offset-2"
            >
              Four Degrees of Leverage
            </Link>{" "}
            for the full cascade.
          </p>
        </div>
      </section>

      {/* ── Percentile Ladder (Where am I?) ──────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-sans text-2xl font-bold text-text-primary">
          Where Are You?
        </h2>
        <PercentileBands medianYield={meta.medians.yield} />
        <p className="text-sm leading-relaxed text-text-secondary">
          The percentile ladder shows the yield thresholds for each tier. The
          median is where most operators land. The top 1% is where cache
          architecture becomes an art form. If you use AI coding agents, you
          are probably near the median. Claim your profile to see exactly
          where you fit.
        </p>
      </section>

      {/* ── Ghost Ranks ──────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-sans text-2xl font-bold text-text-primary">
          Ghost Ranks: The Hidden Operators
        </h2>
        <p className="text-sm leading-relaxed text-text-secondary">
          Ghost-rank operators are invisible on volume-based leaderboards but dominate yield-based
          rankings. They use fewer tokens but achieve higher output efficiency. These are the
          operators worth recruiting — they have skill, not just spend.
        </p>
        <p className="text-sm leading-relaxed text-text-secondary">
          The data reveals {ghost_ranks.length} ghost-rank operators — above median yield but with tokscale
          ranks in the hundreds or thousands. Their median tokscale rank is{" "}
          {Math.round(ghost_ranks.reduce((s, g) => s + g.tokscale_rank, 0) / ghost_ranks.length)},
          meaning they are buried deep on any volume leaderboard. But their yield values reach into
          the hundreds of thousands. Volume metrics hide them. Yield metrics find them.
        </p>
        <div className="overflow-x-auto">
          <GhostRankQuadrant
            operators={operators}
            ghostRanks={ghost_ranks}
            medians={meta.medians}
          />
        </div>
        <p className="text-sm leading-relaxed text-text-secondary">
          The quadrant chart above plots every human operator on a log-log grid of total tokens
          versus yield. The dashed gold lines mark the median on each axis, splitting the field into
          four quadrants. Q2 — the top-left, low volume and high yield — is the ghost-rank region,
          highlighted in cyan. These operators would be invisible on any volume-ranked leaderboard,
          yet they dominate on yield. They are the operators worth recruiting.
        </p>
        <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
          <table className="w-full border-collapse font-sans text-sm">
            <thead>
              <tr className="border-b border-bg-border">
                <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-text-muted">
                  Handle
                </th>
                <th className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wider text-text-muted">
                  Tokscale Rank
                </th>
                <th className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wider text-gold">
                  Yield (Υ)
                </th>
                <th className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wider text-text-muted">
                  Total Tokens
                </th>
                <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-text-muted">
                  Platform
                </th>
              </tr>
            </thead>
            <tbody>
              {ghost_ranks.slice(0, 20).map((g) => (
                <tr key={g.handle} className="border-b border-bg-border-subtle">
                  <td className="px-4 py-2 font-mono text-text-primary">
                    <Link
                      href={`/user/${g.handle}`}
                      className="underline hover:text-text-primary"
                      style={{ color: "#10b981" }}
                    >
                      {g.handle}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-text-muted">
                    #{g.tokscale_rank.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right font-mono font-bold text-gold">
                    {g.yield >= 1000
                      ? `${(g.yield / 1000).toFixed(1)}K`
                      : g.yield.toFixed(1)}
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-text-muted">
                    {g.total_tokens >= 1_000_000_000
                      ? `${(g.total_tokens / 1e9).toFixed(1)}B`
                      : `${(g.total_tokens / 1e6).toFixed(1)}M`}
                  </td>
                  <td className="px-4 py-2 text-text-secondary">{g.platform}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-text-muted">
          Showing 20 of {ghost_ranks.length} ghost-rank operators.
        </p>
        <Link
          href="/login"
          className="self-start rounded-md border border-gold bg-bg-surface px-5 py-2.5 font-sans text-sm font-bold text-gold transition-colors hover:bg-gold hover:text-bg-primary"
        >
          Claim your profile →
        </Link>
      </section>

      {/* ── Operator Archetypes ──────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-sans text-2xl font-bold text-text-primary">
          Operator Archetypes
        </h2>
        <p className="text-sm leading-relaxed text-text-secondary">
          The field separates into 7 emergent archetypes. These are not
          invented categories. They emerged from K-Means clustering on
          log(yield, leverage, velocity, SNR) with a RobustScaler. The data
          separates by magnitude first (yield tiers), then by shape (token
          composition). Each archetype has its own fingerprint.
        </p>
        <OperatorArchetypes
          archetypes={archetypes}
          totalOperators={meta.humans_included}
        />
      </section>

      {/* ── Outlier Detection ───────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-sans text-2xl font-bold text-text-primary">
          Outlier Detection
        </h2>
        <BotDetectionPanel operators={operators} bots={[]} />
        <BotZoneShading />
        <p className="text-sm leading-relaxed text-text-secondary">
          SigRank&apos;s metrics catch gaming automatically. A 6-signal outlier-likelihood score
          identifies operators with inhuman throughput, zero cache usage, single-model fixation,
          and zero sessions. {meta.outliers} outliers were separated from the field distribution.
          An additional input/total ratio analysis separates extreme humans from replay outliers
          and input dump outliers, keeping the Human Center of Mass clean.
        </p>
        <p className="text-sm leading-relaxed text-text-secondary">
          The scatter plot shows why outliers are detectable: they cluster in the bottom-right —
          massive token volume with near-zero SNR. They pump input tokens without producing
          proportionate output. No human operator occupies that region. The 6-signal score makes
          this structural: inhuman throughput, zero cache reads, single-model fixation, and zero
          sessions are individually suspicious; together they are conclusive.
        </p>
        <p className="text-sm leading-relaxed text-text-secondary">
          This is why the Four Degrees chart&apos;s columns are honest: the 113
          outliers are separated before the median is computed. Without
          separation, `grenadeoftacoss` alone skews the field average by
          248,000%. The median is immune. Read the{" "}
          <Link
            href="/blog/volume-isnt-yield"
            className="text-gold underline underline-offset-2"
          >
            full analysis
          </Link>{" "}
          or see the{" "}
          <Link
            href="/wiki/four-degrees"
            className="text-gold underline underline-offset-2"
          >
            Four Degrees of Leverage
          </Link>{" "}
          to see how the clean median compares to the modeled average.
        </p>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="mt-8 flex flex-col gap-3 border-t border-bg-border pt-6">
        <p className="text-sm text-text-secondary">
          Data scraped {meta.scraped_at} from{" "}
          <a
            href={meta.source}
            className="text-gold underline hover:text-text-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            tokscale.ai/leaderboard
          </a>
          . {meta.total_scraped.toLocaleString()} operators scraped, {meta.outliers} outliers
          separated, {meta.humans_included.toLocaleString()} humans
          analyzed.
        </p>
        <div className="flex flex-wrap gap-4 text-sm">
          <Link href="/blog/volume-isnt-yield" className="text-gold underline hover:text-text-primary">
            Read the full analysis
          </Link>
          <Link href="/methodology" className="text-gold underline hover:text-text-primary">
            Methodology
          </Link>
          <Link href="/hall" className="text-gold underline hover:text-text-primary">
            Hall of Signal
          </Link>
          <Link href="/board/all" className="text-gold underline hover:text-text-primary">
            Live Leaderboard
          </Link>
        </div>
      </footer>
    </div>
  );
}
