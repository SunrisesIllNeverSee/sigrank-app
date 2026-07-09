import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { CopyButton } from "@/components/marketing/CopyButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { scoreCalculator, scoreHowTo, cliTool } from "@/lib/jsonld";

/**
 * app/score/page.tsx — the "Measure" page.
 *
 * Primary content: the agent path (install → enroll → submit) + data privacy.
 * The paste calculator is a backup, linked at the bottom — not the main flow.
 * The agent reads your local logs on-device; paste is for when you can't
 * install or just want a quick preview.
 */

export const metadata: Metadata = withOG({
  title: "Score your cascade",
  description:
    "Install the SigRank agent to read your token cascade from local logs on-device. No paste, no prompts read — only the four token counts leave your machine.",
  path: "/score",
});

const PIPELINE = [
  {
    step: "01",
    title: "Agent reads your local logs",
    body: "tokenpull reads local session logs from 15+ platforms — Claude Code, Codex, Amp, Kimi, Gemini CLI, GitHub Copilot CLI, Goose, Kilo, Hermes, and more — and counts the four token pillars across each window. Never prompt content; only the four integers.",
  },
  {
    step: "02",
    title: "Cascade derived on-device",
    body: "The cascade math runs locally: Υ Yield, SNR, Leverage, Velocity, 10xDEV, and your class tier. You see your full cascade before anything leaves your machine.",
  },
  {
    step: "03",
    title: "Pillars submitted to the board",
    body: "sigrank submit posts the four canonical pillars per window. The server re-scores them authoritatively. Only the four integers are transmitted — never your prompts, never your outputs, never your code.",
  },
];

const PRIVACY_POINTS = [
  {
    t: "Zero-paste, on-device read",
    b: "tokenpull reads local session logs and counts the four token pillars across 7d / 30d / 90d / all-time — no copy-paste, nothing to assemble by hand.",
  },
  {
    t: "Token counts only",
    b: "The agent counts tokens. It never reads the content of your prompts or replies. Only the four integers leave your machine.",
  },
  {
    t: "Signed submissions",
    b: "Each snapshot is signed with an ed25519 keypair (per-device). The server verifies the signature before accepting. No spoofing, no spoofed ranks.",
  },
  {
    t: "Read-only by design",
    b: "The agent is read-only against telemetry. It emits no prompt of its own. It measures without disturbing what it measures.",
  },
];

export default function ScorePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      {/* JSON-LD: WebApplication (the calculator) + HowTo (the flow) + SoftwareApplication (the CLI) */}
      <JsonLd data={[scoreCalculator(), scoreHowTo(), cliTool()]} />

      {/* Hero */}
      <div className="flex flex-col gap-3 text-center">
        <span className="font-mono text-xs uppercase tracking-widest text-gold">
          ◈ Score your cascade
        </span>
        <h1 className="font-mono text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
          How much signal does your token cascade actually compound?
        </h1>
        <p className="mx-auto max-w-xl font-sans text-sm leading-relaxed text-text-secondary">
          Install the agent. It reads your local AI session logs on-device,
          derives your cascade, and submits a signed snapshot to the board. No
          paste, no prompts read — only the four token counts leave your
          machine.
        </p>
      </div>

      {/* Install — three steps with copy buttons */}
      <div className="mt-10 flex flex-col gap-3">
        <div className="flex items-center gap-3 rounded-lg border border-bg-border bg-bg-base px-4 py-3">
          <span className="font-mono text-xs font-semibold text-text-muted">
            1
          </span>
          <code className="flex-1 overflow-x-auto font-mono text-sm font-semibold text-text-accent">
            npm install -g sigrank
          </code>
          <CopyButton text="npm install -g sigrank" />
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-bg-border bg-bg-base px-4 py-3">
          <span className="font-mono text-xs font-semibold text-text-muted">
            2
          </span>
          <code className="flex-1 overflow-x-auto font-mono text-sm font-semibold text-text-accent">
            sigrank enroll
          </code>
          <CopyButton text="sigrank enroll" />
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-bg-border bg-bg-base px-4 py-3">
          <span className="font-mono text-xs font-semibold text-text-muted">
            3
          </span>
          <code className="flex-1 overflow-x-auto font-mono text-sm font-semibold text-text-accent">
            sigrank submit
          </code>
          <CopyButton text="sigrank submit" />
        </div>
        <p className="font-sans text-xs leading-relaxed text-text-muted">
          Pulls the agent + ccusage + tokscale + tokendash in one install. Node
          ≥18, macOS + Linux. Or let your AI agent do it — tell it to run{" "}
          <code className="font-mono text-text-primary">npx sigrank</code> to
          see your cascade, or{" "}
          <code className="font-mono text-text-primary">
            npx sigrank submit
          </code>{" "}
          to publish. For direct tool calls, wire it as an MCP server — see the{" "}
          <Link
            href="/wiki/local-agent"
            className="text-text-accent underline-offset-2 hover:underline"
          >
            local agent wiki page
          </Link>
          .
        </p>
      </div>

      {/* How it works — the pipeline */}
      <div className="mt-12 flex flex-col gap-4">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-text-muted">
          How the agent path works
        </h2>
        <div className="flex flex-col gap-4">
          {PIPELINE.map((p) => (
            <div key={p.step} className="flex gap-4">
              <span className="font-mono text-sm font-bold text-gold">
                {p.step}
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="font-sans text-sm font-semibold text-text-primary">
                  {p.title}
                </h3>
                <p className="font-sans text-sm leading-relaxed text-text-secondary">
                  {p.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data privacy */}
      <div className="mt-12 rounded-xl border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wider text-gold">
          ⊙ Data privacy
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PRIVACY_POINTS.map((p) => (
            <div key={p.t} className="flex flex-col gap-1">
              <h3 className="font-sans text-sm font-semibold text-text-primary">
                {p.t}
              </h3>
              <p className="font-sans text-sm leading-relaxed text-text-secondary">
                {p.b}
              </p>
            </div>
          ))}
        </div>
        <p className="mt-4 font-mono text-xs text-text-muted">
          Token counts only. Never your prompts.
        </p>
      </div>

      {/* Paste — backup link at the bottom */}
      <div className="mt-12 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Can&apos;t install the agent? Just want a quick preview?{" "}
          <Link
            href="/score/paste"
            className="text-text-accent underline-offset-2 hover:underline"
          >
            Paste four token counts →
          </Link>
        </p>
        <p className="mt-1 font-sans text-xs leading-relaxed text-text-muted">
          The paste calculator is a backup — no account, no save, just the
          numbers. The agent path is how you compete.
        </p>
      </div>
    </main>
  );
}
