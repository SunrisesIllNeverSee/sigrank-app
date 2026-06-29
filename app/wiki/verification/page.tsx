import type { Metadata } from 'next'
import { TopicPage } from '@/components/wiki/TopicPage'
import { VerificationTests } from '@/components/marketing/VerificationTests'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb, definedTerm } from '@/lib/jsonld'

export const metadata: Metadata = {
  title: 'Verification & Integrity Tests',
  description:
    'How we know the numbers are real: Benford’s Law (shown failing its first form, then earned back via the floor fix), the Hermes bot control, the telescoping identity lock, content-free verification, and the gaming threat model.',
}

export default function VerificationPage() {
  return (
    <TopicPage>
      <JsonLd data={[
        breadcrumb([
          { name: 'Wiki', path: '/wiki' },
          { name: 'Verification & Integrity Tests', path: '/wiki/verification' },
        ]),
        definedTerm(
          'Verification & Integrity Tests',
          'How we know the numbers are real: Benford’s Law, the Hermes bot control, the telescoping identity lock, and the gaming threat model.',
          '/wiki/verification',
        ),
      ]} />
      <VerificationTests />
    </TopicPage>
  )
}
