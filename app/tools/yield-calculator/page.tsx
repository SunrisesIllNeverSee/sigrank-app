import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage } from "@/lib/jsonld";
import { YieldCalculator } from "./YieldCalculator";

export const metadata: Metadata = withOG({
  title: "Yield (Υ) Calculator — Token Cascade Efficiency",
  description:
    "Free yield calculator for AI token cascades. Enter your four token pillars to compute \u03A5 Yield, compression ratio, cache hit rate, and class tier instantly.",
  path: "/tools/yield-calculator",
});

const FAQS = [
  {
    question: "What is the Yield (Υ) metric?",
    answer:
      "Yield (Υ) = cache_read × output / input². It measures the architecture of an AI token cascade — whether cached context is compounding signal into output, or tokens are being burned. It is the headline SigRank operator-efficiency metric.",
  },
  {
    question: "How is the yield calculator different from the /score page?",
    answer:
      "This calculator takes four raw token counts and shows the math instantly in your browser. The /score page is the full paste-based flow that can also submit a signed snapshot to the leaderboard. Use this for a quick estimate; use /score to compete.",
  },
  {
    question: "Where do I get my token counts?",
    answer:
      "Run `ccusage --json` or `npx sigrank me` to read the four token pillars (input, output, cache-read, cache-write) from your local AI session logs on-device. No prompt content is ever read — only the four integers.",
  },
  {
    question: "What is a good yield score?",
    answer:
      "Roughly: below 0.5 is IGNITER (just starting), 0.5–2 is SEEKER, 2–10 is BUILDER (a productive compounding cascade), and 10+ is TRANSMITTER (signal compounds aggressively). These thresholds are approximate.",
  },
  {
    question: "Does the yield calculator send my data anywhere?",
    answer:
      "No. All arithmetic runs in your browser. Nothing is transmitted, stored, or logged. The calculator is a pure client-side estimation tool.",
  },
];

export default function YieldCalculatorPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Tools", path: "/tools" },
            { name: "Yield Calculator", path: "/tools/yield-calculator" },
          ]),
          faqPage(FAQS),
          {
            "@context": "https://schema.org",
            "@type": "WebApplication",
            name: "SigRank Yield (Υ) Calculator",
            url: "https://signalaf.com/tools/yield-calculator",
            description:
              "Enter the four token pillars (input, output, cache-read, cache-write) to compute the Υ Yield token-cascade efficiency score, compression ratio, cache hit rate, and class tier.",
            applicationCategory: "CalculatorApplication",
            operatingSystem: "Any (web browser)",
            browserRequirements: "Requires JavaScript",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
            featureList: [
              "Υ Yield calculation",
              "Compression ratio",
              "Cache hit rate",
              "Class tier classification",
            ],
          },
        ]}
      />

      <WaveHero
        eyebrow="◈ Yield Calculator"
        title="Yield (Υ) Calculator"
        subtitle={
          <>
            Enter your pillars for Υ Yield and see your{" "}
            <span className="text-gold">Υ Yield</span> score, class tier, and
            cascade shape instantly. Pure arithmetic — nothing leaves your
            browser.
          </>
        }
      />

      <YieldCalculator />

      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-sm font-bold uppercase tracking-wider text-text-muted">
          How yield is computed
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          <strong className="text-text-primary">
            Υ = cache_read × output / input²
          </strong>
          . Yield rewards two things at once: reusing cached context
          (cache_read) and producing dense output per fresh token (output /
          input). An operator who re-sends the same large context every turn
          burns input without compounding — low yield. An operator who caches
          aggressively and extracts high signal per fresh token compounds — high
          yield. Volume is noise; yield is signal.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The four pillars map directly to the metrics most AI platforms now
          expose: input (fresh prompt tokens), output (generated tokens),
          cache-read (prompt-caching hits), and cache-write (new tokens written
          to cache for future reuse).
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
            href="/metrics/yield-cascade"
            className="text-gold underline underline-offset-2"
          >
            Yield (Υ)
          </Link>
          {" · "}
          <Link
            href="/tools/operator-class-checker"
            className="text-gold underline underline-offset-2"
          >
            Class Checker
          </Link>
          {" · "}
          <Link
            href="/guides/how-to-improve-your-yield"
            className="text-gold underline underline-offset-2"
          >
            Improve Your Yield
          </Link>
        </p>
      </section>
    </div>
  );
}
