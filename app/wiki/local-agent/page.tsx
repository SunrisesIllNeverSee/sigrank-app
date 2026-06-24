import type { Metadata } from 'next'
import { TopicPage } from '@/components/wiki/TopicPage'
import { LocalAgentMcp } from '@/components/marketing/SignalIntegrity'

export const metadata: Metadata = {
  title: 'The Local Agent (MCP) · SigRank',
  description:
    'The SigRank MCP: a zero-paste, on-device reader (tokenpull) that counts your four token pillars locally and publishes your cascade — read-only, emits no prompt, never reads your content. Install + quickstart.',
}

export default function LocalAgentPage() {
  return (
    <TopicPage>
      <LocalAgentMcp />
    </TopicPage>
  )
}
