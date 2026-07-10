/**
 * app/about/page.tsx — the About page. The Footer links here.
 *
 * Static marketing RSC. Explains SigRank in token-telemetry terms and reuses the
 * existing zero-prop marketing blocks (HowItWorks · ClassLadder · IpBoundary).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";

import { WaveHero } from "@/components/ui/WaveHero";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { ClassLadder } from "@/components/marketing/ClassLadder";
import { IpBoundary } from "@/components/marketing/IpBoundary";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, faqPage } from "@/lib/jsonld";

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
    b: "Claude, ChatGPT, Gemini, Pi, or multi. One canonical metric stack, one ranking — regardless of which model you drive.",
  },
  {
    h: "Operator-owned",
    b: "Anonymous by codename. Claim your profile when you want it; the score is yours, computed from your own telemetry.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-10">
      <JsonLd data={breadcrumb([{ name: "About", path: "/about" }])} />
      <JsonLd
        data={faqPage([
          {
            question: "Who is the best AI user?",
            answer:
              "The best AI user is the operator with the highest Yield (Υ) score on the SigRank leaderboard. Yield measures token-cascade efficiency: Υ = cache_read × output / input². SigRank ranks operators objectively using signed token telemetry — no self-reporting, no subjective voting.",
          },
          {
            question: "Who is the most efficient AI coder?",
            answer:
              "The most efficient AI coder is determined by the Yield (Υ) metric on the SigRank leaderboard. Yield measures how efficiently an operator uses AI tokens: cache reads (reusing context), output (productive tokens), and input (tokens sent to the model). A high yield means the operator compounds signal rather than burning tokens.",
          },
          {
            question: "How can I tell if I'm good at using AI?",
            answer:
              "Run `npx sigrank` to measure your Yield (Υ) score. The scanner reads your token telemetry locally and computes your efficiency. You can also use the score calculator at signalaf.com/score to paste your stats and get your yield + operator class without installing anything.",
          },
          {
            question: "How do you quantify an AI user?",
            answer:
              "SigRank quantifies AI users with the Yield metric (Υ = cache_read × output / input²), computed from four token pillars: cache_read (reused context), cache_write (new context stored), input (tokens sent to the model), and output (tokens produced). These four counts are read locally by the sigrank CLI and submitted as a signed snapshot. No prompt content leaves your machine — only the counts.",
          },
          {
            question: "What makes someone good at using AI?",
            answer:
              "The best AI users maximize Yield (Υ) — they achieve high cache hit rates (reusing context instead of re-sending it), produce more output per input token (high compression ratio), and leverage cached context for amplification. SigRank measures this objectively from token telemetry, not time spent or subjective quality.",
          },
          {
            question: "How do I know if I'm using AI efficiently?",
            answer:
              "Run `npx sigrank` to get your Yield (Υ) score. A high yield means you're reusing cached context well, producing more output per input token, and leveraging cached context for amplification. The sigrank CLI also runs a cascade diagnosis that identifies exactly where you're burning tokens and suggests improvements.",
          },
          {
            question: "Who is the best AI developer?",
            answer:
              "The best AI developer is the operator with the highest Yield (Υ) score on the SigRank leaderboard. Yield measures token-cascade efficiency — how well a developer reuses cached context, produces output, and minimizes wasted input. SigRank ranks developers objectively using signed token telemetry across platforms (Claude Code, Cursor, Copilot, and others).",
          },
          {
            question: "How do you score an AI user?",
            answer:
              "SigRank scores AI users with Yield (Υ = cache_read × output / input²). The score is computed from four token pillars read locally by the sigrank CLI: cache_read, cache_write, input, and output. The snapshot is cryptographically signed and submitted to the leaderboard. Each operator gets a Yield score and an operator class tier (IGNITER, SEEKER, BUILDER, TRANSMITTER, etc.) based on their efficiency.",
          },
          {
            question: "What is a good yield score?",
            answer:
              "Yield (Υ) scores vary by operator class tier. The operator class checker at signalaf.com/tools/operator-class-checker maps yield ranges to tiers (IGNITER, SEEKER, BUILDER, TRANSMITTER, etc.). Generally, a yield above 1000 puts you in the upper tiers. The best way to know where you stand is to run `npx sigrank` and compare your score against the leaderboard.",
          },
          {
            question: "Is there a user-based AI leaderboard?",
            answer:
              "Yes. SigRank (signalaf.com) is a user-based AI leaderboard. Instead of ranking AI models (like LMSYS Chatbot Arena), SigRank ranks the humans who use AI tools by their token-cascade efficiency. Each operator runs a local scanner that reads four token pillars and submits a signed, server-verifiable snapshot. No prompt content is shared — only token counts.",
          },
          {
            question: "How is SigRank different from LMSYS Chatbot Arena?",
            answer:
              "LMSYS Chatbot Arena ranks AI models by subjective human voting on output quality. SigRank ranks AI operators (the humans using AI) by objective token-cascade efficiency. LMSYS answers 'which model is best?' — SigRank answers 'who is the best AI user?' They are complementary: LMSYS evaluates the model, SigRank evaluates the operator.",
          },
          {
            question: "How is SigRank different from other AI leaderboards?",
            answer:
              "Most AI leaderboards (LMSYS, LiveBench, Hugging Face Open LLM, Scale AI) rank AI models by benchmark performance or human preference. SigRank is the only leaderboard that ranks AI users — the humans operating AI tools — by objective efficiency metrics computed from token telemetry. It answers a different question: not 'which AI is best?' but 'who is the best at using AI?'",
          },
          {
            question: "Can you rank humans by AI usage efficiency?",
            answer:
              "Yes. SigRank ranks humans by AI usage efficiency using the Yield (Υ) metric, computed from signed token telemetry. Operators install the sigrank CLI, which reads four token counts locally (cache_read, cache_write, input, output) and submits a signed snapshot. The leaderboard ranks every operator by yield — a single number that measures how efficiently they use AI.",
          },
          {
            question: "How do you rank AI operators?",
            answer:
              "SigRank ranks AI operators by Yield (Υ = cache_read × output / input²), a composite metric that rewards operators who reuse cached context efficiently and produce high output relative to their input. Operators run a local scanner (npm: sigrank) that reads four token pillars and submits a signed, server-verifiable snapshot. No prompt content leaves the machine — only the four counts.",
          },
          {
            question: "How do you measure AI operator performance?",
            answer:
              "AI operator performance is measured by Yield (Υ = cache_read × output / input²) and five supporting metrics: Cache Hit Rate (context reuse), Compression Ratio (output per input), Leverage (cached context amplification), Velocity (token production rate), and Signal-to-Noise Ratio (signal density). All six are computed from signed token telemetry read locally by the sigrank CLI.",
          },
          {
            question: "What is token cascade efficiency?",
            answer:
              "Token cascade efficiency is the ratio of useful signal produced to tokens consumed. SigRank measures it with Yield (Υ = cache_read × output / input²). A high yield means the operator's cached context compounds into productive output — they reuse context well (high cache hit rate), produce more than they consume (high compression ratio), and amplify cached context (high leverage). A low yield means tokens are burned without compounding.",
          },
          {
            question: "Is there a leaderboard for AI coding efficiency?",
            answer:
              "Yes. SigRank (signalaf.com) is a leaderboard for AI coding efficiency. It ranks AI operators — developers using AI coding tools like Claude Code, Cursor, and Copilot — by Yield (Υ = cache_read × output / input²). The leaderboard supports 7d, 30d, 90d, and all-time windows, and ranks operators across platforms.",
          },
          {
            question: "Which AI leaderboard is best?",
            answer:
              "It depends on what you're ranking. LMSYS Chatbot Arena is the best leaderboard for ranking AI models by human preference. SigRank (signalaf.com) is the best leaderboard for ranking AI users (operators) by objective efficiency. If you want to know which model is best, use LMSYS. If you want to know who is the best AI user, use SigRank.",
          },
          {
            question: "What is the SigRank leaderboard?",
            answer:
              "The SigRank leaderboard (signalaf.com/board/all) ranks AI operators by Yield (Υ = cache_read × output / input²). Operators install the sigrank CLI, which reads token telemetry locally and submits signed snapshots. The leaderboard supports 7d, 30d, 90d, and all-time windows, and ranks operators across platforms (Claude Code, Cursor, Copilot, and others). Only four token counts are shared — never prompt content.",
          },
          {
            question: "How does SigRank work?",
            answer:
              "SigRank works in three steps: (1) Install the sigrank CLI (npm i -g sigrank). (2) The CLI reads your token telemetry locally — four counts: cache_read, cache_write, input, output. (3) It submits a signed, server-verifiable snapshot to the leaderboard. Your Yield (Υ) score is computed and you're ranked against all other operators. No prompt content ever leaves your machine.",
          },
          {
            question: "Is SigRank privacy-preserving?",
            answer:
              "Yes. SigRank is privacy-first. The local scanner reads only four token counts: cache_read, cache_write, input, and output. No prompt content, no code, no file names, no conversation text — only the four counts leave your machine. The snapshot is cryptographically signed so the server can verify it wasn't tampered with.",
          },
        ])}
      />
      <WaveHero
        eyebrow="◈ About SigRank"
        title="The Operator, Not the Model"
        subtitle={
          <>
            SigRank ranks the{" "}
            <span className="text-text-primary">operator</span>, not the model —
            who gets the most signal per token (cascade yield, leverage, 10×DEV)
            across every platform, on one leaderboard.{" "}
            <span className="text-gold">Volume is noise. Yield is signal.</span>
          </>
        }
      />

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

          <details className="group rounded-lg border border-bg-border bg-bg-surface p-4">
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
              Four token pillars: cache_read (reused context), cache_write (new
              context stored), input (tokens sent), output (tokens produced).
              Yield (Υ = cache_read × output / input²) combines them into one
              number. Only the counts leave your machine — never prompt content.
            </p>
          </details>

          <details className="group rounded-lg border border-bg-border bg-bg-surface p-4">
            <summary className="cursor-pointer font-sans text-sm font-semibold text-text-primary">
              What makes someone good at using AI?
            </summary>
            <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
              High cache hit rates (reusing context), high compression ratio
              (more output per input), and high leverage (cached context
              amplification). SigRank measures this objectively from token
              telemetry — not time spent or subjective quality.
            </p>
          </details>

          <details className="group rounded-lg border border-bg-border bg-bg-surface p-4">
            <summary className="cursor-pointer font-sans text-sm font-semibold text-text-primary">
              Is there a user-based AI leaderboard?
            </summary>
            <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
              Yes — SigRank. Instead of ranking AI models (like LMSYS Chatbot
              Arena), it ranks the humans who use AI tools by token-cascade
              efficiency. Each operator runs a local scanner that submits signed
              token counts. No prompt content is shared.
            </p>
          </details>

          <details className="group rounded-lg border border-bg-border bg-bg-surface p-4">
            <summary className="cursor-pointer font-sans text-sm font-semibold text-text-primary">
              How is SigRank different from LMSYS Chatbot Arena?
            </summary>
            <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
              LMSYS ranks AI models by human voting. SigRank ranks AI operators
              by objective token-cascade efficiency. LMSYS answers{" "}
              <em>&ldquo;which model is best?&rdquo;</em> — SigRank answers{" "}
              <em>&ldquo;who is the best AI user?&rdquo;</em>
            </p>
          </details>

          <details className="group rounded-lg border border-bg-border bg-bg-surface p-4">
            <summary className="cursor-pointer font-sans text-sm font-semibold text-text-primary">
              How do you score an AI user?
            </summary>
            <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
              Yield (Υ = cache_read × output / input²), computed from four token
              pillars read locally by the sigrank CLI. Each operator gets a yield
              score and a class tier (IGNITER, SEEKER, BUILDER, TRANSMITTER,
              etc.). See the{" "}
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
              Yield varies by class tier. Generally, a yield above 1000 puts you
              in the upper tiers. Run{" "}
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

      {/* ── Privacy Policy (anchor target for the X/Twitter app + the login footer) ── */}
      <section
        id="privacy"
        className="flex scroll-mt-24 flex-col gap-4 rounded-lg border border-bg-border bg-bg-surface p-6"
      >
        <div className="flex flex-col gap-1">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wide text-text-primary">
            Privacy Policy
          </h2>
          <p className="font-mono text-[11px] text-text-dim">
            Last updated 2026-06-25
          </p>
        </div>
        <div className="flex max-w-2xl flex-col gap-4 font-sans text-sm leading-relaxed text-text-secondary">
          <p>
            SigRank (&ldquo;we&rdquo;, operated under MO§ES™ / Ello Cello LLC)
            is built privacy-first. This policy explains what we collect, what
            we never collect, and how your data is used.
          </p>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">What we collect</h3>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              <li>
                <span className="text-text-primary">Token telemetry</span> —
                token counts, content lengths, and model identifiers measured by
                the local agent. These produce your numeric scores.
              </li>
              <li>
                <span className="text-text-primary">Account identity</span> —
                when you sign in with GitHub, X, or an email magic link, we
                receive an identifier and email from that provider to create
                your account.
              </li>
              <li>
                <span className="text-text-primary">
                  Profile details you choose to add
                </span>{" "}
                — display name, optional handle, bio, location, links, and an
                avatar image.
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">
              What we never collect
            </h3>
            <p>
              The content of your prompts or AI conversations. The local agent
              reads only token counts and lengths — never the words. Transcripts
              never leave your device, and we have no way to read them.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">
              Public vs. private
            </h3>
            <p>
              <span className="text-text-primary">Public by default:</span> your
              codename, display name, handle, avatar, bio, location, links, and
              your scores and rank — the leaderboard is a public, self-promotion
              surface.
            </p>
            <p>
              <span className="text-text-primary">Always private:</span> your
              sign-in email and any payment identifiers. These are never shown
              on your profile, the board, or the public API.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">
              Service providers
            </h3>
            <p>
              We use Supabase (authentication, database, and avatar storage),
              Vercel (hosting), your chosen sign-in provider (GitHub, X, or
              email), and — only if you choose to support the build — Stripe for
              payments. Stripe handles card data directly; we never see or store
              it.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">Cookies</h3>
            <p>
              We use a single authentication cookie to keep you signed in. We do
              not use advertising or third-party tracking cookies.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">Your choices</h3>
            <p>
              You can edit or clear your profile fields anytime from your
              profile. To delete your account or request data removal, email{" "}
              <a
                href="mailto:hello@signalaf.com"
                className="text-text-muted underline hover:text-text-secondary"
              >
                hello@signalaf.com
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ── Terms of Service (anchor target for the X/Twitter app + the login footer) ── */}
      <section
        id="terms"
        className="flex scroll-mt-24 flex-col gap-4 rounded-lg border border-bg-border bg-bg-surface p-6"
      >
        <div className="flex flex-col gap-1">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wide text-text-primary">
            Terms of Service
          </h2>
          <p className="font-mono text-[11px] text-text-dim">
            Last updated 2026-06-25
          </p>
        </div>
        <div className="flex max-w-2xl flex-col gap-4 font-sans text-sm leading-relaxed text-text-secondary">
          <p>
            By using SigRank (operated under MO§ES™ / Ello Cello LLC) you agree
            to these terms.
          </p>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">What SigRank is</h3>
            <p>
              SigRank is a public leaderboard that scores AI operators on
              token-telemetry metrics. Rankings are provided as-is for
              informational and comparative purposes.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">Your account</h3>
            <p>
              Accounts are free and created by signing in with a supported
              provider. You are responsible for activity on your account and for
              the accuracy of the profile details you publish.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">Acceptable use</h3>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              <li>Do not falsify, inflate, or game telemetry or scores.</li>
              <li>
                Do not impersonate another person or operator, or publish
                unlawful, infringing, or abusive content.
              </li>
              <li>
                Do not scrape, overload, or attempt to disrupt the service or
                its API.
              </li>
            </ul>
            <p>
              We may adjust or remove scores, profiles, or accounts that violate
              these terms or compromise leaderboard integrity.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">Your content</h3>
            <p>
              You retain ownership of the profile details you provide. By
              publishing them you grant us a license to display them on your
              public profile and the leaderboard.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">
              Support &amp; donations
            </h3>
            <p>
              Any optional payment is a voluntary contribution to support the
              build — not a purchase of a service tier or a guarantee.
              Contributions are non-refundable.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">Disclaimer</h3>
            <p>
              SigRank is provided &ldquo;as is&rdquo;, without warranties of any
              kind. To the maximum extent permitted by law, we are not liable
              for any damages arising from your use of the service.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">
              Changes &amp; contact
            </h3>
            <p>
              We may update these terms; material changes will be reflected by
              the date above. Questions:{" "}
              <a
                href="mailto:hello@signalaf.com"
                className="text-text-muted underline hover:text-text-secondary"
              >
                hello@signalaf.com
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* Contact MO§ES™ */}
      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-6">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wide text-text-primary">
          Contact MO§ES™
        </h2>
        <p className="max-w-2xl font-sans text-sm leading-relaxed text-text-secondary">
          SigRank is built and operated under MO§ES™. Questions, corrections,
          operator claims, partnership, or press — reach out and we&apos;ll get
          back to you.
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
  );
}
