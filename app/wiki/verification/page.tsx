import type { Metadata } from 'next'
import { TopicPage } from '@/components/wiki/TopicPage'
import { VerificationTests } from '@/components/marketing/VerificationTests'
import { withOG } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb, definedTerm } from '@/lib/jsonld'

export const metadata: Metadata = withOG({
  title: 'Verification & Integrity Tests',
  description:
    'How we know the numbers are real: Benford’s Law (shown failing its first form, then earned back via the floor fix), the Hermes bot control, the telescoping identity lock, content-free verification, and the gaming threat model.',
  path: '/wiki/verification',
})

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
