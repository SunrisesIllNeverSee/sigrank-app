/**
 * app/ai-agent-evaluation/page.tsx — "AI Agent Evaluation — Measuring the
 * Human Directing the Agent"
 *
 * Frames AI agent evaluation as focusing on the agent, but agents are
 * directed by humans. SigRank measures the operator directing the agent.
 * Links into /ai-evaluation, /methodology, /vs/braintrust, /vs/langfuse.
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
  title: "AI Agent Evaluation — Measuring the Human Directing the Agent",
  description:
    "AI agent evaluation focuses on the agent. But agents are directed by humans. SigRank measures the operator directing the agent — privacy-preserving token telemetry, the Yield metric, and ed25519-signed snapshots.",
  path: "/ai-agent-evaluation",
});

const RELATED = [
  {
    href: "/ai-evaluation",
    title: "AI Evaluation — Measuring the Operator, Not Just the Model",
    desc: "The four-layer model of AI evaluation: model, output, safety, operator. Agent evaluation sits at the operator layer — measuring the human directing the agent.",
  },
  {
    href: "/methodology",
    title: "The SigRank Index — Methodology",
    desc: "How operator scores are computed from four token pillars, verified server-side, and ranked. The canonical methodology for evaluating agent operators.",
  },
  {
    href: "/vs/braintrust",
    title: "SigRank vs. Braintrust",
    desc: "Braintrust evaluates LLM applications and agent outputs. SigRank evaluates the operator directing the agent. Different layers, different questions.",
  },
  {
    href: "/vs/langfuse",
    title: "SigRank vs. Langfuse",
    desc: "Langfuse traces LLM application behavior. SigRank measures the human driving the LLM. Tracing the agent vs. evaluating the operator.",
  },
];

export default function AIAgentEvaluationPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "AI Agent Evaluation", path: "/ai-agent-evaluation" },
          ]),
          definedTerm(
            "AI Agent Evaluation",
            "AI agent evaluation is the measurement and comparison of AI agent performance. Most agent evaluation focuses on the agent itself — task completion rate, tool-use accuracy, latency. But agents are directed by humans (operators), and two operators directing the same agent produce wildly different results. SigRank measures the operator directing the agent via privacy-preserving token telemetry and the Yield metric (Υ = cache_read × output / input²). It is the operator layer of agent evaluation.",
            "/ai-agent-evaluation",
          ),
          faqPage([
            {
              question: "What is AI agent evaluation?",
              answer:
                "AI agent evaluation is the measurement and comparison of AI agent performance. Most agent evaluation focuses on the agent itself — task completion rate, tool-use accuracy, latency, cost per task. These are necessary metrics, but they measure the agent, not the human directing it. Two operators directing the same agent produce wildly different results because the operator determines the context, the prompts, and the workflow. Complete agent evaluation must measure both the agent and the operator. SigRank covers the operator layer.",
            },
            {
              question: "Why evaluate the operator, not just the agent?",
              answer:
                "Because the operator is the variable. You pick an agent and deploy it; the agent is a constant. The operator — the human directing the agent — is the variable that determines whether the agent succeeds or fails. Two operators on the same agent produce different task completion rates, different token efficiency, different cost per task. Agent-only evaluation averages that difference away. Operator evaluation with SigRank makes it visible, continuously, without reading a single prompt.",
            },
            {
              question: "How does SigRank evaluate agent operators?",
              answer:
                "SigRank captures four token pillars (input, output, cache-read, cache-write) on-device from real agent-directed sessions, computes the yield metric Υ = cache_read × output / input², and ranks operators by the architecture of their token cascade. Operators are classified into tiers and scored over 7-day, 30-day, 90-day, and all-time windows. Snapshots are ed25519-signed and verified server-side. No prompt content is ever read — only token counts. The same methodology applies whether the operator is directing a coding agent, a research agent, or a general LLM.",
            },
            {
              question: "Is SigRank a replacement for agent evaluation tools?",
              answer:
                "No — it is a complement. Agent evaluation tools (Braintrust, Langfuse) measure the agent: task completion, tool-use accuracy, trace latency. SigRank measures the operator directing the agent. Both layers matter. An agent driven poorly still produces poor results; an agent driven well can outperform a stronger agent driven poorly. Complete agent evaluation needs both the agent layer and the operator layer.",
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Agent Evaluation"
        terminalText="AGENT"
        title="AI Agent Evaluation — Measuring the Human Directing the Agent"
        subtitle={
          <>
            AI agent evaluation focuses on the agent — task completion, tool
            use, latency. But agents are directed by humans. SigRank measures
            the <span className="text-gold">operator</span> directing the
            agent — the variable that determines whether the agent succeeds.
          </>
        }
      />

      {/* ── What agent evaluation measures today ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          What agent evaluation measures today
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Agent evaluation today focuses on the agent itself. Task completion
          rate: did the agent finish the task? Tool-use accuracy: did the
          agent call the right tools in the right order? Latency: how long did
          the agent take? Cost per task: how many tokens did the agent burn?
          These are necessary metrics — but they measure the agent, not the
          human directing it.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The blind spot is the operator. The operator determines the context
          the agent works in, the prompts that frame each task, and the
          workflow that connects tasks. Two operators directing the same agent
          produce wildly different results — one may complete 90% of tasks
          efficiently, the other 40% while burning three times the tokens.
          Agent-only evaluation cannot see that difference because it holds
          the operator as a constant and averages it away.
        </p>
      </section>

      {/* ── The operator is the variable ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The operator is the variable
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          In practice, the agent is a constant and the operator is the
          variable. You pick an agent and deploy it; the question that remains
          is whether your team is directing it well. That question has been
          unanswerable until now — not because it is unimportant, but because
          there was no privacy-preserving way to measure it. Reading prompts
          is invasive; counting tokens is not.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank closes the gap. Four token pillars — input, output,
          cache-read, cache-write — are captured on-device from real
          agent-directed sessions. The yield metric{" "}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
            Υ = cache_read × output / input²
          </code>{" "}
          measures whether the operator&apos;s cascade is compounding signal
          or burning tokens. Snapshots are ed25519-signed and verified
          server-side. No prompt content is ever read — only token counts.
        </p>
      </section>

      {/* ── Complement, not competitor ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Complement to agent evaluation, not a competitor
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Agent evaluation tools like Braintrust and Langfuse measure the
          agent: traces, tool calls, task completion, latency. SigRank
          measures the operator directing the agent. Both layers matter. An
          agent driven poorly still produces poor results; an agent driven
          well can outperform a stronger agent driven poorly. Complete agent
          evaluation needs both the agent layer and the operator layer — and
          the operator layer is the one most teams are missing.
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
              What is AI agent evaluation?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              The measurement and comparison of AI agent performance — task
              completion, tool use, latency, cost. Most agent evaluation
              measures the agent. SigRank measures the operator directing the
              agent.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Why evaluate the operator, not just the agent?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              The operator is the variable. You deploy an agent; the question
              that remains is whether your team directs it well. Agent-only
              evaluation averages operator difference away. SigRank makes it
              visible, continuously, without reading prompts.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How does SigRank evaluate agent operators?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Four token pillars captured on-device from real agent-directed
              sessions. Yield (Υ = cache_read × output / input²) measures
              cascade architecture. ed25519-signed snapshots, cohort-relative
              ranking. No prompt content ever read.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Is SigRank a replacement for agent evaluation tools?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              No — it is a complement. Agent tools (Braintrust, Langfuse)
              measure the agent. SigRank measures the operator directing the
              agent. Complete agent evaluation needs both layers.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
