import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { CopyButton } from "@/components/marketing/CopyButton";
import { JsonLd } from "@/components/seo/JsonLd";
import { scoreCalculator, scoreHowTo, cliTool } from "@/lib/jsonld";
import PillarFlowDiagram from "@/components/score/PillarFlowDiagram";
import WhereYouSit from "@/components/score/WhereYouSit";
import HowToGetScored from "@/components/score/HowToGetScored";

/**
 * app/score/page.tsx — the "Measure" page.
 *
 * Conversion-first layout:
 *   1. Hero (tight)
 *   2. Two-column glowing CTA (paste left, install right)
 *   3. One diagram (the four pillars — most intuitive)
 *   4. "Where do you sit?" hook (archetype yield range)
 *   5. Step-by-step "how to get scored" guide with visuals
 *   6. Privacy section
 *
 * The deeper diagrams (cascade snowball + yield formula) live on /learn.
 */

export const metadata: Metadata = withOG({
  title: "Score your cascade",
  description:
    "Paste four token counts for an instant cascade preview, or install the agent to read your logs on-device. Find out which archetype you are.",
  path: "/score",
});

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
          Two paths. Paste four numbers for an instant preview, or install
          the agent to read your logs automatically. Find out which
          archetype you are — and where you rank.
        </p>
      </div>

      {/* ── Two-column glowing CTA ── */}
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* LEFT: Manual upload (paste) */}
        <Link
          href="/score/paste"
          className="box-glow-soft group relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-bg-border bg-bg-surface/80 px-6 py-8 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:bg-bg-elevated hover:shadow-lg hover:shadow-gold/10"
        >
          <span className="absolute inset-x-0 top-0 h-[2px] bg-gold/0 transition-colors group-hover:bg-gold" />
          <span className="font-mono text-4xl leading-none text-gold transition-transform duration-200 group-hover:scale-110">
            ⌨
          </span>
          <span className="font-mono text-sm font-semibold uppercase leading-tight tracking-[0.12em] text-text-secondary transition-colors group-hover:text-text-primary">
            Manual upload
          </span>
          <span className="font-sans text-xs leading-relaxed text-text-muted">
            Paste four token counts. Instant score. No account, no
            install. 30 seconds.
          </span>
          <span className="mt-1 font-mono text-xs font-bold text-gold">
            → Paste your numbers
          </span>
        </Link>

        {/* RIGHT: Agent install */}
        <a
          href="#install"
          className="box-glow-soft group relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-bg-border bg-bg-surface/80 px-6 py-8 text-center transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:bg-bg-elevated hover:shadow-lg hover:shadow-gold/10"
        >
          <span className="absolute inset-x-0 top-0 h-[2px] bg-gold/0 transition-colors group-hover:bg-gold" />
          <span className="font-mono text-4xl leading-none text-gold transition-transform duration-200 group-hover:scale-110">
            ⚡
          </span>
          <span className="font-mono text-sm font-semibold uppercase leading-tight tracking-[0.12em] text-text-secondary transition-colors group-hover:text-text-primary">
            Agent install
          </span>
          <span className="font-sans text-xs leading-relaxed text-text-muted">
            Auto-reads your logs. Signed submissions. You're on the
            board. The real path.
          </span>
          <span className="mt-1 font-mono text-xs font-bold text-gold">
            → Install the agent
          </span>
        </a>
      </div>

      {/* ── One diagram: the four pillars ── */}
      <div className="mt-12">
        <PillarFlowDiagram />
      </div>

      {/* ── "Where do you sit?" hook ── */}
      <div className="mt-12">
        <WhereYouSit />
      </div>

      {/* ── Step-by-step guide ── */}
      <div className="mt-16">
        <HowToGetScored />
      </div>

      {/* ── Install commands (anchor target for the agent CTA) ── */}
      <div id="install" className="mt-12 scroll-mt-8 flex flex-col gap-3">
        <h2 className="text-center font-mono text-sm font-semibold uppercase tracking-wider text-text-muted">
          Install the agent
        </h2>
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
        <p className="text-center font-sans text-xs leading-relaxed text-text-muted">
          Pulls the agent + ccusage + tokscale + tokendash in one install.
          Node ≥18, macOS + Linux.
        </p>
      </div>

      {/* ── MCP install ── */}
      <div className="mt-6 flex flex-col gap-3">
        <div className="flex items-center justify-center gap-2">
          <span className="font-mono text-xs uppercase tracking-widest text-gold">
            ⊙ Or wire it as an MCP server
          </span>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-bg-border bg-bg-base px-4 py-3">
          <span className="font-mono text-xs font-semibold text-text-muted">
            $
          </span>
          <code className="flex-1 overflow-x-auto font-mono text-sm font-semibold text-text-accent">
            npx sigrank
          </code>
          <CopyButton text="npx sigrank" />
        </div>
        <p className="text-center font-sans text-xs leading-relaxed text-text-muted">
          Works with Claude Desktop, Cursor, Cline, Windsurf, and any
          MCP-compatible client. No API key required for read tools. See
          the{" "}
          <Link
            href="/mcp"
            className="text-text-accent underline-offset-2 hover:underline"
          >
            MCP server page
          </Link>{" "}
          for client setup + all 15 tools.
        </p>
      </div>

      {/* ── Closing CTA band (matches landing page style) ── */}
      <section className="box-glow mt-16 overflow-hidden rounded-2xl border border-gold/25 bg-gradient-to-b from-gold/5 to-bg-surface px-6 py-14 text-center">
        <div className="font-mono text-xs uppercase tracking-widest text-gold">
          ⊙ Get on the board
        </div>
        <h2 className="mx-auto mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-text-primary sm:text-4xl">
          Four integers in, full ledger out.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-text-secondary">
          Paste your numbers or run the agent — see your Υ Yield, your
          archetype, and your rank in under a minute.
        </p>

        {/* Two glowing action buttons */}
        <div className="mx-auto mt-8 grid w-full max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
          <Link
            href="/score/paste"
            className="box-glow-soft group relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-bg-border bg-bg-surface/80 px-6 py-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:bg-bg-elevated hover:shadow-lg hover:shadow-gold/10"
          >
            <span className="absolute inset-x-0 top-0 h-[2px] bg-gold/0 transition-colors group-hover:bg-gold" />
            <span className="font-mono text-3xl leading-none text-gold transition-transform duration-200 group-hover:scale-110">
              ⌨
            </span>
            <span className="font-mono text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary transition-colors group-hover:text-text-primary">
              Paste your numbers
            </span>
            <span className="font-sans text-xs text-text-muted">
              30 seconds · no install
            </span>
          </Link>
          <a
            href="#install"
            className="box-glow-soft group relative flex flex-col items-center justify-center gap-2 overflow-hidden rounded-xl border border-bg-border bg-bg-surface/80 px-6 py-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-gold/50 hover:bg-bg-elevated hover:shadow-lg hover:shadow-gold/10"
          >
            <span className="absolute inset-x-0 top-0 h-[2px] bg-gold/0 transition-colors group-hover:bg-gold" />
            <span className="font-mono text-3xl leading-none text-gold transition-transform duration-200 group-hover:scale-110">
              ⚡
            </span>
            <span className="font-mono text-sm font-semibold uppercase tracking-[0.12em] text-text-secondary transition-colors group-hover:text-text-primary">
              Install the agent
            </span>
            <span className="font-sans text-xs text-text-muted">
              auto-reads logs · signed
            </span>
          </a>
        </div>

        {/* Learn more link */}
        <p className="mt-6 font-sans text-xs text-text-muted">
          Want to understand the model first?{" "}
          <Link
            href="/learn"
            className="text-text-accent underline-offset-2 hover:underline"
          >
            Learn how it works →
          </Link>
        </p>
      </section>

      {/* ── Data privacy ── */}
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
    </main>
  );
}
