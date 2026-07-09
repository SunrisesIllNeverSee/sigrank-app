/**
 * app/about/page.tsx — the About page. The Footer links here.
 *
 * Static marketing RSC. Explains SigRank in token-telemetry terms and reuses the
 * existing zero-prop marketing blocks (HowItWorks · ClassLadder · IpBoundary).
 */

import type { Metadata } from 'next'
import Link from 'next/link'
import { withOG } from '@/lib/seo'

import { WaveHero } from '@/components/ui/WaveHero'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { ClassLadder } from '@/components/marketing/ClassLadder'
import { IpBoundary } from '@/components/marketing/IpBoundary'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb } from '@/lib/jsonld'

export const metadata: Metadata = withOG({
  title: 'About',
  description:
    'SigRank is a privacy-preserving leaderboard that scores AI operators on token-telemetry metrics computed locally — token counts and lengths, never prompt content.',
  path: '/about',
})

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
      <JsonLd data={breadcrumb([
        { name: 'About', path: '/about' },
      ])} />
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

      {/* ── Privacy Policy (anchor target for the X/Twitter app + the login footer) ── */}
      <section
        id="privacy"
        className="flex scroll-mt-24 flex-col gap-4 rounded-lg border border-bg-border bg-bg-surface p-6"
      >
        <div className="flex flex-col gap-1">
          <h2 className="font-mono text-sm font-semibold uppercase tracking-wide text-text-primary">
            Privacy Policy
          </h2>
          <p className="font-mono text-[11px] text-text-dim">Last updated 2026-06-25</p>
        </div>
        <div className="flex max-w-2xl flex-col gap-4 font-sans text-sm leading-relaxed text-text-secondary">
          <p>
            SigRank (&ldquo;we&rdquo;, operated under MO§ES™ / Ello Cello LLC) is built
            privacy-first. This policy explains what we collect, what we never collect,
            and how your data is used.
          </p>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">What we collect</h3>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              <li>
                <span className="text-text-primary">Token telemetry</span> — token counts,
                content lengths, and model identifiers measured by the local agent. These
                produce your numeric scores.
              </li>
              <li>
                <span className="text-text-primary">Account identity</span> — when you sign
                in with GitHub, X, or an email magic link, we receive an identifier and
                email from that provider to create your account.
              </li>
              <li>
                <span className="text-text-primary">Profile details you choose to add</span>{' '}
                — display name, optional handle, bio, location, links, and an avatar image.
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">What we never collect</h3>
            <p>
              The content of your prompts or AI conversations. The local agent reads only
              token counts and lengths — never the words. Transcripts never leave your
              device, and we have no way to read them.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">Public vs. private</h3>
            <p>
              <span className="text-text-primary">Public by default:</span> your codename,
              display name, handle, avatar, bio, location, links, and your scores and rank —
              the leaderboard is a public, self-promotion surface.
            </p>
            <p>
              <span className="text-text-primary">Always private:</span> your sign-in email
              and any payment identifiers. These are never shown on your profile, the board,
              or the public API.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">Service providers</h3>
            <p>
              We use Supabase (authentication, database, and avatar storage), Vercel
              (hosting), your chosen sign-in provider (GitHub, X, or email), and — only if
              you choose to support the build — Stripe for payments. Stripe handles card
              data directly; we never see or store it.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">Cookies</h3>
            <p>
              We use a single authentication cookie to keep you signed in. We do not use
              advertising or third-party tracking cookies.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">Your choices</h3>
            <p>
              You can edit or clear your profile fields anytime from your profile. To delete
              your account or request data removal, email{' '}
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
          <p className="font-mono text-[11px] text-text-dim">Last updated 2026-06-25</p>
        </div>
        <div className="flex max-w-2xl flex-col gap-4 font-sans text-sm leading-relaxed text-text-secondary">
          <p>
            By using SigRank (operated under MO§ES™ / Ello Cello LLC) you agree to these
            terms.
          </p>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">What SigRank is</h3>
            <p>
              SigRank is a public leaderboard that scores AI operators on token-telemetry
              metrics. Rankings are provided as-is for informational and comparative
              purposes.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">Your account</h3>
            <p>
              Accounts are free and created by signing in with a supported provider. You are
              responsible for activity on your account and for the accuracy of the profile
              details you publish.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">Acceptable use</h3>
            <ul className="flex list-disc flex-col gap-1 pl-5">
              <li>Do not falsify, inflate, or game telemetry or scores.</li>
              <li>
                Do not impersonate another person or operator, or publish unlawful,
                infringing, or abusive content.
              </li>
              <li>Do not scrape, overload, or attempt to disrupt the service or its API.</li>
            </ul>
            <p>
              We may adjust or remove scores, profiles, or accounts that violate these terms
              or compromise leaderboard integrity.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">Your content</h3>
            <p>
              You retain ownership of the profile details you provide. By publishing them you
              grant us a license to display them on your public profile and the leaderboard.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">Support &amp; donations</h3>
            <p>
              Any optional payment is a voluntary contribution to support the build — not a
              purchase of a service tier or a guarantee. Contributions are non-refundable.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">Disclaimer</h3>
            <p>
              SigRank is provided &ldquo;as is&rdquo;, without warranties of any kind. To the
              maximum extent permitted by law, we are not liable for any damages arising from
              your use of the service.
            </p>
          </div>

          <div className="flex flex-col gap-1.5">
            <h3 className="font-semibold text-text-primary">Changes &amp; contact</h3>
            <p>
              We may update these terms; material changes will be reflected by the date
              above. Questions:{' '}
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
          Learn more:{' '}
          <Link href="/ai-operator-scoring" className="text-gold underline underline-offset-2">
            AI Operator Scoring
          </Link>
          {' · '}
          <Link href="/operator-performance" className="text-gold underline underline-offset-2">
            Operator Performance
          </Link>
          {' · '}
          <Link href="/methodology" className="text-gold underline underline-offset-2">
            Methodology
          </Link>
        </p>
      </section>
    </div>
  )
}
