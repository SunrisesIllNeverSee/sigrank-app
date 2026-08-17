/**
 * app/alternatives/mcp-ai-developer-tools/page.tsx —
 * "Best MCP Tools for AI Developers (2026)"
 *
 * SEO listicle targeting "best mcp tools for developers", "mcp server ai
 * coding", "model context protocol developer tools". Focuses on tools that
 * expose Model Context Protocol servers for AI developer workflows, and
 * argues that SigRank's MCP server is the only one that gives AI agents
 * self-awareness of their own cascade efficiency.
 *
 * RSC (no "use client"). Uses withOG, JsonLd (breadcrumb + faqPage +
 * ItemList), WaveHero, and Tailwind theme tokens matching the repo convention.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage, alternativesItemList } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Best MCP Tools for AI Developers (2026)",
  description:
    "The 6 best MCP tools for AI developers in 2026. SigRank MCP, Claude Code MCP, Continue MCP, Smithery, Glama MCP Registry, and MCP.so — which MCP server gives AI agents self-awareness of their own efficiency.",
  path: "/alternatives/mcp-ai-developer-tools",
});

type Tool = {
  name: string;
  measures: string;
  pros: string[];
  cons: string[];
  pricing: string;
  bestFor: string;
  featured?: boolean;
};

const TOOLS: Tool[] = [
  {
    name: "SigRank MCP",
    measures:
      "Operator-level token-cascade efficiency exposed via MCP — Υ Yield (cache_read × output / input²), compression ratio, SNR, cache hit rate, leverage, velocity, and class tier. The only MCP server that lets AI agents read their own token metrics and cascade efficiency.",
    pros: [
      "The only MCP server that gives AI agents self-awareness of their own cascade efficiency",
      "Agents can read their Υ Yield, cache hit rate, and class tier in real time and adjust behavior",
      "Platform-neutral: works across Claude, ChatGPT, Gemini, Copilot, Cursor, and 15+ platforms",
      "Privacy-preserving: on-device scanning, token counts only, ed25519-signed submissions",
      "Live leaderboard data accessible via MCP — agents can compare their operator to others",
    ],
    cons: [
      "Newer ecosystem — MCP server sample still growing",
      "Requires a CLI install and enrollment to submit telemetry",
    ],
    pricing: "Free (open-source MCP server, MIT-licensed code, CC-BY-4.0 data)",
    bestFor: "AI agents that need to read their own token metrics and cascade efficiency via MCP",
    featured: true,
  },
  {
    name: "Claude Code MCP",
    measures:
      "Anthropic's native MCP support in Claude Code — lets Claude read and write files, run commands, and interact with local tools. General-purpose agentic context, not efficiency-specific.",
    pros: [
      "Native to Claude Code — no extra install if you already use it",
      "General-purpose: file system, shell, and tool access for agentic workflows",
      "Well-documented and actively maintained by Anthropic",
    ],
    cons: [
      "General-purpose context, not efficiency-specific — no token-cascade metrics exposed",
      "Claude Code only — no cross-platform MCP support",
      "Agents cannot read their own efficiency or yield via this server",
    ],
    pricing: "Free (included with Claude Code)",
    bestFor: "Claude Code agents needing file and shell access via MCP",
  },
  {
    name: "Continue MCP",
    measures:
      "Continue's MCP server for AI code editor workflows — exposes codebase context, completions, and editor state to AI agents. Editor-integrated context, not efficiency-specific.",
    pros: [
      "Integrates with the Continue AI code editor ecosystem",
      "Exposes codebase context and editor state to agents",
      "Open-source and extensible",
    ],
    cons: [
      "Editor-context only — no token-cascade metrics or efficiency scoring",
      "Continue ecosystem only — no cross-platform MCP support",
      "Agents cannot read their own efficiency or yield via this server",
    ],
    pricing: "Free (open-source)",
    bestFor: "Continue editor users wanting codebase context exposed to AI agents via MCP",
  },
  {
    name: "Smithery",
    measures:
      "MCP server registry and package manager — discover, install, and manage MCP servers for AI workflows. Infrastructure for MCP, not an efficiency-specific server itself.",
    pros: [
      "Registry model — discover and install MCP servers in one place",
      "Package manager workflow — familiar to developers",
      "Growing catalog of MCP servers across categories",
    ],
    cons: [
      "Registry, not a server — does not expose any token or efficiency metrics itself",
      "Quality varies across listed servers — no efficiency-specific curation",
      "No agent self-awareness — agents cannot read their own metrics via Smithery",
    ],
    pricing: "Free (open-source registry)",
    bestFor: "Discovering and installing MCP servers for AI developer workflows",
  },
  {
    name: "Glama MCP Registry",
    measures:
      "Curated MCP server registry — browse and deploy MCP servers for AI applications. Discovery and deployment infrastructure, not an efficiency-specific server.",
    pros: [
      "Curated registry — quality-filtered MCP server listings",
      "Deployment support — helps teams stand up MCP servers",
      "Categorized by use case for easy discovery",
    ],
    cons: [
      "Registry, not a server — does not expose token or efficiency metrics itself",
      "No efficiency-specific servers in the catalog — no cascade or yield metrics",
      "No agent self-awareness — agents cannot read their own metrics via Glama",
    ],
    pricing: "Free (registry); some servers may have their own pricing",
    bestFor: "Browsing curated MCP servers and deploying them for AI applications",
  },
  {
    name: "MCP.so",
    measures:
      "MCP server directory and search — find MCP servers by capability, category, or keyword. Discovery surface, not an efficiency-specific server itself.",
    pros: [
      "Searchable directory — find MCP servers by keyword or category",
      "Simple, fast discovery interface",
      "Covers a broad range of MCP servers",
    ],
    cons: [
      "Directory, not a server — does not expose any token or efficiency metrics itself",
      "No efficiency-specific curation — no cascade, yield, or operator metrics",
      "No agent self-awareness — agents cannot read their own metrics via MCP.so",
    ],
    pricing: "Free (open directory)",
    bestFor: "Searching for MCP servers by capability or keyword",
  },
];

const FAQS = [
  {
    question: "What are MCP tools for AI developers?",
    answer:
      "MCP (Model Context Protocol) tools expose servers that let AI agents read context, run tools, and interact with external systems during coding workflows. They range from general-purpose servers (Claude Code MCP, Continue MCP) to registries and directories (Smithery, Glama, MCP.so). SigRank MCP is the only server that lets AI agents read their own token-cascade efficiency (Υ Yield: cache_read × output / input²) — giving agents self-awareness of whether their usage is compounding or burning.",
  },
  {
    question: "How does SigRank's MCP server work?",
    answer:
      "SigRank's MCP server exposes your operator-level token metrics to AI agents via the Model Context Protocol. An agent can query its Υ Yield (cache_read × output / input²), compression ratio, SNR, cache hit rate, leverage, velocity, and class tier in real time. This means the agent can see whether its own cascade is efficient and adjust its context strategy — reuse cache, compress inputs, or reduce token waste — without leaving the conversation.",
  },
  {
    question: "Which MCP tools are best for AI coding workflows?",
    answer:
      "For general agentic context (file access, shell commands), Claude Code MCP is the standard for Claude Code users. For editor-integrated context, Continue MCP. For discovering MCP servers, Smithery, Glama, and MCP.so are the main registries. But for agent self-awareness of coding efficiency, SigRank MCP is the only server that exposes token-cascade metrics — letting agents read and react to their own Υ Yield.",
  },
  {
    question: "Can AI agents read their own metrics via MCP?",
    answer:
      "Yes — but only via SigRank MCP. Most MCP servers expose external context (files, APIs, databases) to agents. SigRank MCP is the only server that exposes the agent's own token metrics back to the agent. This creates a feedback loop: the agent reads its Υ Yield, sees whether its cache reads are growing faster than its inputs, and adjusts its context strategy in real time. No other MCP server provides this self-awareness.",
  },
  {
    question: "Are MCP developer tools free?",
    answer:
      "Yes. SigRank MCP, Claude Code MCP, Continue MCP, Smithery, Glama MCP Registry, and MCP.so are all free. SigRank MCP is open-source (MIT-licensed). The difference is that only SigRank MCP exposes efficiency metrics to agents — the rest provide general context or discovery infrastructure without giving agents self-awareness of their own cascade.",
  },
];

export default function MCPAIDeveloperToolsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Alternatives", path: "/alternatives" },
            {
              name: "MCP AI Developer Tools",
              path: "/alternatives/mcp-ai-developer-tools",
            },
          ]),
          faqPage(FAQS),
          alternativesItemList(
            TOOLS,
            "/alternatives/mcp-ai-developer-tools",
            "Best MCP Tools for AI Developers (2026)",
          ),
        ]}
      />

      <WaveHero
        eyebrow="◈ Alternatives"
        title="Best MCP Tools for AI Developers (2026)"
        subtitle={
          <>
            Six MCP tools for AI dev workflows. Only one gives agents{" "}
            <span className="text-gold">self-awareness</span> of their own
            efficiency.
          </>
        }
      />

      {/* Intro — leads with the direct answer */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The short version
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Most MCP tools for AI developers expose <em>external context</em> to
          agents. Claude Code MCP gives agents file and shell access. Continue
          MCP gives agents codebase context. Smithery, Glama, and MCP.so help
          you discover and install MCP servers. None of these let an agent read
          its own <strong className="text-text-primary">efficiency</strong> —
          whether its token cascade is compounding or burning.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank MCP is the only server that exposes operator-level
          token-cascade efficiency to AI agents via the Model Context Protocol.
          An agent can read its Υ Yield (
          <span className="font-mono text-gold">cache_read × output / input²</span>),
          cache hit rate, and class tier in real time — and adjust its context
          strategy accordingly. The five tools below each serve a different MCP
          purpose. Here is how they compare.
        </p>
      </section>

      {/* Comparison table */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          At-a-glance comparison
        </h2>
        <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-bg-border">
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">
                  Tool
                </th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">
                  MCP role
                </th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">
                  Agent self-awareness?
                </th>
                <th className="p-3 font-mono text-xs uppercase tracking-wide text-text-muted">
                  Pricing
                </th>
              </tr>
            </thead>
            <tbody>
              {TOOLS.map((t) => (
                <tr
                  key={t.name}
                  className={`border-b border-bg-border-subtle last:border-b-0 ${t.featured ? "bg-gold/5" : ""}`}
                >
                  <td className="p-3 font-mono text-sm font-bold text-text-primary">
                    {t.featured ? (
                      <span className="text-gold">{t.name}</span>
                    ) : (
                      t.name
                    )}
                  </td>
                  <td className="p-3 font-sans text-xs leading-relaxed text-text-secondary">
                    {t.measures.split("—")[0].trim()}
                  </td>
                  <td className="p-3 font-sans text-xs text-text-secondary">
                    {t.featured ? (
                      <span className="text-gold">Yes — the only one</span>
                    ) : (
                      "No — external context only"
                    )}
                  </td>
                  <td className="p-3 font-sans text-xs text-text-secondary">
                    {t.pricing}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Detailed cards */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The 6 tools, in detail
        </h2>
        <div className="flex flex-col gap-5">
          {TOOLS.map((t, i) => (
            <article
              key={t.name}
              className={`flex flex-col gap-4 rounded-lg border p-6 ${
                t.featured
                  ? "border-gold/40 bg-gold/5"
                  : "border-bg-border bg-bg-surface"
              }`}
            >
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="font-mono text-xs text-text-muted">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="font-mono text-lg font-bold text-text-primary">
                  {t.featured ? (
                    <span className="text-gold">{t.name}</span>
                  ) : (
                    t.name
                  )}
                </h3>
                {t.featured && (
                  <span className="rounded-full border border-gold/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-gold">
                    editor&apos;s pick
                  </span>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div>
                  <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                    What it measures
                  </span>
                  <p className="mt-1 font-sans text-sm leading-relaxed text-text-secondary">
                    {t.measures}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                      Pros
                    </span>
                    <ul className="mt-1 flex flex-col gap-1">
                      {t.pros.map((p) => (
                        <li
                          key={p}
                          className="font-sans text-xs leading-relaxed text-text-secondary"
                        >
                          <span className="text-gold">+</span> {p}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                      Cons
                    </span>
                    <ul className="mt-1 flex flex-col gap-1">
                      {t.cons.map((c) => (
                        <li
                          key={c}
                          className="font-sans text-xs leading-relaxed text-text-secondary"
                        >
                          <span className="text-text-muted">−</span> {c}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                      Pricing
                    </span>
                    <p className="mt-1 font-sans text-sm text-text-secondary">
                      {t.pricing}
                    </p>
                  </div>
                  <div>
                    <span className="font-mono text-xs uppercase tracking-wide text-text-muted">
                      Best for
                    </span>
                    <p className="mt-1 font-sans text-sm text-text-secondary">
                      {t.bestFor}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Verdict */}
      <section className="flex flex-col gap-3 rounded-lg border border-gold/30 bg-gold/5 p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The verdict
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          If you want agents to read and write files, Claude Code MCP will let
          them. If you want codebase context, Continue MCP will provide it. If
          you want to discover MCP servers, Smithery, Glama, and MCP.so will
          help you find them. But if you want your AI agents to{" "}
          <strong className="text-text-primary">read their own efficiency</strong>{" "}
          — to see their Υ Yield, cache hit rate, and class tier, and adjust
          their context strategy in real time — SigRank MCP is the only server
          that gives agents self-awareness of their own cascade.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          Install the CLI, enroll, and connect the MCP server to give your
          agents cascade self-awareness:{" "}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
            npm install -g sigrank
          </code>
          .
        </p>
      </section>

      {/* FAQ */}
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

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/alternatives/ai-coding-efficiency-tools"
            className="text-gold underline underline-offset-2"
          >
            AI Coding Efficiency Tools
          </Link>
          {" · "}
          <Link
            href="/alternatives/ai-coding-metrics"
            className="text-gold underline underline-offset-2"
          >
            AI Coding Metrics Tools
          </Link>
          {" · "}
          <Link
            href="/vs/cursor"
            className="text-gold underline underline-offset-2"
          >
            vs Cursor
          </Link>
          {" · "}
          <Link
            href="/guides/how-to-read-your-cascade"
            className="text-gold underline underline-offset-2"
          >
            How to Read Your Cascade
          </Link>
        </p>
      </section>
    </div>
  );
}
