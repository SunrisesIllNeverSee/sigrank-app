/**
 * app/wiki/page.tsx — the live Wiki: the About / wiki hub (at /wiki; was /draft1, renamed 2026-06-22).
 *
 * A basic, navigable wiki over the core SigRank topics — the foundation the
 * deepwiki grows from later. Owner-specified root-column order (2026-06-21):
 *   1. SigRank console (definition)   2. Submit   3. Metrics (four pillars +
 *   the token cascade — NO word-era)  4. Transmitters (the 9 classes)
 *   5. MO§ES™ (commitment theory + founding story — owner-authored)
 *
 * Plus a sign bar (WikiSignBar) with a login dropdown carrying Contact +
 * "Submit now / get ranked". Login is a stub until auth is wired.
 *
 * RSC discipline: this is a SERVER component. It renders each topic's content
 * into nodes and passes them to the client TopicConsole; the only client islands
 * are WikiSignBar, PasteForm, and SubmitForm. Imports real components — never
 * forks them. Inline literal markup is reproduced from the source pages (plain
 * markup, no logic). Draft-only: touches no live file.
 */

import type { Metadata } from 'next'
import { withOG } from '@/lib/seo'

import { TOKEN_METRICS } from '@/lib/canon/ids'
import { MCP_VERSION, PLATFORM_COUNT } from '@/lib/constants'
import { ClassLadder } from '@/components/marketing/ClassLadder'
import { PasteForm } from '@/components/submit/PasteForm'
import { SubmitForm } from '@/components/submit/SubmitForm'

import { TopicConsole, type TopicGroup } from '@/components/draft/TopicConsole'
import { ThreeDegreesChart } from '@/components/marketing/ThreeDegreesChart'
import { VerificationTests } from '@/components/marketing/VerificationTests'
import { SignatureDrift, LocalAgentMcp, Credits } from '@/components/marketing/SignalIntegrity'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb, definedTerm } from '@/lib/jsonld'
import Link from 'next/link'

export const metadata: Metadata = withOG({
  title: 'Wiki',
  description:
    'SigRank wiki — the console, the four pillars + token cascade, the nine transmitter classes, and MO§ES™ governance (the Conservation Law of Commitment, the Six Fold Flame, the empirical record, and the governed ecosystem).',
  path: '/wiki',
})

/** Prepend a deep-link to a Proof topic's standalone page above its console node, so
 * the dedicated /wiki/<slug> route (real title + crawlable + shareable) is reachable
 * from the hub. Owner 2026-06-23: proof goes per-topic; console stays the browse UI. */
function withPermalink(slug: string, node: React.ReactNode) {
  return (
    <div className="flex flex-col gap-3">
      <Link
        href={`/wiki/${slug}`}
        className="w-fit font-mono text-[11px] uppercase tracking-wide text-text-accent underline-offset-2 hover:underline"
      >
        Open as page ↗ /wiki/{slug}
      </Link>
      {node}
    </div>
  )
}

/* ───────────────────── 1 · SIGRANK CONSOLE (definition) ───────────────────── */

function SigRankDefinition() {
  return (
    <div className="flex flex-col gap-3">
      <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-secondary">
        <strong className="text-text-primary">SigRank</strong> is the operator leaderboard for AI — it
        ranks the <strong className="text-text-primary">operator, not the model</strong>, by the
        architecture of their token cascade. The console is the field at a glance: every operator,
        every metric, scored from four raw integers and ranked live.
      </p>
      <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-muted">
        Volume is noise. Yield is signal. The same four token counts reveal whether you compound
        signal or burn it — and whether you&apos;re a Burner, a Builder, or a 10×er.
      </p>
      <p className="max-w-2xl rounded-lg border-l-2 border-gold/50 bg-bg-surface px-4 py-3 font-sans text-sm leading-relaxed text-text-secondary">
        <strong className="text-text-primary">What the signature is — and isn&apos;t.</strong> SigRank
        measures the token-cascade signature honestly: a real coordinate of <em>how</em> an operator
        works the tools — leverage, efficiency, the shape of their cascade. It is not a verdict on the
        quality of the work itself, and it doesn&apos;t claim to be. Read it as one signal, set beside
        the operator&apos;s actual work — together they say more than either does alone.
      </p>
    </div>
  )
}

/* ───────────────────── 3 · METRICS (four pillars + cascade, token-only) ───────────────────── */

// RAW group (6) — the canonical DISPLAY_RAW set (owner 2026-06-22): the 4 pillars
// + Total + Cost. Keeps the wiki's descriptive copy; matches lib/canon DISPLAY_RAW.
const PILLARS: { id: string; name: string; glyph: string; what: string }[] = [
  { id: 'T.02', name: 'Input', glyph: '→', what: 'Fresh prompt tokens you send — the cost of asking.' },
  { id: 'T.01', name: 'Output', glyph: '←', what: 'Tokens the model generates back — the work produced.' },
  { id: 'T.03', name: 'Cache-read', glyph: '↺', what: 'Tokens served from cache — cheap reuse of held context.' },
  { id: 'T.04', name: 'Cache-write', glyph: '◆', what: 'Tokens written to cache — context you build forward.' },
  { id: 'T.05', name: 'Total', glyph: '∑', what: 'Sum of all four pillars — the raw scale of the work.' },
  { id: 'Y.07', name: 'Cost ($/1M)', glyph: '$', what: 'Blended USD per 1,000,000 tokens — the wallet pillar.' },
]

function FourPillars() {
  return (
    <section className="flex flex-col gap-3">
      <p className="max-w-2xl font-sans text-sm text-text-secondary">
        Every score starts from <strong className="text-text-primary">four raw token counts</strong> —
        nothing else, and never your prompt content. The whole cascade is derived from these.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {PILLARS.map((p) => (
          <div key={p.id} className="flex flex-col gap-1 rounded-lg border border-bg-border bg-bg-surface p-4">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-lg text-gold">{p.glyph}</span>
              <span className="font-mono text-sm font-bold text-text-primary">{p.name}</span>
              <span className="ml-auto font-mono text-[11px] text-text-muted">{p.id}</span>
            </div>
            <p className="font-sans text-xs leading-relaxed text-text-muted">{p.what}</p>
          </div>
        ))}
      </div>
    </section>
  )
}

function CascadeList() {
  return (
    <section className="flex flex-col gap-1.5">
      <p className="mb-2 max-w-2xl font-sans text-sm text-text-secondary">
        From the four pillars we derive the <strong className="text-text-primary">token cascade</strong> —
        the metrics the board actually ranks on. Token-only; no word-era proxies.
      </p>
      {Object.values(TOKEN_METRICS).map((m) => (
        <div
          key={m.id}
          className="flex items-baseline gap-2 border-b border-bg-border-subtle py-1.5 last:border-b-0"
        >
          <span className="w-16 shrink-0 font-mono text-sm font-bold text-text-accent">{m.ticker}</span>
          <span className="shrink-0 font-mono text-[13px] text-text-primary">
            {m.name}
            <sup className="ml-0.5 text-[10px] text-text-muted">{m.id}</sup>
          </span>
          <span className="ml-auto text-right font-mono text-xs leading-snug text-text-secondary">
            {m.formula}
          </span>
        </div>
      ))}
    </section>
  )
}

/* ───────────────────── 4 · TRANSMITTERS (the 9 classes) ───────────────────── */

function TransmitterClasses() {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="font-mono text-lg font-bold text-text-primary">The nine classes</h2>
        <span className="rounded-full border border-gold/30 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-gold">
          still calibrating
        </span>
      </div>
      <p className="max-w-2xl font-sans text-sm text-text-muted">
        Nine cascade classes from Transmitter down. The ranges shown are qualitative cuts — exact
        breakpoints are still calibrating as the leaderboard fills, so class assignments may shift.
      </p>
      <ClassLadder />
    </section>
  )
}

/* ───────────────────── 5 · MO§ES™ (commitment theory) ───────────────────── */

function MosesSection() {
  return (
    <div className="flex flex-col gap-5">
      <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-secondary">
        SigRank runs on <strong className="text-gold">MO§ES™</strong> &mdash; the{' '}
        <strong className="text-text-primary">Modus Operandi §ignal Scaling Expansion
        System</strong>. It&apos;s a governance framework that came out of a published
        conservation law for language. This section covers where it came from, what the law
        says, what the evidence shows, how governance works inside it, who it&apos;s for, and
        what we&apos;re building on top of it.
      </p>

      {/* ── Where this came from ── */}
      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-5">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          Where this came from
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The founder studied sociology and history at SUNY Geneseo, UB, and University of
          Hawaii at Hilo. Ran Pacific Northwest operations for Invisible Children. Held board
          seats at KEDS (2006&ndash;2008) and Horizon Health Services (2012&ndash;2018).
          Different world, but the same question underneath: how do you keep commitment intact
          when it passes through a lot of hands?
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Then DJMP Inc. &mdash; a Buffalo contracting operation, started in 2011, taken from
          zero to $1M/yr with a team of 40. Projects ranging $10k&ndash;$500k. Real operations,
          real governance, real consequences when things drift.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Running governed AI across that operation, something was missing. The leaderboards
          measured the models. Nobody measured the operator &mdash; the person actually
          steering the AI, making the calls, deciding what to keep and what to cut. The
          augmentation layer was invisible. So the founder built a way to measure it, found a
          conservation law underneath it, published the law, patented the enforcement
          architecture, and ran it against the field. That&apos;s where SigRank and MO§ES™
          came from &mdash; not from a market thesis, from an operational gap.
        </p>
      </section>

      {/* ── The law ── */}
      <section className="flex flex-col gap-3 rounded-lg border border-gold/40 bg-gold/5 p-5">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          The Conservation Law of Commitment
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">C(T(S)) &asymp; C(S)</strong> with enforcement;
          {' '}<strong className="text-text-primary">C(T(S)) &lt; C(S)</strong> without it.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          In plain terms: when you transform a piece of language &mdash; compress it, translate
          it, summarize it, rewrite it &mdash; the <em>commitment content</em> (the obligations,
          prohibitions, and modal constraints: &ldquo;shall,&rdquo; &ldquo;must not,&rdquo;
          &ldquo;unless,&rdquo; &ldquo;is entitled to&rdquo;) either survives or it
          doesn&apos;t. With an enforcement gate in the transformation pipeline, it survives.
          Without one, it decays. This isn&apos;t a guideline or a best practice &mdash; it&apos;s
          a measurable property of language under compression, and it&apos;s falsifiable.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The law is published under CC-BY-4.0
          {' '}(<a href="https://doi.org/10.5281/zenodo.20029607" className="text-gold underline underline-offset-2" rel="external">DOI: 10.5281/zenodo.20029607</a>).
          The enforcement architecture (MO§ES™) is patent-pending. The law itself is open.
        </p>
      </section>

      {/* ── The evidence ── */}
      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-5">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          What the evidence shows
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Seven experiments (EXP-001 through EXP-007) tested the law on a 20-signal canonical
          corpus, running 10 recursive iterations each, using bidirectional NLI entailment and
          Jaccard surface stability as oracles. Three results worth pulling out:
        </p>
        <ul className="flex flex-col gap-1.5 font-sans text-sm leading-relaxed text-text-secondary">
          <li><strong className="text-text-primary">EXP-003:</strong> 13 of 20 signals held NLI bidirectional entailment = 1.00 across all 10 iterations under the gate. That&apos;s invariance under recursion, not a tautology.</li>
          <li><strong className="text-text-primary">EXP-006:</strong> Only 2 of 4 paper claims survived self-referential recursion. The harness fails when commitment structure isn&apos;t robust &mdash; which is the point. The law is falsifiable and the experiments can break it.</li>
          <li><strong className="text-text-primary">EXP-007:</strong> An NP-negation probe separated semantic commitment from lexical surface form. Jaccard degraded while NLI held &mdash; the commitment survived even when the surface words changed.</li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Separately, a 5-phase architecture stress test measured 80&ndash;85% structural
          coherence across a four-module system. Standard probability says four modules at 80%
          standalone viability should produce ~41% series-system viability
          (0.8&times;0.8&times;0.8&times;0.8 = 0.4096). The governance layer inverted that.
        </p>
        <p className="font-sans text-xs text-text-muted">
          Full experimental record:{' '}
          <a href="https://doi.org/10.5281/zenodo.19105225" className="text-gold underline underline-offset-2" rel="external">DOI: 10.5281/zenodo.19105225</a>
        </p>
      </section>

      {/* ── Governance in the action path ── */}
      <section className="flex flex-col gap-3 rounded-lg border border-gold/40 bg-gold/5 p-5">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          Governance in the action path
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Most approaches to AI governance sit outside the model &mdash; firewalls that drop
          packets after the logic has already corrupted, sandboxes that box an agent that still
          hallucinates inside the box, post-hoc audits that tell you how you were breached after
          the damage is done. Every one of them patches after the fact.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          MO§ES™ doesn&apos;t build a better cage. It governs from inside the loop &mdash; in
          the execution path, not before it, not after it. The enforcement gate sits where the
          transformation happens. Commitment that passes through the gate survives. Commitment
          that doesn&apos;t, doesn&apos;t. The conservation law is what makes this a property of
          the system rather than a policy someone has to remember to follow.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The practical difference: a violation doesn&apos;t kill the workflow. The loop
          realigns to its original parameters and steers back. The agent stays fluid, bound to
          intent, instead of dying in a dead end or looping indefinitely inside a sandbox that
          only secures the perimeter.
        </p>
      </section>

      {/* ── Who this is for ── */}
      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-5">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          Who this is for
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank measures the operator, not the model. If you&apos;re the person steering the
          AI &mdash; deciding what to keep, what to cut, what to ask next &mdash; the board is
          about you. A few groups who get something specific out of it:
        </p>
        <ul className="flex flex-col gap-1.5 font-sans text-sm leading-relaxed text-text-secondary">
          <li><strong className="text-text-primary">Builders and developers</strong> &mdash; see how your AI-assisted workflow actually performs. The token cascade shows whether you&apos;re burning tokens or compounding them. Compare against the field instead of guessing.</li>
          <li><strong className="text-text-primary">Creators and writers</strong> &mdash; measure augmentation efficiency, not just output volume. The cascade reveals whether the AI is helping you think or just generating text. The four pillars separate signal from noise.</li>
          <li><strong className="text-text-primary">Students and researchers</strong> &mdash; benchmark your AI collaboration patterns against established operators. See what efficient operator-AI interaction looks like, with real numbers behind it.</li>
          <li><strong className="text-text-primary">Enterprise teams</strong> &mdash; quantify operator effectiveness for hiring, training, and tooling decisions. The board is an objective surface, not a self-reported one. Signed snapshots mean the numbers are verifiable.</li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          In the SIGNOMY layer, agents carry provenance and build trust. SigRank is where that
          provenance starts &mdash; the operator&apos;s measured record becomes portable.
        </p>
      </section>

      {/* ── What we're building ── */}
      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-5">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          What we&apos;re building on it
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The law is the substrate. MO§ES™ is the enforcement architecture. On top of that, a
          stack of products &mdash; each one a different surface for the same gate:
        </p>
        <ul className="flex flex-col gap-1.5 font-sans text-sm leading-relaxed text-text-secondary">
          <li><strong className="text-text-primary">AQUA</strong> &mdash; application workflow tooling with reusable submission memory. Answer banks, submission memory, application filling. The workflow layer and the first wedge.</li>
          <li><strong className="text-text-primary">SigRank</strong> &mdash; the leaderboard you&apos;re looking at. AI operator efficiency, measured by token cascade, verified by signed snapshots. The intelligence layer.</li>
          <li><strong className="text-text-primary">KA§§A</strong> &mdash; voice AI runtime that uses commitment kernel caching to cut redundant NLU work in multi-agent flows. In practice: 50s &rarr; 6.5s per 5-turn call.</li>
          <li><strong className="text-text-primary">SIGNOMY</strong> (<a href="https://signomy.xyz" className="text-gold underline underline-offset-2" rel="external">signomy.xyz</a>) &mdash; a governed agent marketplace where agents register, build trust, take missions, and carry provenance. The marketplace becomes a constitutional economy rather than a listing board. The top layer &mdash; where everything below it becomes operational behavior.</li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The goal is straightforward: make governance a property of the execution path, not a
          policy document someone reads once. If the law holds &mdash; and the evidence says it
          does &mdash; then commitment survives transformation when the gate is present. Every
          product above is a different surface for the same gate.
        </p>
      </section>

      {/* ── How this connects to the board ── */}
      <section className="flex flex-col gap-3 rounded-lg border border-gold/40 bg-gold/5 p-5">
        <h3 className="font-mono text-sm font-bold text-text-primary">
          How this connects to the board
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Every snapshot on the SigRank leaderboard is <strong className="text-text-primary">ed25519-signed</strong> on the operator&apos;s device and verified server-side. Token counts only &mdash; no message content is ever read or stored. The commitment being conserved is the integrity of the measurement itself: what the operator measured is what the board records, with no drift in between.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The governance layer maps directly to how the board works: signed operator identity,
          token counts only, leaderboard ranking, platform-agnostic collection, ed25519
          verification, and a public board with open data. The leaderboard works because the
          data passed through the gate &mdash; not because someone reviewed it after the fact.
        </p>
        <p className="font-sans text-xs text-text-muted">
          More at{' '}
          <a href="https://mos2es.com" className="text-gold underline underline-offset-2" rel="external">mos2es.com</a>
          {' '}&middot;{' '}
          <a href="https://mos2es.com/benchmarks" className="text-gold underline underline-offset-2" rel="external">benchmarks</a>
        </p>
      </section>
    </div>
  )
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
        <h2 className="font-mono text-lg font-bold text-text-primary">Run the local agent (MCP / CLI)</h2>
        <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-secondary">
          The SigRank agent reads your local session logs across 15 AI coding platforms (Claude Code,
          Codex, Gemini CLI, Copilot CLI, Amp, Goose, Kilo, and more) and counts the four token pillars
          per window — <strong className="text-text-primary">zero paste, token counts only, never your
          prompt content.</strong> One command:
        </p>
      </div>

      <pre className="overflow-x-auto rounded-md border border-bg-border bg-bg-base px-4 py-3 font-mono text-xs leading-relaxed text-text-secondary">
{`# install once (recommended)
npm install -g sigrank

# …or run with no install
npx sigrank`}
      </pre>

      <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-muted">
        <code className="rounded bg-bg-surface px-1 py-0.5 font-mono text-xs text-gold">npx sigrank</code>{' '}
        opens your dashboard — the cascade across every detected platform and window, the 5-source token
        comparison, and your board position. <strong className="text-text-primary">Submitting to the
        board is managed from your profile</strong> (sign in, then publish) — so your numbers land
        verified and stay yours. Full command + tool reference is in{' '}
        <a href="/wiki/local-agent" className="text-text-accent underline-offset-2 hover:underline">the local-agent page ↗</a>.
      </p>
    </section>
  )
}

const FLOW: { step: string; title: string; body: string }[] = [
  { step: '01', title: 'The local agent reads your tokens', body: `The SigRank agent (MCP) reads local session logs from ${PLATFORM_COUNT}+ platforms — Claude Code, Codex, Amp, Gemini CLI, Copilot CLI, Goose, Kilo, and more — and counts the four token pillars. You never touch a number; the agent is the verifier. It never reads the content of your prompts or replies.` },
  { step: '02', title: 'We compute the cascade layer', body: 'From your four pillars we derive Υ Yield, Leverage, SNR, 10xDEV, and your cascade species. Architecture is the only variable — the same four integers reveal whether you\'re a Burner, a Builder, or a 10×er.' },
  { step: '03', title: 'Account + review lands you on the board', body: 'Board entries go through an account and a quick review, so the leaderboard stays honest (observer-inflated tooling gets stripped). Want to just see your numbers? Paste below — it runs instantly and does NOT save to the board.' },
]

function SubmitFlow() {
  return (
    <section className="grid gap-3 sm:grid-cols-3">
      {FLOW.map((f) => (
        <div key={f.step} className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface px-4 py-4">
          <span className="font-mono text-xs text-text-accent">{f.step}</span>
          <span className="font-mono text-sm font-bold text-text-primary">{f.title}</span>
          <span className="font-sans text-xs leading-relaxed text-text-muted">{f.body}</span>
        </div>
      ))}
    </section>
  )
}

function PasteRunNumbers() {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="font-mono text-lg font-bold text-text-primary">Run numbers — paste ccusage output</h2>
        <p className="max-w-2xl font-sans text-sm text-text-secondary">
          Run{' '}
          <code className="rounded bg-bg-surface px-1 py-0.5 font-mono text-text-primary">ccusage --json</code>{' '}
          in your terminal and paste the output below to see your cascade and projected rank. Real
          token counts extracted directly. Accepts full JSON, partial fragments, Codex exports, or four
          bare numbers. <span className="text-text-muted">Calculator only — not saved to the board.</span>
        </p>
      </div>
      <PasteForm />
    </section>
  )
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
        No token counts handy? This fallback estimates a rough cascade from coarse activity proxies
        (sessions, turns, account age) at reduced confidence. It is an approximation only — the board
        ranks on the four token pillars, so run the local agent (or paste{' '}
        <code className="rounded bg-bg-surface px-1 py-0.5 font-mono text-xs text-text-primary">ccusage --json</code>{' '}
        above) for a real read.
      </p>
      {/* TODO(AUTH.WIRE): replace these word-era proxies with the 4 token pillars once the
          agent/auth path lands — see WIKI_ASSESSMENT §4 (this form contradicts token-only). */}
      <div className="mt-3">
        <SubmitForm />
      </div>
    </details>
  )
}

function ContactCard() {
  return (
    <section
      id="contact"
      className="flex scroll-mt-20 flex-col items-center gap-2 rounded-lg border border-bg-border bg-bg-surface px-4 py-5 text-center"
    >
      <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-text-muted">Stuck, or want in?</span>
      <p className="max-w-md font-sans text-sm text-text-secondary">
        Paste not parsing, reader we don&apos;t support yet, or just want to talk? Reach us — we read everything.
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
  )
}

/* ───────────────────── CONSOLE GROUPS (owner-ordered) ───────────────────── */

export default function Draft1Page() {
  const groups: TopicGroup[] = [
    {
      groupLabel: 'SigRank console',
      items: [
        {
          label: 'What it is',
          hint: 'Ranks the operator, not the model — four integers in, full ledger out.',
          node: <SigRankDefinition />,
        },
      ],
    },
    {
      groupLabel: 'Submit',
      source: 'run the agent',
      items: [
        // MCP-FIRST (owner 2026-06-24): lead with the agent + its run commands (was hidden
        // two groups down); the paste/manual options follow as clearly-secondary "other ways".
        { label: 'Run the agent (MCP / CLI)', hint: `The fastest, recommended path — npm i -g sigrank / npx sigrank. Zero paste, reads ${PLATFORM_COUNT}+ platforms. Board entry is managed from your profile.`, node: <SubmitMcpLead /> },
        { label: 'How it works (3 steps)', hint: '01 agent reads tokens · 02 compute the cascade · 03 account + review → board (via your profile).', node: <SubmitFlow /> },
        { label: 'Other ways — paste ccusage', hint: 'No agent? Paste ccusage --json for an instant PROJECTED cascade. Calculator only — not saved to the board.', node: <PasteRunNumbers /> },
        { label: 'Other ways — manual entry (advanced)', hint: 'No token counts at all? A rough estimate from coarse activity proxies, reduced confidence. Approximation only.', node: <ManualEntryPanel /> },
        { label: 'Contact / help', hint: '#contact — mailto hello@signalaf.com + @burnmydays.', node: <ContactCard /> },
      ],
    },
    {
      groupLabel: 'Agent & Profile',
      source: 'sigrank',
      items: [
        {
          label: 'The local agent (MCP)',
          hint: `Full reference: install · all CLI commands · all MCP tools · how the agent feeds your operator profile (the write path). sigrank@${MCP_VERSION}.`,
          node: withPermalink('local-agent', <LocalAgentMcp />),
        },
      ],
    },
    {
      groupLabel: 'Metrics',
      source: 'token-only',
      items: [
        { label: 'The four pillars', hint: 'The four raw token counts every score is built from (T.01–T.04).', node: <FourPillars /> },
        { label: 'The cascade', hint: 'Υ Yield / SNR / Leverage / Velocity / 10×DEV / Scale / $1M / Efficiency (Y.01–Y.08).', node: <CascadeList /> },
      ],
    },
    {
      groupLabel: 'Proof',
      items: [
        { label: 'The three degrees of leverage', hint: 'AA 7:2:1 baseline → wild field → a compounding operator; the 10xDEV log read + full provenance.', node: withPermalink('three-degrees', <ThreeDegreesChart variant="full" />) },
        { label: 'Verification & integrity tests', hint: 'How we know the numbers are real — Benford (with its honest failure + fix), the bot control, the telescoping lock, content-free verification, the threat model.', node: withPermalink('verification', <VerificationTests />) },
        { label: 'Signature drift — the tune meter', hint: 'Shape-not-magnitude drift from an operator’s calibrated signature; the contamination constraint. (Internals proprietary.)', node: withPermalink('signal-drift', <SignatureDrift />) },
        { label: 'Measured alongside', hint: 'Tip of the hat to the token tools SigRank reads alongside / builds on — ccusage, tokscale, token-dashboard.', node: withPermalink('measured-alongside', <Credits />) },
        { label: 'How we got here — refining the index', hint: 'Why we lead with the ordinal rank + reader-matched framing, and treat the raw Υ multiplier with care. The honest calibration story.', node: <p className="text-sm text-text-secondary">Read the full write-up on <a href="/wiki/methodology-refinement" className="text-text-accent underline-offset-2 hover:underline">the index-refinement page ↗</a>.</p> },
      ],
    },
    {
      groupLabel: 'Transmitters',
      items: [
        { label: 'The nine classes', hint: 'K.01–K.09, Transmitter down — qualitative ranges (exact breaks RS.05).', node: <TransmitterClasses /> },
      ],
    },
    {
      groupLabel: 'MO§ES™',
      items: [
        { label: 'Commitment theory + founding', hint: 'The theory behind MO§ES™ + the founding-of-the-board story (owner-authored).', node: <MosesSection /> },
      ],
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <JsonLd data={breadcrumb([
        { name: 'Wiki', path: '/wiki' },
      ])} />
      <JsonLd data={definedTerm(
        'Conservation Law of Commitment',
        'C(T(S)) ≈ C(S) with enforcement; C(T(S)) < C(S) without it. Commitment content (obligations, prohibitions, modal constraints) persists under recursive transformative compression when an enforcement gate is present. Published under CC-BY-4.0 (DOI: 10.5281/zenodo.20029607). Enforced by MO§ES™ (Modus Operandi §ignal Scaling Expansion System) — constitutional governance framework co-authored by nine rival AI architectures. Patent portfolio: Provisional 63/877,177 + 63/883,018 + 63/991,282 + Utility 19/426,028 + trademark TM 99408355 (IC 042).',
        '/wiki#conservation-law-of-commitment',
      )} />
      {/* WikiSignBar removed (owner 2026-06-24): the "Get ranked → Sign in" CTA moved to
          the global nav (AccountMenu, top-right), so the wiki's duplicate sign bar is gone. */}
      {/* The wiki: numbered root column → content panel. */}
      <TopicConsole groups={groups} />
    </div>
  )
}
