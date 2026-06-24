import type { Metadata } from 'next'
import { TopicPage } from '@/components/wiki/TopicPage'
import { SignatureDrift } from '@/components/marketing/SignalIntegrity'

export const metadata: Metadata = {
  title: 'Signature Drift — the tune meter · SigRank',
  description:
    'Shape-not-magnitude drift from an operator’s calibrated cascade signature, measured in log space, plus the contamination constraint that keeps every SigRank instrument read-only. Internals proprietary.',
}

export default function SignalDriftPage() {
  return (
    <TopicPage>
      <SignatureDrift />
    </TopicPage>
  )
}
