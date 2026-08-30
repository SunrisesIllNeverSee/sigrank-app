/**
 * app/ai-compliance-standards/page.tsx — "AI Compliance Standards and Operator
 * Evaluation"
 *
 * Covers NIST AI RMF, EU AI Act, and the need for auditable evaluation.
 * Positions SigRank as governed operator evaluation with provenance. Links
 * into /methodology, /standard, /science, /ai-evaluation-frameworks.
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
  title: "AI Compliance Standards and Operator Evaluation",
  description:
    "NIST AI RMF and the EU AI Act require auditable AI evaluation. SigRank provides governed operator evaluation with cryptographic provenance — ed25519-signed snapshots, the Yield metric, and content-free telemetry.",
  path: "/ai-compliance-standards",
});

const RELATED = [
  {
    href: "/methodology",
    title: "The SigRank Index — Methodology",
    desc: "How operator scores are computed from four token pillars, verified server-side, and ranked. The auditable methodology behind SigRank's governed operator evaluation.",
  },
  {
    href: "/standard",
    title: "The SigRank Standard",
    desc: "The open operator-evaluation standard: token telemetry, the Yield metric, ed25519-signed snapshots, and cohort-relative ranking. A governed standard, not a proprietary black box.",
  },
  {
    href: "/science",
    title: "The Conservation Law of Commitment",
    desc: "The academic foundation: a published conservation law for language under compression, with Zenodo DOIs and an empirical record. The science behind the operator-evaluation standard.",
  },
  {
    href: "/ai-evaluation-frameworks",
    title: "AI Evaluation Frameworks — From Models to Operators",
    desc: "NIST AI RMF, OpenAI Evals, DeepEval, Braintrust, SigRank. How the frameworks fit together — and where SigRank fits as the operator layer.",
  },
];

export default function AIComplianceStandardsPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            {
              name: "AI Compliance Standards",
              path: "/ai-compliance-standards",
            },
          ]),
          definedTerm(
            "AI Compliance Standards",
            "AI compliance standards are regulatory and voluntary frameworks that require organizations to evaluate, document, and govern AI system performance. Key standards include the NIST AI Risk Management Framework (AI RMF) and the EU AI Act. Both require auditable evaluation with provenance — the ability to show what was measured, how, and by whom. SigRank provides governed operator evaluation that meets these requirements: content-free token telemetry (input, output, cache-read, cache-write), the Yield metric (Υ = cache_read × output / input²), and ed25519-signed snapshots verified server-side. No prompt content is ever read.",
            "/ai-compliance-standards",
          ),
          faqPage([
            {
              question: "What are AI compliance standards?",
              answer:
                "AI compliance standards are regulatory and voluntary frameworks that require organizations to evaluate, document, and govern AI system performance. The two most influential are the NIST AI Risk Management Framework (AI RMF), a voluntary US framework with Govern, Map, Measure, and Manage functions, and the EU AI Act, a binding regulation that classifies AI systems by risk tier and requires conformity assessment for high-risk systems. Both require auditable evaluation — the ability to demonstrate what was measured, how, and with what provenance.",
            },
            {
              question: "How does SigRank help with AI compliance?",
              answer:
                "SigRank provides governed operator evaluation with cryptographic provenance. Every snapshot is ed25519-signed on-device and verified server-side, so you can prove the token counts came from a real session without revealing what was in the session. The four token pillars (input, output, cache-read, cache-write) and the Yield metric (Υ = cache_read × output / input²) are computed from signed data. This gives compliance teams an auditable, provenance-backed record of operator performance — exactly what a NIST AI RMF \"Measure\" function or an EU AI Act conformity assessment requires for the operator layer.",
            },
            {
              question: "How does SigRank fit into the NIST AI RMF?",
              answer:
                "The NIST AI RMF organizes AI risk management into four functions: Govern, Map, Measure, and Manage. SigRank serves the \"Measure\" function for the operator layer. It provides continuous, auditable measurement of operator performance via content-free token telemetry. The ed25519-signed snapshots provide the provenance that the \"Govern\" function requires — you can show what was measured and when, without reading prompt content. SigRank does not replace the framework; it provides the governed operator evaluation that the framework calls for.",
            },
            {
              question: "Is SigRank privacy-compliant?",
              answer:
                "Yes. SigRank is content-free by design: it captures token counts only (input, output, cache-read, cache-write) and never reads or stores prompt content. This means there is no personally identifiable content to protect — the data is token counts, not conversation text. Snapshots are ed25519-signed on-device, so operators control their own data submission. Operators appear on the public leaderboard under codenames; real identities are never shown. Content-free telemetry is the privacy standard that makes operator evaluation possible without the privacy risks of reading prompts.",
            },
          ]),
        ]}
      />

      <WaveHero
        eyebrow="◈ Compliance"
        terminalText="COMPLY"
        title="AI Compliance Standards and Operator Evaluation"
        subtitle={
          <>
            NIST AI RMF and the EU AI Act require auditable AI evaluation.
            SigRank provides governed operator evaluation with{" "}
            <span className="text-gold">cryptographic provenance</span> —
            ed25519-signed snapshots, content-free telemetry, and the Yield
            metric.
          </>
        }
      />

      {/* ── The compliance landscape ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          The AI compliance landscape
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          AI compliance standards are converging on a common requirement:
          organizations must be able to demonstrate what their AI systems do,
          how they are evaluated, and with what provenance. The NIST AI Risk
          Management Framework (AI RMF) organizes this into Govern, Map,
          Measure, and Manage functions. The EU AI Act classifies AI systems
          by risk tier and requires conformity assessment for high-risk
          systems. Both frameworks demand auditable evaluation — not just
          &ldquo;we tested it&rdquo; but &ldquo;here is what we measured, how,
          and when, with evidence.&rdquo;
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Most compliance effort has focused on the model, output, and safety
          layers. The operator layer — whether the humans driving the AI are
          driving it well — has been unmeasured. That is a compliance gap: you
          cannot fully govern AI risk if you cannot measure operator
          performance. SigRank closes it with governed, provenance-backed
          operator evaluation.
        </p>
      </section>

      {/* ── How SigRank helps ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          How SigRank provides governed operator evaluation
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank gives compliance teams three things they need. First,
          auditable measurement: four token pillars (input, output,
          cache-read, cache-write) and the yield metric{" "}
          <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
            Υ = cache_read × output / input²
          </code>{" "}
          computed from signed data. Second, cryptographic provenance: every
          snapshot is ed25519-signed on-device and verified server-side, so
          you can prove the token counts came from a real session without
          revealing what was in the session. Third, privacy by design: no
          prompt content is ever read or stored, so there is no content to
          protect or leak.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          This is exactly what a NIST AI RMF &ldquo;Measure&rdquo; function
          requires for the operator layer — and what an EU AI Act conformity
          assessment needs for auditable operator performance. SigRank does
          not replace the compliance framework; it provides the governed
          operator evaluation that the framework calls for.
        </p>
      </section>

      {/* ── Privacy compliance ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Privacy compliance
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is content-free by design. It captures token counts only and
          never reads or stores prompt content. This means there is no
          personally identifiable content to protect — the data is token
          counts, not conversation text. Snapshots are signed on-device, so
          operators control their own data submission. Operators appear on the
          public leaderboard under codenames; real identities are never shown.
          Content-free telemetry is the privacy standard that makes operator
          evaluation possible without the privacy risks of reading prompts.
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
              What are AI compliance standards?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Regulatory and voluntary frameworks requiring auditable AI
              evaluation. NIST AI RMF (Govern, Map, Measure, Manage) and the
              EU AI Act (risk-tiered conformity assessment) are the most
              influential.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How does SigRank help with compliance?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Governed operator evaluation with cryptographic provenance.
              ed25519-signed snapshots, the Yield metric, content-free
              telemetry. An auditable, provenance-backed record of operator
              performance.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              How does SigRank fit into the NIST AI RMF?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              It serves the &ldquo;Measure&rdquo; function for the operator
              layer — continuous, auditable measurement via content-free token
              telemetry. ed25519 signatures provide the provenance the
              &ldquo;Govern&rdquo; function requires.
            </dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">
              Is SigRank privacy-compliant?
            </dt>
            <dd className="font-sans text-sm leading-relaxed text-text-secondary">
              Yes. Token counts only — never prompt content. No personally
              identifiable content to protect. Snapshots signed on-device;
              operators control submission. Codenames on the leaderboard, not
              real identities.
            </dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
