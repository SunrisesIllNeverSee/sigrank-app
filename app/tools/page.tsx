/**
 * app/tools/page.tsx — Tools index.
 *
 * Hub page listing all four interactive calculators. Each child page carries
 * WebApplication + FAQPage + BreadcrumbList schema. This index adds an ItemList
 * so AI engines see the full tool set as a structured collection.
 *
 * JSON-LD: breadcrumb() + ItemList.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";
import { WaveHero } from "@/components/ui/WaveHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, alternativesItemList, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Tools — AI Token Efficiency Calculators",
  description:
    "Four interactive calculators: Yield (Υ) Calculator, Cascade Comparator, Operator Class Checker, and Token Waste Calculator. Enter your token pillars and get instant results — no account needed.",
  path: "/tools",
});

export const revalidate = 86400;

const TOOLS = [
  {
    href: "/tools/yield-calculator",
    title: "Yield (Υ) Calculator — Token Cascade Efficiency",
    desc: "Enter the four token pillars (input, output, cache-read, cache-write) to compute the Υ Yield score, compression ratio, cache hit rate, and class tier.",
  },
  {
    href: "/tools/cascade-comparator",
    title: "Cascade Comparator — Compare Two AI Token Cascades",
    desc: "Compare two AI token cascades side by side. Enter two sets of four token pillars to see yield, compression ratio, cache hit rate, and leverage for each.",
  },
  {
    href: "/tools/operator-class-checker",
    title: "Operator Class Checker — AI Tier Calculator",
    desc: "Enter a yield score or four token pillars to determine your AI operator class tier - IGNITER through ARCH+. TRANSMITTER is a separate peak badge, not a tier.",
  },
  {
    href: "/tools/token-waste-calculator",
    title: "Token Waste Calculator — AI Token Waste",
    desc: "Estimate wasted AI tokens from the four token pillars. Shows an efficiency percentage and a waste breakdown by category.",
  },
];

export default function ToolsIndex() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8 py-2">
      <JsonLd
        data={[
          breadcrumb([{ name: "Tools", path: "/tools" }]),
          alternativesItemList(TOOLS.map((t) => ({ name: t.title })), "/tools", "SigRank Tools — All Calculators"),
        ]}
      />
      <JsonLd
        data={faqPage([
          {
            question: "What is the Yield (Υ) Calculator?",
            answer:
              "The Yield Calculator is a free tool that computes your Υ = (cache_read × output) / input² score from four token pillars (input, output, cache-read, cache-write). It also shows your compression ratio, cache hit rate, and class tier. No account needed — visit signalaf.com/tools/yield-calculator.",
          },
          {
            question: "What is the Cascade Comparator?",
            answer:
              "The Cascade Comparator lets you compare two AI token cascades side by side. Enter two sets of four token pillars to see yield, compression ratio, cache hit rate, and leverage for each operator. Useful for benchmarking yourself against top operators or comparing two time windows.",
          },
          {
            question: "What is the Operator Class Checker?",
            answer:
              "The Operator Class Checker maps your Yield score to one of 8 class tiers: IGNITER, BEARER, REFINER, SEEKER, BASE, POWER, ARCH, or ARCH+. TRANSMITTER is a separate peak badge, not a class tier. Enter a yield score or four token pillars to determine your tier.",
          },
          {
            question: "What is the Token Waste Calculator?",
            answer:
              "The Token Waste Calculator estimates wasted AI tokens from your four token pillars. It shows an efficiency percentage and a waste breakdown by category — repeated context, poor caching, verbose prompts, and unnecessary re-rolls. Free, no account needed.",
          },
          {
            question: "Are SigRank calculators free?",
            answer:
              "Yes. All four SigRank calculators (Yield Calculator, Cascade Comparator, Operator Class Checker, and Token Waste Calculator) are free and require no account. Visit signalaf.com/tools to use them.",
          },
        ])}
      />

      <WaveHero
        eyebrow="◈ Tools"
        title="Interactive Calculators"
        subtitle={
          <>
            Enter your <span className="text-gold">four token pillars</span> and
            get instant yield, class, and waste breakdowns — no account needed.
          </>
        }
      />

      <div className="flex flex-col gap-6">
        {TOOLS.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="group flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5 transition-colors hover:border-gold/40"
          >
            <h2 className="font-sans text-xl font-bold text-text-primary group-hover:text-gold">
              {t.title}
            </h2>
            <p className="text-sm leading-relaxed text-text-secondary">
              {t.desc}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
