/**
 * app/platforms/page.tsx — "Supported AI Coding Platforms" page.
 *
 * Lists all 19+ AI coding agents whose telemetry SigRank measures.
 * Targets "AI coding tools", "AI coding agents", "supported platforms" queries.
 * ItemList schema for AI engine extraction.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, alternativesItemList } from "@/lib/jsonld";
import { WaveHero } from "@/components/ui/WaveHero";

export const metadata: Metadata = withOG({
  title: "Supported AI Coding Platforms — 19+ Agents Measured by SigRank",
  description:
    "SigRank reads session logs from 19+ AI coding agents: Claude Code, Codex CLI, Gemini CLI, Copilot CLI, Amp, Qwen Code, Goose, OpenCode, Kilo CLI, Hermes Agent, Devin, OMP, Pi, OpenClaw, Droid, Codebuff, and more. Run npx sigrank to get ranked.",
  path: "/platforms",
});

type Platform = {
  name: string;
  maintainer: string;
  adapter: string;
  url: string;
  description: string;
  githubStars?: string;
};

const SUPPORTED: Platform[] = [
  {
    name: "Claude Code",
    maintainer: "Anthropic",
    adapter: "claude",
    url: "https://claude.ai/claude-code",
    description: "Anthropic's terminal-native AI coding agent. Primary platform for most SigRank operators.",
  },
  {
    name: "Codex CLI",
    maintainer: "OpenAI",
    adapter: "codex",
    url: "https://github.com/openai/codex",
    description: "OpenAI's Rust-core CLI with OS-level sandboxing. 104k GitHub stars.",
    githubStars: "104k",
  },
  {
    name: "Gemini CLI",
    maintainer: "Google",
    adapter: "gemini",
    url: "https://github.com/google-gemini/gemini-cli",
    description: "Google's Gemini CLI. Being retired June 18 2026 in favor of Antigravity CLI. 106k GitHub stars.",
    githubStars: "106k",
  },
  {
    name: "Copilot CLI",
    maintainer: "GitHub",
    adapter: "copilot",
    url: "https://docs.github.com/en/copilot",
    description: "GitHub Copilot's CLI mode. Defaults to Claude Sonnet 4.5.",
  },
  {
    name: "Amp",
    maintainer: "Sourcegraph",
    adapter: "amp",
    url: "https://sourcegraph.com/amp",
    description: "Sourcegraph's AI coding agent with deep codebase awareness.",
  },
  {
    name: "Qwen Code",
    maintainer: "Alibaba",
    adapter: "qwen",
    url: "https://github.com/QwenLM/qwen-code",
    description: "Open fork of Gemini CLI powered by Qwen models. 25k GitHub stars.",
    githubStars: "25k",
  },
  {
    name: "Goose",
    maintainer: "Block / Linux Foundation",
    adapter: "goose",
    url: "https://github.com/block/goose",
    description: "MCP-driven general automation agent. 46k GitHub stars.",
    githubStars: "46k",
  },
  {
    name: "OpenCode",
    maintainer: "Anomaly",
    adapter: "opencode",
    url: "https://github.com/anomaly/opencode",
    description: "Provider-agnostic CLI supporting 75+ providers. 165k GitHub stars.",
    githubStars: "165k",
  },
  {
    name: "Kilo CLI",
    maintainer: "Community",
    adapter: "kilo",
    url: "https://github.com/kilo-ai/kilo",
    description: "Lightweight AI coding CLI. Reached 1.0 stability.",
  },
  {
    name: "Hermes Agent",
    maintainer: "Nous Research",
    adapter: "hermes",
    url: "https://github.com/NousResearch/hermes-agent",
    description: "Self-improving agent supporting 300+ models. 225k GitHub stars.",
    githubStars: "225k",
  },
  {
    name: "Devin",
    maintainer: "Cognition",
    adapter: "devin",
    url: "https://devin.ai",
    description: "Devin CLI and Devin Desktop by Cognition. Interactive AI software engineer.",
  },
  {
    name: "OMP (Oh My Pi)",
    maintainer: "can1357",
    adapter: "omp",
    url: "https://omp.sh",
    description: "60+ providers, 31 built-in tools, 14 LSP ops, 28 DAP ops. ~80k lines Rust core. Ships with @oh-my-pi/omp-stats local dashboard.",
  },
  {
    name: "Pi",
    maintainer: "mariozechner",
    adapter: "pi",
    url: "https://github.com/mariozechner/pi",
    description: "Minimal harness with sub-1k-token system prompt. 82.7k GitHub stars.",
    githubStars: "82.7k",
  },
  {
    name: "OpenClaw",
    maintainer: "Community",
    adapter: "openclaw",
    url: "https://github.com/openclaw/openclaw",
    description: "Open-source AI coding agent.",
  },
  {
    name: "Droid",
    maintainer: "Factory",
    adapter: "droid",
    url: "https://factory.ai",
    description: "Factory's Droid AI coding agent.",
  },
  {
    name: "Codebuff",
    maintainer: "Codebuff",
    adapter: "codebuff",
    url: "https://codebuff.com",
    description: "AI coding agent with multi-agent orchestration.",
  },
];

const GAPS: Platform[] = [
  {
    name: "Antigravity CLI",
    maintainer: "Google",
    adapter: "antigravity",
    url: "https://antigravity.google",
    description: "Replacing Gemini CLI June 18 2026. Google's free-tier users need somewhere to go. Adapter in development.",
  },
  {
    name: "Grok Build",
    maintainer: "xAI",
    adapter: "grok-build",
    url: "https://x.ai",
    description: "8 parallel subagents in isolated git worktrees. 256K context. SuperGrok/X Premium+ access.",
  },
  {
    name: "Kimi Code",
    maintainer: "Moonshot",
    adapter: "kimi-code",
    url: "https://moonshot.ai",
    description: "Replaced their earlier CLI in June 2026.",
  },
  {
    name: "Junie",
    maintainer: "JetBrains",
    adapter: "junie",
    url: "https://jetbrains.com/junie",
    description: "JetBrains IDE-integrated AI agent. Went GA June 2026.",
  },
  {
    name: "Crush",
    maintainer: "Community",
    adapter: "crush",
    url: "https://github.com/charmbracelet/crush",
    description: "25k GitHub stars. Best-looking terminal UI. Mid-session model swaps.",
    githubStars: "25k",
  },
];

export default function PlatformsPage() {
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([{ name: "Platforms", path: "/platforms" }]),
          alternativesItemList(
            SUPPORTED.map((p) => ({ name: p.name })),
            "/platforms",
            "Supported AI Coding Platforms",
          ),
        ]}
      />

      <WaveHero
        eyebrow="◈ Platforms"
        title="Supported AI Coding Platforms"
        subtitle={
          <>
            SigRank reads session logs from{" "}
            <span className="text-gold">{SUPPORTED.length} AI coding agents</span>{" "}
            and counting. Every platform listed here can be scored with{" "}
            <span className="font-mono text-gold">npx sigrank</span>. No install, no
            sign-in, token counts only.
          </>
        }
      />

      {/* ── Supported platforms ─────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Currently supported ({SUPPORTED.length})
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          These are the AI coding agents whose session logs SigRank can read,
          score, and rank. Each has a dedicated adapter that extracts the four
          token pillars (input, output, cache-write, cache-read) from local logs.
          Run <span className="font-mono text-text-primary">npx sigrank</span> to
          see your cascade across any of them.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {SUPPORTED.map((p) => (
            <div
              key={p.adapter}
              className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-bold text-text-primary">
                  {p.name}
                </h3>
                <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-text-muted">
                  {p.adapter}
                </code>
              </div>
              <p className="font-sans text-xs leading-relaxed text-text-secondary">
                {p.description}
              </p>
              <div className="flex items-center justify-between border-t border-bg-border-subtle pt-2">
                <span className="font-sans text-xs text-text-muted">
                  {p.maintainer}
                  {p.githubStars ? ` · ${p.githubStars} stars` : ""}
                </span>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-gold underline underline-offset-2"
                >
                  Visit site
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Coming soon ─────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Coming soon ({GAPS.length})
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          These AI coding agents are on the roadmap. Adapters are in development
          or planned. If you use one of these today,{" "}
          <Link
            href="/contact"
            className="text-gold underline underline-offset-2"
          >
            let us know
          </Link>{" "}
          and we will prioritize it.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {GAPS.map((p) => (
            <div
              key={p.adapter}
              className="flex flex-col gap-2 rounded-lg border border-bg-border-subtle bg-bg-surface/50 p-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-sm font-bold text-text-muted">
                  {p.name}
                </h3>
                <span className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-text-muted">
                  planned
                </span>
              </div>
              <p className="font-sans text-xs leading-relaxed text-text-secondary">
                {p.description}
              </p>
              <div className="flex items-center justify-between border-t border-bg-border-subtle pt-2">
                <span className="font-sans text-xs text-text-muted">
                  {p.maintainer}
                  {p.githubStars ? ` · ${p.githubStars} stars` : ""}
                </span>
                <a
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-text-muted underline underline-offset-2"
                >
                  Visit site
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How platform support works
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Every AI coding agent writes session logs to your local filesystem.
          SigRank reads those logs, extracts four token counts (input, output,
          cache-write, cache-read), and computes your Yield score. The adapter
          is the reader that knows where each agent stores its logs and how to
          parse them.
        </p>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-5">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary">
            {`npx sigrank          # detect your agents, read logs, show cascade
npx sigrank submit   # sign + publish to leaderboard
npx sigrank me       # see your yield, archetype, and class tier`}
          </pre>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank auto-detects which AI coding agents you have installed and
          reads their logs. You do not need to configure anything. If your agent
          is not detected, it may not be supported yet (check the Coming Soon
          list above) or its logs may be in a non-standard location.
        </p>
      </section>

      {/* ── CTA ─────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Ready to see your cascade?
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          No matter which AI coding agent you use, SigRank reads your logs and
          scores your efficiency. Install SigRank and submit your first signed
          snapshot in under a minute.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/score"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            Calculate your Yield
          </Link>
          <Link
            href="/board/all"
            className="rounded-lg border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs uppercase tracking-wide text-text-primary transition-colors hover:border-gold"
          >
            See the leaderboard
          </Link>
        </div>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/vs/ccusage"
            className="text-gold underline underline-offset-2"
          >
            vs ccusage
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
            href="/methodology"
            className="text-gold underline underline-offset-2"
          >
            Methodology
          </Link>
          {" · "}
          <Link
            href="/wiki"
            className="text-gold underline underline-offset-2"
          >
            Wiki
          </Link>
        </p>
      </section>
    </div>
  );
}
