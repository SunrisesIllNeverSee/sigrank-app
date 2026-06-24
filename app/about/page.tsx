/**
 * app/about/page.tsx — the About page. The Footer links here.
 *
 * Static marketing RSC. Explains SigRank in token-telemetry terms and reuses the
 * existing zero-prop marketing blocks (HowItWorks · ClassLadder · IpBoundary).
 */

import type { Metadata } from 'next'

import { WaveHero } from '@/components/ui/WaveHero'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { ClassLadder } from '@/components/marketing/ClassLadder'
import { IpBoundary } from '@/components/marketing/IpBoundary'

export const metadata: Metadata = {
  title: 'About · SigRank',
  description:
    'SigRank is a privacy-preserving leaderboard that scores AI operators on token-telemetry metrics computed locally — token counts and lengths, never prompt content.',
}

const PILLARS: { h: string; b: string }[] = [
  {
    h: 'Token telemetry only',
    b: 'The local agent reads token counts and content lengths — never the words of your prompts. Only the resulting numeric scores ever leave your device.',
  },
  {
    h: 'Platform-neutral',
    b: 'Claude, ChatGPT, Gemini, Pi, or multi. One canonical metric stack, one ranking — regardless of which model you drive.',
  },
  {
    h: 'Operator-owned',
    b: 'Anonymous by codename. Claim your profile when you want it; the score is yours, computed from your own telemetry.',
  },
]

export default function AboutPage() {
  return (
    <div className="flex flex-col gap-10">
      <WaveHero
        eyebrow="◈ About SigRank"
        title="The Operator, Not the Model"
        subtitle={
          <>
            SigRank ranks the <span className="text-text-primary">operator</span>, not the
            model — who gets the most signal per token (cascade yield, leverage, 10×DEV)
            across every platform, on one leaderboard.{' '}
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
            <h3 className="font-sans text-sm font-semibold text-text-primary">{c.h}</h3>
            <p className="font-sans text-sm leading-relaxed text-text-muted">{c.b}</p>
          </div>
        ))}
      </section>

      <HowItWorks />
      <ClassLadder />
      <IpBoundary />

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
    </div>
  )
}
