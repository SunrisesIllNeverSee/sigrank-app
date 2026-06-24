import type { Metadata } from 'next'
import { TopicPage } from '@/components/wiki/TopicPage'
import { Credits } from '@/components/marketing/SignalIntegrity'

export const metadata: Metadata = {
  title: 'Measured Alongside · SigRank',
  description:
    'Credit to the token-usage tools SigRank reads alongside and builds on — ccusage, tokscale, and token-dashboard. They measure how much; SigRank ranks how well.',
}

export default function MeasuredAlongsidePage() {
  return (
    <TopicPage>
      <Credits />
    </TopicPage>
  )
}
