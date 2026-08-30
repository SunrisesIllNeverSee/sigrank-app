/**
 * app/ai-evaluation-platform/page.tsx — "AI Evaluation Platform — SigRank"
 *
 * Positions SigRank as an AI evaluation platform for operators. Highlights
 * four properties: content-free, continuous, cohort-relative, governed.
 * Links into /methodology, /developers, /mcp, /pricing.
 *
 * JSON-LD: breadcrumb() + definedTerm() + faqPage().
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "AI Evaluation Platform — SigRank",
  description:
    "SigRank is an AI evaluation platform for operators. Content-free, continuous, cohort-relative, and governed — privacy-preserving token telemetry, the Yield metric, and ed25519-signed snapshots. Integrate via CLI, MCP, or API.",
  path: "/ai-evaluation-platform",
});

const RELATED = [
  {
    href: "/methodology",
    title: "The SigRank Index — Methodology",
    desc: "How operator scores are computed from four token pillars, verified server-side, and ranked. The canonical methodology behind the SigRank platform.",
  },
  {
    href: "/developers",
    title: "Developer Documentation",
    desc: "How to integrate the SigRank platform: CLI installation, snapshot submission, API access, and the MCP server for agent-native workflows.",
  },
  {
    href: "/mcp",
    title: "The SigRank MCP Server",
    desc: "The Model Context Protocol server that lets AI agents query operator scores, leaderboard data, and Yield metrics programmatically.",
  },
  {
    href: "/pricing",
    title: "Pricing",
    desc: "The SigRank platform is free for individual operators. Team and enterprise tiers add private cohorts, governance, and SLA-backed verification.",
  },
];

export default function AIEvaluationPlatformPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "AI Evaluation Platform", path: "/ai-evaluation-platform" },
          ]),
          definedTerm(
            "AI Evaluation Platform",
            "An AI evaluation platform is a software system that systematically measures, compares, and reports AI performance. SigRank is an AI evaluation platform for operators — the humans driving the AI. It is content-free (token counts only, never prompt content), continuous (scores over 7-day, 30-day, 90-day, and all-time windows), cohort-relative (ranked against the live field), and governed (ed25519-signed snapshots verified server-side). The headline metric is Yield (Υ = cache_read × output / input²).",
            "/ai-evaluation-platform",
          ),
          faqPage([
            {
              question: "What is an AI evaluation platform?",
              answer:
                "An AI evaluation platform is a software system that systematically measures, compares, and reports AI performance. Most platforms evaluate models (MMLU, LMSYS Arena), outputs (LLM-as-judge platforms), or LLM applications (Braintrust, Langfuse). SigRank is an AI evaluation platform for operators — the humans driving the AI. It measures who is best at using the AI via privacy-preserving token telemetry, the Yield metric, and cohort-relative ranking.",
            },
            {
              question: "How is SigRank different from other AI evaluation platforms?",
              answer:
                "Other platforms evaluate the model, the output, or the application. SigRank evaluates the operator. Four properties set it apart: it is content-free (token counts only, never prompt content), continuous (scores over multiple time windows, not one-off tests), cohort-relative (ranked against the live field, not static thresholds), and governed (ed25519-signed snapshots verified server-side). It is a new category of platform, not a competitor to model or output evaluation platforms.",
            },
            {
              question: "How does SigRank protect operator privacy?",
              answer:
                "SigRank is content-free by design. It captures four token pillars — input, output, cache-read, cache-write — and nothing else. No prompt content is ever read or stored. Snapshots are ed25519-signed on-device and verified server-side, so the data is trustworthy without being readable. Operators appear on the public leaderboard under codenames; real identities are never shown. Token counts are the minimal sufficient statistic for operator evaluation, and they make the platform privacy-preserving by construction.",
            },
            {
              question: "How do I integrate the SigRank platform?",
              answer:
                "Three integration paths. (1) CLI: install the sigrank npm or pip package, run a coding session, and submit your ed25519-signed token snapshot. (2) MCP server: use the SigRank Model Context Protocol server to let AI agents query operator scores, leaderboard data, and Yield metrics programmatically. (3) API: access the REST API for leaderboard data, operator profiles, and aggregate stats. The platform is free for individual operators; team and enterprise tiers add private cohorts and governance.",
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Platform"
        terminalText="PLATFORM"
        title="AI Evaluation Platform — SigRank"
        subtitle={
          <>
            SigRank is an AI evaluation platform for operators.{" "}
            <span className="text-gold">Content-free, continuous,
            cohort-relative, and governed</span> — the four properties an
            operator evaluation platform needs.
          </>
        }
      />

      {/* ── What is an AI evaluation platform ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What is an AI evaluation platform?
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          An AI evaluation platform is a software system that systematically
          measures, compares, and reports AI performance. The category
          includes model evaluation platforms (MMLU, LMSYS Chatbot Arena),
          output evaluation platforms (LLM-as-judge services, human review
          platforms), and LLM application evaluation platforms (Braintrust,
          Langfuse). Each platform targets a different layer of the AI
          evaluation stack.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is an AI evaluation platform for the operator layer. It
          measures the humans driving the AI — the variable that determines
          whether the model you deployed is actually being driven well. No
          other platform covers this layer, because until now there was no
          privacy-preserving way to measure it. Token counts make it possible;
          reading prompts does not.
        </p>
      </section>

      {/* ── Four properties ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Four properties that define the platform
        </h2>
        <ul className="flex flex-col gap-3 font-sans text-sm leading-relaxed text-text-secondary">
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">Content-free.</strong> The platform
            captures four token pillars — input, output, cache-read,
            cache-write — and nothing else. No prompt content is ever read or
            stored. Token counts are the minimal sufficient statistic for
            operator evaluation, and they make the platform
            privacy-preserving by design.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">Continuous.</strong> Operators are
            scored over 7-day, 30-day, 90-day, and all-time windows, not on a
            one-off test. The platform runs on every session, in the
            background. You see your trend — improvement is visible, regression
            is visible.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">Cohort-relative.</strong> Operators
            are ranked against the live field, not against a static threshold.
            Your score reflects where you sit relative to other operators right
            now. The field shifts as the population grows, so the ranking stays
            meaningful.
          </li>
          <li className="rounded-lg border border-bg-border-subtle bg-bg-surface p-4">
            <strong className="text-gold">Governed.</strong> Every snapshot is
            ed25519-signed on-device and verified server-side. The yield
            metric{" "}
            <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
              Υ = cache_read × output / input²
            </code>{" "}
            is computed from signed data with cryptographic provenance. The
            platform is an open standard, not a proprietary black box.
          </li>
        </ul>
      </section>

      {/* ── Integration ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How to integrate
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Three integration paths. The CLI: install the sigrank npm or pip
          package, run a coding session, and submit your ed25519-signed token
          snapshot. The MCP server: use the Model Context Protocol server to
          let AI agents query operator scores, leaderboard data, and Yield
          metrics programmatically. The API: access the REST API for
          leaderboard data, operator profiles, and aggregate stats. The
          platform is free for individual operators; team and enterprise tiers
          add private cohorts, governance, and SLA-backed verification.
        </p>
      </section>

      {/* ── Related ── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Explore the category
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {RELATED.map((r) => (
            <Link
              key={r.href}
              href={r.href}
              className="group rounded-lg border border-bg-border bg-bg-surface p-5 transition-colors hover:border-bg-border-subtle hover:bg-bg-elevated"
            >
              <h3 className="font-mono text-sm font-bold text-text-primary group-hover:text-gold">
                {r.title}
              </h3>
              <p className="mt-1.5 font-sans text-sm leading-relaxed text-text-secondary">
                {r.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">FAQ</h2>
        <dl className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              What is an AI evaluation platform?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              A software system that measures, compares, and reports AI
              performance. SigRank is a platform for operators — the humans
              driving the AI. A new category, not a competitor to model or
              output platforms.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How is SigRank different?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              It evaluates the operator, not the model or output. Content-free,
              continuous, cohort-relative, and governed. ed25519-signed
              snapshots, the Yield metric, and no prompt content ever read.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How does SigRank protect privacy?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Token counts only — never prompt content. Snapshots are
              ed25519-signed on-device and verified server-side. Operators
              appear under codenames. Token counts are the minimal sufficient
              statistic for operator evaluation.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How do I integrate?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Three paths: CLI (npm/pip package), MCP server (agent-native
              queries), or REST API (leaderboard and stats). Free for
              individuals; team and enterprise tiers add private cohorts and
              governance.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
