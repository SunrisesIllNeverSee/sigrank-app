import type { Metadata } from 'next'
import { TopicPage } from '@/components/wiki/TopicPage'
import { ThreeDegreesChart } from '@/components/marketing/ThreeDegreesChart'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb, definedTerm } from '@/lib/jsonld'

export const metadata: Metadata = {
  title: 'The Three Degrees of Leverage',
  description:
    'AA 7:2:1 average user → power-user median → the top operator to date, read as a token cascade (Cache:Input:Output). The 10xDEV log anchor and full provenance.',
}

// ISR: the chart auto-pulls the top operator's live all-time metrics. Daily revalidate
// keeps this page prerendered + refreshes the gold column once a day.
export const revalidate = 86400

export default function ThreeDegreesPage() {
  return (
    <TopicPage>
      <JsonLd data={[
        breadcrumb([
          { name: 'Wiki', path: '/wiki' },
          { name: 'Three Degrees of Leverage', path: '/wiki/three-degrees' },
        ]),
        definedTerm(
          'Three Degrees of Leverage',
          'The 10xDEV log anchor: average user → power-user median → top operator, read as a token cascade.',
          '/wiki/three-degrees',
        ),
      ]} />
      <ThreeDegreesChart variant="full" />
    </TopicPage>
  )
}
