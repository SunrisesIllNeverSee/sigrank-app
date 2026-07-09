import type { Metadata } from 'next'
import { withOG } from '@/lib/seo'
import Link from 'next/link'
import { SupportCheckout } from '@/components/billing/SupportCheckout'

/**
 * app/upgrade/page.tsx — the "back the build" checkout-start page.
 *
 * Target of the Pro page's "Support the build" CTA (and the PricingModal). The
 * heavy lifting is the client SupportCheckout island, which POSTs to
 * /api/v1/billing/create-checkout-session and redirects to Stripe. With no
 * Stripe creds the API 503s and the island shows "not live yet" — it NEVER
 * falsely completes a sale. ?tier= preselects patron (the early-supporter tier).
 *
 * Pro is not ironed out (owner, 2026-06-18): this page funds the build as an
 * early-supporter contribution, not a fixed Pro subscription.
 */

export const metadata: Metadata = withOG({
  title: 'Back the build',
  description:
    'Support SigRank as an early backer. The leaderboard stays free; supporters fund the precision tier and lock in lifetime founding-supporter perks.',
  path: '/upgrade',
})

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<{ tier?: string }>
}) {
  const { tier } = await searchParams
  void tier // preset selection is handled inside SupportCheckout
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 py-8">
      <header className="flex flex-col gap-2 text-center">
        <span className="font-mono text-[11px] uppercase tracking-[0.08em] text-gold">
          ◈ Back the build
        </span>
        <h1 className="font-mono text-2xl font-bold tracking-wide text-text-primary">
          Become a founding supporter
        </h1>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The leaderboard is free and stays free. A precision tier is in the
          works — early supporters fund it and lock in lifetime
          founding-supporter perks at today&apos;s rate. Thank you for backing
          the build.
        </p>
      </header>

      <SupportCheckout />

      {/* ── Founding supporter perks ── */}
      <section className="flex flex-col gap-3">
        <h2 className="font-mono text-base font-bold text-text-primary">
          Founding supporter perks
        </h2>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Founding supporters lock in <strong className="text-text-primary">lifetime
          perks</strong> at today&apos;s rate — the price never changes for you, even
          as the precision tier matures and pricing increases for new subscribers.
          You get permanent <strong className="text-text-primary">founding-supporter
          status</strong> on your profile, marking you as someone who backed the build
          before it was polished.
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The precision tier unlocks deeper analytics: per-session cascade breakdowns,
          historical yield trajectories, head-to-head comparisons without rate limits,
          and exportable reports. Founding supporters get all of this at the early-backer
          rate for as long as SigRank exists. The leaderboard itself — the board, the
          Hall, the metrics pages — stays free for everyone. Your contribution funds the
          precision layer and the ongoing build.
        </p>
      </section>

      <p className="text-center font-mono text-[11px] text-text-dim">
        Secure checkout via Stripe ·{' '}
        {/* TODO(sweep 2026-06-22): /pro removed in ITEM 1 — repointed to /wiki; restore the Pro explainer target when Stripe goes live in the new repo. */}
        <Link href="/wiki" className="text-text-muted underline hover:text-text-secondary">
          what you&apos;re backing
        </Link>
      </p>
    </div>
  )
}
