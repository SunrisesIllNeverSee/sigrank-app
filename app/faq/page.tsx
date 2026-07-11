/**
 * app/faq/page.tsx — Frequently Asked Questions.
 *
 * Targets the exact intent queries from the Perplexity conversation:
 * "Who is the best AI user?", "How do I measure up?", "Is there an AI user
 * leaderboard?", "Am I an AI power user?", "What is token cascade efficiency?",
 * "How can I use AI more efficiently?", "What makes someone a top AI operator?"
 *
 * JSON-LD: breadcrumb + faqPage.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "FAQ — SigRank",
  description:
    "Answers to the most common questions about AI operator performance: who is the best AI user, how to measure up, what is token cascade efficiency, and what makes a top AI operator.",
  path: "/faq",
});

const FAQS: { question: string; answer: string }[] = [
  {
    question: "Who is the best AI user?",
    answer:
      "SigRank crowns operators by Υ Yield and cascade efficiency, not volume. The top operator on the /board/all leaderboard is the current best by token cascade efficiency.",
  },
  {
    question: "How do I measure up to other AI users?",
    answer:
      "Install sigrank (npm i -g sigrank), run `sigrank me` or paste your ccusage JSON at /score, then compare your Υ Yield, class tier, and rank against other operators on the leaderboard.",
  },
  {
    question: "Is there an AI user leaderboard?",
    answer:
      "Yes — SigRank is the AI Operator Leaderboard. It ranks operators by token cascade efficiency (Υ = cache_read × output / input²), not raw token volume. See /board/all.",
  },
  {
    question: "Am I an AI power user?",
    answer:
      "SigRank classifies operators into tiers (Burner, Builder, 10xer) based on yield and leverage. A 10xer is the AI power user archetype: high cache reuse, high output per input, disciplined token architecture. Check your class at /score.",
  },
  {
    question: "What is token cascade efficiency?",
    answer:
      "Token cascade efficiency measures how well an AI operator converts fresh input tokens into useful output, amplified by cached context reuse. The formula is Υ = (cache_read × output) / input². High yield means signal is compounding; low yield means tokens are burned.",
  },
  {
    question: "How can I use AI more efficiently?",
    answer:
      "Increase cache reuse (reuse prompts, templates, workflows), reduce fresh input (don't start from scratch each time), and maximize output per session. SigRank's self_improve tool diagnoses your cascade and suggests specific improvements.",
  },
  {
    question: "What makes someone a top AI operator?",
    answer:
      "Top operators build workflows where one unit of new input sits atop a large cached base and yields more than one unit of output. This reflects disciplined, system-level reuse, not brute-force prompting. See the class tiers on /board/all.",
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([{ name: "FAQ", path: "/faq" }]),
          faqPage(FAQS),
        ]}
      />

      <WaveHero
        eyebrow="◈ FAQ"
        terminalText="FAQ"
        title="Frequently Asked Questions"
        subtitle={
          <>
            Answers to the most common questions about{" "}
            <span className="text-gold">AI operator performance</span> — who is
            the best, how to measure up, and what makes a top AI user.
          </>
        }
      />

      {/* ── FAQ section ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Questions &amp; answers
        </h2>
        <dl className="flex flex-col gap-4">
          {FAQS.map((f) => (
            <div
              key={f.question}
              className="flex flex-col gap-1 rounded-lg border border-bg-border bg-bg-surface p-4"
            >
              <dt className="font-semibold text-text-primary">
                {f.question}
              </dt>
              <dd className="font-sans text-sm leading-relaxed text-text-secondary">
                {f.answer}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Related pages ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Explore further
        </h2>
        <ul className="flex flex-col gap-2 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <Link
              href="/board/all"
              className="text-gold underline-offset-2 hover:underline"
            >
              /board/all
            </Link>{" "}
            — the live AI operator leaderboard.
          </li>
          <li>
            <Link
              href="/score"
              className="text-gold underline-offset-2 hover:underline"
            >
              /score
            </Link>{" "}
            — paste your token stats and get your Υ Yield + class tier.
          </li>
          <li>
            <Link
              href="/methodology"
              className="text-gold underline-offset-2 hover:underline"
            >
              /methodology
            </Link>{" "}
            — the full methodology behind the SigRank Index.
          </li>
        </ul>
      </section>
    </div>
  );
}
