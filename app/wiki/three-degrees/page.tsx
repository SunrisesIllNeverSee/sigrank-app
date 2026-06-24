import type { Metadata } from 'next'
import { TopicPage } from '@/components/wiki/TopicPage'
import { ThreeDegreesChart } from '@/components/marketing/ThreeDegreesChart'

export const metadata: Metadata = {
  title: 'The Three Degrees of Leverage · SigRank',
  description:
    'AA 7:2:1 average user → power-user median → the top operator to date, read as a token cascade (Cache:Input:Output). The 10xDEV log anchor and full provenance.',
}

export default function ThreeDegreesPage() {
  return (
    <TopicPage>
      <ThreeDegreesChart variant="full" />
    </TopicPage>
  )
}
