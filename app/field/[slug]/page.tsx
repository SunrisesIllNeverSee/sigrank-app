/**
 * app/field/[slug]/page.tsx — individual field analysis section.
 *
 * Renders the full content for a single field analysis section.
 * The hub page at /field links here for each section.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { withOG } from "@/lib/seo";
import { SITE_ORIGIN } from "@/lib/seo";
import { getFieldAnalysis, getArchetypes } from "@/lib/analytics/field-data";
import { JsonLd } from "@/components/seo/JsonLd";
import { WaveHero } from "@/components/ui/WaveHero";
import { breadcrumb, personAuthor } from "@/lib/jsonld";
import { FIELD_SECTIONS, FIELD_SECTION_MAP } from "@/lib/field/sections";
import FieldStatCards from "@/components/field/FieldStatCards";
import PlatformAdoption from "@/components/field/PlatformAdoption";
import CascadeSankey from "@/components/field/CascadeSankey";
import PercentileBands from "@/components/field/PercentileBands";
import OperatorArchetypes from "@/components/field/OperatorArchetypes";
import BotZoneShading from "@/components/field/BotZoneShading";
import EightyPercentBand from "@/components/field/EightyPercentBand";

export const revalidate = 3600;

export function generateStaticParams() {
  return FIELD_SECTIONS.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const section = FIELD_SECTION_MAP.get(slug);
  if (!section) return {};
  return withOG({
    title: `${section.title} — Field Analysis`,
    description: section.blurb,
    path: `/field/${slug}`,
  });
}

export default async function FieldSectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const section = FIELD_SECTION_MAP.get(slug);
  if (!section) notFound();

  const [data, archetypes] = await Promise.all([
    getFieldAnalysis(),
    getArchetypes(),
  ]);
  const { meta, ghost_ranks, platform_adoption } = data;

  const article = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: section.title,
    description: section.blurb,
    url: `${SITE_ORIGIN}/field/${slug}`,
    author: personAuthor(),
    publisher: { "@id": `${SITE_ORIGIN}/#org` },
    datePublished: meta.scraped_at,
    isPartOf: {
      "@type": "CreativeWork",
      name: "AI Operator Field Analysis",
      url: `${SITE_ORIGIN}/field`,
    },
  };

  // Find prev/next for navigation
  const idx = FIELD_SECTIONS.findIndex((s) => s.slug === slug);
  const prev = idx > 0 ? FIELD_SECTIONS[idx - 1] : null;
  const next = idx < FIELD_SECTIONS.length - 1 ? FIELD_SECTIONS[idx + 1] : null;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          article,
          breadcrumb([
            { name: "Field Analysis", path: "/field" },
            { name: section.title, path: `/field/${slug}` },
          ]),
        ]}
      />

      <WaveHero
        eyebrow={`📊 Field Analysis · ${String(section.order).padStart(2, "0")}`}
        terminalText={section.title.toUpperCase().slice(0, 11)}
        title={section.title}
        subtitle={section.blurb}
      />

      {/* ── Section content ─────────────────────────────────────────── */}
      <FieldSectionContent
        slug={slug}
        meta={meta}
        ghostRanks={ghost_ranks}
        platformAdoption={platform_adoption}
        archetypes={archetypes}
      />

      {/* ── Prev / Next nav ──────────────────────────────────────────── */}
      <nav className="flex justify-between gap-4 border-t border-bg-border pt-6">
        {prev ? (
          <Link
            href={`/field/${prev.slug}`}
            className="flex flex-col gap-1 text-left"
          >
            <span className="font-mono text-xs text-text-dim">← Previous</span>
            <span className="text-sm text-gold underline underline-offset-2">
              {prev.title}
            </span>
          </Link>
        ) : (
          <Link
            href="/field"
            className="flex flex-col gap-1 text-left"
          >
            <span className="font-mono text-xs text-text-dim">← Back</span>
            <span className="text-sm text-gold underline underline-offset-2">
              Field Analysis Hub
            </span>
          </Link>
        )}
        {next ? (
          <Link
            href={`/field/${next.slug}`}
            className="flex flex-col gap-1 text-right"
          >
            <span className="font-mono text-xs text-text-dim">Next →</span>
            <span className="text-sm text-gold underline underline-offset-2">
              {next.title}
            </span>
          </Link>
        ) : (
          <Link
            href="/field"
            className="flex flex-col gap-1 text-right"
          >
            <span className="font-mono text-xs text-text-dim">Back to hub →</span>
            <span className="text-sm text-gold underline underline-offset-2">
              Field Analysis
            </span>
          </Link>
        )}
      </nav>
    </div>
  );
}

// ── Section content renderer ───────────────────────────────────────────

function FieldSectionContent({
  slug,
  meta,
  ghostRanks,
  platformAdoption,
  archetypes,
}: {
  slug: string;
  meta: any;
  ghostRanks: any[];
  platformAdoption: any[];
  archetypes: any[];
}) {
  switch (slug) {
    case "volume-vs-yield":
      return (
        <section className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <img
              src="/field-charts/volume-vs-yield.svg"
              alt="Volume vs Yield scatter plot"
              width={800}
              height={480}
              className="h-auto w-full"
              style={{ aspectRatio: "800 / 480" }}
            />
          </div>
          <p className="text-sm leading-relaxed text-text-secondary">
            Public token-volume leaderboards rank by total token volume. SigRank ranks by yield — how
            efficiently an operator converts input tokens into output tokens using cache compounding.
            These two rankings have almost zero correlation. The operator with the most tokens (9
            quadrillion) has a yield of 0. The operator with the highest yield (2.46M) ranks #697
            by volume. Volume alone is noise. Yield is signal.
          </p>
          <p className="text-sm leading-relaxed text-text-secondary">
            The scatter plot above makes this visible. The median lines divide the field into four
            quadrants — and the top-right (high volume, high yield) is nearly empty. The highest-yield
            operators cluster in the bottom-right: modest token spend, extraordinary efficiency. This
            is the ghost-rank phenomenon, explored in the{" "}
            <Link href="/field/ghost-ranks" className="text-gold underline underline-offset-2">
              Ghost Ranks
            </Link>{" "}
            section.
          </p>
        </section>
      );

    case "token-cascade":
      return (
        <section className="flex flex-col gap-4">
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
      );

    case "snr-separation":
      return (
        <section className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <img
              src="/field-charts/snr-distribution.svg"
              alt="SNR distribution histogram"
              width={800}
              height={340}
              className="h-auto w-full"
              style={{ aspectRatio: "800 / 340" }}
              loading="lazy"
            />
          </div>
          <p className="text-sm leading-relaxed text-text-secondary">
            Signal-to-Noise Ratio (SNR) = output / (input + output). It measures what fraction of your
            interaction produced actual output versus prompt overhead. Outliers have SNR near zero.
            Humans have SNR above .05. One number separates signal producers from token burners.
          </p>
          <p className="text-sm leading-relaxed text-text-secondary">
            The histogram shows the field clustering tightly around the median SNR of{" "}
            {meta.medians.snr.toFixed(3)}. The IQR fences (dashed lines) bracket the middle
            50% of operators. The long tail to the right — operators with SNR above .10 — are the
            ghost-rank operators: they produce disproportionate output from minimal input.
          </p>
        </section>
      );

    case "leverage-velocity":
      return (
        <section className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <img
              src="/field-charts/leverage-vs-velocity.svg"
              alt="Leverage vs Velocity scatter plot"
              width={800}
              height={420}
              className="h-auto w-full"
              style={{ aspectRatio: "800 / 420" }}
              loading="lazy"
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
      );

    case "platform-dominance":
      return (
        <section className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <PlatformAdoption platforms={platformAdoption} />
          </div>
          <div className="mt-2 overflow-x-auto">
            <img
              src="/field-charts/platform-yield-quartile.svg"
              alt="Platform × Yield Quartile"
              width={800}
              height={380}
              className="h-auto w-full"
              style={{ aspectRatio: "800 / 380" }}
              loading="lazy"
            />
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
      );

    case "cascade-composition":
      return (
        <section className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <img
              src="/field-charts/cascade-composition.svg"
              alt="Cascade composition — 4 notable operators"
              width={800}
              height={400}
              className="h-auto w-full"
              style={{ aspectRatio: "800 / 400" }}
              loading="lazy"
            />
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
      );

    case "yield-quartiles":
      return (
        <section className="flex flex-col gap-4">
          <div className="overflow-x-auto">
            <img
              src="/field-charts/yield-quartile-boxplots.svg"
              alt="Yield quartile box plots"
              width={800}
              height={420}
              className="h-auto w-full"
              style={{ aspectRatio: "800 / 420" }}
              loading="lazy"
            />
          </div>
          <p className="text-sm leading-relaxed text-text-secondary">
            The box plots break down four metrics — yield, leverage, velocity, and SNR — across the
            four yield quartiles. The progression is stark: leverage jumps from a median of ~5× in Q1
            to ~200× in Q4. Velocity climbs from 0.03 to nearly 1.0. But SNR stays flat across all
            quartiles — the signal density of output doesn&apos;t change. What changes is how much cached
            context amplifies that output.
          </p>
          <p className="text-sm leading-relaxed text-text-secondary">
            This is the architectural insight: high-yield operators don&apos;t produce denser signal —
            they produce more signal from the same density by leveraging cache. The yield gap is a
            leverage gap, not a talent gap.
          </p>
        </section>
      );

    case "eighty-percent":
      return (
        <section className="flex flex-col gap-4">
          <EightyPercentBand
            p10={meta.iqr_fences.yield?.q1 ? meta.iqr_fences.yield.q1 * 0.7 : 0.04}
            p90={meta.iqr_fences.yield?.q3 ? meta.iqr_fences.yield.q3 * 31 : 394}
            median={meta.medians.yield}
          />
          <p className="text-sm leading-relaxed text-text-secondary">
            The yield distribution is heavily right-skewed. 80% of human
            operators fall within the shaded band. The long tail to the right
            is where the AMPLIFIERS and CONVERGENT operators live. The bulk of
            the field clusters near the median. This is why the median is used
            instead of the mean: the mean is pulled by outliers, the median
            reflects where operators actually are.
          </p>
          <div className="rounded-lg border border-bg-border bg-bg-surface p-4">
            <p className="text-sm leading-relaxed text-text-secondary">
              <strong className="text-text-primary">The average-user anchor.</strong>{" "}
              The median yield of {meta.medians.yield.toFixed(2)} sits close to the{" "}
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
              different: the real field has <strong className="text-text-primary">{meta.medians.leverage.toFixed(1)}× leverage</strong>{" "}
              vs the model&apos;s 3.5× — real operators read far more cache — but
              only <strong className="text-text-primary">{meta.medians.velocity.toFixed(2)} velocity</strong>{" "}
              vs the model&apos;s 0.50 — they produce less output per input token.
              Cache-heavy, output-light. Net yield is close to the modeled average;
              the path there is not.
            </p>
          </div>
        </section>
      );

    case "where-are-you":
      return (
        <section className="flex flex-col gap-4">
          <PercentileBands medianYield={meta.medians.yield} />
          <p className="text-sm leading-relaxed text-text-secondary">
            The percentile ladder shows the yield thresholds for each tier. The
            median is where most operators land. The top 1% is where cache
            architecture becomes an art form. If you use AI coding agents, you
            are probably near the median. Claim your profile to see exactly
            where you fit.
          </p>
          <Link
            href="/login"
            className="self-start rounded-md border border-gold bg-bg-surface px-5 py-2.5 font-sans text-sm font-bold text-gold transition-colors hover:bg-gold hover:text-bg-primary"
          >
            Claim your profile →
          </Link>
        </section>
      );

    case "ghost-ranks":
      return (
        <section className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-text-secondary">
            Ghost-rank operators are invisible on volume-based leaderboards but dominate yield-based
            rankings. They use fewer tokens but achieve higher output efficiency. These are the
            operators worth recruiting — they have skill, not just spend.
          </p>
          <p className="text-sm leading-relaxed text-text-secondary">
            The data reveals {ghostRanks.length} ghost-rank operators — above median yield but with volume
            ranks in the hundreds or thousands. Their median volume rank is{" "}
            {(() => {
              const ranks = ghostRanks.map((g) => g.tokscale_rank).sort((a, b) => a - b);
              const mid = Math.floor(ranks.length / 2);
              return ranks.length % 2 === 0
                ? Math.round((ranks[mid - 1] + ranks[mid]) / 2)
                : ranks[mid];
            })()}
            , meaning they are buried deep on any volume leaderboard. But their yield values reach into
            the hundreds of thousands. Volume metrics hide them. Yield metrics find them.
          </p>
          <div className="overflow-x-auto">
            <img
              src="/field-charts/ghost-rank-quadrant.svg"
              alt="Ghost rank quadrant"
              width={800}
              height={480}
              className="h-auto w-full"
              style={{ aspectRatio: "800 / 480" }}
              loading="lazy"
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
                  <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-text-muted">Handle</th>
                  <th className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wider text-text-muted">Tokscale Rank</th>
                  <th className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wider text-gold">Yield (Υ)</th>
                  <th className="px-4 py-2 text-right text-xs font-bold uppercase tracking-wider text-text-muted">Total Tokens</th>
                  <th className="px-4 py-2 text-left text-xs font-bold uppercase tracking-wider text-text-muted">Platform</th>
                </tr>
              </thead>
              <tbody>
                {ghostRanks.slice(0, 20).map((g) => (
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
                      {g.yield >= 1000 ? `${(g.yield / 1000).toFixed(1)}K` : g.yield.toFixed(1)}
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
            Showing 20 of {ghostRanks.length} ghost-rank operators.
          </p>
        </section>
      );

    case "build-archetypes":
      return (
        <section className="flex flex-col gap-4">
          <p className="text-sm leading-relaxed text-text-secondary">
            The field separates into 10 build archetypes across four families:
            Convergence, Generation, Reuse Depth, and Active Construction.
            CONVERGENT is checked first and pulls out operators who are elite
            on all three derived dimensions (leverage, velocity, construction).
            KINETIC captures high-velocity generation. The Construction branch
            captures active context builders. The Reuse Depth branch captures
            passive context reusers. Each type is defined by a different
            primary dimension of the token cascade.
          </p>
          <OperatorArchetypes
            archetypes={archetypes}
            totalOperators={archetypes.reduce((s, a) => s + (a.n ?? 0), 0)}
          />
        </section>
      );

    case "outlier-detection":
      return (
        <section className="flex flex-col gap-4">
          <img
            src="/field-charts/outlier-detection.svg"
            alt="Outlier detection"
            width={800}
            height={320}
            className="h-auto w-full"
            style={{ aspectRatio: "800 / 320" }}
            loading="lazy"
          />
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
        </section>
      );

    default:
      return null;
  }
}
