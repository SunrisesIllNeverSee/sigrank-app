import { getHomepageStats } from '@/lib/data'
import { MotionPause } from '@/components/home/MotionPause'
import { DeletedNotice } from '@/components/home/DeletedNotice'
import { HowItWorks } from '@/components/marketing/HowItWorks'
import { IpBoundary } from '@/components/marketing/IpBoundary'
import { PricingCards } from '@/components/marketing/PricingCards'
import { ThreeDegreesChart } from '@/components/marketing/ThreeDegreesChart'
import { Draft2Hero } from '@/components/draft/Draft2Hero'
import { Draft2LiveActivity } from '@/components/draft/Draft2LiveActivity'
import { Draft2CtaBand } from '@/components/draft/Draft2CtaBand'
import type { Metadata } from 'next'
import { withOG } from '@/lib/seo'

export const metadata: Metadata = withOG({
  title: 'SigRank — AI Operator Leaderboard',
  description:
    'Privacy-preserving leaderboard scoring AI operators on canonical token-telemetry metrics. Rank by Υ Yield, see the cascade, claim your operator.',
  path: '/',
})

/**
 * Homepage (`/`) — the landing.
 *
 * Order (owner 2026-06-22): Hero → Live board (activity tracker — the 4 MiniBoards
 * were archived; "Real operators. Real cascades." headline moved into the tracker) →
 * Three Degrees of Leverage chart (the show-stopper, with sources/footnotes above it +
 * a link to the full wiki description) → How it works → IP/privacy → Tiers → CTA.
 * Indexable — no draft banner, no #keys overlay, no noindex. The previous HF-Space-style
 * landing (wordmark + ticker + 3-box rows) is archived + disconnected:
 * Devins_Plans/_archive/old-landing-page-2026-06-21.tsx.txt. Draft2BoardsGrid archived:
 * Devins_Plans/_archive/components/Draft2BoardsGrid.tsx.txt.
 *
 * Server component: all data reads here; the client islands (CascadeHeader,
 * MotionPause) render as children. The Draft2* component names are retained for
 * now (functional; rename is a later cleanup).
 */
export default async function HomePage() {
  const homeStats = await getHomepageStats()

  return (
    <div className="flex flex-col gap-8 py-2">
      <DeletedNotice />
      <Draft2Hero />

      {/* Live board — the activity tracker now owns the whole section (owner 2026-06-22:
          the 4 MiniBoards were archived; "Real operators. Real cascades." moved into it).
          First under the hero. */}
      <Draft2LiveActivity stats={homeStats} />

      {/* The three degrees of leverage — our show-stopper, directly under the live board,
          with sources/footnotes above the chart + a link to the full wiki description
          (owner 2026-06-22). */}
      <ThreeDegreesChart variant="embed" />

      <HowItWorks />
      <IpBoundary />
      <PricingCards />
      <Draft2CtaBand />
      <MotionPause />
    </div>
  )
}
