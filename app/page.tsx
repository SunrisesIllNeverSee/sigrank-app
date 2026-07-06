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
import { JsonLd } from '@/components/seo/JsonLd'
import { cliTool } from '@/lib/jsonld'
import Link from 'next/link'

// ISR: the Three Degrees chart now auto-pulls the top operator's live all-time metrics
// (lib/marketing/top-operator-column.ts). Revalidate hourly so the page stays prerendered
// (○ Static) + refreshes the gold column + metadata/brand edits propagate within the hour
// (was 86400 — a metadata change took up to 24h to show in-browser).
export const revalidate = 3600

// Home title carries the dual brand: SigRank (the product) · SignalAF (the domain identity),
// near-equal parallel per owner. Sub-pages get just "· SigRank" via the root template
// (SITE_NAME); the home title is the root segment so it's set in full here. Description is
// the hero's voice (kept in sync with SITE_TAGLINE).
export const metadata: Metadata = withOG({
  title: 'SigRank · SignalAF — AI Operator Leaderboard',
  description:
    'The new standard in AI evaluation & benchmarks. SigRank measures the architecture of your token cascade — is signal compounding, or are tokens burned?',
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
      {/* JSON-LD: SoftwareApplication — the sigrank CLI tool (GEO: machine-readable software product) */}
      <JsonLd data={cliTool()} />

      <DeletedNotice />
      <Draft2Hero />

      {/* The three degrees of leverage — our show-stopper, directly under the hero
          (owner 2026-07-02: moved above the live board so the comparison table leads,
          with the explanation underneath). Sources/footnotes + a link to the full wiki
          description live inside the section. */}
      <ThreeDegreesChart variant="embed" />

      {/* Live board — the activity tracker now owns the whole section (owner 2026-06-22:
          the 4 MiniBoards were archived; "Real operators. Real cascades." moved into it).
          Now sits under the Three Degrees section. */}
      <Draft2LiveActivity stats={homeStats} />

      <HowItWorks />
      <IpBoundary />
      <PricingCards />
      <Draft2CtaBand />

      {/* Research + methodology links — internal links from the indexed homepage
          to /methodology and /research so Google discovers + indexes them (G3/G4).
          Also gives visitors a path to the citation/data sources. */}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pb-4 text-center">
        <Link
          href="/methodology"
          className="font-mono text-xs text-text-muted transition-colors hover:text-text-secondary"
        >
          Methodology & data →
        </Link>
        <Link
          href="/research/q1-2026"
          className="font-mono text-xs text-text-muted transition-colors hover:text-text-secondary"
        >
          Q1 2026 report →
        </Link>
        <Link
          href="/science"
          className="font-mono text-xs text-text-muted transition-colors hover:text-text-secondary"
        >
          Academic foundation →
        </Link>
      </div>

      <MotionPause />
    </div>
  )
}
