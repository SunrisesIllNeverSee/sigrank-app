import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage } from "@/lib/jsonld";
import { ClassChecker } from "./ClassChecker";

export const metadata: Metadata = withOG({
  title: "Operator Class Checker — AI Tier Calculator",
  description:
    "Check your AI operator class tier from four token pillars. Maps total tokens to IGNITER, BEARER, REFINER, SEEKER, BASE, POWER, ARCH, or ARCH+.",
  path: "/tools/operator-class-checker",
});

const FAQS = [
  {
    question: "What are the AI operator class tiers?",
    answer:
      "SigRank assigns every operator a class tier based on TOTAL TOKENS (input + output + cacheCreate + cacheRead), on an 8-tier experience ladder from low to high: IGNITER, BEARER, REFINER, SEEKER, BASE, POWER, ARCH, and ARCH+. Each tier is split into three sub-stages (I/II/III). TRANSMITTER is a separate peak badge, not a permanent class. The tier describes the operator’s accumulated experience, not the AI model being driven.",
  },
  {
    question: "What yield score do I need for each tier?",
    answer:
      "Class tier is not based on yield — it is based on total tokens (input + output + cacheCreate + cacheRead). The 8 tiers, from lowest to highest, are IGNITER, BEARER, REFINER, SEEKER, BASE, POWER, ARCH, and ARCH+. The authoritative tier is assigned server-side from signed token-telemetry snapshots on the leaderboard.",
  },
  {
    question: "Does the class tier depend on which AI model I use?",
    answer:
      "No. SigRank scores the operator — the human driving the AI — not the model. The four token pillars are platform-neutral, so a Claude operator and a ChatGPT operator can be compared on the same tier ladder. A strong operator compounds signal on any model.",
  },
  {
    question: "How do I raise my operator class?",
    answer:
      "The fastest gains come from prompt caching (raising cache_read and cache hit rate) and from denser output per fresh input (raising compression ratio). Yield rewards both at once. Typing more input without caching or denser output rarely moves the tier.",
  },
  {
    question: "Is the class tier the same as a rank?",
    answer:
      "No. Rank is your ordinal position on the leaderboard (1st, 50th, etc.). Class tier is an experience band derived from your total tokens. Many operators share a tier; only one holds a given rank.",
  },
];

export default function OperatorClassCheckerPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Tools", path: "/tools" },
            {
              name: "Operator Class Checker",
              path: "/tools/operator-class-checker",
            },
          ]),
          faqPage(FAQS),
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "SigRank Operator Class Checker",
            url: "https://signalaf.com/tools/operator-class-checker",
            description:
              "Enter four token pillars to determine your AI operator class tier — IGNITER, BEARER, REFINER, SEEKER, BASE, POWER, ARCH, or ARCH+ — with a description of what each tier means.",
            applicationCategory: "CalculatorApplication",
            operatingSystem: "Web",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            featureList: [
              "Class tier from total tokens",
              "Class tier from four token pillars",
              "Tier ladder visualization",
              "Per-tier description",
            ],
          },
        ]}
      />

      <WaveHero
        eyebrow="◈ Operator Class Checker"
        title="Operator Class Checker"
        subtitle={
          <>
            Which tier are you? Enter four token pillars to compute your total
            tokens — and see your{" "}
            <span className="text-gold">class tier</span> on the experience
            ladder from IGNITER to ARCH+.
          </>
        }
      />

      <ClassChecker />

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-text-muted">
          The class ladder, explained
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Every operator starts as an{" "}
          <strong className="text-text-primary">IGNITER</strong> — dormant
          potential, the still soul, waiting. The first promotion comes from
          accumulating real volume.{" "}
          <strong className="text-text-primary">BEARER</strong> operators have
          quiet accumulation — the first real volume.{" "}
          <strong className="text-text-primary">REFINER</strong> operators are
          practicing with purpose, building early sustained volume.{" "}
          <strong className="text-text-primary">SEEKER</strong> operators are
          approaching the center, experience accumulating.{" "}
          <strong className="text-text-primary">BASE</strong> is the center of
          the field — the average operator’s experience.{" "}
          <strong className="text-text-primary">POWER</strong> operators are
          above the center, with volume compounding.{" "}
          <strong className="text-text-primary">ARCH</strong> operators are
          system builders — sustained volume, coherent output.{" "}
          <strong className="text-text-primary">ARCH+</strong> is the deepest
          field experience — volume that became architecture. The ladder
          measures accumulated <em>experience</em>, not your raw spend.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Thresholds shown here are approximate. The authoritative tier is
          computed server-side from ed25519-signed snapshots submitted via the
          SigRank CLI — see{" "}
          <a
            href="/score"
            className="text-text-accent underline-offset-2 hover:underline"
          >
            /score
          </a>{" "}
          to submit your own.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-text-muted">
          Frequently asked questions
        </h2>
        <div className="flex flex-col gap-4">
          {FAQS.map((f) => (
            <div key={f.question} className="flex flex-col gap-1">
              <h3 className="font-sans text-sm font-semibold text-text-primary">
                {f.question}
              </h3>
              <p className="font-sans text-sm leading-relaxed text-text-secondary">
                {f.answer}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Cross-links ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Related:{" "}
          <Link
            href="/tools/yield-calculator"
            className="text-gold underline underline-offset-2"
          >
            Yield Calculator
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
            href="/guides/how-to-read-your-cascade"
            className="text-gold underline underline-offset-2"
          >
            Read Your Cascade
          </Link>
        </p>
      </section>
    </div>
  );
}
