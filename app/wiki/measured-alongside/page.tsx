import type { Metadata } from "next";
import { TopicPage } from "@/components/wiki/TopicPage";
import { Credits } from "@/components/marketing/SignalIntegrity";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Measured Alongside",
  description:
    "Credit to the token-usage tools SigRank builds on — ccusage, tokscale, and token-dashboard. They measure how much; SigRank ranks how well.",
  path: "/wiki/measured-alongside",
});

export default function MeasuredAlongsidePage() {
  return (
    <TopicPage title="Measured Alongside">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Measured Alongside", path: "/wiki/measured-alongside" },
          ]),
          definedTerm(
            "Measured Alongside",
            "Credit to the token-usage tools SigRank reads alongside: ccusage, tokscale, and token-dashboard.",
            "/wiki/measured-alongside",
          ),
          faqPage([
            {
              question: "What tools does SigRank measure alongside?",
              answer:
                "SigRank builds on token-usage tools like ccusage, tokscale, and token-dashboard. These tools measure how much you use AI. SigRank ranks how well you use it — turning raw token counts into cascade efficiency metrics like Yield, Leverage, and SNR.",
            },
            {
              question: "How is SigRank different from ccusage?",
              answer:
                "ccusage counts your token usage (how much). SigRank ranks your token efficiency (how well). SigRank reads the same session logs but computes cascade metrics — Yield (Υ = cache_read × output / input²), Leverage, Velocity, SNR — that measure whether your tokens compound signal or just burn volume.",
            },
            {
              question: "What is the difference between measuring and ranking AI usage?",
              answer:
                "Measuring means counting tokens (input, output, cache reads). Ranking means comparing those counts across operators using efficiency metrics. SigRank does both: it measures your four token pillars locally, then ranks you against other operators on the leaderboard by Yield and related cascade metrics.",
            },
          ]),
        ]}
      />
      <Credits />
    </TopicPage>
  );
}
