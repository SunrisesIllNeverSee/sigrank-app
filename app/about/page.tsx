/**
 * app/about/page.tsx — the About page. The Footer links here.
 *
 * Static marketing RSC. Explains SigRank in token-telemetry terms and reuses the
 * existing zero-prop marketing blocks (HowItWorks · ClassLadder · IpBoundary).
 */

import type { Metadata } from "next";
import { FieldWorkspaceFrame } from "@/components/field/FieldWorkspaceFrame";
import Link from "next/link";
import { withOG } from "@/lib/seo";

import { WaveHero } from "@/components/ui/WaveHero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { ClassLadder } from "@/components/marketing/ClassLadder";
import { IpBoundary } from "@/components/marketing/IpBoundary";
import { JsonLd } from "@/components/seo/JsonLd";
import { aboutPage, breadcrumb, faqPage } from "@/lib/jsonld";
import { FaqSection } from "@/components/seo/FaqSection";
import { ABOUT_MORE_FAQS } from "@/lib/seo/page-faqs";

export const metadata: Metadata = withOG({
  title: "About",
  description:
    "SigRank is a privacy-preserving leaderboard that scores AI operators on token-telemetry metrics computed locally \u2014 token counts, never prompt content.",
  path: "/about",
});

const PILLARS: { h: string; b: string }[] = [
  {
    h: "Token telemetry only",
    b: "The local agent reads token counts and content lengths — never the words of your prompts. Only the resulting numeric scores ever leave your device.",
  },
  {
    h: "Platform-neutral",
    b: "Whether you run Claude, ChatGPT, Gemini, Pi, or multi, there is one canonical metric stack and one ranking, regardless of which model you drive.",
  },
  {
    h: "Operator-owned",
    b: "You stay anonymous behind a codename and sign up when you want in; the score is yours, computed from your own telemetry.",
  },
];

export default function AboutPage() {
  return (
    <FieldWorkspaceFrame current="about" title="ABOUT SIGRANK" rightTitle="ABOUT" right={<div className="mod"><div className="mini-h"><span className="sq" />OVERVIEW</div><p className="ws-note">Privacy-preserving operator evaluation · SignalAF × SigRank.</p></div>}>
    <div className="flex flex-col gap-10">
      {/* Fragments are not sent to the server. This zero-dependency redirect
          also works on local previews when client hydration is unavailable. */}
      <script dangerouslySetInnerHTML={{ __html:
        "(function(){function go(){if(location.hash==='#privacy')location.replace('/privacy');else if(location.hash==='#terms')location.replace('/terms')}go();window.addEventListener('hashchange',go)})()"
      }} />
      <JsonLd data={breadcrumb([{ name: "About", path: "/about" }])} />
      <JsonLd
        data={aboutPage({
          path: "/about",
          name: "About SigRank",
          description:
            "SigRank is a privacy-preserving leaderboard that scores AI operators on token-telemetry metrics computed locally \u2014 token counts, never prompt content.",
        })}
      />
      {/* FAQPage mirrors the visible FAQ section below (same questions, plain-
          text answers) — keep the two in sync when either changes. */}
      <JsonLd
        data={faqPage([
          {
            question: "Who is the best AI user?",
            answer:
              "The operator with the highest Yield (Υ) score on the leaderboard. Yield measures token-cascade efficiency: Υ = cache_read × output / input².",
          },
          {
            question: "How can I tell if I'm good at using AI?",
            answer:
              "Run npx sigrank to measure your Yield (Υ) score, or use the score calculator to paste your stats without installing anything.",
          },
          {
            question: "How do you quantify an AI user?",
            answer:
              "SigRank uses four token pillars: cache_read (reused context), cache_write (new context stored), input (tokens sent), and output (tokens produced), and Yield (Υ = cache_read × output / input²) combines them into one number. Only the counts leave your machine — never prompt content.",
          },
          {
            question: "What makes someone good at using AI?",
            answer:
              "Strong operators show high cache hit rates (reusing context), a high compression ratio (more output per input), and high leverage (cached context amplification). SigRank measures this objectively from token telemetry, not from time spent or subjective quality.",
          },
          {
            question: "Is there a user-based AI leaderboard?",
            answer:
              "Yes, SigRank is one. Instead of ranking AI models (like LMSYS Chatbot Arena), it ranks the accounts that use AI tools by token-cascade efficiency. Each operator runs a local scanner that submits signed token counts. No prompt content is shared.",
          },
          {
            question: "How is SigRank different from LMSYS Chatbot Arena?",
            answer:
              "LMSYS ranks AI models by human voting, while SigRank ranks AI operators by objective token-cascade efficiency. LMSYS answers “which model is best?” and SigRank answers “who is the best AI user?”",
          },
          {
            question: "How do you score an AI user?",
            answer:
              "SigRank scores with Yield (Υ = cache_read × output / input²), computed from four token pillars read locally by the sigrank CLI. Each operator gets a yield score and a class tier (IGNITER through ARCH+). TRANSMITTER is a separate peak badge, not a tier. See the class checker for the tier mapping.",
          },
          {
            question: "What is a good yield score?",
            answer:
              "Yield is unbounded and relative — benchmark against the live leaderboard. Rough bands: below 0.5 is low, 0.5–2 is moderate, 2–10 is high, and 10+ is very high. Class tier is separate — it is based on total tokens, not yield (see the class checker). Run npx sigrank and compare your score on the leaderboard.",
          },
          // Rendered visibly by the "More questions" FaqSection below.
          ...ABOUT_MORE_FAQS,
        ])}
      />
      <WaveHero
        eyebrow="◈ About SigRank"
        title="The Operator, Not the Model"
      />
      {/* lede moved out of the pinned masthead (owner 2026-10-17) */}
      <p className="ws-hero-lede">
        SignalAF (not Signal Messenger) is the web platform for SigRank, an
        AI operator evaluation leaderboard. SigRank ranks the{" "}
        <span className="text-text-primary">operator</span>, not the model,
        by who gets the most signal per token (cascade yield, leverage,
        10×DEV) across every platform on one leaderboard.{" "}
        <span className="text-gold">Volume alone is noise. Yield is signal.</span>
      </p>

      <section className="grid gap-4 sm:grid-cols-3">
        {PILLARS.map((c) => (
          <div
            key={c.h}
            className="flex flex-col gap-2 rounded-lg border border-bg-border bg-bg-surface p-5"
          >
            <h3 className="font-sans text-sm font-semibold text-text-primary">
              {c.h}
            </h3>
            <p className="font-sans text-sm leading-relaxed text-text-muted">
              {c.b}
            </p>
          </div>
        ))}
      </section>

      <HowItWorks />
      <ClassLadder />
      <IpBoundary />

      {/* ── FAQ ── */}
      <section
        id="about-faq"
        className="flex flex-col gap-4"
        aria-label="Frequently asked questions"
      >
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wide text-text-primary">
          FAQ
        </h2>
        <div className="flex flex-col gap-3">
          <details className="group rounded-lg border border-bg-border bg-bg-surface p-4">
            <summary className="cursor-pointer font-sans text-sm font-semibold text-text-primary">
              Who is the best AI user?
            </summary>
            <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
              The operator with the highest Yield (Υ) score on the{" "}
              <Link href="/board/all" className="text-gold underline underline-offset-2">
                leaderboard
              </Link>
              . Yield measures token-cascade efficiency:{" "}
              <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-xs text-gold">
                Υ = cache_read × output / input²
              </code>
              .
            </p>
          </details>

          <details id="install" className="group rounded-lg border border-bg-border bg-bg-surface p-4">
            <summary className="cursor-pointer font-sans text-sm font-semibold text-text-primary">
              How can I tell if I&apos;m good at using AI?
            </summary>
            <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
              Run{" "}
              <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-xs text-gold">
                npx sigrank
              </code>{" "}
              to measure your Yield (Υ) score, or use the{" "}
              <Link href="/score" className="text-gold underline underline-offset-2">
                score calculator
              </Link>{" "}
              to paste your stats without installing anything.
            </p>
          </details>

          <details className="group rounded-lg border border-bg-border bg-bg-surface p-4">
            <summary className="cursor-pointer font-sans text-sm font-semibold text-text-primary">
              How do you quantify an AI user?
            </summary>
            <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
              SigRank uses four token pillars: cache_read (reused context),
              cache_write (new context stored), input (tokens sent), and output
              (tokens produced), and Yield (Υ = cache_read × output / input²)
              combines them into one number. Only the counts leave your machine — never prompt content.
            </p>
          </details>

          <details className="group rounded-lg border border-bg-border bg-bg-surface p-4">
            <summary className="cursor-pointer font-sans text-sm font-semibold text-text-primary">
              What makes someone good at using AI?
            </summary>
            <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
              Strong operators show high cache hit rates (reusing context), a
              high compression ratio (more output per input), and high leverage
              (cached context amplification). SigRank measures this objectively
              from token telemetry, not from time spent or subjective quality.
            </p>
          </details>

          <details className="group rounded-lg border border-bg-border bg-bg-surface p-4">
            <summary className="cursor-pointer font-sans text-sm font-semibold text-text-primary">
              Is there a user-based AI leaderboard?
            </summary>
            <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
              Yes, SigRank is one. Instead of ranking AI models (like LMSYS Chatbot
              Arena), it ranks the accounts that use AI tools by token-cascade
              efficiency. Each operator runs a local scanner that submits signed
              token counts. No prompt content is shared.
            </p>
          </details>

          <details className="group rounded-lg border border-bg-border bg-bg-surface p-4">
            <summary className="cursor-pointer font-sans text-sm font-semibold text-text-primary">
              How is SigRank different from LMSYS Chatbot Arena?
            </summary>
            <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
              LMSYS ranks AI models by human voting, while SigRank ranks AI
              operators by objective token-cascade efficiency. LMSYS answers{" "}
              <em>&ldquo;which model is best?&rdquo;</em> and SigRank answers{" "}
              <em>&ldquo;who is the best AI user?&rdquo;</em>
            </p>
          </details>

          <details className="group rounded-lg border border-bg-border bg-bg-surface p-4">
            <summary className="cursor-pointer font-sans text-sm font-semibold text-text-primary">
              How do you score an AI user?
            </summary>
            <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
              SigRank scores with Yield (Υ = cache_read × output / input²),
              computed from four token pillars read locally by the sigrank CLI.
              Each operator gets a yield
              score and a class tier (IGNITER through ARCH+). TRANSMITTER is a
              separate peak badge, not a tier. See the{" "}
              <Link href="/tools/operator-class-checker" className="text-gold underline underline-offset-2">
                class checker
              </Link>{" "}
              for the tier mapping.
            </p>
          </details>

          <details className="group rounded-lg border border-bg-border bg-bg-surface p-4">
            <summary className="cursor-pointer font-sans text-sm font-semibold text-text-primary">
              What is a good yield score?
            </summary>
            <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
              Yield is unbounded and relative — benchmark against the live
              leaderboard. Rough bands: below 0.5 is low, 0.5–2 is moderate,
              2–10 is high, and 10+ is very high. Class tier is separate — it is
              based on total tokens, not yield (see the{" "}
              <Link href="/tools/operator-class-checker" className="text-gold underline underline-offset-2">
                class checker
              </Link>
              ). Run{" "}
              <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-xs text-gold">
                npx sigrank
              </code>{" "}
              and compare against the{" "}
              <Link href="/board/all" className="text-gold underline underline-offset-2">
                leaderboard
              </Link>
              .
            </p>
          </details>
        </div>
      </section>

      <FaqSection faqs={ABOUT_MORE_FAQS} id="about-faq-more" heading="More questions" />

      {/* Legal policies are maintained at their canonical standalone URLs.
          These legacy fragment anchors retain a useful no-JS fallback. */}
      <nav aria-label="Legal documents" className="flex flex-wrap gap-5 font-mono text-xs text-text-secondary">
        <Link id="privacy" href="/privacy" className="underline underline-offset-2 hover:text-gold">
          Privacy Policy ↗
        </Link>
        <Link id="terms" href="/terms" className="underline underline-offset-2 hover:text-gold">
          Terms of Service ↗
        </Link>
      </nav>

      {/* Contact MO§ES™ */}
      <section id="about-contact" className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wide text-text-primary">
          Contact MO§ES™
        </h2>
        <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is built and operated under MO§ES™. For questions,
          corrections, operator claims, partnership, or press, reach out and
          we&apos;ll get back to you.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="mailto:hello@signalaf.com"
            className="rounded-md bg-gold px-4 py-2 font-mono text-xs font-semibold text-bg-base transition-colors hover:bg-gold/90"
          >
            hello@signalaf.com
          </a>
          <a
            href="https://x.com/burnmydays"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-bg-border px-4 py-2 font-mono text-xs text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
          >
            @burnmydays on X →
          </a>
        </div>
        <p className="font-mono text-[11px] text-text-dim">
          All signal is monitored. All drift is noted.
        </p>
      </section>

      {/* ── Topic hubs ── */}
      <section className="mt-4 border-t border-bg-border-subtle pt-6">
        <p className="font-sans text-sm text-text-muted">
          Learn more:{" "}
          <Link
            href="/ai-operator-scoring"
            className="text-gold underline underline-offset-2"
          >
            AI Operator Scoring
          </Link>
          {" · "}
          <Link
            href="/operator-performance"
            className="text-gold underline underline-offset-2"
          >
            Operator Performance
          </Link>
          {" · "}
          <Link
            href="/methodology"
            className="text-gold underline underline-offset-2"
          >
            Methodology
          </Link>
        </p>
      </section>
    </div>
    </FieldWorkspaceFrame>
  );
}
