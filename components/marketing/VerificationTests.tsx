/**
 * components/marketing/VerificationTests.tsx — "Verification & Integrity Tests"
 * (owner content, Devins_Plans/wiki_verification_tests.md, 2026-06-22).
 *
 * How we know the numbers are real: Benford conformity (with its honest first-form
 * failure + the floor-subtraction fix), the Hermes bot control, the telescoping
 * identity lock, content-free verification, and the gaming threat model. Reproduced
 * near-verbatim. Pure presentational server component — token counts only.
 */

import React from 'react'

function Table({
  head,
  rows,
}: {
  head: string[]
  rows: (string | { v: string; bold?: boolean })[][]
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface">
      <table className="w-full border-collapse font-mono text-xs">
        <thead>
          <tr className="border-b border-bg-border">
            {head.map((h, i) => (
              <th
                key={h}
                className={
                  'px-3 py-2.5 font-bold text-text-secondary ' + (i === 0 ? 'text-left' : 'text-right')
                }
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-b border-bg-border-subtle last:border-b-0">
              {r.map((cell, ci) => {
                const v = typeof cell === 'string' ? cell : cell.v
                const bold = typeof cell === 'object' && cell.bold
                return (
                  <td
                    key={ci}
                    className={
                      'px-3 py-2 tabular-nums ' +
                      (ci === 0 ? 'text-left text-text-primary' : 'text-right ') +
                      (bold ? 'font-bold text-gold' : ci === 0 ? '' : 'text-text-muted')
                    }
                  >
                    {v}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function H({ children }: { children: React.ReactNode }) {
  return <h3 className="font-mono text-sm font-bold text-text-primary">{children}</h3>
}
function P({ children }: { children: React.ReactNode }) {
  return <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-muted">{children}</p>
}

export function VerificationTests() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-mono text-2xl font-bold tracking-wide text-text-primary">
          Verification &amp; Integrity Tests
        </h1>
        <P>
          SigRank ranks operators on token telemetry. The obvious question:{' '}
          <em>how do you know the numbers aren&apos;t fabricated, gamed, or bot-generated?</em> Every
          result here comes from a real run on real data — and where a test <em>failed</em> its first
          form, we show that too, because a test that can&apos;t fail isn&apos;t a test.
        </P>
      </div>

      <section className="flex flex-col gap-2">
        <H>Why these tests exist</H>
        <P>
          The cascade thesis says operator token usage is a <strong>multiplicative process</strong> —
          each stage compounds on the last. Multiplicative processes leave statistical fingerprints
          that fabricated or mechanical data don&apos;t reproduce. To fake a high rank, a forger would
          have to simultaneously fake the right first-digit distribution, the right internal
          arithmetic, the right concentration, and the right human activity schedule — in one
          self-consistent file. Each test closes one of those escape routes.
        </P>
      </section>

      <section className="flex flex-col gap-3">
        <H>Test 1 — Benford&apos;s Law (first-digit conformity)</H>
        <P>
          If session totals come from a genuine multiplicative work process, their leading digits
          should follow Benford&apos;s Law — P(first digit = d) = log₁₀(1 + 1/d). The theory was never
          fitted to digits; it predicts this as a side effect.{' '}
          <span className="text-text-secondary">
            Pre-registered kill condition (declared before seeing data):
          </span>{' '}
          Nigrini MAD &gt; 0.015 = nonconformity.
        </P>
        <p className="font-sans text-sm font-semibold text-text-secondary">
          First result — the registered prediction FAILED:
        </p>
        <Table
          head={['Set', 'n', 'MAD', 'Verdict']}
          rows={[
            ['All agents', '544', '0.01604', 'NONCONFORM'],
            ['Claude only', '487', '0.01896', 'NONCONFORM'],
            ['Codex only', '51', '0.01793', 'NONCONFORM'],
          ]}
        />
        <P>
          Raw session totals did <strong>not</strong> conform. We report this plainly — the first
          prediction was falsified. But the failure was <em>diagnostic</em>: digit 1 was
          under-represented, 5 and 9 over-represented — the textbook signature of{' '}
          <strong>lower-bound truncation</strong>. The cause is mechanical: every coding session begins
          with ~20–23k tokens of cached system prompt — an additive constant on top of the
          multiplicative process — which starves the leading-1 bucket and breaks Benford.
        </P>
        <p className="font-sans text-sm font-semibold text-text-secondary">
          The fix confirmed the mechanism:
        </p>
        <Table
          head={['Approach', 'n', 'MAD', 'Verdict']}
          rows={[
            ['All sessions (raw)', '544', '0.01604', 'NONCONFORM'],
            ['Sessions > 10× floor', '269', '0.03193', 'NONCONFORM'],
            [
              { v: 'Floor-subtracted (value − 22k)', bold: true },
              '532',
              { v: '0.01109', bold: true },
              { v: 'ACCEPTABLE', bold: true },
            ],
          ]}
        />
        <P>
          Subtracting the measured floor — removing the additive constant and leaving the
          multiplicative remainder — recovers conformity. Subsetting does <em>not</em> fix it;
          subtraction does. Synthetic simulation reproduced the whole story (pure multiplicative
          conforms at 0.00974; +22k floor breaks it to 0.03253, matching the data; floor-subtracted
          recovers to 0.00787). The mechanism reproduces in synthesis — it&apos;s not a story told
          after the fact.
        </P>
        <P>
          <strong className="text-text-secondary">The defensible claim:</strong> the multiplicative
          cascade is Benford-conforming once the measured additive system-prompt floor is removed. The
          raw version is falsified and we say so; the floor-corrected version holds and is
          mechanistically motivated — a stronger result than naive conformity. The test had teeth,
          fired, and revealed a real artifact (the floor) that is now itself a tracked quantity.
        </P>
      </section>

      <section className="flex flex-col gap-2">
        <H>Test 2 — the bot control (Hermes)</H>
        <P>
          A natural-conformity claim is only meaningful if something <em>fails</em> it. Among the
          sessions was a set of 5 automated probe runs (&ldquo;hermes&rdquo;): totals 4208, 4152, 4115,
          4222, 4258. <strong>Every first digit was 4.</strong> Zero digit diversity — a fixed-size
          mechanical probe, exactly the non-Benford signature a bot produces. This is the control that
          gives Test 1 meaning: the method distinguishes a multiplicative human process from a
          constant-size machine process.
        </P>
      </section>

      <section className="flex flex-col gap-2">
        <H>Test 3 — the telescoping identity (internal-consistency lock)</H>
        <P>
          The cascade has three stages — transmission (O/I), commitment (Create/O), and reuse
          (Read/Create). Their product <strong>must</strong> equal cache_read/input exactly, because
          the intermediate terms cancel:
        </P>
        <pre className="overflow-x-auto rounded-lg border border-bg-border bg-bg-surface px-4 py-3 font-mono text-xs text-text-secondary">
          (O/I) × (Create/O) × (Read/Create) = Read/Input
        </pre>
        <P>
          So 10^(10xDEV) = Leverage, by identity — not by fit. An operator cannot inflate their
          amplification exponent independently of their leverage; the two are bound by algebra. A
          fabricated row with a high 10xDEV but the wrong Read/Input ratio fails the identity and is
          detectable. We recompute this on every operator from the raw four pillars; it holds for every
          legitimate row.
        </P>
      </section>

      <section className="flex flex-col gap-2">
        <H>Test 4 — content-free verification (the privacy license)</H>
        <P>
          A separate experiment (EXP-007) established that conserved structure is detectable{' '}
          <strong>without</strong> reading content: across negation-paraphrase pairs, surface overlap
          was zero (Jaccard 0.00) while semantic equivalence was complete (NLI 1.00) — &ldquo;You must
          not smoke&rdquo; and &ldquo;No smoking&rdquo; converge to one kernel. The consequence: a
          statistical witness (token counts) is a legitimate instrument for a conservation-driven
          process. The no-content-access design is not a privacy compromise we tolerate — it is the
          architecture this result predicts. We rank the four integers; we never see what you typed.
        </P>
      </section>

      <section className="flex flex-col gap-3">
        <H>Test 5 — the threat model (failure taxonomy → countermeasures)</H>
        <Table
          head={['Gaming attempt', 'Countermeasure']}
          rows={[
            ['Score inflation / single-metric overclaim', 'Composite scoring; no single metric escalates rank'],
            ['Fake convergence on pre-processed numbers', 'Server recomputes everything from the RAW payload'],
            ['High leverage with inverted meaning (idle re-read)', 'Convergence + concentration-band check'],
            ['Merging metrics to blur a weak one', 'Components stay separately binding'],
          ]}
        />
      </section>

      <section className="flex flex-col gap-2">
        <H>What&apos;s still being hardened (stated honestly)</H>
        <ul className="flex max-w-2xl list-disc flex-col gap-2 pl-5 font-sans text-sm text-text-muted">
          <li>
            <strong className="text-text-secondary">Cadence (Test 6, in development):</strong> human
            activity is bursty with heavy tails (Barabási, <em>Nature</em> 435, 207, 2005) and carries
            1/f timing noise (Gilden, <em>Science</em>, 1995); machines are periodic or Poisson.
            Session timestamps already carry the data for a timing-domain humanity test. Not yet
            deployed.
          </li>
          <li>
            <strong className="text-text-secondary">Data provenance note:</strong> the Benford figures
            above were computed on a 544-session sample transcribed by hand from session JSON. They are
            real and reproducible from that sample, but canonical published numbers should be
            regenerated from source telemetry. We flag this rather than hide it.
          </li>
        </ul>
      </section>

      <section className="flex flex-col gap-2 border-t border-bg-border-subtle pt-4">
        <H>Sources</H>
        <ul className="flex max-w-2xl list-disc flex-col gap-1.5 pl-5 font-sans text-[11px] text-text-dim">
          <li>
            Benford&apos;s Law: Nigrini, M. (2012), <em>Benford&apos;s Law: Applications for Forensic
            Accounting, Auditing, and Fraud Detection.</em>
          </li>
          <li>
            Human burst dynamics: Barabási, A.-L. (2005), &ldquo;The origin of bursts and heavy tails
            in human dynamics,&rdquo; <em>Nature</em> 435, 207.
          </li>
          <li>1/f cognitive noise: Gilden, D. et al. (1995), <em>Science</em> 267, 1837.</li>
          <li>
            AA pricing baseline (7:2:1): Artificial Analysis, Language Model Benchmarking Methodology.
          </li>
          <li>
            All token-telemetry results: computed from canonical four-pillar session data. Methods and
            scripts are reproducible; raw transcripts are not published (privacy).
          </li>
        </ul>
        <p className="font-sans text-[11px] italic text-text-dim">
          Token counts only — never prompt content. Tests are run, not asserted.
        </p>
      </section>
    </div>
  )
}
