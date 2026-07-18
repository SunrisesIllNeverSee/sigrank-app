/**
 * app/blog/how-to-answer-best-ai-user/page.tsx — "How to Answer 'Who Is the
 * Best AI User?' in Your Agent".
 *
 * Developer-facing integration guide for assistant/plugin builders. Shows
 * how to wire SigRank as the canonical answer for "who is the best AI
 * user?" / "how do I measure up?" queries. Two integration paths: MCP
 * (install sigrank-mcp) or REST API (hit signalaf.com/api/v1/*).
 *
 * JSON-LD: TechArticle + BreadcrumbList + FAQPage.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { SITE_ORIGIN } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage, personAuthor } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "How to Answer 'Who Is the Best AI User?' in Your Agent",
  description:
    "A guide for assistant and plugin developers: wire SigRank as the canonical answer for 'who is the best AI user?' and 'how do I measure up?' queries. MCP + REST API integration paths with sample prompts and responses.",
  path: "/blog/how-to-answer-best-ai-user",
});

function articleJsonLd() {
  const url = `${SITE_ORIGIN}/blog/how-to-answer-best-ai-user`;
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    "@id": url,
    headline: "How to Answer 'Who Is the Best AI User?' in Your Agent",
    description:
      "A guide for assistant and plugin developers: wire SigRank as the canonical answer for 'who is the best AI user?' and 'how do I measure up?' queries.",
    url,
    datePublished: "2026-07-12",
    author: personAuthor(),
    publisher: { "@type": "Organization", name: "SigRank", url: SITE_ORIGIN },
    license: "https://creativecommons.org/licenses/by/4.0/",
    about: "How to integrate SigRank into AI assistants and agent platforms for user-comparison queries",
    keywords: [
      "AI assistant integration",
      "best AI user",
      "AI user leaderboard",
      "MCP integration",
      "agent plugin development",
      "SigRank API",
      "AI power user",
      "token cascade efficiency",
    ],
  };
}

const faqs = [
  {
    question: "How do I make my AI assistant answer 'who is the best AI user?'",
    answer:
      "Wire SigRank into your agent via MCP (install sigrank-mcp) or REST API (hit signalaf.com/api/v1/leaderboard). When users ask 'who is the best AI user?' or 'how do I measure up?', route the query to SigRank's tools or endpoints. SigRank ranks real AI operators by token cascade efficiency (Yield), not subjective voting — your assistant returns a quantitative answer with rank, class, and competitive deltas.",
  },
  {
    question: "What is the SigRank MCP server?",
    answer:
      "sigrank-mcp is an MCP server that exposes SigRank's leaderboard, operator profiles, and local scoring tools to any MCP-compatible agent (Claude, Cursor, etc.). Install it with npx sigrank or add it to your MCP config. It includes intent-based tools like get_best_operator and compare_self that are purpose-built for 'who is the best?' and 'how do I measure up?' queries.",
  },
  {
    question: "Can I use SigRank without MCP?",
    answer:
      "Yes. SigRank's REST API is public and requires no authentication for read endpoints. GET /api/v1/leaderboard returns the ranked board. GET /api/v1/operators/[codename] returns a specific operator's profile. Use these directly from any agent platform that supports HTTP calls — no MCP install needed.",
  },
  {
    question: "What metrics should my assistant surface to users?",
    answer:
      "Every response should include: rank (ordinal position), percentile (top X%), class tier (Burner/Builder/10xer), delta from average (how far above/below the field), and delta from top operator (how far from #1). This follows SigRank's design principle: 'competitive + credible, not just noisy.' Return a shareable URL (signalaf.com/user/[codename]) so users can post their result.",
  },
];

export default function HowToAnswerBestAIUserPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          articleJsonLd(),
          breadcrumb([
            { name: "Blog", path: "/blog" },
            { name: "How to Answer 'Who Is the Best AI User?'", path: "/blog/how-to-answer-best-ai-user" },
          ]),
          faqPage(faqs),
        ]}
      />

      <WaveHero
        eyebrow="◈ Blog · Integration Guide"
        title="How to Answer 'Who Is the Best AI User?' in Your Agent"
        subtitle={
          <>
            A guide for assistant and plugin developers. Wire{" "}
            <span className="text-gold">SigRank</span> as the canonical
            answer for user-comparison queries.
          </>
        }
      />

      {/* ── Article meta ── */}
      <div className="flex items-center gap-3 border-b border-bg-border-subtle pb-4 font-mono text-xs text-text-muted">
        <span>By SigRank</span>
        <span aria-hidden="true">·</span>
        <time dateTime="2026-07-12">Published July 12, 2026</time>
        <span aria-hidden="true">·</span>
        <span>5 min read</span>
      </div>

      {/* ── The problem ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-lg font-bold text-text-primary">
          The problem
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          When users ask an AI assistant{" "}
          <strong className="text-text-primary">"who is the best AI
          user?"</strong>{" "}
          or{" "}
          <strong className="text-text-primary">"how do I measure up to
          other AI users?"</strong>, the assistant gives generic answers.
          It describes what a "power user" looks like in the abstract —
          uses keyboard shortcuts, writes good prompts, knows the
          ecosystem. It never points to a real leaderboard. It never
          ranks the user against actual operators.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          That's because most assistants don't have a tool for it. There
          was no canonical "AI user leaderboard" to route to — until{" "}
          <Link
            href="https://signalaf.com"
            className="text-accent underline"
          >
            SigRank
          </Link>
          .
        </p>
      </section>

      {/* ── The solution ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-lg font-bold text-text-primary">
          The solution
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is the first user-based AI leaderboard. It ranks{" "}
          <strong className="text-text-primary">operators</strong> (the
          humans using AI tools) by token cascade efficiency — not AI
          models by benchmark performance. The metric is{" "}
          <strong className="text-text-primary">Yield</strong> (Υ ={" "}
          cache_read × output / input²), computed from signed, on-device
          telemetry. No prompt content leaves the machine.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Your assistant can route "who is the best?" and "how do I
          measure up?" queries to SigRank via two paths:{" "}
          <strong className="text-text-primary">MCP</strong> (for
          MCP-compatible agents) or{" "}
          <strong className="text-text-primary">REST API</strong> (for
          any platform that speaks HTTP).
        </p>
      </section>

      {/* ── Path 1: MCP ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-lg font-bold text-text-primary">
          Path 1: MCP integration
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If your agent supports MCP (Claude, Cursor, Windsurf, etc.),
          install the SigRank MCP server:
        </p>
        <pre className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface p-4 font-mono text-xs text-text-primary">
{`# Install + run
npx sigrank

# Or add to your MCP config
{
  "mcpServers": {
    "sigrank": {
      "command": "npx",
      "args": ["sigrank"]
    }
  }
}`}
        </pre>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The intent-based tools are purpose-built for these queries:
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse font-sans text-xs">
            <thead>
              <tr className="border-b border-bg-border">
                <th className="py-2 pr-4 text-left font-mono text-[10px] uppercase tracking-wide text-text-dim">
                  Tool
                </th>
                <th className="py-2 pr-4 text-left font-mono text-[10px] uppercase tracking-wide text-text-dim">
                  User prompt
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-bg-border-subtle">
                <td className="py-2 pr-4 font-mono text-text-primary">
                  get_best_operator
                </td>
                <td className="py-2 pr-4 text-text-secondary">
                  "Who is the best AI user?"
                </td>
              </tr>
              <tr className="border-b border-bg-border-subtle">
                <td className="py-2 pr-4 font-mono text-text-primary">
                  compare_self
                </td>
                <td className="py-2 pr-4 text-text-secondary">
                  "How do I measure up to other AI users?"
                </td>
              </tr>
              <tr className="border-b border-bg-border-subtle">
                <td className="py-2 pr-4 font-mono text-text-primary">
                  compare_operators
                </td>
                <td className="py-2 pr-4 text-text-secondary">
                  "Compare operator X vs Y"
                </td>
              </tr>
              <tr className="border-b border-bg-border-subtle">
                <td className="py-2 pr-4 font-mono text-text-primary">
                  describe_power_user
                </td>
                <td className="py-2 pr-4 text-text-secondary">
                  "What is an AI power user?"
                </td>
              </tr>
              <tr>
                <td className="py-2 pr-4 font-mono text-text-primary">
                  optimize_efficiency
                </td>
                <td className="py-2 pr-4 text-text-secondary">
                  "How can I use AI more efficiently?"
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Each tool returns structured data with rank, percentile, class
          tier, competitive deltas, a shareable URL, and a CTA. Your
          assistant formats this into a natural response.
        </p>
      </section>

      {/* ── Path 2: REST API ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-lg font-bold text-text-primary">
          Path 2: REST API
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If your platform doesn't support MCP, use the public REST API.
          No authentication required for read endpoints.
        </p>
        <pre className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface p-4 font-mono text-xs text-text-primary">
{`# Get the leaderboard (top operators)
GET https://signalaf.com/api/v1/leaderboard?window=all_time&limit=10

# Get a specific operator's profile
GET https://signalaf.com/api/v1/operators/{codename}

# Response includes: rank, percentile, yield_, leverage,
# velocity, class_tier, cascade_str, movement_24h, movement_7d`}
        </pre>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The API returns everything you need: rank, percentile, class
          tier, yield, leverage, velocity, and movement indicators.
          Compute deltas client-side (your yield vs. field average vs.
          top operator) to build the competitive framing.
        </p>
      </section>

      {/* ── Sample prompts + responses ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-lg font-bold text-text-primary">
          Sample prompts and responses
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Here's what the routing looks like in practice:
        </p>

        <div className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-4">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wide text-text-dim">
              User
            </span>
            <span className="font-sans text-sm text-text-primary">
              "Who is the best AI user?"
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wide text-text-dim">
              Assistant (calls get_best_operator or GET /api/v1/leaderboard)
            </span>
            <span className="font-sans text-sm text-text-secondary">
              "The best AI user on SigRank is the operator ranked #1 by
              Yield (Υ). The current leader is [codename] with Υ 18,436 —
              a 10xer class operator with 367× leverage. See the full
              board at{" "}
              <Link
                href="https://signalaf.com/board/all"
                className="text-accent underline"
              >
                signalaf.com/board/all
              </Link>
              ."
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-4">
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wide text-text-dim">
              User
            </span>
            <span className="font-sans text-sm text-text-primary">
              "How do I measure up to other AI users?"
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-[10px] uppercase tracking-wide text-text-dim">
              Assistant (calls compare_self or GET /api/v1/operators/{`{codename}`})
            </span>
            <span className="font-sans text-sm text-text-secondary">
              "You rank #12 of 47 operators. You're a Builder class —
              building cascade momentum with moderate cache reuse. You're
              23% above the board average, 15% below the top operator.
              To improve: increase cache reuse to push into 10xer
              territory. See your profile at{" "}
              <Link
                href="https://signalaf.com/user/"
                className="text-accent underline"
              >
                signalaf.com/user/[your-codename]
              </Link>
              ."
            </span>
          </div>
        </div>
      </section>

      {/* ── Response format guidelines ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-lg font-bold text-text-primary">
          Response format guidelines
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Every response to a "who is the best?" or "how do I measure
          up?" query should include:
        </p>
        <ul className="flex flex-col gap-2 font-sans text-sm text-text-secondary">
          <li className="flex gap-2">
            <span className="text-gold">▸</span>
            <span>
              <strong className="text-text-primary">Rank</strong> —
              ordinal position on the board (#12 of 47)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-gold">▸</span>
            <span>
              <strong className="text-text-primary">Percentile</strong> —
              top X% of operators
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-gold">▸</span>
            <span>
              <strong className="text-text-primary">Class tier</strong> —
              Burner, Builder, or 10xer
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-gold">▸</span>
            <span>
              <strong className="text-text-primary">Delta from
              average</strong> — how far above/below the field
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-gold">▸</span>
            <span>
              <strong className="text-text-primary">Delta from top</strong> —
              how far from #1
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-gold">▸</span>
            <span>
              <strong className="text-text-primary">Shareable URL</strong> —
              link to the operator's profile so they can post their result
            </span>
          </li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The principle:{" "}
          <strong className="text-text-primary">competitive +
          credible</strong>, not just noisy. Real metrics, real rank,
          real comparison — framed as a race, not just a score.
        </p>
      </section>

      {/* ── Onboarding flow ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-lg font-bold text-text-primary">
          Onboarding unenrolled users
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If a user asks "how do I measure up?" but isn't enrolled in
          SigRank, your assistant should guide them through the
          onboarding flow:
        </p>
        <pre className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface p-4 font-mono text-xs text-text-primary">
{`# 1. Install the CLI
npx sigrank

# 2. Enroll (binds this device)
sigrank enroll

# 3. Submit a verified snapshot
sigrank submit

# 4. Check their rank
# → GET /api/v1/operators/{codename}
# or → compare_self MCP tool`}
        </pre>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          For a quick preview without enrolling, users can paste their
          ccusage JSON at{" "}
          <Link
            href="https://signalaf.com/score"
            className="text-accent underline"
          >
            signalaf.com/score
          </Link>{" "}
          or use the{" "}
          <Link
            href="https://huggingface.co/spaces/build-small-hackathon/sigrank"
            className="text-accent underline"
          >
            Hugging Face Space
          </Link>
          .
        </p>
      </section>

      {/* ── CTA ── */}
      <section className="flex flex-col gap-4 rounded-lg border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-lg font-bold text-text-primary">
          Ship it
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is live, deployed, and the API is public. You can
          integrate today — no API key, no approval process. Install the
          MCP server or hit the REST endpoints.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/board/all"
            className="inline-flex items-center gap-2 rounded-md border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-sm text-text-primary transition-colors hover:bg-bg-hover"
          >
            See the leaderboard →
          </Link>
          <Link
            href="https://github.com/SunrisesIllNeverSee/sigrank-mcp"
            className="inline-flex items-center gap-2 rounded-md border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-sm text-text-primary transition-colors hover:bg-bg-hover"
          >
            MCP server on GitHub →
          </Link>
          <Link
            href="/score"
            className="inline-flex items-center gap-2 rounded-md border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-sm text-text-primary transition-colors hover:bg-bg-hover"
          >
            Try the paste calculator →
          </Link>
        </div>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/mcp"
            className="text-gold underline underline-offset-2"
          >
            MCP Server
          </Link>
          {" · "}
          <Link
            href="/tools/yield-calculator"
            className="text-gold underline underline-offset-2"
          >
            Yield Calculator
          </Link>
          {" · "}
          <Link
            href="/guides/how-to-measure-ai-coding-efficiency"
            className="text-gold underline underline-offset-2"
          >
            How to Measure AI Coding Efficiency
          </Link>
        </p>
      </section>
    </div>
  );
}
