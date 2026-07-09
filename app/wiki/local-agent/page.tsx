import type { Metadata } from 'next'
import { TopicPage } from '@/components/wiki/TopicPage'
import { LocalAgentMcp } from '@/components/marketing/SignalIntegrity'
import { withOG } from '@/lib/seo'
import { JsonLd } from '@/components/seo/JsonLd'
import { breadcrumb, definedTerm } from '@/lib/jsonld'

export const metadata: Metadata = withOG({
  title: 'The Local Agent (MCP)',
  description:
    'The SigRank MCP: a zero-paste, on-device reader that counts your four token pillars locally and publishes your cascade. Read-only, never reads your content.',
  path: '/wiki/local-agent',
})

export default function LocalAgentPage() {
  return (
    <TopicPage>
      <JsonLd data={[
        breadcrumb([
          { name: 'Wiki', path: '/wiki' },
          { name: 'The Local Agent (MCP)', path: '/wiki/local-agent' },
        ]),
        definedTerm(
          'Local Agent (MCP)',
          'The SigRank MCP server: a zero-paste, on-device reader that counts token pillars locally and publishes your cascade.',
          '/wiki/local-agent',
        ),
      ]} />
      <LocalAgentMcp />
    </TopicPage>
  )
}
