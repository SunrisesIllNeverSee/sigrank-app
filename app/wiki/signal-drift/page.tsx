import type { Metadata } from 'next'
import { TopicPage } from '@/components/wiki/TopicPage'
import { SignatureDrift } from '@/components/marketing/SignalIntegrity'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb, definedTerm } from '@/lib/jsonld'

export const metadata: Metadata = {
  title: 'Signature Drift — the tune meter',
  description:
    'Shape-not-magnitude drift from an operator’s calibrated cascade signature, measured in log space, plus the contamination constraint that keeps every SigRank instrument read-only. Internals proprietary.',
}

export default function SignalDriftPage() {
  return (
    <TopicPage>
      <JsonLd data={[
        breadcrumb([
          { name: 'Wiki', path: '/wiki' },
          { name: 'Signature Drift', path: '/wiki/signal-drift' },
        ]),
        definedTerm(
          'Signature Drift',
          'Shape-not-magnitude drift from an operator’s calibrated cascade signature, measured in log space.',
          '/wiki/signal-drift',
        ),
      ]} />
      <SignatureDrift />
    </TopicPage>
  )
}
