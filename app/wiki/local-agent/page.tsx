import type { Metadata } from "next";
import { TopicPage } from "@/components/wiki/TopicPage";
import { LocalAgentMcp } from "@/components/marketing/SignalIntegrity";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "The Local Agent (MCP)",
  description:
    "The SigRank MCP: a zero-paste, on-device reader that counts your four token pillars locally and publishes your cascade. Read-only, never reads your content.",
  path: "/wiki/local-agent",
});

export default function LocalAgentPage() {
  return (
    <TopicPage>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "The Local Agent (MCP)", path: "/wiki/local-agent" },
          ]),
          definedTerm(
            "Local Agent (MCP)",
            "The SigRank MCP server: a zero-paste, on-device reader that counts token pillars locally and publishes your cascade.",
            "/wiki/local-agent",
          ),
          faqPage([
            {
              question: "What is the SigRank local agent?",
              answer:
                "The SigRank local agent is an MCP server that reads your AI session logs on-device, counts your four token pillars (input, output, cache creation, cache read), and publishes your cascade metrics to the leaderboard. It never reads your prompts or code — only token counts.",
            },
            {
              question: "Does the SigRank MCP server read my prompts?",
              answer:
                "No. The SigRank MCP server is read-only and content-free. It counts token quantities (input, output, cache creation, cache read) from your session logs. It never accesses, stores, or transmits your prompts, code, or file contents.",
            },
            {
              question: "How do I install the SigRank MCP server?",
              answer:
                "Run `npx sigrank` to install and start the SigRank MCP server. It works with Claude, Cursor, Cline, Windsurf, and any MCP-compatible client. The server exposes 15 tools for measuring, ranking, and improving token efficiency.",
            },
          ]),
        ]}
      />
      <LocalAgentMcp />
    </TopicPage>
  );
}
