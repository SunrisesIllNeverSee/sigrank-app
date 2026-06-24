import type { Metadata } from 'next'
import { TopicPage } from '@/components/wiki/TopicPage'
import { VerificationTests } from '@/components/marketing/VerificationTests'

export const metadata: Metadata = {
  title: 'Verification & Integrity Tests · SigRank',
  description:
    'How we know the numbers are real: Benford’s Law (shown failing its first form, then earned back via the floor fix), the Hermes bot control, the telescoping identity lock, content-free verification, and the gaming threat model.',
}

export default function VerificationPage() {
  return (
    <TopicPage>
      <VerificationTests />
    </TopicPage>
  )
}
