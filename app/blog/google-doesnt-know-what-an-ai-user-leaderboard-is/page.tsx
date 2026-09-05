/**
 * app/blog/google-doesnt-know-what-an-ai-user-leaderboard-is/page.tsx
 *
 * Blog post using the SERP capture evidence as the story. The thesis:
 * Google returns model leaderboards for "ai user leaderboard" because
 * nobody has built a user leaderboard yet. SigRank is the first. This
 * post documents the gap with dated evidence and positions SigRank as
 * the answer.
 *
 * Targets: "ai user leaderboard", "ai operator", "ai leaderboard",
 * "who is the best ai user", "model leaderboard vs user leaderboard"
 *
 * JSON-LD: BlogPosting + BreadcrumbList + FAQPage.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { SITE_ORIGIN } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { CitationMeta } from "@/components/seo/CitationMeta";
import { breadcrumb, faqPage, personAuthor } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Google Doesn't Know What an AI User Leaderboard Is",
  description:
    "Search 'ai user leaderboard' on Google and you get model leaderboards — LMArena, LiveBench, Artificial Analysis. Not a single user leaderboard appears. SigRank is the first. Here's the evidence.",
  path: "/blog/google-doesnt-know-what-an-ai-user-leaderboard-is",
});

function articleJsonLd() {
  const url = `${SITE_ORIGIN}/blog/google-doesnt-know-what-an-ai-user-leaderboard-is`;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": url,
    headline:
      "Google Doesn't Know What an AI User Leaderboard Is",
    description:
      "Search 'ai user leaderboard' on Google and you get model leaderboards. Not a single user leaderboard appears. SigRank is the first. Here's the evidence.",
    url,
    datePublished: "2026-09-04",
    dateModified: "2026-09-04",
    author: personAuthor(),
    publisher: { "@type": "Organization", name: "SigRank", url: SITE_ORIGIN },
    license: "https://creativecommons.org/licenses/by/4.0/",
    about:
      "SERP evidence that Google returns model leaderboards for 'ai user leaderboard' and what that gap means for AI operator measurement",
    keywords: [
      "ai user leaderboard",
      "ai operator",
      "model leaderboard",
      "ai leaderboard",
      "who is the best ai user",
      "ai user ranking",
      "sigrank",
      "operator efficiency",
    ],
  };
}

const faqs = [
  {
    question:
      "What does Google return for 'ai user leaderboard'?",
    answer:
      "As of September 2026, searching 'ai user leaderboard' on Google returns model leaderboards on page 1: Artificial Analysis, LiveBench, OpenRouter, Scale AI, HuggingFace LMArena, Vellum, Steel.dev, LLM Stats, and Kilo Code. Google's AI Overview also only cites model leaderboards. Not a single user leaderboard appears in organic results or the AI Overview.",
  },
  {
    question:
      "Why doesn't Google show a user leaderboard?",
    answer:
      "Google interprets 'ai user leaderboard' as 'AI leaderboard for users' rather than 'leaderboard of AI users.' The query has search volume and Google recognizes it (it appears in 'People Also Search For' suggestions), but no page on the internet currently serves the 'leaderboard of AI users' intent. Google can only rank what exists.",
  },
  {
    question:
      "What does Google return for 'ai operator'?",
    answer:
      "Google's AI Overview defines 'AI operator' two ways: an autonomous software agent like OpenAI Operator, or a human professional who manages AI systems in a business oversight role. Neither matches SigRank's definition: the human who drives an AI tool — writing prompts, managing context, turning output into work. The organic results are a consulting company (aioperator.com), OpenAI's product page, a LinkedIn post, an edX career guide, and Indeed job listings.",
  },
  {
    question:
      "What is the difference between a model leaderboard and a user leaderboard?",
    answer:
      "A model leaderboard ranks AI models by benchmark scores or preference votes — it asks 'which AI is best?' A user leaderboard ranks the humans who use AI tools by how efficiently they drive them — it asks 'who uses the AI best?' Model leaderboards hold the operator constant and vary the model. User leaderboards hold the model constant and vary the operator. They answer different questions.",
  },
  {
    question: "Is SigRank the first AI user leaderboard?",
    answer:
      "Yes. Existing AI usage trackers (Cribble, Tokscale, TokenRank) rank by raw token volume — who burned the most compute. That rewards waste, not skill. SigRank is the first leaderboard to rank AI users by token-cascade efficiency (Yield = cache_read x output / input^2), which measures how well you drive the AI, not how much you spend on it.",
  },
];

export default function GoogleDoesntKnowPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <CitationMeta
        title="Google Doesn't Know What an AI User Leaderboard Is"
        description="Search 'ai user leaderboard' on Google and you get model leaderboards. Not a single user leaderboard appears. SigRank is the first. Here's the evidence."
        date="2026-09-04"
        slug="/blog/google-doesnt-know-what-an-ai-user-leaderboard-is"
      />
      <JsonLd
        data={[
          articleJsonLd(),
          breadcrumb([
            { name: "Blog", path: "/blog" },
            {
              name: "Google Doesn't Know What an AI User Leaderboard Is",
              path: "/blog/google-doesnt-know-what-an-ai-user-leaderboard-is",
            },
          ]),
          faqPage(faqs),
        ]}
      />

      <WaveHero
        eyebrow="◈ Blog · SERP Evidence"
        title="Google Doesn't Know What an AI User Leaderboard Is"
        subtitle={
          <>
            Search <span className="text-gold">&ldquo;ai user
            leaderboard&rdquo;</span> on Google and you get model
            leaderboards. Every single result. Not one ranks users. Here&apos;s
            the evidence — and why that gap is an opportunity.
          </>
        }
      />

      {/* ── Article meta ── */}
      <div className="flex items-center gap-3 border-b border-bg-border-subtle pb-4 font-mono text-xs text-text-muted">
        <span>By SigRank</span>
        <span aria-hidden="true">·</span>
        <time dateTime="2026-09-04">Published September 4, 2026</time>
        <span aria-hidden="true">·</span>
        <span>7 min read</span>
      </div>

      {/* ── Intro ── */}
      <section className="flex flex-col gap-4">
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          On September 4, 2026, we searched Google for{" "}
          <strong className="text-text-primary">
            &ldquo;ai user leaderboard&rdquo;
          </strong>{" "}
          with personalization disabled. The results were unanimous:{" "}
          <span className="text-gold">every single result on page 1
          was a model leaderboard.</span>{" "}
          Not one user leaderboard. Not one page ranking the humans who
          use AI tools. Google &mdash; the world&apos;s largest search
          engine &mdash; does not know what an AI user leaderboard is,
          because nobody has built one yet.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          This post documents what Google returns, why it matters, and
          what it means for the future of AI operator measurement. The
          evidence is dated, sourced, and reproducible.
        </p>
      </section>

      {/* ── The SERP ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What Google returns for &ldquo;ai user leaderboard&rdquo;
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          We captured the full SERP using Playwright with personalization
          disabled (<code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-text-muted">pws=0</code>).
          Here is what page 1 looks like:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-bg-border">
                <th className="py-2 pr-4 text-left font-mono text-xs font-bold text-text-primary">
                  #
                </th>
                <th className="py-2 pr-4 text-left font-mono text-xs font-bold text-text-primary">
                  Result
                </th>
                <th className="py-2 text-left font-mono text-xs font-bold text-text-primary">
                  What it ranks
                </th>
              </tr>
            </thead>
            <tbody className="font-sans text-sm text-text-secondary">
              <tr className="border-b border-bg-border-subtle">
                <td className="py-2 pr-4 font-mono text-text-muted">1</td>
                <td className="py-2 pr-4">
                  Artificial Analysis
                  <br />
                  <span className="text-text-muted">artificialanalysis.ai</span>
                </td>
                <td className="py-2">AI models (250+)</td>
              </tr>
              <tr className="border-b border-bg-border-subtle">
                <td className="py-2 pr-4 font-mono text-text-muted">2</td>
                <td className="py-2 pr-4">
                  LiveBench
                  <br />
                  <span className="text-text-muted">livebench.ai</span>
                </td>
                <td className="py-2">AI models (benchmarks)</td>
              </tr>
              <tr className="border-b border-bg-border-subtle">
                <td className="py-2 pr-4 font-mono text-text-muted">3</td>
                <td className="py-2 pr-4">
                  OpenRouter
                  <br />
                  <span className="text-text-muted">openrouter.ai</span>
                </td>
                <td className="py-2">AI models (usage)</td>
              </tr>
              <tr className="border-b border-bg-border-subtle">
                <td className="py-2 pr-4 font-mono text-text-muted">4</td>
                <td className="py-2 pr-4">
                  Scale AI
                  <br />
                  <span className="text-text-muted">labs.scale.com</span>
                </td>
                <td className="py-2">AI models (benchmarks)</td>
              </tr>
              <tr className="border-b border-bg-border-subtle">
                <td className="py-2 pr-4 font-mono text-text-muted">5</td>
                <td className="py-2 pr-4">
                  HuggingFace LMArena
                  <br />
                  <span className="text-text-muted">huggingface.co</span>
                </td>
                <td className="py-2">AI models (Elo votes)</td>
              </tr>
              <tr className="border-b border-bg-border-subtle">
                <td className="py-2 pr-4 font-mono text-text-muted">6</td>
                <td className="py-2 pr-4">
                  Vellum
                  <br />
                  <span className="text-text-muted">vellum.ai</span>
                </td>
                <td className="py-2">AI models (benchmarks)</td>
              </tr>
              <tr className="border-b border-bg-border-subtle">
                <td className="py-2 pr-4 font-mono text-text-muted">7</td>
                <td className="py-2 pr-4">
                  Steel.dev
                  <br />
                  <span className="text-text-muted">leaderboard.steel.dev</span>
                </td>
                <td className="py-2">AI agents (browser tasks)</td>
              </tr>
              <tr className="border-b border-bg-border-subtle">
                <td className="py-2 pr-4 font-mono text-text-muted">8</td>
                <td className="py-2 pr-4">
                  LLM Stats
                  <br />
                  <span className="text-text-muted">llm-stats.com</span>
                </td>
                <td className="py-2">AI models (300+)</td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-text-muted">9</td>
                <td className="py-2 pr-4">
                  Kilo Code
                  <br />
                  <span className="text-text-muted">kilo.ai</span>
                </td>
                <td className="py-2">AI models (coding usage)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Nine results. Nine model leaderboards. Zero user leaderboards.
        </p>
      </section>

      {/* ── AI Overview ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Google&apos;s AI Overview is no better
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Google generated an AI Overview for the query. Its answer:
        </p>
        <blockquote className="border-l-2 border-gold/40 pl-4 font-sans text-sm italic leading-relaxed text-text-secondary">
          &ldquo;Top AI model leaderboards rely on real-world user feedback
          and automated benchmarks to rank systems like Anthropic&apos;s
          Claude and OpenAI&apos;s GPT series.&rdquo;
        </blockquote>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The AI Overview cites LMSYS Chatbot Arena, LiveBench, and Kilo AI
          Leaderboard as its sources. All model leaderboards. Google&apos;s
          own generated answer doesn&apos;t include a single user
          leaderboard &mdash; because it can&apos;t cite what doesn&apos;t
          exist.
        </p>
      </section>

      {/* ── People Also Ask ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Google knows the question exists
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The &ldquo;People Also Search For&rdquo; section at the bottom of
          the SERP includes:
        </p>
        <ul className="flex flex-col gap-2 font-sans text-sm text-text-secondary">
          <li className="flex gap-2">
            <span className="text-gold">&rsaquo;</span>
            <span>ai user leaderboard today</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gold">&rsaquo;</span>
            <span>ai coding leaderboard</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gold">&rsaquo;</span>
            <span>best ai leaderboard</span>
          </li>
          <li className="flex gap-2">
            <span className="text-gold">&rsaquo;</span>
            <span>llm coding leaderboard</span>
          </li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Google recognizes the query. It knows people search for it. It
          just doesn&apos;t have anything to show them &mdash; so it fills
          the page with the closest thing it can find: model leaderboards.
          The intent is being{" "}
          <span className="text-gold">misrouted</span>, not absent.
        </p>
      </section>

      {/* ── The ai operator SERP ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The same gap exists for &ldquo;ai operator&rdquo;
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          We ran the same capture for{" "}
          <strong className="text-text-primary">&ldquo;ai
          operator&rdquo;</strong>{" "}
          (320 searches/month, keyword difficulty 35). Google&apos;s AI
          Overview defines it two ways:
        </p>
        <ol className="flex flex-col gap-3 font-sans text-sm text-text-secondary">
          <li className="flex gap-3">
            <span className="font-mono font-bold text-gold">1.</span>
            <span>
              <strong className="text-text-primary">An autonomous
              software agent</strong> &mdash; like OpenAI&apos;s Operator
              product, which clicks and types inside a web browser to
              complete tasks.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="font-mono font-bold text-gold">2.</span>
            <span>
              <strong className="text-text-primary">A human
              professional</strong> who manages AI systems in a business
              oversight role &mdash; monitoring outputs, ensuring
              compliance, correcting mistakes.
            </span>
          </li>
        </ol>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Neither definition is what we mean by &ldquo;AI operator.&rdquo;
          In SigRank&apos;s framework, an AI operator is{" "}
          <span className="text-gold">the human who drives an AI
          tool</span> &mdash; the person writing prompts, managing context,
          turning output into shipped work. Not an autonomous agent. Not a
          compliance manager. A driver. The person whose skill determines
          whether a great model produces great work or mediocre work.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The organic results confirm the gap: a consulting company
          (aioperator.com), OpenAI&apos;s product page, a LinkedIn post, an
          edX career guide, and Indeed job listings (257 AI operator jobs).
          The &ldquo;People Also Search For&rdquo; section is entirely
          career-related: salary, jobs, certification, training. Nobody is
          serving the &ldquo;what is an AI operator&rdquo; definitional
          intent from a skill-measurement perspective.
        </p>
      </section>

      {/* ── Why this matters ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Why this matters
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The AI industry benchmarks models constantly. LMSYS ranks them by
          preference votes. Artificial Analysis ranks them by composite
          scores. LiveBench ranks them by test suites. Every leaderboard
          asks the same question:{" "}
          <em>which AI is best?</em>
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          But that is only half the equation. A great model in the hands of
          a poor operator produces mediocre work. A good model in the hands
          of a great operator produces exceptional work. The operator is
          the variable that nobody is measuring &mdash; and Google
          can&apos;t find a user leaderboard because{" "}
          <span className="text-gold">nobody built one until
          SigRank.</span>
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The existing AI usage trackers (Cribble, Tokscale, TokenRank) do
          exist, but they rank by raw token volume &mdash; who burned the
          most compute. That rewards waste, not skill. A developer who
          dumps 10M tokens of unfocused input looks
          &ldquo;productive&rdquo; on a volume-based leaderboard. But they
          burned cache, generated noise, and produced less per dollar than
          someone who used 1M tokens with discipline.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank inverts that. The Yield metric{" "}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
            cache_read x output / input^2
          </code>{" "}
          rewards the operator who reuses context heavily, produces dense
          output, and keeps fresh input lean. Volume is spend. Yield is
          skill. And Yield is what Google is missing.
        </p>
      </section>

      {/* ── The opportunity ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The opportunity
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The SERP gap is not a problem. It is a category-creation
          opportunity. When Google returns the wrong results for a query,
          it means the right result doesn&apos;t exist yet. Whoever builds
          it &mdash; and builds it well enough for Google to understand
          &mdash; owns the category.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is now live at{" "}
          <Link
            href="/ai-user-leaderboard"
            className="text-gold underline decoration-gold/30 underline-offset-2 hover:decoration-gold"
          >
            /ai-user-leaderboard
          </Link>{" "}
          and{" "}
          <Link
            href="/ai-operator"
            className="text-gold underline decoration-gold/30 underline-offset-2 hover:decoration-gold"
          >
            /ai-operator
          </Link>
          . The leaderboard itself is at{" "}
          <Link
            href="/board/all"
            className="text-gold underline decoration-gold/30 underline-offset-2 hover:decoration-gold"
          >
            /board/all
          </Link>
          . If you use AI tools &mdash; Claude, ChatGPT, Gemini, Copilot,
          Cursor, any of them &mdash; you can get your score at{" "}
          <Link
            href="/score"
            className="text-gold underline decoration-gold/30 underline-offset-2 hover:decoration-gold"
          >
            /score
          </Link>{" "}
          and see where you rank.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The next time someone searches &ldquo;ai user leaderboard,&rdquo;
          Google will have something to show them.
        </p>
      </section>

      {/* ── Methodology ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Methodology
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SERP captures were performed on September 4, 2026 using Playwright
          with personalization disabled (<code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-text-muted">pws=0</code>).
          Full-page screenshots and text extractions are stored as dated
          evidence files. The captures are reproducible: the same query
          with personalization disabled should produce similar results,
          though Google may update its index over time. Location was
          detected as Buffalo, NY (14209).
        </p>
      </section>

      {/* ── CTA ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          See where you rank
        </h2>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/score"
            className="rounded-lg border border-bg-border bg-bg-surface px-4 py-2 font-mono text-sm font-bold text-text-primary transition-colors hover:border-gold hover:text-gold"
          >
            Get your score →
          </Link>
          <Link
            href="/board/all"
            className="rounded-lg border border-bg-border bg-bg-surface px-4 py-2 font-mono text-sm font-bold text-text-primary transition-colors hover:border-gold hover:text-gold"
          >
            View the leaderboard →
          </Link>
          <Link
            href="/ai-user-leaderboard"
            className="rounded-lg border border-bg-border bg-bg-surface px-4 py-2 font-mono text-sm font-bold text-text-primary transition-colors hover:border-gold hover:text-gold"
          >
            What is an AI user leaderboard? →
          </Link>
          <Link
            href="/ai-operator"
            className="rounded-lg border border-bg-border bg-bg-surface px-4 py-2 font-mono text-sm font-bold text-text-primary transition-colors hover:border-gold hover:text-gold"
          >
            What is an AI operator? →
          </Link>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">FAQ</h2>
        <dl className="flex flex-col gap-4">
          {faqs.map((f) => (
            <div key={f.question} className="flex flex-col gap-1">
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
    </div>
  );
}
