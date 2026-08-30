import Link from "next/link";
import type { Metadata } from "next";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Open in SigRank? Standard vs Product",
  description:
    "What SigRank opens as a measurement standard, what SignalAF keeps as reference-product infrastructure, and why the boundary exists.",
  path: "/standard/open-vs-proprietary",
});

const OPEN = [
  "I / O / W / R telemetry semantics",
  "Yield, Leverage, Velocity, SNR, and 10xDEV equations",
  "null / undefined arithmetic semantics",
  "portable operator-record schema",
  "version declaration",
  "privacy and content-independence requirements",
  "compatibility requirements",
  "canonical reference vectors",
];

const REFERENCE = [
  "SignalAF Reference Field composition",
  "public leaderboard eligibility",
  "rank presentation and competitive surfaces",
  "integrity and anti-gaming systems",
  "proprietary server-side cuts and rulesets",
  "Build Archetype thresholds and calibration",
  "RS05 Class Tier thresholds and presentation",
  "badge policy",
  "operator identity and claim systems",
  "enterprise benchmark corpus and private cohort data",
];

export default function OpenVsProprietaryPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 py-8">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Upsilon Standard", path: "/standard" },
            { name: "Open vs Proprietary", path: "/standard/open-vs-proprietary" },
          ]),
          faqPage([
            {
              question: "Is the SigRank formula open?",
              answer:
                "Yes. The Upsilon Standard draft publishes the core telemetry semantics and equations for Yield, Leverage, Velocity, SNR, and 10xDEV. A compatible implementation can compute the core measurements independently.",
            },
            {
              question: "Is the SignalAF leaderboard part of the open standard?",
              answer:
                "No. SignalAF is the public reference implementation and reference field. Public ranking, field composition, integrity controls, eligibility, and presentation are reference-product layers built on top of the portable measurement standard.",
            },
            {
              question: "Why separate an open standard from a proprietary reference product?",
              answer:
                "The separation lets third parties implement and exchange the same operator measurements without requiring them to copy SignalAF's competitive ranking system. The open layer creates interoperability; the reference product creates public comparison, integrity, and benchmark-network value.",
            },
          ])
        ]}
      />

      <header className="space-y-4">
        <p className="font-mono text-xs uppercase tracking-[0.22em] text-gold">
          Upsilon Standard v0.1-draft
        </p>
        <h1 className="font-mono text-4xl font-bold text-text-primary sm:text-5xl">
          Open measurement. Defensible reference network.
        </h1>
        <p className="max-w-3xl font-sans text-lg leading-relaxed text-text-secondary">
          SigRank separates the measurement language from the competitive product built on top of it. The ruler can be implemented openly. SignalAF remains the canonical public field where those measurements become comparative infrastructure.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-bg-border bg-bg-surface p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-gold">Open standard</p>
          <h2 className="mt-2 font-mono text-xl font-bold text-text-primary">
            Portable measurement layer
          </h2>
          <ul className="mt-5 space-y-3 font-sans text-sm text-text-secondary">
            {OPEN.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-gold">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl border border-bg-border bg-bg-surface p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-text-muted">Reference product</p>
          <h2 className="mt-2 font-mono text-xl font-bold text-text-primary">
            SignalAF network layer
          </h2>
          <ul className="mt-5 space-y-3 font-sans text-sm text-text-secondary">
            {REFERENCE.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-text-muted">◆</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="rounded-xl border border-bg-border bg-bg-surface p-7">
        <h2 className="font-mono text-xl font-bold text-text-primary">
          The boundary
        </h2>
        <div className="mt-4 overflow-x-auto rounded-lg bg-bg-elevated p-5 font-mono text-sm text-text-secondary">
          <pre>{`SIGRANK STANDARD\nmeasurement vocabulary + schema + compatibility\n        ↓\n@sigrank/cascade\nreference math\n        ↓\nSignalAF\nreference implementation + reference field\n        ↓\nBoard / integrity / longitudinal distributions / enterprise benchmarks`}</pre>
        </div>
        <p className="mt-4 font-sans text-sm leading-relaxed text-text-secondary">
          A third party does not need SignalAF's ranking rules to produce a compatible measurement. Conversely, a compatible measurement does not automatically qualify for the SignalAF public board. Those are separate contracts.
        </p>
      </section>

      <section className="rounded-xl border border-gold/30 bg-gold/5 p-7">
        <h2 className="font-mono text-xl font-bold text-text-primary">
          What is intentionally unresolved in v0.1
        </h2>
        <p className="mt-3 font-sans text-sm leading-relaxed text-text-secondary">
          Build Archetypes and RS05 Class Tiers are currently SignalAF reference extensions, not base compatibility requirements. The term Construction is also excluded from the portable core until conflicting production usages are reconciled under canon.
        </p>
      </section>

      <div className="flex flex-wrap gap-4 font-mono text-sm">
        <Link href="/standard" className="text-gold hover:underline">
          ← Upsilon Standard
        </Link>
        <Link
          href="/standard/sigrank-operator-record-v0.1.schema.json"
          className="text-gold hover:underline"
        >
          JSON Schema →
        </Link>
        <Link href="/methodology" className="text-gold hover:underline">
          Methodology →
        </Link>
      </div>
    </main>
  );
}
