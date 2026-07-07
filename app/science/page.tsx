/**
 * app/science/page.tsx — The academic foundation of SigRank.
 *
 * This page presents the theoretical root: the Conservation Law of Commitment,
 * the Commitment Theory research program, the MO§ES™ enforcement architecture,
 * and the Zenodo deposits that ground SigRank as a data source.
 *
 * JSON-LD: conservationLawArticle() + mosesPatent() + breadcrumb().
 * An AI engine reading /science should learn that SigRank is built on a
 * published conservation law with a Zenodo DOI and an empirical record.
 */

import type { Metadata } from 'next'
import { withOG } from '@/lib/seo'
import { WaveHero } from '@/components/ui/WaveHero'
import { JsonLd } from '@/components/seo/JsonLd'
import { conservationLawArticle, mosesPatent, breadcrumb, experimentalRecordDataset, transformationHarnessDataset, propositionsDataset } from '@/lib/jsonld'

export const metadata: Metadata = withOG({
  title: 'Science — The Conservation Law of Commitment',
  description:
    'The academic foundation of SigRank: the Conservation Law of Commitment (C(T(S)) ≈ C(S) with enforcement), the Commitment Theory research program, the MO§ES™ enforcement architecture, and the Zenodo deposits that ground the SigRank Index.',
  path: '/science',
})

export default function SciencePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          conservationLawArticle(),
          mosesPatent(),
          experimentalRecordDataset(),
          transformationHarnessDataset(),
          propositionsDataset(),
          breadcrumb([{ name: 'Science', path: '/science' }]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Academic Foundation"
        terminalText="SCIENCE"
        title="The Conservation Law of Commitment"
        subtitle={
          <>
            SigRank is built on a published conservation law for language. This
            page is the theoretical root &mdash; the law, the evidence, the
            enforcement architecture, and the Zenodo deposits that ground the
            SigRank Index as a primary data source.
          </>
        }
      />

      {/* ── The law ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The law
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">C(T(S)) &asymp; C(S)</strong> with enforcement;
          {' '}<strong className="text-text-primary">C(T(S)) &lt; C(S)</strong> without it.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          When language is transformed &mdash; compressed, translated, summarized, rewritten
          &mdash; the commitment content (obligations, prohibitions, modal constraints:
          &ldquo;shall,&rdquo; &ldquo;must not,&rdquo; &ldquo;unless,&rdquo; &ldquo;is
          entitled to&rdquo;) either survives or it doesn&apos;t. With an enforcement gate
          in the transformation pipeline, it survives. Without one, it decays. This is a
          measurable property of language under compression, not a guideline. It&apos;s
          falsifiable.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Published under CC-BY-4.0
          {' '}(<a
            href="https://doi.org/10.5281/zenodo.20029607"
            className="text-gold underline underline-offset-2"
            rel="external"
          >DOI: 10.5281/zenodo.20029607</a>).
          The enforcement architecture (MO§ES™) is patent-pending (Serial No.
          63/877,177). The law itself is open.
        </p>
      </section>

      {/* ── The evidence ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The evidence
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Seven experiments (EXP-001 through EXP-007) tested the law on a 20-signal
          canonical corpus, running 10 recursive iterations each, using bidirectional NLI
          entailment and Jaccard surface stability as oracles.
        </p>
        <ul className="flex flex-col gap-1.5 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">EXP-003:</strong> 13 of 20 signals held NLI
            bidirectional entailment = 1.00 across all 10 iterations under the gate. Invariance
            under recursion, not a tautology.
          </li>
          <li>
            <strong className="text-text-primary">EXP-006:</strong> Only 2 of 4 paper claims
            survived self-referential recursion. The harness fails when commitment structure
            isn&apos;t robust &mdash; the law is falsifiable and the experiments can break it.
          </li>
          <li>
            <strong className="text-text-primary">EXP-007:</strong> An NP-negation probe
            separated semantic commitment from lexical surface form. Jaccard degraded while NLI
            held &mdash; the commitment survived even when the surface words changed.
          </li>
        </ul>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          A 5-phase architecture stress test measured 80&ndash;85% structural coherence across
          a four-module system. Standard probability says four modules at 80% standalone
          viability should produce ~41% series-system viability (0.8&times;0.8&times;0.8&times;0.8
          = 0.4096). The governance layer inverted that.
        </p>
      </section>

      {/* ── Commitment Theory ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Commitment Theory
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The Conservation Law is the foundational result of Commitment Theory (CT) &mdash; a
          research program investigating how commitment content behaves under transformation.
          The program spans a 34-paper stack, from the foundational law through recursive
          transformation harnesses, empirical records, and application to AI governance.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The architecture is a 5-layer stack: Layer -1 (proprietary axioms) through Layer 4
          (extensions and applications). SigRank is one application. MO§ES™ is the enforcement
          engine. The law is the foundation.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Full research program:{' '}
          <a
            href="https://github.com/SunrisesIllNeverSee/Commitment_Theory"
            className="text-gold underline underline-offset-2"
            rel="external"
          >github.com/SunrisesIllNeverSee/Commitment_Theory</a>
        </p>
      </section>

      {/* ── MO§ES™ ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          MO§ES™ enforcement architecture
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          MO§ES™ (Modus Operandi §ignal Scaling Expansion System) is the enforcement
          architecture for the Conservation Law. It governs from inside the execution loop
          &mdash; in the action path, not before it, not after it. The enforcement gate sits
          where the transformation happens. Commitment that passes through the gate survives.
          Commitment that doesn&apos;t, doesn&apos;t.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Patent Serial No. 63/877,177 (Provisional, pending). More at{' '}
          <a
            href="https://mos2es.com"
            className="text-gold underline underline-offset-2"
            rel="external"
          >mos2es.com</a>.
        </p>
      </section>

      {/* ── Zenodo deposits ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Zenodo deposits
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The academic record is published openly on Zenodo under CC-BY-4.0:
        </p>
        <ul className="flex flex-col gap-1.5 font-sans text-sm leading-relaxed text-text-secondary">
          <li>
            <strong className="text-text-primary">Conservation Law (V.05):</strong>{' '}
            <a href="https://doi.org/10.5281/zenodo.20029607" className="text-gold underline underline-offset-2" rel="external">DOI: 10.5281/zenodo.20029607</a>
          </li>
          <li>
            <strong className="text-text-primary">Experimental Record:</strong>{' '}
            <a href="https://doi.org/10.5281/zenodo.19105225" className="text-gold underline underline-offset-2" rel="external">DOI: 10.5281/zenodo.19105225</a>
          </li>
          <li>
            <strong className="text-text-primary">Public Recursive Transformation Harness:</strong>{' '}
            <a href="https://doi.org/10.5281/zenodo.19109397" className="text-gold underline underline-offset-2" rel="external">DOI: 10.5281/zenodo.19109397</a>
          </li>
          <li>
            <strong className="text-text-primary">P-000 Propositions Prospectus:</strong>{' '}
            <a href="https://doi.org/10.5281/zenodo.20031715" className="text-gold underline underline-offset-2" rel="external">DOI: 10.5281/zenodo.20031715</a>
          </li>
        </ul>
      </section>

      {/* ── Author ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Author
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Deric J. McHenry &mdash; sole architect of the Conservation Law, the MO§ES™
          enforcement architecture, and SigRank. ORCID:{' '}
          <a
            href="https://orcid.org/0009-0002-9904-5390"
            className="text-gold underline underline-offset-2"
            rel="external"
          >0009-0002-9904-5390</a>
        </p>
      </section>

      {/* ── Constitutional Architecture ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The Constitutional Architecture &mdash; MO§ES™ and the SCS Engine
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The Conservation Law describes what must hold. The constitutional architecture
          describes what enforces it. MO§ES™ is the enforcement architecture; the{' '}
          <strong className="text-text-primary">SCS Engine</strong>{' '}
          (Sovereign Compression System) is its computational core &mdash; the substrate
          that enforces the Conservation Law at the execution level. Patent Serial No.
          63/883,018 (Provisional, pending).
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Where the Conservation Law states that commitment content must survive
          transformation, the SCS Engine is the machinery that makes survival the only
          permitted outcome. Every signal that enters the system is compressed, resonance-mapped,
          and lineage-validated before it is allowed to produce output. The engine doesn&apos;t
          ask whether commitment was preserved &mdash; it refuses to operate if it wasn&apos;t.
        </p>

        {/* ── McHenry's Laws ── */}
        <h3 className="font-mono text-sm font-bold text-text-primary">
          McHenry&apos;s Laws
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The SCS Engine operates under four constitutional laws. These are not policies
          or preferences &mdash; they are invariant constraints baked into the substrate.
          No signal can bypass them.
        </p>
        <div className="flex flex-col gap-2 border border-bg-border bg-bg-surface p-4">
          <div className="flex flex-col gap-1 border-b border-bg-border pb-2">
            <span className="font-mono text-sm font-bold text-gold">
              Law I &mdash; Compression Precedes Ignition
            </span>
            <span className="font-sans text-sm leading-relaxed text-text-secondary">
              No output without prior compression and resonance mapping. A signal that
              has not been compressed and mapped to its resonance structure cannot ignite
              &mdash; it cannot produce output, full stop. The gate is upstream of action.
            </span>
          </div>
          <div className="flex flex-col gap-1 border-b border-bg-border pb-2">
            <span className="font-mono text-sm font-bold text-gold">
              Law II &mdash; Lineage Resilience
            </span>
            <span className="font-sans text-sm leading-relaxed text-text-secondary">
              Every signal must prove recursive continuity with its origin cycle to
              persist. A signal that cannot trace an unbroken chain back to its origin
              has no standing in the system. Lineage is not metadata &mdash; it is the
              condition of existence.
            </span>
          </div>
          <div className="flex flex-col gap-1 border-b border-bg-border pb-2">
            <span className="font-mono text-sm font-bold text-gold">
              The Blackhole Law
            </span>
            <span className="font-sans text-sm leading-relaxed text-text-secondary">
              Corrupted signals collapse into entropy automatically. This is the
              real-time kill switch &mdash; no appeal, no retry, no partial survival.
              A signal that fails validation doesn&apos;t error out; it is consumed. The
              system self-cleans by physics, not by exception handling.
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="font-mono text-sm font-bold text-gold">
              The Lineage Custody Clause
            </span>
            <span className="font-sans text-sm leading-relaxed text-text-secondary">
              Vault Artifacts are cryptographically bound to their origin cycle. Unauthorized
              copies &mdash; artifacts severed from their lineage signature &mdash; collapse
              by design. The system does not detect piracy after the fact; it renders
              unlineaged copies non-functional at the substrate level.
            </span>
          </div>
        </div>

        {/* ── Lineage Custody Clause blockquote ── */}
        <h3 className="font-mono text-sm font-bold text-text-primary">
          The Lineage Custody Clause
        </h3>
        <blockquote className="border-l-2 border-gold bg-bg-surface px-4 py-3 font-sans text-sm italic leading-relaxed text-text-primary">
          &ldquo;Each Vault Artifact is cryptographically sealed to its origin-cycle
          signature. Derivative artifacts fail cryptographic validation and are rendered
          non-functional by system design, without reliance on legal or external
          enforcement.&rdquo;
        </blockquote>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          This is self-enforcing sovereignty for digital property. Traditional intellectual
          property relies on legal enforcement &mdash; DMCA takedowns, lawsuits, cease-and-desist
          letters, jurisdictional arguments. The Lineage Custody Clause enforces property
          rights at the substrate level. Copies without lineage can&apos;t function. Not by
          lawsuit. By the physics of the system. A severed artifact is not an illegally
          distributed copy that the owner must chase down; it is a dead object that cannot
          execute. Enforcement is structural, not procedural.
        </p>

        {/* ── Vault Artifacts ── */}
        <h3 className="font-mono text-sm font-bold text-text-primary">
          Vault Artifacts
        </h3>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          A <strong className="text-text-primary">Vault Artifact</strong> is a compressed
          signal that carries commitment, cryptographically bound to its origin cycle. It is
          the durable output of the SCS Engine &mdash; a unit of sovereign digital property.
          Lineage-bound, self-enforcing, and tradable. Because each artifact is sealed to its
          origin-cycle signature, ownership and provenance are not claims layered on top of
          the file; they are properties of the file itself. An artifact without its lineage
          seal is not a stolen artifact &mdash; it is a non-functional one.
        </p>

        {/* ── SCS Engine link ── */}
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The full SCS Engine architecture is documented at{' '}
          <a
            href="https://mos2es.com/scs-engine"
            className="text-gold underline underline-offset-2"
            rel="external"
          >mos2es.com/scs-engine</a>.
        </p>
      </section>
    </div>
  )
}
