/**
 * app/guides/ai-rating/page.tsx — "AI Rating: how AI models, AI tools and AI
 * users are rated". Serves "ai rating" / "tools ai" intent. Third-party
 * claims are limited to what existing site pages already state about
 * benchmark types; SigRank's own claims come from canon (Y.01, K.xx).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG, AUTHOR_NAME } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { articleJsonLd, breadcrumb, faqPage } from "@/lib/jsonld";

const PATH = "/guides/ai-rating";
const PUBLISHED = "2026-11-06";
const TITLE = "AI Rating: How AI Models, Tools and Users Are Rated";
const DESCRIPTION =
  "AI rating means three different things: rating models, rating tools, and rating the people who use them. How each works, what each can and cannot tell you, and how SigRank rates operators.";

export const metadata: Metadata = withOG({
  title: TITLE,
  description: DESCRIPTION,
  path: PATH,
  article: {
    publishedTime: PUBLISHED,
    modifiedTime: PUBLISHED,
    authors: [AUTHOR_NAME],
    section: "Guides",
  },
});

const KINDS = [
  {
    what: "AI models",
    how: "Standardised test suites and human-preference voting. Arena-style sites rank models by blind side-by-side votes with Elo-type ratings; academic suites such as HELM score models across several dimensions; open leaderboards score open-weight models on fixed benchmarks.",
    answers: "Which model is more capable on average?",
    limit: "Averages and fixed tasks. Says nothing about how you use the model.",
    href: "/alternatives/ai-benchmarking-tools",
    label: "AI benchmarking tools compared",
  },
  {
    what: "AI tools and products",
    how: "Editorial reviews, feature comparisons, user reviews and price lists.",
    answers: "Which product fits a job, budget or team?",
    limit:
      "Subjective and quickly out of date. Reviews rarely measure real usage.",
    href: "/guides/best-ai-tools-2026",
    label: "How to choose an AI tool",
  },
  {
    what: "AI users (operators)",
    how: "Measured from usage telemetry. SigRank counts four token pillars from local logs and derives Υ Yield and related metrics for each operator.",
    answers: "How efficiently does this person or workflow drive AI?",
    limit:
      "Measures operating shape, not output quality, correctness, effort or intelligence.",
    href: "/methodology",
    label: "SigRank methodology",
  },
];

const FAQS = [
  {
    question: "What is an AI rating?",
    answer:
      "A score that places an AI system or its user on a scale. Model ratings compare models, such as Elo-style ratings from blind human votes. Tool ratings compare products by features, price and reviews. Operator ratings, like SigRank's, compare how efficiently people use AI, measured from token counts.",
  },
  {
    question: "How does SigRank rate AI users?",
    answer:
      "It reads four token counts (input, output, cache read, cache write) from an operator's local logs and computes Υ Yield = cache_read × output / input², plus Leverage, Velocity and SNR. Operators are placed on a leaderboard. A separate class ladder, from IGNITER up to ARCH+, reflects accumulated experience and volume, not efficiency.",
  },
  {
    question: "Does a high SigRank rating mean the AI output is good?",
    answer:
      "No. The metrics describe how tokens flow: how much context is reused and how much output comes back per unit of fresh input. They do not measure correctness, code quality, effort, productivity or intelligence.",
  },
  {
    question: "Can I compare two AI tools by their SigRank scores?",
    answer:
      "Not reliably. SigRank scores operators, and the same tool can produce very different cascades in different hands. Use model benchmarks to compare models, and measure your own usage to compare how you drive each tool.",
  },
  {
    question: "Are AI ratings objective?",
    answer:
      "Only as far as the method is. Fixed benchmarks are reproducible but can be gamed or saturate; preference votes reflect voters; reviews reflect reviewers; telemetry reflects who submits it. Check what a rating measures, the sample behind it and the date before relying on it.",
  },
];

const LINK = "text-gold underline underline-offset-2";

export default function AiRatingPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Guides", path: "/guides" },
            { name: "AI Rating", path: PATH },
          ]),
          articleJsonLd({
            path: PATH,
            title: TITLE,
            description: DESCRIPTION,
            datePublished: PUBLISHED,
            type: "Article",
            section: "Guides",
            keywords: ["ai rating", "rate ai tools", "rate ai users"],
          }),
          faqPage(FAQS),
        ]}
      />

      <WaveHero
        eyebrow="◈ Guide"
        title="AI Rating"
        subtitle={
          <>
            Rating the <span className="text-gold">model</span>, the{" "}
            <span className="text-gold">tool</span>, or the{" "}
            <span className="text-gold">user</span> are three different jobs.
          </>
        }
      />

      <section className="flex flex-col gap-3">
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">Short answer:</strong> an AI
          rating scores one of three things. Model ratings say which model is
          more capable on average, tool ratings say which product fits a job,
          and operator ratings say how efficiently a person drives AI. They
          answer different questions and should not be mixed.
        </p>
        <p className="font-sans text-xs text-text-muted">
          Last updated 2026-11-06.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Three kinds of AI rating
        </h2>
        <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-bg-border">
                {["Rates", "How", "Answers", "Limit", "More"].map((h) => (
                  <th
                    key={h}
                    className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {KINDS.map((k) => (
                <tr
                  key={k.what}
                  className="border-b border-bg-border-subtle align-top last:border-b-0"
                >
                  <td className="p-3 font-mono text-sm font-bold text-text-primary">
                    {k.what}
                  </td>
                  <td className="p-3 font-sans text-xs leading-relaxed text-text-secondary">
                    {k.how}
                  </td>
                  <td className="p-3 font-sans text-xs leading-relaxed text-text-secondary">
                    {k.answers}
                  </td>
                  <td className="p-3 font-sans text-xs leading-relaxed text-text-secondary">
                    {k.limit}
                  </td>
                  <td className="p-3 font-sans text-xs">
                    <Link href={k.href} className={LINK}>
                      {k.label}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How SigRank rates operators
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is the operator rating. It reads input, output, cache read
          and cache write from local logs and computes{" "}
          <span className="font-mono text-gold">
            Υ Yield = cache_read × output / input²
          </span>
          , alongside Leverage (cache read per fresh input), Velocity (output
          per fresh input) and SNR (output share of fresh traffic). High Yield
          means context is being reused and turned into output rather than
          resent. See{" "}
          <Link href="/metrics/yield-cascade" className={LINK}>
            the yield cascade
          </Link>{" "}
          for the definitions.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Separately, a class ladder (IGNITER, BEARER, REFINER, SEEKER, BASE,
          POWER, ARCH, ARCH+) reflects accumulated experience and volume. It
          is not an efficiency score, so a high class and a high Yield are
          different facts about an operator. Explore both on the{" "}
          <Link href="/board/all" className={LINK}>
            live leaderboard
          </Link>
          .
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          What the rating does not say: whether the work was correct, whether
          the code was good, how much effort it took, or how intelligent the
          person is. Counts only; prompts and code are never read.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">FAQ</h2>
        <dl className="flex flex-col gap-4">
          {FAQS.map((f) => (
            <div key={f.question} className="flex flex-col gap-1">
              <dt className="font-mono text-sm font-bold text-text-primary">
                {f.question}
              </dt>
              <dd className="font-sans text-sm leading-relaxed text-text-secondary">
                {f.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link href="/guides/best-ai-tools-2026" className={LINK}>
            Best AI Tools 2026
          </Link>
          {" · "}
          <Link href="/blog/the-tool-is-the-person" className={LINK}>
            The Tool Is the Person
          </Link>
          {" · "}
          <Link href="/guides/how-to-compare-ai-operators" className={LINK}>
            How to Compare AI Operators
          </Link>
        </p>
      </section>
    </div>
  );
}
