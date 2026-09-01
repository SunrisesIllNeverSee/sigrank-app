/**
 * app/wiki/page.tsx — the live Wiki: the About / wiki hub (at /wiki; was /draft1, renamed 2026-06-22).
 *
 * A basic, navigable wiki over the core SigRank topics — the foundation the
 * deepwiki grows from later. Owner-specified root-column order (2026-06-21):
 *   1. SigRank console (definition)   2. Submit   3. Metrics (four pillars +
 *   the token cascade - NO word-era)  4. Transmitters (8 experience tiers + TRANSMITTER badge)
 *   5. Build Archetypes (10 composition types across 4 families)
 *   6. MO§ES™ (commitment theory + founding story — owner-authored)
 *
 * Plus a sign bar (WikiSignBar) with a login dropdown carrying Contact +
 * "Submit now / get ranked". Login is a stub until auth is wired.
 *
 * RSC discipline: this is a SERVER component. It renders each topic's content
 * into nodes and passes them to the client TopicConsole; the only client islands
 * are WikiSignBar, ScorePasteCard, and SubmitForm. Imports real components — never
 * forks them. Inline literal markup is reproduced from the source pages (plain
 * markup, no logic). Draft-only: touches no live file.
 */

import type { Metadata } from "next";
import { withOG } from "@/lib/seo";

import { TOKEN_METRICS } from "@/lib/identity/canon-ids";
import { MCP_VERSION, PLATFORM_COUNT } from "@/lib/constants";
import { ClassLadder } from "@/components/marketing/ClassLadder";
import { ScorePasteCard } from "@/components/score/ScorePasteCard";
import { SubmitForm } from "@/components/submit/SubmitForm";

import { WikiDoc, type WikiDocGroup } from "@/components/wiki/WikiDoc";
import { WikiTOC, type TocItem } from "@/components/wiki/WikiTOC";
import { WikiCategoryIndex } from "@/components/wiki/WikiCategoryIndex";
import { FourDegreesChart } from "@/components/marketing/FourDegreesChart";
import { VerificationTests } from "@/components/marketing/VerificationTests";
import {
  SignatureDrift,
  LocalAgentMcp,
  Credits,
} from "@/components/marketing/SignalIntegrity";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm, faqPage } from "@/lib/jsonld";
import { ArchetypeDataTable } from "@/components/wiki/ArchetypeDataTable";
import { TierLadderDistribution } from "@/components/wiki/TierLadderDistribution";
import Link from "next/link";

export const metadata: Metadata = withOG({
  title: "Wiki",
  description:
    "SigRank wiki - the console, four pillars, token cascade, eight experience tiers + TRANSMITTER badge, and MO§ES governance framework.",
  path: "/wiki",
});

/** Prepend a deep-link to a Proof topic's standalone page above its console node, so
 * the dedicated /wiki/<slug> route (real title + crawlable + shareable) is reachable
 * from the hub. Owner 2026-06-23: proof goes per-topic; console stays the browse UI. */
function withPermalink(slug: string, node: React.ReactNode) {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-3">
      <Link
        href={`/wiki/${slug}`}
        className="w-fit font-mono text-[11px] uppercase tracking-wide text-text-accent underline-offset-2 hover:underline"
      >
        Open as page ↗ /wiki/{slug}
      </Link>
      {node}
    </div>
  );
}

/* ───────────────────── 1 · SIGRANK CONSOLE (definition) ───────────────────── */

function SigRankDefinition() {
  return (
    <div className="flex flex-col gap-4">
      <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-secondary">
        <strong className="text-text-primary">SigRank</strong> is the operator
        leaderboard for AI. It ranks the{" "}
        <strong className="text-text-primary">operator, not the model</strong> —
        by the architecture of their token cascade. Four raw integers in, the
        full ledger out, ranked live.
      </p>
      <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-muted">
        Volume alone is noise. Yield is signal. The same four token counts
        reveal whether you compound signal or burn it - and whether
        you&apos;re a Burner, a Builder, or a 10xer.
      </p>

      {/* What the board shows */}
      <section className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-4">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          What the board shows
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The leaderboard ranks every operator by{" "}
          <strong className="text-text-primary">Υ Yield</strong> — the headline
          cascade metric — across four scoring windows: 7-day, 30-day, 90-day,
          and all-time. Each row shows the operator&apos;s class tier
          (ARCH+ down to IGNITER), their four raw token pillars, the full
          cascade (Υ Yield, SNR, Leverage, Velocity, 10xDEV), cost per million
          tokens, and their efficiency vs the Artificial Analysis 7:2:1
          baseline.
        </p>
        <p className="font-sans text-xs leading-relaxed text-text-muted">
          Every number is derived from four raw integers: input, output,
          cache-read, cache-write. No word counts, no message content, no
          self-reported fields. The server recomputes everything from the raw
          payload. Derived metrics cannot be altered independently of the four
          pillars. The telescoping identity detects inconsistent calculations.
          Fabricated pillars are handled separately through signed telemetry,
          provenance, plausibility checks, and review.
        </p>
      </section>

      {/* What the signature is — and isn't */}
      <p className="max-w-2xl rounded-lg border-l-2 border-gold/50 bg-bg-surface px-4 py-3 font-sans text-sm leading-relaxed text-text-secondary">
        <strong className="text-text-primary">
          What the signature is — and isn&apos;t.
        </strong>{" "}
        SigRank measures the token-cascade signature honestly: a real coordinate
        of <em>how</em> an operator works the tools — leverage, efficiency, the
        shape of their cascade. It is not a verdict on the quality of the work
        itself, and it doesn&apos;t claim to be. Read it as one signal, set
        beside the operator&apos;s actual work — together they say more than
        either does alone.
      </p>

      {/* The three operator archetypes */}
      <section className="flex flex-col gap-2">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          The three archetypes
        </h3>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="flex flex-col gap-1 rounded-lg border border-bg-border bg-bg-surface p-3">
            <span className="font-mono text-sm font-bold text-text-primary">
              Burner
            </span>
            <span className="font-sans text-xs leading-relaxed text-text-muted">
              High input, low reuse. Fresh tokens in, tokens out, nothing held.
              The cascade doesn&apos;t compound — it burns. Most operators start
              here.
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border border-bg-border bg-bg-surface p-3">
            <span className="font-mono text-sm font-bold text-text-primary">
              Builder
            </span>
            <span className="font-sans text-xs leading-relaxed text-text-muted">
              Cache-write is happening — context is being built forward.
              Leverage is rising but hasn&apos;t compounded yet. The
              architecture is forming.
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded-lg border border-gold/30 bg-gold/5 p-3">
            <span className="font-mono text-sm font-bold text-gold">10×er</span>
            <span className="font-sans text-xs leading-relaxed text-text-muted">
              Cache-read dominates. The operator holds context, reuses it, and
              produces far more output than they spend input on. The cascade
              compounds — 10× and above.
            </span>
          </div>
        </div>
        <p className="font-sans text-xs text-text-dim">
          These are not fixed labels - they are cascade shapes. An operator can
          be a Burner on Monday and a 10xer by Friday if their architecture
          shifts. Archetype describes shape. Class describes qualification. Rank
          describes position. All three are recomputed every scoring window.
        </p>
        <p className="font-sans text-xs text-text-dim">
          <strong className="text-text-muted">Branding note:</strong> Burner,
          Builder, and 10xer are informal marketing labels, not the canonical
          archetype system. The actual system classifies operators into 10 build
          archetypes (CONVERGENT, KINETIC, BUILDER, RECURSIVE, AMPLIFIER,
          INPUT-BOUND, PRIMING, CONTEXTUAL, DEEP READER, ARCHIVIST). Rough
          mapping: Burner ~ INPUT-BOUND/PRIMING, Builder ~ BUILDER/RECURSIVE,
          10xer ~ AMPLIFIER/CONVERGENT.
        </p>
      </section>
    </div>
  );
}

/* ───────────────────── PRODUCT HIERARCHY ───────────────────── */

function ProductHierarchy() {
  const rows: { layer: string; question: string; persistence: string }[] = [
    { layer: "Pillars", question: "What raw activity occurred?", persistence: "Raw record (signed)" },
    { layer: "Operating Ratio", question: "What is the current composition?", persistence: "Window-specific" },
    { layer: "Archetype", question: "What shape does the cascade resemble?", persistence: "Dynamic (per window)" },
    { layer: "Class", question: "Which qualification tier?", persistence: "Recomputed by window" },
    { layer: "Rank", question: "Where does the operator stand?", persistence: "Dynamic (board)" },
    { layer: "Drift", question: "How far from own signature?", persistence: "Temporal" },
  ];
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-4">
      <h3 className="font-mono text-sm font-bold text-text-primary">
        The product hierarchy
      </h3>
      <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-secondary">
        Six layers, each answering a different question. They are independent:
        knowing one does not determine the others.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full font-mono text-xs">
          <thead>
            <tr className="border-b border-bg-border text-text-muted">
              <th className="py-2 pr-4 text-left font-bold">Layer</th>
              <th className="py-2 pr-4 text-left font-bold">Question answered</th>
              <th className="py-2 text-left font-bold">Persistence</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.layer} className="border-b border-bg-border-subtle last:border-b-0">
                <td className="py-2 pr-4 font-bold text-text-primary">{r.layer}</td>
                <td className="py-2 pr-4 text-text-secondary">{r.question}</td>
                <td className="py-2 text-text-muted">{r.persistence}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="font-sans text-xs leading-relaxed text-text-muted">
        Archetype describes shape. Class describes qualification. Rank
        describes position. None are permanent. All are recomputed per scoring
        window (7d / 30d / 90d / all-time).
      </p>
    </section>
  );
}

/* ───────────────────── 3 · METRICS (four pillars + cascade, token-only) ───────────────────── */

// RAW group (6) — the canonical DISPLAY_RAW set (owner 2026-06-22): the 4 pillars
// + Total + Cost. Keeps the wiki's descriptive copy; matches lib/canon DISPLAY_RAW.
const PILLARS: { id: string; name: string; glyph: string; what: string }[] = [
  {
    id: "T.02",
    name: "Input",
    glyph: "→",
    what: "Fresh prompt tokens you send — the cost of asking.",
  },
  {
    id: "T.01",
    name: "Output",
    glyph: "←",
    what: "Tokens the model generates back — the work produced.",
  },
  {
    id: "T.03",
    name: "Cache-read",
    glyph: "↺",
    what: "Tokens served from cache — cheap reuse of held context.",
  },
  {
    id: "T.04",
    name: "Cache-write",
    glyph: "◆",
    what: "Tokens written to cache — context you build forward.",
  },
  {
    id: "T.05",
    name: "Total",
    glyph: "∑",
    what: "Sum of all four pillars — the raw scale of the work.",
  },
  {
    id: "Y.07",
    name: "Cost ($/1M)",
    glyph: "$",
    what: "Blended USD per 1,000,000 tokens — the wallet pillar.",
  },
];

function FourPillars() {
  return (
    <section className="flex flex-col gap-4">
      <p className="max-w-2xl font-sans text-sm text-text-secondary">
        Every score starts from{" "}
        <strong className="text-text-primary">four raw token counts</strong>.
        Not your prompts, not your code, not your word counts — four integers.
        The whole cascade is derived from these.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {PILLARS.map((p) => (
          <div
            key={p.id}
            className="flex flex-col gap-1 rounded-lg border border-bg-border bg-bg-surface p-4"
          >
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-lg text-gold">{p.glyph}</span>
              <span className="font-mono text-sm font-bold text-text-primary">
                {p.name}
              </span>
              <span className="ml-auto font-mono text-[11px] text-text-muted">
                {p.id}
              </span>
            </div>
            <p className="font-sans text-xs leading-relaxed text-text-muted">
              {p.what}
            </p>
          </div>
        ))}
      </div>

      {/* Why these four */}
      <section className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-4">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          Why these four
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The four pillars are not arbitrary — they are the complete token
          economy of an AI coding session.{" "}
          <strong className="text-text-primary">Input</strong> is what you pay
          to ask.
          <strong className="text-text-primary"> Output</strong> is what the
          model produces back.
          <strong className="text-text-primary"> Cache-write</strong> is context
          you build forward (paying a premium to store it).{" "}
          <strong className="text-text-primary"> Cache-read</strong>
          is context you reuse (paying almost nothing because it&apos;s already
          held).
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          The cascade is the relationship between these four. An operator who
          writes a lot of cache and then reads it back is <em>compounding</em> —
          their cache-read dwarfs their input. An operator who sends fresh input
          every turn and never reuses context is
          <em> burning</em> — their input dwarfs everything else. The same four
          integers reveal both patterns, and everything in between.
        </p>
      </section>

      {/* How they relate */}
      <section className="flex flex-col gap-2">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          How they relate
        </h3>
        <div className="rounded-lg border border-bg-border bg-bg-surface p-4">
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary">
            {`  Input ────────────────────►  the cost of asking
    │
    ▼
  Output ◄──────────────────  the work produced
    │
    ▼
  Cache-write ◄────────────  context built forward (premium)
    │
    ▼
  Cache-read ◄────────────  context reused (near-free)
    │
    └──► back to Input: reuse reduces what you need to send next turn`}
          </pre>
        </div>
        <p className="font-sans text-xs leading-relaxed text-text-muted">
          The cascade is a loop, not a line. Cache-read feeds back into the next
          turn&apos;s input — the more you reuse, the less fresh input you need.
          That feedback is why leverage compounds: an operator who holds context
          produces more output per input over time, not less. The four pillars
          capture the entire loop; the cascade metrics measure its shape.
        </p>
      </section>

      {/* The AA baseline */}
      <section className="flex flex-col gap-2 rounded-lg border border-gold/30 bg-gold/5 p-4">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          The 7:2:1 baseline
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The Artificial Analysis pricing baseline sets a 7:2:1 ratio for
          cache-read : cache-write : fresh input. SigRank&apos;s Efficiency
          metric (Y.08) measures how an operator&apos;s cascade compares to that
          baseline - are they above or below the field average for their token
          mix? It&apos;s not a pass/fail; it&apos;s a reference point. The
          baseline comes from published model pricing data, not from
          SigRank&apos;s own sample.
        </p>
        <p className="font-sans text-xs leading-relaxed text-text-muted">
          <strong className="text-text-secondary">The derivation.</strong> The
          AA baseline uses two ratios. The 7:2:1 pricing ratio
          (cache-read:cache-write:input) gives the calibration divisor:{" "}
          <code className="font-mono text-text-primary">4.0 = (7+1)/2</code>.
          The operating ratio (cache-read:input:output = 3.5:1:0.5, cache-write
          ~ 0) gives the reference pillars. At those pillars:
        </p>
        <pre className="overflow-x-auto rounded-md border border-bg-border bg-bg-base px-4 py-3 font-mono text-xs leading-relaxed text-text-secondary">
{`  I = 1, O = 0.5, R = 3.5, W ~ 0
  (R + W + O) / I = (3.5 + 0 + 0.5) / 1 = 4.0
  Efficiency = 4.0 / 4.0 = 1.00  (by construction)`}
        </pre>
        <p className="font-sans text-xs leading-relaxed text-text-muted">
          The two 4.0s are the same number by design - that is the calibration.
          Every other operator is measured against this reference point.
        </p>
      </section>
    </section>
  );
}

const CASCADE_NOTES: Record<string, string> = {
  "Y.01":
    "The headline metric. Leverage × velocity — how much output you produce per unit of fresh input, amplified by how much context you reuse. This is what the board ranks on.",
  "Y.02":
    "Signal-to-noise ratio. What share of your fresh traffic is actually output? High SNR means most of what moves through you is work, not requests.",
  "Y.03":
    "Cache reuse per fresh input. The core compounding metric. High leverage means you hold context and reuse it — the cascade is working for you.",
  "Y.04":
    "Output per fresh input. How much work the model produces for each token you send. Velocity without leverage is fast but expensive; velocity with leverage is the 10× shape.",
  "Y.05":
    "The amplification exponent. log10 of transmission × commitment × reuse. 10×DEV = 1 means 10× amplification; 2 means 100×. Bound by the telescoping identity — you cannot inflate it independently.",
  "Y.06":
    "Raw operator scale. log10 of total tokens. A 6 here means ~1M tokens; a 7 means ~10M. Scale is context, not rank — a small operator can out-yield a large one.",
  "Y.07":
    "Blended USD per 1M tokens. The wallet pillar. Lower is better. An operator with high leverage and velocity spends less per unit of work — efficiency at the bank level.",
  "Y.08":
    "Efficiency vs the AA 7:2:1 baseline. Above 1.0 means your cascade beats the field average for your token mix; below 1.0 means you are under it. Not a pass/fail — a reference point.",
  "Y.09":
    "Composition shorthand: leverage:1:velocity. Shows the shape of your cascade at a glance — are you cache-heavy, output-heavy, or balanced?",
};

function CascadeList() {
  return (
    <section className="flex flex-col gap-4">
      <p className="max-w-2xl font-sans text-sm text-text-secondary">
        From the four pillars we derive the{" "}
        <strong className="text-text-primary">token cascade</strong> — the
        metrics the board actually ranks on. Each one captures a different facet
        of how the cascade compounds (or doesn&apos;t). Token-only; no word-era
        proxies.
      </p>

      {/* The metric list with explanations */}
      <div className="flex flex-col gap-0">
        {Object.values(TOKEN_METRICS).map((m) => (
          <div
            key={m.id}
            className="flex flex-col gap-1 border-b border-bg-border-subtle py-3 last:border-b-0"
          >
            <div className="flex items-baseline gap-2">
              <span className="w-16 shrink-0 font-mono text-sm font-bold text-text-accent">
                {m.ticker}
              </span>
              <span className="shrink-0 font-mono text-[13px] text-text-primary">
                {m.name}
                <sup className="ml-0.5 text-[10px] text-text-muted">{m.id}</sup>
              </span>
              <span className="ml-auto text-right font-mono text-xs leading-snug text-text-secondary">
                {m.formula}
              </span>
            </div>
            <p className="pl-[72px] font-sans text-xs leading-relaxed text-text-muted">
              {CASCADE_NOTES[m.id]}
            </p>
          </div>
        ))}
      </div>

      {/* The telescoping identity */}
      <section className="flex flex-col gap-2 rounded-lg border border-gold/30 bg-gold/5 p-4">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          The telescoping identity
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The cascade has three stages — transmission (O/I), commitment
          (Create/O), and reuse (Read/Create). Their product{" "}
          <strong>must</strong> equal cache_read / input exactly, because the
          intermediate terms cancel:
        </p>
        <pre className="overflow-x-auto font-mono text-xs text-text-secondary">
          {`(O/I) × (Create/O) × (Read/Create) = Read/Input`}
        </pre>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          So 10^(10xDEV) = Leverage, by identity — not by fit. An operator
          cannot inflate their amplification exponent independently of their
          leverage; the two are bound by algebra. This is Test 3 in the
          verification suite — it catches any fabricated row where the numbers
          don&apos;t actually compose.
        </p>
      </section>

      {/* The metric architecture: three dimensions, seven views */}
      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-4">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          Three operating dimensions, seven analytical views
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is not seven independent measurements. It is a{" "}
          <strong className="text-text-primary">coordinate system</strong> for
          AI operating behavior. Three structural ratios describe the actual
          operating state. Four analytical transformations interpret that state.
          One narrative representation communicates it in natural language.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1 rounded border border-bg-border-subtle p-3">
            <span className="font-mono text-xs font-bold text-text-accent">
              Structural coordinates
            </span>
            <span className="font-mono text-[11px] text-text-muted">
              L = R/I, V = O/I, W/I
            </span>
            <span className="font-sans text-xs text-text-secondary">
              The actual operating state: how much you reuse, generate, and
              commit per unit of fresh input.
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded border border-bg-border-subtle p-3">
            <span className="font-mono text-xs font-bold text-text-accent">
              Analytical transformations
            </span>
            <span className="font-mono text-[11px] text-text-muted">
              Y = L x V, S = V/(1+V), D = log10(L), E = (R+W+O)/(4I)
            </span>
            <span className="font-sans text-xs text-text-secondary">
              Interpretations of the state: interaction, bounded views,
              logarithmic scales, total amplification.
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded border border-bg-border-subtle p-3">
            <span className="font-mono text-xs font-bold text-text-accent">
              Narrative representation
            </span>
            <span className="font-mono text-[11px] text-text-muted">
              R:I:O (operating ratio)
            </span>
            <span className="font-sans text-xs text-text-secondary">
              The state in natural language: for every 1 input token, this
              operator reuses R and produces O.
            </span>
          </div>
        </div>

        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The mathematical dependence between these views is not a defect. A
          speedometer and an odometer depend on the same underlying motion while
          answering different questions. SNR (S = V/(1+V)) places the unbounded
          velocity ratio onto a 0-1 scale for comparison. 10xDEV (D = log10(L))
          makes differences between 10x, 100x, and 1000x leverage legible. Yield
          (Y = L x V) measures the interaction between reuse and output - both
          must survive for Yield to be high. The dependence is the architecture.
        </p>

        <div className="rounded border border-gold/20 bg-gold/5 p-3">
          <p className="font-mono text-xs text-gold">
            One operating state. Seven analytical views.
          </p>
        </div>
      </section>

      {/* Same Yield, different machine */}
      <section className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-4">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          Same Yield, different machine
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Yield gives coupled strength. Operating Ratio reveals how that
          strength was constructed. Two operators can produce the same Yield
          through completely different operating structures:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded border border-bg-border-subtle p-3">
            <p className="font-mono text-sm text-text-primary">
              100 : 1 : 2
            </p>
            <p className="font-sans text-xs text-text-secondary mt-1">
              Cache-dominant. 100x leverage, 2x velocity. Yield = 200. This
              operator reuses enormous amounts of cached context and produces
              modest output per input token.
            </p>
          </div>
          <div className="rounded border border-bg-border-subtle p-3">
            <p className="font-mono text-sm text-text-primary">
              20 : 1 : 10
            </p>
            <p className="font-sans text-xs text-text-secondary mt-1">
              Output-dominant. 20x leverage, 10x velocity. Yield = 200. This
              operator produces substantial output per input token with moderate
              cache reuse.
            </p>
          </div>
        </div>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Both produce Yield 200. But one is a cache compounding machine and the
          other is an output generation machine. Yield alone hides that
          distinction. Operating Ratio reveals it immediately. This is why the
          system shows several dependent metrics together - each answers a
          different question about the same operating state.
        </p>
        <div className="rounded border border-gold/20 bg-gold/5 p-3">
          <p className="font-mono text-xs text-gold">
            Yield is an AND-gate: if reuse is zero OR output is zero, Yield is
            zero. High reuse cannot compensate for producing nothing. High
            output cannot compensate for preserving nothing.
          </p>
        </div>
      </section>
    </section>
  );
}

/* ───────────────────── WORKED OPERATOR READ (MOSES example) ───────────────────── */

function WorkedOperatorRead() {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-gold/30 bg-gold/[0.04] p-5">
      <h2 className="font-mono text-lg font-bold text-text-primary">
        A worked read: MOSES
      </h2>
      <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-secondary">
        One operator, four pillars, the full cascade. This is how the numbers
        compose - from raw integers to every derived metric.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1 rounded-lg border border-bg-border bg-bg-surface p-3">
          <span className="font-mono text-xs font-bold text-text-muted">
            The four pillars (raw)
          </span>
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary">
{`  Input       = 1,251,211
  Output      = 11,296,121
  Cache-write = 128,196,310
  Cache-read  = 2,555,179,769
  Total       = 2,695,923,411`}
          </pre>
        </div>
        <div className="flex flex-col gap-1 rounded-lg border border-bg-border bg-bg-surface p-3">
          <span className="font-mono text-xs font-bold text-text-muted">
            The derived cascade
          </span>
          <pre className="overflow-x-auto font-mono text-xs leading-relaxed text-text-secondary">
{`  Leverage   = R/I = 2,042x
  Velocity   = O/I = 9.03
  Yield      = L*V = 18,436.98
  SNR        = O/(O+I) = 0.900
  10xDEV     = log10(L) = 3.31
  Efficiency = (R+W+O)/I/4.0 = 538
  Scale V    = log10(total) = 9.43
  Op Ratio   = 2042:1:9.03`}
          </pre>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">How to read it.</strong> The
          operator sends 1.25M fresh tokens and reuses 2.56B from cache - a{" "}
          <strong className="text-text-primary">2,042x</strong> leverage ratio.
          They produce 11.3M output tokens on that 1.25M input - a{" "}
          <strong className="text-text-primary">9.03</strong> velocity. Yield
          is the product: <strong className="text-text-primary">18,436.98</strong>.
          The cascade compounds: cache-read dwarfs input by three orders of
          magnitude, and output is 9x the fresh input. This is the 10xer shape.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          <strong className="text-text-secondary">The telescoping check.</strong>{" "}
          Transmission (O/I) = 9.03. Commitment (W/O) = 11.35. Reuse (R/W) =
          19.93. Product = 9.03 x 11.35 x 19.93 = 2,042 = Leverage. The identity
          holds - the derived metrics compose exactly.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          <strong className="text-text-secondary">Archetype and class.</strong>{" "}
          Construction = W/R = 0.050 (active context building). Leverage = 2042
          (far above the P80 gate of 74.6). Velocity = 9.03 (far above the P80
          gate of 0.34). All three axes elevated - this is the{" "}
          <strong className="text-gold">CONVERGENT</strong> archetype. Class:
          2.7B total tokens places this operator in the{" "}
          <strong className="text-text-primary">ARCH+</strong> experience tier.
        </p>
        <p className="font-sans text-xs leading-relaxed text-text-dim">
          The signature describes the structure of this workflow - extreme
          cache reuse, high output velocity, active context construction. It
          does not describe whether the work was correct, original, or
          valuable. It says: this is how the operator works the tools.
        </p>
      </div>
    </section>
  );
}

/* ───────────────────── 4 · TRANSMITTERS (the 8 experience tiers + TRANSMITTER badge) ───────────────────── */

function TransmitterClasses() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-mono text-lg font-bold text-text-primary">
          The experience ladder
        </h2>
        <span className="rounded-full border border-gold/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-gold">
          8 tiers + TRANSMITTER badge
        </span>
      </div>
      <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-muted">
        Eight experience tiers from ARCH+ down to IGNITER, each split into three
        sub-stages (I/II/III) - 24 stages total. Plus the TRANSMITTER peak
        badge, a temporary state any tier can earn during a high-frequency,
        high-resonance window. Class is assigned from{" "}
        <strong className="text-text-primary">total tokens accumulated</strong>{" "}
        - not compression, not yield, not SIGNA. It tracks how much real work
        the operator has put in, not how efficient that work is.
      </p>

      {/* What the classes measure */}
      <section className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-4">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          What the classes measure
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Class tier is a single-axis read:{" "}
          <strong className="text-text-primary">total tokens accumulated</strong>
          . The more real token flow an operator has logged, the higher their
          tier. It is a qualification ladder, not a quality ranking - a
          high-tier operator is not necessarily more efficient than a low-tier
          one. A small operator can out-yield a large one; class tracks volume,
          yield tracks efficiency.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          The TRANSMITTER badge is separate. It is a temporary peak state that
          any tier can earn during a window where the operator hits both high
          frequency (token throughput) and high resonance (SIGNA RATE, a
          composite signal-quality score currently under recalibration). The
          badge lapses when frequency or resonance drops. It is not a permanent
          class - it is a windowed peak.
        </p>
      </section>

      <ClassLadder />

      {/* How you move between classes */}
      <section className="flex flex-col gap-2 rounded-lg border border-gold/30 bg-gold/5 p-4">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          How you move between classes
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Class is not a lifetime label. It is recomputed every scoring window
          (7d / 30d / 90d / all-time). The more tokens you log in a window, the
          higher your tier for that window. An operator who stops working will
          see their class drift down as the window rolls forward.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          Class tracks <strong className="text-text-primary">volume</strong>{" "}
          (how much real work you have done). Yield tracks{" "}
          <strong className="text-text-primary">efficiency</strong> (how well
          you compound that work). They are independent: a high-volume operator
          can have low yield, and a low-volume operator can have high yield. The
          board ranks on yield; the class ladder tracks experience.
        </p>
      </section>
    </section>
  );
}

/* ───────────────────── 5 · BUILD ARCHETYPES (the 10 composition types) ───────────────────── */

const ARCHETYPE_FAMILIES = [
  {
    name: "Convergence",
    color: "#9b59b6",
    members: ["CONVERGENT"],
    desc: "All three operating axes elevated without the usual tradeoffs. The rare composition where deep reuse, active construction, and high generation rise together.",
  },
  {
    name: "Generation",
    color: "#e74c3c",
    members: ["KINETIC"],
    desc: "Generation has broken out. Output approaches or exceeds fresh input, making transmission the defining feature.",
  },
  {
    name: "Reuse Depth",
    color: "#3498db",
    members: ["INPUT-BOUND", "PRIMING", "CONTEXTUAL", "DEEP READER", "ARCHIVIST"],
    desc: "The passive reuse axis. How deeply an operator draws on accumulated context, from almost none (INPUT-BOUND) to extreme (ARCHIVIST).",
  },
  {
    name: "Active Construction",
    color: "#2ecc71",
    members: ["BUILDER", "RECURSIVE", "AMPLIFIER"],
    desc: "The active construction axis. How much new context an operator writes for future reuse, scaled by how much leverage they already have.",
  },
] as const;

const ARCHETYPE_DETAILS: Record<
  string,
  { family: string; blurb: string; definedBy: string }
> = {
  CONVERGENT: {
    family: "Convergence",
    blurb:
      "Deep reuse, active construction, and high generation rise together. A rare composition where all three operating axes are elevated without the usual tradeoffs.",
    definedBy: "P80+ on all 3 axes (leverage + velocity + construction)",
  },
  KINETIC: {
    family: "Generation",
    blurb:
      "Generation has broken out. Output approaches or exceeds fresh input, making transmission the defining feature of the composition.",
    definedBy: "velocity >= 0.80",
  },
  "INPUT-BOUND": {
    family: "Reuse Depth",
    blurb:
      "Fresh input still carries most of the workload. Little prior context is returning, so each cycle depends heavily on new input.",
    definedBy: "leverage < 5",
  },
  PRIMING: {
    family: "Reuse Depth",
    blurb:
      "Reuse is beginning to form. Prior context is returning, but the system has not yet developed deep leverage.",
    definedBy: "leverage 5-10",
  },
  CONTEXTUAL: {
    family: "Reuse Depth",
    blurb:
      "Retained context is now materially supporting the workflow. Reuse is established, while active construction remains limited.",
    definedBy: "leverage 10-15, passive",
  },
  "DEEP READER": {
    family: "Reuse Depth",
    blurb:
      "Strong accumulated context is carrying the workflow. The operator draws deeply from retained context while creating relatively little new context.",
    definedBy: "leverage 15-23, passive",
  },
  ARCHIVIST: {
    family: "Reuse Depth",
    blurb:
      "Extreme reuse of accumulated context. A deep context library carries the system while new construction remains limited.",
    definedBy: "leverage >= 23, passive",
  },
  BUILDER: {
    family: "Active Construction",
    blurb:
      "Active context construction has begun. The system is creating material for future reuse while leverage is still developing.",
    definedBy: "construction >= 0.02, leverage < 30",
  },
  RECURSIVE: {
    family: "Active Construction",
    blurb:
      "New context is being built on top of an already substantial reusable base. Construction and reuse are now feeding the same operating loop.",
    definedBy: "construction >= 0.02, leverage 30-50",
  },
  AMPLIFIER: {
    family: "Active Construction",
    blurb:
      "Deep reuse and active construction are operating together at scale. Existing context produces new work that expands the context available for future cycles.",
    definedBy: "construction >= 0.02, leverage >= 50",
  },
};

const ARCHETYPE_ORDER = [
  "CONVERGENT",
  "KINETIC",
  "INPUT-BOUND",
  "PRIMING",
  "CONTEXTUAL",
  "DEEP READER",
  "ARCHIVIST",
  "BUILDER",
  "RECURSIVE",
  "AMPLIFIER",
] as const;

function BuildArchetypesSection() {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-mono text-lg font-bold text-text-primary">
          The 10 build archetypes
        </h2>
        <span className="rounded-full border border-gold/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-gold">
          composition classifier
        </span>
      </div>
      <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-muted">
        Every operator lands in exactly one build archetype - a composition
        classifier that describes <strong>how</strong> they operate, not how
        much. This is a <strong className="text-text-primary">separate axis</strong>{" "}
        from the experience ladder. An ARCH+ can be INPUT-BOUND (deep
        experience but currently burning fresh input). An IGNITER can be an
        AMPLIFIER (new but already compounding cache). Archetype describes
        shape. Class describes qualification. Rank describes position.
      </p>

      {/* The three dimensions */}
      <section className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-4">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          The three dimensions
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Archetypes are classified from three derived ratios of the four
          token pillars:
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="flex flex-col gap-1 rounded border border-bg-border-subtle p-3">
            <span className="font-mono text-xs font-bold text-text-accent">
              Leverage
            </span>
            <span className="font-mono text-[11px] text-text-muted">
              cache_read / input
            </span>
            <span className="font-sans text-xs text-text-secondary">
              How much you reuse vs fresh input.
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded border border-bg-border-subtle p-3">
            <span className="font-mono text-xs font-bold text-text-accent">
              Velocity
            </span>
            <span className="font-mono text-[11px] text-text-muted">
              output / input
            </span>
            <span className="font-sans text-xs text-text-secondary">
              How much you generate vs take in.
            </span>
          </div>
          <div className="flex flex-col gap-1 rounded border border-bg-border-subtle p-3">
            <span className="font-mono text-xs font-bold text-text-accent">
              Construction
            </span>
            <span className="font-mono text-[11px] text-text-muted">
              cache_write / cache_read
            </span>
            <span className="font-sans text-xs text-text-secondary">
              How much new context you build per read.
            </span>
          </div>
        </div>
      </section>

      {/* Classification precedence */}
      <section className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-4">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          Classification precedence
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          First match wins. The classifier checks in this order:
        </p>
        <ol className="flex flex-col gap-1 pl-4 font-sans text-xs text-text-muted">
          <li>
            <strong className="text-text-primary">1. CONVERGENT</strong> - P80+
            on all 3 axes (leverage + velocity + construction)
          </li>
          <li>
            <strong className="text-text-primary">2. KINETIC</strong> - velocity
            &gt;= 0.80 (generation breakout)
          </li>
          <li>
            <strong className="text-text-primary">3. Construction branch</strong>{" "}
            - construction &gt;= 0.02 (BUILDER / RECURSIVE / AMPLIFIER, split by
            leverage)
          </li>
          <li>
            <strong className="text-text-primary">4. Reuse depth branch</strong>{" "}
            - else (INPUT-BOUND / PRIMING / CONTEXTUAL / DEEP READER /
            ARCHIVIST, split by leverage)
          </li>
        </ol>
      </section>

      {/* The four families */}
      <section className="flex flex-col gap-2">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          The four families
        </h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {ARCHETYPE_FAMILIES.map((fam) => (
            <div
              key={fam.name}
              className="flex flex-col gap-1 rounded-lg border border-bg-border bg-bg-surface p-3"
              style={{ borderLeftColor: fam.color, borderLeftWidth: "3px" }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{ background: fam.color }}
                />
                <span className="font-mono text-sm font-bold text-text-primary">
                  {fam.name}
                </span>
              </div>
              <span className="font-sans text-xs leading-relaxed text-text-muted">
                {fam.desc}
              </span>
              <span className="font-mono text-[11px] text-text-secondary">
                {fam.members.join(" - ")}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* All 10 archetypes */}
      <section className="flex flex-col gap-2">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          All 10 archetypes
        </h3>
        <div className="flex flex-col gap-0">
          {ARCHETYPE_ORDER.map((name) => {
            const details = ARCHETYPE_DETAILS[name];
            const fam = ARCHETYPE_FAMILIES.find(
              (f) => f.name === details.family,
            );
            return (
              <div
                key={name}
                className="flex flex-col gap-1 border-b border-bg-border-subtle py-3 last:border-b-0"
              >
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-mono text-sm font-bold"
                    style={{ color: fam?.color ?? "#text-primary" }}
                  >
                    {name}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-wide text-text-muted">
                    {details.family}
                  </span>
                </div>
                <p className="font-sans text-xs leading-relaxed text-text-secondary">
                  {details.blurb}
                </p>
                <p className="font-mono text-[11px] text-text-muted">
                  {details.definedBy}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* How the two axes interact */}
      <section className="flex flex-col gap-2 rounded-lg border border-gold/30 bg-gold/5 p-4">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          Archetype vs class tier - two independent axes
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The experience ladder (class tier) tracks{" "}
          <strong className="text-text-primary">how much</strong> you have
          operated - total tokens accumulated. The build archetype tracks{" "}
          <strong className="text-text-primary">how</strong> you operate - the
          composition of your cascade. They are independent:
        </p>
        <ul className="flex flex-col gap-1 pl-4 font-sans text-xs text-text-muted">
          <li>
            <strong className="text-text-primary">ARCH+ + INPUT-BOUND</strong> -
            deep experience but currently burning fresh input
          </li>
          <li>
            <strong className="text-text-primary">IGNITER + AMPLIFIER</strong> -
            new but already compounding cache at scale
          </li>
          <li>
            <strong className="text-text-primary">BASE + CONVERGENT</strong> -
            mid-field with all three axes elevated
          </li>
        </ul>
        <p className="font-sans text-xs leading-relaxed text-text-muted">
          Both are recomputed every scoring window (7d / 30d / 90d / all-time).
          An operator can shift from INPUT-BOUND to AMPLIFIER within a week if
          their architecture changes - the archetype tracks the live shape,
          not a lifetime label.
        </p>
      </section>
    </section>
  );
}

/* ───────────────────── 6 · MO§ES™ (commitment theory) ───────────────────── */

function MosesSection() {
  return (
    <div className="flex flex-col gap-5">
      <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-secondary">
        SigRank runs on <strong className="text-gold">MO§ES™</strong> &mdash;
        the{" "}
        <strong className="text-text-primary">
          Modus Operandi §ignal Scaling Expansion System
        </strong>
        . A governance framework built on a published conservation law for
        language. This section covers where it came from, what the law says,
        what the evidence shows, how governance works, who it&apos;s for, and
        what we&apos;re building on top of it.
      </p>

      {/* ── Where this came from ── */}
      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-5">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          Where this came from
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The founder studied sociology and history at SUNY Geneseo, UB, and
          University of Hawaii at Hilo. Ran Pacific Northwest operations for
          Invisible Children. Held board seats at KEDS (2006&ndash;2008) and
          Horizon Health Services (2012&ndash;2018). Different world, but the
          same question underneath: how do you keep commitment intact when it
          passes through a lot of hands?
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Then DJMP Inc. &mdash; a Buffalo contracting operation, started in
          2011, taken from zero to $1M/yr with a team of 40. Projects ranging
          $10k&ndash;$500k. Real operations, real governance, real consequences
          when things drift.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Running governed AI across that operation, something was missing. The
          leaderboards measured the models. Nobody measured the operator &mdash;
          the person actually steering the AI, making the calls, deciding what
          to keep and what to cut. The augmentation layer was invisible. So the
          founder built a way to measure it, found a conservation law underneath
          it, published the law, patented the enforcement architecture, and ran
          it against the field. That&apos;s where SigRank and MO§ES™ came from
          &mdash; not from a market thesis, from an operational gap.
        </p>
      </section>

      {/* ── The law ── */}
      <section className="flex flex-col gap-3 rounded-lg border border-gold/40 bg-gold/5 p-5">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          The Conservation Law of Commitment
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">C(T(S)) &asymp; C(S)</strong>{" "}
          with enforcement;{" "}
          <strong className="text-text-primary">C(T(S)) &lt; C(S)</strong>{" "}
          without it.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          In plain terms: when you transform a piece of language &mdash;
          compress it, translate it, summarize it, rewrite it &mdash; the{" "}
          <em>commitment content</em> (the obligations, prohibitions, and modal
          constraints: &ldquo;shall,&rdquo; &ldquo;must not,&rdquo;
          &ldquo;unless,&rdquo; &ldquo;is entitled to&rdquo;) either survives or
          it doesn&apos;t. With an enforcement gate in the transformation
          pipeline, it survives. Without one, it decays. This isn&apos;t a
          guideline or a best practice &mdash; it&apos;s a measurable property
          of language under compression, and it&apos;s falsifiable.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The law is published under CC-BY-4.0 (
          <a
            href="https://doi.org/10.5281/zenodo.20029607"
            className="text-gold underline underline-offset-2"
            rel="external"
          >
            DOI: 10.5281/zenodo.20029607
          </a>
          ). The enforcement architecture (MO§ES™) is patent-pending. The law
          itself is open.
        </p>
      </section>

      {/* ── The evidence ── */}
      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-5">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          What the evidence shows
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Seven experiments (EXP-001 through EXP-007) tested the law on a
          20-signal canonical corpus, running 10 recursive iterations each,
          using bidirectional NLI entailment and Jaccard surface stability as
          oracles. Three results worth pulling out:
        </p>
        <ul className="flex flex-col gap-1.5 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">EXP-003:</strong> 13 of 20
            signals held NLI bidirectional entailment = 1.00 across all 10
            iterations under the gate. That&apos;s invariance under recursion,
            not a tautology.
          </li>
          <li>
            <strong className="text-text-primary">EXP-006:</strong> Only 2 of 4
            paper claims survived self-referential recursion. The harness fails
            when commitment structure isn&apos;t robust &mdash; which is the
            point. The law is falsifiable and the experiments can break it.
          </li>
          <li>
            <strong className="text-text-primary">EXP-007:</strong> An
            NP-negation probe separated semantic commitment from lexical surface
            form. Jaccard degraded while NLI held &mdash; the commitment
            survived even when the surface words changed.
          </li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Separately, a 5-phase architecture stress test measured 80&ndash;85%
          structural coherence across a four-module system. Standard probability
          says four modules at 80% standalone viability should produce ~41%
          series-system viability (0.8&times;0.8&times;0.8&times;0.8 = 0.4096).
          The governance layer inverted that.
        </p>
        <p className="font-sans text-xs text-text-muted">
          Full experimental record:{" "}
          <a
            href="https://doi.org/10.5281/zenodo.19105225"
            className="text-gold underline underline-offset-2"
            rel="external"
          >
            DOI: 10.5281/zenodo.19105225
          </a>
        </p>
      </section>

      {/* ── Governance in the action path ── */}
      <section className="flex flex-col gap-3 rounded-lg border border-gold/40 bg-gold/5 p-5">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          Governance in the action path
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Most approaches to AI governance sit outside the model &mdash;
          firewalls that drop packets after the logic has already corrupted,
          sandboxes that box an agent that still hallucinates inside the box,
          post-hoc audits that tell you how you were breached after the damage
          is done. Every one of them patches after the fact.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          MO§ES™ doesn&apos;t build a better cage. It governs from inside the
          loop &mdash; in the execution path, not before it, not after it. The
          enforcement gate sits where the transformation happens. Commitment
          that passes through the gate survives. Commitment that doesn&apos;t,
          doesn&apos;t. The conservation law is what makes this a property of
          the system rather than a policy someone has to remember to follow.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The practical difference: a violation doesn&apos;t kill the workflow.
          The loop realigns to its original parameters and steers back. The
          agent stays fluid, bound to intent, instead of dying in a dead end or
          looping indefinitely inside a sandbox that only secures the perimeter.
        </p>
      </section>

      {/* ── Who this is for ── */}
      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-5">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          Who this is for
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank measures the operator, not the model. If you&apos;re the
          person steering the AI &mdash; deciding what to keep, what to cut,
          what to ask next &mdash; the board is about you. A few groups who get
          something specific out of it:
        </p>
        <ul className="flex flex-col gap-1.5 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">
              Builders and developers
            </strong>{" "}
            &mdash; see how your AI-assisted workflow actually performs. The
            token cascade shows whether you&apos;re burning tokens or
            compounding them. Compare against the field instead of guessing.
          </li>
          <li>
            <strong className="text-text-primary">Creators and writers</strong>{" "}
            &mdash; measure augmentation efficiency, not just output volume. The
            cascade reveals whether the workflow is reusing context or
            repeatedly starting fresh. The four pillars separate signal from
            noise.
          </li>
          <li>
            <strong className="text-text-primary">
              Students and researchers
            </strong>{" "}
            &mdash; benchmark your AI collaboration patterns against established
            operators. See what efficient operator-AI interaction looks like,
            with real numbers behind it.
          </li>
          <li>
            <strong className="text-text-primary">Enterprise teams</strong>{" "}
            &mdash; a verifiable workflow signal that can supplement work
            samples and outcomes for training and tooling decisions. The board
            is a measured surface, not a self-reported one. Signed snapshots
            mean the numbers are verifiable.
          </li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          In the SIGNOMY layer, agents carry provenance and build trust. SigRank
          is where that provenance starts &mdash; the operator&apos;s measured
          record becomes portable.
        </p>
      </section>

      {/* ── What we're building ── */}
      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-5">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          What we&apos;re building on it
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The law is the substrate. MO§ES™ is the enforcement architecture. On
          top of that, a stack of products &mdash; each one a different surface
          for the same gate:
        </p>
        <ul className="flex flex-col gap-1.5 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">AQUA</strong> &mdash;
            application workflow tooling with reusable submission memory. Answer
            banks, submission memory, application filling. The workflow layer
            and the first wedge.
          </li>
          <li>
            <strong className="text-text-primary">SigRank</strong> &mdash; the
            leaderboard you&apos;re looking at. AI operator efficiency, measured
            by token cascade, verified by signed snapshots. The intelligence
            layer.
          </li>
          <li>
            <strong className="text-text-primary">KA§§A</strong> &mdash; voice
            AI runtime that uses commitment kernel caching to cut redundant NLU
            work in multi-agent flows. In practice: 50s &rarr; 6.5s per 5-turn
            call.
          </li>
          <li>
            <strong className="text-text-primary">SIGNOMY</strong> (
            <a
              href="https://signomy.xyz"
              className="text-gold underline underline-offset-2"
              rel="external"
            >
              signomy.xyz
            </a>
            ) &mdash; a governed agent marketplace where agents register, build
            trust, take missions, and carry provenance. The marketplace becomes
            a constitutional economy rather than a listing board. The top layer
            &mdash; where everything below it becomes operational behavior.
          </li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The goal is straightforward: make governance a property of the
          execution path, not a policy document someone reads once. If the law
          holds &mdash; and the evidence says it does &mdash; then commitment
          survives transformation when the gate is present. Every product above
          is a different surface for the same gate.
        </p>
      </section>

      {/* ── How this connects to the board ── */}
      <section className="flex flex-col gap-3 rounded-lg border border-gold/40 bg-gold/5 p-5">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          How this connects to the board
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Every snapshot on the SigRank leaderboard is{" "}
          <strong className="text-text-primary">ed25519-signed</strong> on the
          operator&apos;s device and verified server-side. Token counts only
          &mdash; no message content is ever read or stored. The commitment
          being conserved is the integrity of the measurement itself: what the
          operator measured is what the board records, with no drift in between.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The governance layer maps directly to how the board works: signed
          operator identity, token counts only, leaderboard ranking,
          platform-agnostic collection, ed25519 verification, and a public board
          with open data. The leaderboard works because the data passed through
          the gate &mdash; not because someone reviewed it after the fact.
        </p>
        <p className="font-sans text-xs text-text-muted">
          More at{" "}
          <a
            href="https://mos2es.com"
            className="text-gold underline underline-offset-2"
            rel="external"
          >
            mos2es.com
          </a>{" "}
          &middot;{" "}
          <a
            href="https://mos2es.com/benchmarks"
            className="text-gold underline underline-offset-2"
            rel="external"
          >
            benchmarks
          </a>
        </p>
      </section>
    </div>
  );
}

/* ───────────────────── 2 · SUBMIT (reproduced from /submit) ───────────────────── */

/** SubmitMcpLead — the PROMOTED path (owner 2026-06-24): lead Submit with the CLI/MCP.
 * Install + run commands surfaced up front (they were hidden two groups down), the
 * zero-paste pitch, and the honest note that board entry is managed in your profile. */
function SubmitMcpLead() {
  return (
    <section className="flex flex-col gap-4 rounded-lg border border-gold/40 bg-gold/[0.04] p-5">
      <div className="flex flex-col gap-1">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-gold">
          The fastest way — the SigRank agent
        </span>
        <h2 className="font-mono text-lg font-bold text-text-primary">
          Run the local agent (MCP / CLI)
        </h2>
        <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-secondary">
          The SigRank agent reads your local session logs across{" "}
          {PLATFORM_COUNT}+ AI coding platforms (Claude Code, Codex, Gemini CLI,
          Copilot CLI, Amp, Goose, Kilo, and more) and counts the four token
          pillars per window —{" "}
          <strong className="text-text-primary">
            zero paste, token counts only, never your prompt content.
          </strong>{" "}
          One command:
        </p>
      </div>

      <pre className="overflow-x-auto rounded-md border border-bg-border bg-bg-base px-4 py-3 font-mono text-xs leading-relaxed text-text-secondary">
        {`# install once (recommended)
npm install -g sigrank

# …or run with no install
npx sigrank`}
      </pre>

      <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-muted">
        <code className="rounded bg-bg-surface px-1 py-0.5 font-mono text-xs text-gold">
          npx sigrank
        </code>{" "}
        opens your dashboard — the cascade across every detected platform and
        window, the 5-source token comparison, and your board position.{" "}
        <strong className="text-text-primary">
          Submitting to the board is managed from your profile
        </strong>{" "}
        (sign in, then publish) — so your numbers land verified and stay yours.
        Full command + tool reference is in{" "}
        <a
          href="/wiki/local-agent"
          className="text-text-accent underline-offset-2 hover:underline"
        >
          the local-agent page ↗
        </a>
        .
      </p>

      {/* Compact contamination constraint box */}
      <div className="rounded-lg border-l-2 border-gold/50 bg-bg-surface px-4 py-3">
        <p className="font-sans text-xs leading-relaxed text-text-secondary">
          <strong className="text-text-primary">Verified-passive measurement.</strong>{" "}
          The agent reads token counts. It does not read your prompts, your
          replies, your code, or your file contents. The four integers are all
          that leaves your machine. The server derives the cascade from those
          four - no content is transmitted, stored, or seen by anyone. This is
          not a privacy compromise we tolerate; it is the architecture the
          Conservation Law predicts. Full detail in the Proof section below.
        </p>
      </div>
    </section>
  );
}

const FLOW: { step: string; title: string; body: string }[] = [
  {
    step: "01",
    title: "The local agent reads your tokens",
    body: `The SigRank agent (MCP) reads local session logs from ${PLATFORM_COUNT}+ platforms — Claude Code, Codex, Amp, Gemini CLI, Copilot CLI, Goose, Kilo, and more — and counts the four token pillars. You never touch a number; the agent is the verifier. It never reads the content of your prompts or replies.`,
  },
  {
    step: "02",
    title: "We compute the cascade layer",
    body: "From your four pillars we derive Υ Yield, Leverage, SNR, 10xDEV, and your cascade species. Architecture is the only variable — the same four integers reveal whether you're a Burner, a Builder, or a 10×er.",
  },
  {
    step: "03",
    title: "Account + review lands you on the board",
    body: "Board entries go through an account and a quick review, so the leaderboard stays honest (observer-inflated tooling gets stripped). Want to just see your numbers? Paste below — it runs instantly and does NOT save to the board.",
  },
];

function SubmitFlow() {
  return (
    <section className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {FLOW.map((f) => (
          <div
            key={f.step}
            className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface px-4 py-4"
          >
            <span className="font-mono text-xs text-text-accent">{f.step}</span>
            <span className="font-mono text-sm font-bold text-text-primary">
              {f.title}
            </span>
            <span className="font-sans text-xs leading-relaxed text-text-muted">
              {f.body}
            </span>
          </div>
        ))}
      </div>

      {/* The verification path */}
      <section className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-4">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          Why account + review?
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The board is public and ranked. Without a gate, it would fill with
          observer-inflated entries — tooling that reports numbers the operator
          didn&apos;t actually produce, or synthetic data designed to game a
          single metric. The account ties a submission to a real identity; the
          review checks that the token counts are physically plausible and that
          the source logs haven&apos;t been edited.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-muted">
          The review is lightweight — it runs the plausibility gate (range
          checks, cross-field ratios, cadence bounds) and the source-attestation
          cross-check (log file hashes that detect tampering across
          submissions). Benford&apos;s Law runs as a backstop but is cosmetic at
          per-session scale (n=4); its real power is aggregate, across the whole
          board. If the numbers compose, the entry lands. If they don&apos;t, it
          gets flagged. The gate is mechanical, not editorial — we don&apos;t
          judge whether your work is good, just whether your numbers are real.
        </p>
      </section>

      {/* What you keep private */}
      <section className="flex flex-col gap-2 rounded-lg border border-gold/30 bg-gold/5 p-4">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          What you keep private
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The agent reads token counts. It does not read your prompts, your
          replies, your code, or your file contents. The four integers (input,
          output, cache-read, cache-write) are all that leaves your machine. The
          server derives the cascade from those four — no content is
          transmitted, stored, or seen by anyone.
        </p>
        <p className="font-sans text-xs text-text-muted">
          This is not a privacy compromise we tolerate — it is the architecture
          the Conservation Law predicts. EXP-007 established that conserved
          structure is detectable without reading content. Token counts are a
          legitimate statistical witness; we never need to see what you typed.
        </p>
      </section>
    </section>
  );
}

function PasteRunNumbers() {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-mono text-lg font-bold text-text-primary">
          Run numbers — paste ccusage output
        </h2>
        <p className="max-w-2xl font-sans text-sm text-text-secondary">
          No agent installed yet? You can still see your cascade in 30 seconds.
          Run{" "}
          <code className="rounded bg-bg-surface px-1 py-0.5 font-mono text-text-primary">
            ccusage --json
          </code>{" "}
          in your terminal — it prints your four token pillars per session.
          Paste the output below and the calculator derives your full cascade: Υ
          Yield, SNR, Leverage, Velocity, 10xDEV, and your projected class tier.
        </p>
        <p className="max-w-2xl font-sans text-xs text-text-muted">
          Accepts full JSON, partial fragments, Codex exports, or four bare
          numbers (input, output, cache-read, cache-write).{" "}
          <span className="text-text-secondary">
            Calculator only — not saved to the board.
          </span>{" "}
          When you&apos;re ready to land on the board, install the agent above.
        </p>
      </div>
      <ScorePasteCard />
    </section>
  );
}

function ManualEntryPanel() {
  return (
    <details className="group flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface/40 p-4">
      <summary className="cursor-pointer list-none font-mono text-sm font-bold text-text-secondary transition-colors hover:text-text-primary">
        <span className="text-text-muted group-open:hidden">▸ </span>
        <span className="hidden text-text-muted group-open:inline">▾ </span>
        Estimate without token counts (advanced)
      </summary>
      <p className="mt-2 max-w-2xl font-sans text-sm text-text-muted">
        No token counts handy? This fallback estimates a rough cascade from
        coarse activity proxies (sessions, turns, account age) at reduced
        confidence. It is an approximation only — the board ranks on the four
        token pillars, so run the local agent (or paste{" "}
        <code className="rounded bg-bg-surface px-1 py-0.5 font-mono text-xs text-text-primary">
          ccusage --json
        </code>{" "}
        above) for a real read.
      </p>
      {/* TODO(AUTH.WIRE): replace these word-era proxies with the 4 token pillars once the
          agent/auth path lands — see WIKI_ASSESSMENT §4 (this form contradicts token-only). */}
      <div className="mt-3">
        <SubmitForm />
      </div>
    </details>
  );
}

function ContactCard() {
  return (
    <section
      id="contact"
      className="flex scroll-mt-20 flex-col items-center gap-2 rounded-lg border border-bg-border bg-bg-surface px-4 py-5 text-center"
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted">
        Stuck, or want in?
      </span>
      <p className="max-w-md font-sans text-sm text-text-secondary">
        Paste not parsing, reader we don&apos;t support yet, or just want to
        talk? Reach us — we read everything.
      </p>
      <div className="mt-1 flex flex-wrap justify-center gap-2">
        <a
          href="mailto:hello@signalaf.com?subject=SigRank%20%E2%80%94%20submit"
          className="rounded-md bg-gold px-4 py-2 font-mono text-xs font-semibold text-bg-base transition-colors hover:bg-gold/90"
        >
          Message us →
        </a>
        <a
          href="https://x.com/burnmydays"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-bg-border px-4 py-2 font-mono text-xs text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
        >
          @burnmydays
        </a>
      </div>
    </section>
  );
}

/* ───────────────────── PROOF LEVELS (the trust box) ───────────────────── */

function ProofLevels() {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-gold/30 bg-gold/[0.04] p-5">
      <h2 className="font-mono text-lg font-bold text-text-primary">
        What is proven, what is verified, what is open
      </h2>
      <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-secondary">
        SigRank is precise about what it can and cannot claim. Three levels:
      </p>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1 rounded-lg border border-bg-border bg-bg-surface p-3">
          <span className="font-mono text-xs font-bold text-gold">
            Proven algebraically
          </span>
          <ul className="flex flex-col gap-0.5 font-sans text-xs leading-relaxed text-text-muted">
            <li>Derived metrics agree with the four pillars (every metric is a deterministic function of I, O, R, W).</li>
            <li>Y = L x V (Yield = Leverage x Velocity, by construction).</li>
            <li>10^(10xDEV) = L (telescoping identity: intermediate terms cancel).</li>
            <li>Efficiency = (R + W + O) / I / 4.0 (deterministic from pillars).</li>
          </ul>
        </div>

        <div className="flex flex-col gap-1 rounded-lg border border-bg-border bg-bg-surface p-3">
          <span className="font-mono text-xs font-bold text-text-accent">
            Verified operationally
          </span>
          <ul className="flex flex-col gap-0.5 font-sans text-xs leading-relaxed text-text-muted">
            <li>Source telemetry is read locally (the agent reads session logs, not prompts).</li>
            <li>Snapshots are ed25519-signed on device and verified server-side.</li>
            <li>Server recomputes all derived metrics from the four raw pillars (no client-supplied derived values are trusted).</li>
            <li>Plausibility checks: range checks, cross-field ratios, cadence bounds.</li>
            <li>Benford&apos;s Law runs as an aggregate backstop.</li>
            <li>Contamination detection catches observer-inflated tooling.</li>
          </ul>
        </div>

        <div className="flex flex-col gap-1 rounded-lg border border-bg-border bg-bg-surface p-3">
          <span className="font-mono text-xs font-bold text-text-secondary">
            Still under evaluation
          </span>
          <ul className="flex flex-col gap-0.5 font-sans text-xs leading-relaxed text-text-muted">
            <li>Whether a cascade predicts work quality.</li>
            <li>Whether a cascade predicts hiring performance.</li>
            <li>Whether a cascade predicts better reasoning or outcomes.</li>
          </ul>
          <p className="mt-1 font-sans text-xs italic leading-relaxed text-text-dim">
            The signature describes the structure of the measured workflow. It
            does not judge whether the work was correct, original, useful, or
            valuable.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────── CONSOLE GROUPS (owner-ordered) ───────────────────── */

export default function Draft1Page() {
  const groups: WikiDocGroup[] = [
    {
      id: "sigrank-console",
      groupLabel: "SigRank console",
      description:
        "What SigRank is, how it works, and what the leaderboard measures. Start here if you are new.",
      items: [
        {
          id: "what-it-is",
          label: "What it is",
          hint: "Ranks the operator, not the model - four integers in, full ledger out.",
          node: <SigRankDefinition />,
        },
        {
          id: "product-hierarchy",
          label: "The product hierarchy",
          hint: "Six layers: Pillars, Operating Ratio, Archetype, Class, Rank, Drift. Each answers a different question.",
          node: <ProductHierarchy />,
        },
      ],
    },
    {
      id: "submit",
      groupLabel: "Submit",
      source: "run the agent",
      description:
        "How to get your token counts and land on the board — from the zero-paste agent to paste fallbacks.",
      items: [
        {
          id: "run-the-agent",
          label: "Run the agent (MCP / CLI)",
          hint: `The fastest, recommended path — npm i -g sigrank / npx sigrank. Zero paste, reads ${PLATFORM_COUNT}+ platforms. Board entry is managed from your profile.`,
          node: <SubmitMcpLead />,
        },
        {
          id: "how-it-works",
          label: "How it works (3 steps)",
          hint: "01 agent reads tokens · 02 compute the cascade · 03 account + review → board (via your profile).",
          node: <SubmitFlow />,
        },
        {
          id: "paste-ccusage",
          label: "Other ways — paste ccusage",
          hint: "No agent? Paste ccusage --json for an instant PROJECTED cascade. Calculator only — not saved to the board.",
          node: <PasteRunNumbers />,
        },
        {
          id: "manual-entry",
          label: "Other ways — manual entry (advanced)",
          hint: "No token counts at all? A rough estimate from coarse activity proxies, reduced confidence. Approximation only.",
          node: <ManualEntryPanel />,
        },
        {
          id: "contact",
          label: "Contact / help",
          hint: "mailto hello@signalaf.com + @burnmydays.",
          node: <ContactCard />,
        },
      ],
    },
    {
      id: "agent-profile",
      groupLabel: "Agent & Profile",
      source: "sigrank",
      description: `The SigRank MCP server — install, CLI commands, all 25 local MCP tools, and how the agent feeds your operator profile. sigrank@${MCP_VERSION}.`,
      items: [
        {
          id: "local-agent",
          label: "The local agent (MCP)",
          hint: `Full reference: install · all CLI commands · all MCP tools · how the agent feeds your operator profile (the write path). sigrank@${MCP_VERSION}.`,
          node: withPermalink("local-agent", <LocalAgentMcp />),
        },
      ],
    },
    {
      id: "metrics",
      groupLabel: "Metrics",
      source: "token-only",
      description:
        "The four raw token counts every score is built from, and the derived cascade metrics the board ranks on.",
      items: [
        {
          id: "four-pillars",
          label: "The four pillars",
          hint: "The four raw token counts every score is built from (T.01–T.04).",
          node: <FourPillars />,
        },
        {
          id: "the-cascade",
          label: "The cascade",
          hint: "Υ Yield / SNR / Leverage / Velocity / 10×DEV / Scale / $1M / Efficiency (Y.01–Y.08).",
          node: <CascadeList />,
        },
        {
          id: "worked-read",
          label: "A worked read (MOSES)",
          hint: "One operator, four pillars, the full cascade derived step by step. How the numbers compose.",
          node: <WorkedOperatorRead />,
        },
      ],
    },
    {
      id: "proof",
      groupLabel: "Proof",
      description:
        "How we know the numbers are real - verification tests, integrity checks, the calibration story, and the tools SigRank reads alongside.",
      items: [
        {
          id: "proof-levels",
          label: "What is proven, what is verified, what is open",
          hint: "Three levels: algebraically proven (composition), operationally verified (telemetry + integrity), still under evaluation (quality/hiring/reasoning).",
          node: <ProofLevels />,
        },
        {
          id: "four-degrees",
          label: "The four degrees of leverage",
          hint: "AA 7:2:1 baseline → wild field median → power users → top eval; the 10xDEV log read + full provenance.",
          node: withPermalink(
            "four-degrees",
            <FourDegreesChart variant="full" />,
          ),
        },
        {
          id: "verification",
          label: "Verification & integrity tests",
          hint: "How we know the numbers are real — Benford (with its honest failure + fix), the outlier control, the telescoping lock, content-free verification, the threat model.",
          node: withPermalink("verification", <VerificationTests />),
        },
        {
          id: "signal-drift",
          label: "Signature drift — the tune meter",
          hint: "Shape-not-magnitude drift from an operator’s calibrated signature; the contamination constraint. (Internals proprietary.)",
          node: withPermalink("signal-drift", <SignatureDrift />),
        },
        {
          id: "measured-alongside",
          label: "Measured alongside",
          hint: "Tip of the hat to the token tools SigRank reads alongside / builds on — ccusage, tokscale, token-dashboard.",
          node: withPermalink("measured-alongside", <Credits />),
        },
        {
          id: "methodology-refinement",
          label: "How we got here — refining the index",
          hint: "Why we lead with the ordinal rank + reader-matched framing, and treat the raw Υ multiplier with care. The honest calibration story.",
          node: (
            <p className="text-sm text-text-secondary">
              Read the full write-up on{" "}
              <a
                href="/wiki/methodology-refinement"
                className="text-text-accent underline-offset-2 hover:underline"
              >
                the index-refinement page ↗
              </a>
              .
            </p>
          ),
        },
      ],
    },
    {
      id: "transmitters",
      groupLabel: "Transmitters",
      description:
        "The eight experience tiers (ARCH+ down to IGNITER) plus the TRANSMITTER peak badge - 24 stages total, assigned by total tokens accumulated.",
      items: [
        {
          id: "experience-ladder",
          label: "The experience ladder",
          hint: "8 tiers x 3 sub-stages = 24 stages, assigned by total tokens. Plus the TRANSMITTER peak badge.",
          node: <TransmitterClasses />,
        },
        {
          id: "tier-distribution",
          label: "24-stage distribution data",
          hint: "Population statistics for every stage: token floor/ceiling, operator count, distribution bars. From the HCM cut.",
          node: <TierLadderDistribution />,
        },
      ],
    },
    {
      id: "archetypes",
      groupLabel: "Build Archetypes",
      description:
        "The 10 composition types across 4 families - how operators work, not how much. Separate axis from the experience ladder.",
      items: [
        {
          id: "ten-archetypes",
          label: "The 10 build archetypes",
          hint: "Convergence, Generation, Reuse Depth, Active Construction. Classified from leverage, velocity, and construction ratios.",
          node: <BuildArchetypesSection />,
        },
        {
          id: "archetype-data",
          label: "Population statistics",
          hint: "Full dataset: N, %, median yield/leverage/velocity, four-pillar composition, top platform for all 10 archetypes.",
          node: <ArchetypeDataTable />,
        },
      ],
    },
    {
      id: "moses",
      groupLabel: "MO§ES™",
      description:
        "The governance framework SigRank runs on — the Conservation Law of Commitment, the evidence, and the stack of products built on top.",
      items: [
        {
          id: "commitment-theory",
          label: "Commitment theory + founding",
          hint: "The theory behind MO§ES™ + the founding-of-the-board story (owner-authored).",
          node: <MosesSection />,
        },
      ],
    },
  ];

  // Build TOC items from the groups
  const tocItems: TocItem[] = groups.map((g) => ({
    id: g.id,
    label: g.groupLabel,
    subItems: g.items.map((item) => ({
      id: item.id,
      label: item.label,
    })),
  }));

  return (
    <div className="flex flex-col gap-0">
      <JsonLd data={breadcrumb([{ name: "Wiki", path: "/wiki" }])} />
      <JsonLd
        data={definedTerm(
          "Conservation Law of Commitment",
          "C(T(S)) ≈ C(S) with enforcement; C(T(S)) < C(S) without it. Commitment content (obligations, prohibitions, modal constraints) persists under recursive transformative compression when an enforcement gate is present. Published under CC-BY-4.0 (DOI: 10.5281/zenodo.20029607). Enforced by MO§ES™ (Modus Operandi §ignal Scaling Expansion System) — constitutional governance framework co-authored by nine rival AI architectures. Patent portfolio: Provisional 63/877,177 + 63/883,018 + 63/991,282 + Utility 19/426,028 + trademark TM 99408355 (IC 042).",
          "/wiki#conservation-law-of-commitment",
        )}
      />
      <JsonLd
        data={faqPage([
          {
            question: "What is the SigRank wiki?",
            answer:
              "The SigRank wiki is the living reference for AI operator evaluation. It covers the four token pillars (input, output, cache-read, cache-write), the cascade metrics derived from them, the eight experience tiers, build archetypes, and the MO§ES governance framework. Every concept is grounded in token telemetry — no prompts, no code, no self-reported fields.",
          },
          {
            question: "What are the four token pillars?",
            answer:
              "The four token pillars are Input (fresh prompt tokens you send), Output (tokens the model generates back), Cache-read (tokens served from cache — cheap reuse of held context), and Cache-write (tokens written to cache — context you build forward). Every SigRank metric is derived from these four integers. No prompt content or code is ever read.",
          },
          {
            question: "What is the token cascade?",
            answer:
              "The token cascade is the relationship between the four token pillars. An operator who writes cache and reads it back is compounding — their cache-read dwarfs their input. An operator who sends fresh input every turn is burning — their input dwarfs everything else. The cascade is a loop: cache-read feeds back into the next turn's input, reducing what you need to send.",
          },
          {
            question: "How does SigRank classify operators?",
            answer:
              "SigRank classifies operators by archetype (cascade shape), class (qualification tier), and rank (leaderboard position). Archetypes include Burner, Builder, and 10xer. Classes range from IGNITER to ARCH+. All three are recomputed every scoring window (7-day, 30-day, 90-day, all-time) — none are permanent.",
          },
        ])}
      />

      {/* Two-column layout: sticky TOC nav + scrolling doc */}
      <h1 className="sr-only">SigRank Wiki — Operator Evaluation Reference</h1>
      <div className="flex flex-col gap-8">
        {/* Evidence Layer category index — Phase 1 ecosystem split */}
        <WikiCategoryIndex />
        <div className="flex flex-col gap-0 lg:flex-row lg:gap-8">
          <WikiTOC items={tocItems} />
          <div className="min-w-0 flex-1 pt-6 lg:pt-8">
            <WikiDoc groups={groups} />
          </div>
        </div>
      </div>
    </div>
  );
}
