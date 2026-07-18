/**
 * app/blog/the-tool-is-the-person/page.tsx — "The Tool Is the Person: Why
 * Token Telemetry Measures AI Operator Skill".
 *
 * Bridge blog post connecting tool queries (ccusage, token tracking) to person
 * queries (who is the best AI user, am I an AI power user). The core thesis:
 * measuring the AI tool IS measuring the human operator. Your token cascade
 * is your skill signature.
 *
 * JSON-LD: ScholarlyArticle + BreadcrumbList + FAQPage.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { SITE_ORIGIN } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage, personAuthor } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "The Tool Is the Person: Why Token Telemetry Measures AI Skill",
  description:
    "Every token the AI tool burns is a decision the person made. Measuring the tool IS measuring the person. Your token cascade is your skill signature.",
  path: "/blog/the-tool-is-the-person",
});

function articleJsonLd() {
  const url = `${SITE_ORIGIN}/blog/the-tool-is-the-person`;
  return {
    "@context": "https://schema.org",
    "@type": "ScholarlyArticle",
    "@id": url,
    headline: "The Tool Is the Person: Why Token Telemetry Measures AI Skill",
    description:
      "Every token the AI tool burns is a decision the person made. Measuring the tool IS measuring the person. Your token cascade is your skill signature.",
    url,
    datePublished: "2026-07-12",
    author: personAuthor(),
    publisher: { "@type": "Organization", name: "SigRank", url: SITE_ORIGIN },
    license: "https://creativecommons.org/licenses/by/4.0/",
    about: "Why AI token telemetry measures human operator skill, not just tool usage",
    keywords: [
      "ai operator skill",
      "ai power user",
      "token telemetry",
      "ccusage alternative",
      "ai user leaderboard",
      "token yield",
      "operator efficiency",
    ],
  };
}

const faqs = [
  {
    question: "What does 'the tool is the person' mean?",
    answer:
      "It means that every token an AI tool consumes reflects a decision the human operator made. High cache reuse shows discipline. Low fresh input shows restraint. High output per input shows leverage. The tool's token cascade IS the person's skill signature — you don't need a quiz to assess AI skill if you have the telemetry.",
  },
  {
    question: "How is SigRank different from token-count leaderboards?",
    answer:
      "Token-count leaderboards (clawdboard, CCgather, TrustMRT) rank tools by how many tokens they burned or dollars they spent. SigRank ranks operators by yield (Υ = cache_read × output / input²) — a skill metric that measures how efficiently the person uses the tool, not how much the tool consumed.",
  },
  {
    question: "Can token tracking really tell you if someone is a good AI user?",
    answer:
      "Yes. Your token cascade reveals your workflow architecture. Operators who reuse cached context, keep fresh input lean, and extract high output from low input have high yield — and those behaviors are skills, not accidents. The cascade is objective, signed, and privacy-preserving. No self-reported quiz can match it.",
  },
  {
    question: "Who is the best AI user?",
    answer:
      "The operator with the highest yield (Υ) on the SigRank leaderboard. Not the one who burned the most tokens — the one whose token cascade compounds most efficiently. See /board/all for the current rankings.",
  },
];

export default function TheToolIsThePersonPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          articleJsonLd(),
          breadcrumb([
            { name: "Blog", path: "/blog" },
            { name: "The Tool Is the Person", path: "/blog/the-tool-is-the-person" },
          ]),
          faqPage(faqs),
        ]}
      />

      <WaveHero
        eyebrow="◈ Blog · Operator Skill"
        title="The Tool Is the Person"
        subtitle={
          <>
            Why measuring the AI tool{" "}
            <span className="text-gold">IS</span> measuring the human operator.
            Your token cascade is your skill signature.
          </>
        }
      />

      {/* ── Article meta ── */}
      <div className="flex items-center gap-3 border-b border-bg-border-subtle pb-4 font-mono text-xs text-text-muted">
        <span>By SigRank</span>
        <span aria-hidden="true">·</span>
        <time dateTime="2026-07-12">Published July 12, 2026</time>
        <span aria-hidden="true">·</span>
        <span>6 min read</span>
      </div>

      {/* ── Intro ── */}
      <section className="flex flex-col gap-4">
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          There are two kinds of AI usage leaderboards on the internet right
          now. The first kind ranks{" "}
          <strong className="text-text-primary">tools</strong> — who burned
          the most tokens, who spent the most dollars, who has the longest
          streak. The second kind ranks{" "}
          <strong className="text-text-primary">people</strong> — via quizzes,
          self-assessments, and conversational interviews. Both miss something
          obvious:{" "}
          <span className="text-gold">the tool&apos;s behavior IS the
          person&apos;s skill.</span>
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          You don&apos;t need a quiz to know if someone is an AI power user.
          You need their token cascade. And you don&apos;t need a raw token
          count to know if they&apos;re skilled. You need their{" "}
          <Link
            href="/metrics/yield-cascade"
            className="text-gold underline underline-offset-2"
          >
            yield
          </Link>
          . Here&apos;s why.
        </p>
      </section>

      {/* ── The hammer vs the carpenter ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The hammer vs the carpenter
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Imagine ranking carpenters by how many nails their hammer hit. The
          one who swung the most wins. That&apos;s what token-count
          leaderboards do — they rank the hammer, not the carpenter. A
          carpenter who drives 100 nails crooked outranks one who drives 20
          perfectly. The metric measures activity, not skill.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Now imagine ranking carpenters by{" "}
          <em>how much structure they built per nail</em>. The one who
          builds a house with 1,000 nails beats the one who builds a wobbly
          shelf with 5,000. That&apos;s what yield (Υ) does for AI operators.
          It measures the{" "}
          <Link
            href="/blog/token-cascade-vs-raw-token-consumption"
            className="text-gold underline underline-offset-2"
          >
            architecture of the token flow
          </Link>
          , not the volume.
        </p>
      </section>

      {/* ── Every token is a decision ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Every token is a decision
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Here&apos;s the core insight. When an AI tool consumes tokens, those
          tokens aren&apos;t random. They&apos;re the product of decisions the
          human operator made:
        </p>
        <ul className="flex flex-col gap-2 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">Cache reuse</strong> — when
            the tool reads from cached context instead of sending fresh input,
            that&apos;s because the{" "}
            <em>person</em> designed a workflow that builds on prior turns.
            That&apos;s discipline.
          </li>
          <li>
            <strong className="text-text-primary">Fresh input volume</strong>{" "}
            — when the tool sends a lot of fresh input, that&apos;s because
            the <em>person</em> pasted entire files, repeated instructions, or
            started from scratch. That&apos;s waste.
          </li>
          <li>
            <strong className="text-text-primary">Output per input</strong> —
            when the tool produces a lot of output from little input,
            that&apos;s because the <em>person</em> asked the right question
            and gave the right context. That&apos;s leverage.
          </li>
          <li>
            <strong className="text-text-primary">Cascade architecture</strong>{" "}
            — when the overall token flow compounds (high yield), that&apos;s
            because the <em>person</em> has a system, not just prompts.
            That&apos;s skill.
          </li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The tool doesn&apos;t decide to reuse cache. The tool doesn&apos;t
          decide to paste a 500-line file. The tool doesn&apos;t decide to ask
          a sharp question. <span className="text-gold">The person does. The
          tool is the person.</span>
        </p>
      </section>

      {/* ── Why quizzes can't compete ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why quizzes can&apos;t compete
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The person-assessment products (AISA, FormHug, AI IQ tests) ask you
          questions: &quot;How often do you use AI?&quot; &quot;Do you use
          custom prompts?&quot; &quot;Can you write a system prompt?&quot; The
          answers are self-reported. They reflect what you{" "}
          <em>think</em> you do, not what you{" "}
          <em>actually</em> do.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Token telemetry doesn&apos;t care what you think. It shows what you
          actually did — every cache hit, every wasted input token, every
          productive output. It&apos;s objective, signed, and verifiable. A
          quiz can be gamed by someone who reads the right blog posts. A token
          cascade can&apos;t be gamed without actually changing your behavior.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          This is why SigRank sits at the intersection that no one else
          occupies:{" "}
          <strong className="text-text-primary">real telemetry from the
          tool</strong> (like ccusage){" "}
          <strong className="text-text-primary">+ skill scoring that measures
          the person</strong> (like a quiz, but objective). The tool is the
          person — so measuring the tool IS measuring the person.
        </p>
      </section>

      {/* ── The leaderboard gap ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The leaderboard gap
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Search for &quot;AI user leaderboard&quot; and you&apos;ll find at
          least ten products: clawdboard, CCgather, TrustMRT, CostHawk,
          Fancysauce, viberank, and more. They all rank by{" "}
          <em>token count</em> or <em>dollar spend</em>. None rank by skill.
          None ask: &quot;who is the best AI user?&quot; — they ask
          &quot;who burned the most tokens?&quot;
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Search for &quot;who is the best AI user&quot; and you&apos;ll find
          journalism — Semafor profiles, Business Insider articles about
          tokenmaxxing power users. No product. No leaderboard. Just stories
          about people, with no way to compare them objectively.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank fills both gaps. It&apos;s a leaderboard that ranks by skill
          (yield), powered by real telemetry (token cascade), measuring the
          person through the tool.{" "}
          <Link
            href="/board/all"
            className="text-gold underline underline-offset-2"
          >
            See the rankings →
          </Link>
        </p>
      </section>

      {/* ── CTA ── */}
      <section className="flex flex-col gap-3 rounded-lg border border-gold/30 bg-gold/5 p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Your cascade is your signature
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Stop wondering if you&apos;re an AI power user. Stop counting tokens.
          Find out what your token cascade says about your skill:
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-elevated p-4">
          <pre className="overflow-x-auto font-mono text-sm text-gold">
            <code>npx sigrank</code>
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Already have token stats?{" "}
          <Link
            href="/score"
            className="text-gold underline underline-offset-2"
          >
            Score your yield →
          </Link>{" "}
          ·{" "}
          <Link
            href="/faq"
            className="text-gold underline underline-offset-2"
          >
            Read the FAQ
          </Link>
        </p>
      </section>

      {/* ── FAQ ── */}
      <section className="flex flex-col gap-3 border-t border-bg-border-subtle pt-6">
        <h2 className="font-mono text-xs uppercase tracking-[0.14em] text-text-dim">
          FAQ
        </h2>
        <dl className="flex flex-col gap-4">
          {faqs.map((f) => (
            <div key={f.question} className="flex flex-col gap-1">
              <dt className="font-semibold text-text-primary">{f.question}</dt>
              <dd className="text-base text-text-secondary">{f.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/blog/token-cascade-vs-raw-token-consumption"
            className="text-gold underline underline-offset-2"
          >
            Token Yield vs Token Count
          </Link>
          {" · "}
          <Link
            href="/blog/ai-power-user-benchmarking"
            className="text-gold underline underline-offset-2"
          >
            AI Power User Benchmarking
          </Link>
          {" · "}
          <Link
            href="/alternatives/ccusage-alternatives"
            className="text-gold underline underline-offset-2"
          >
            ccusage Alternatives
          </Link>
          {" · "}
          <Link
            href="/board/all"
            className="text-gold underline underline-offset-2"
          >
            Leaderboard
          </Link>
        </p>
      </section>
    </div>
  );
}
