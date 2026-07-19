import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import PillarFlowDiagram from "@/components/score/PillarFlowDiagram";
import CascadeSnowball from "@/components/score/CascadeSnowball";
import YieldFormulaVisual from "@/components/score/YieldFormulaVisual";

export const metadata: Metadata = withOG({
  title: "Learn — the token cascade model",
  description:
    "How the SigRank token cascade works: the four pillars, the cascade snowball, and the yield formula. Visual explainers with real data.",
  path: "/learn",
});

export default function LearnPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
      {/* Hero */}
      <div className="flex flex-col gap-3 text-center">
        <span className="font-mono text-xs uppercase tracking-widest text-gold">
          ◈ Learn the model
        </span>
        <h1 className="font-mono text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
          The token cascade, explained
        </h1>
        <p className="mx-auto max-w-xl font-sans text-sm leading-relaxed text-text-secondary">
          Three things you need to know: the four pillars (what tokens
          are), the cascade (how they compound), and the yield formula
          (how we measure it). Visual, not abstract.
        </p>
      </div>

      {/* Diagrams */}
      <div className="mt-12 flex flex-col gap-16">
        <PillarFlowDiagram />
        <CascadeSnowball />
        <YieldFormulaVisual />
      </div>

      {/* CTA */}
      <div className="mt-16 border-t border-bg-border-subtle pt-8 text-center">
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Ready to see your own cascade?{" "}
          <Link
            href="/score"
            className="text-text-accent underline-offset-2 hover:underline"
          >
            Get scored →
          </Link>
        </p>
      </div>
    </main>
  );
}
