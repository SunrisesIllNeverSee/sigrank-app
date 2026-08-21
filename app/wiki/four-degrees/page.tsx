import type { Metadata } from "next";
import { TopicPage } from "@/components/wiki/TopicPage";
import { FourDegreesChart } from "@/components/marketing/FourDegreesChart";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "The Four Degrees of Leverage",
  description:
    "AA baseline to median operator to top-100 median to the top operator, read as a token cascade. The last three columns measured live from the all-time board. The 10xDEV log anchor and full provenance.",
  path: "/wiki/four-degrees",
});

// ISR: the chart auto-pulls live all-time board medians + the top operator. Daily
// revalidate keeps this page prerendered + refreshes the columns once a day.
export const revalidate = 86400;

export default function FourDegreesPage() {
  return (
    <TopicPage title="The Four Degrees of Leverage">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Four Degrees of Leverage", path: "/wiki/four-degrees" },
          ]),
          definedTerm(
            "Four Degrees of Leverage",
            "The 10xDEV log anchor: AA baseline → median operator → top-100 median → top operator. The first column is a static modeled reference; the last three are measured live from the all-time board.",
            "/wiki/four-degrees",
          ),
          faqPage([
            {
              question: "What are the Four Degrees of Leverage in AI usage?",
              answer:
                "The Four Degrees of Leverage is a framework that compares four levels of AI operator efficiency: the AA baseline (a modeled reference), the median operator, the top-100 median, and the top operator. Each degree is read as a token cascade, showing how leverage compounds from average to elite usage.",
            },
            {
              question: "What is 10xDEV in SigRank?",
              answer:
                "10xDEV is the log-base-10 of Leverage — a normalized value-above-replacement metric. It telescopes the exponent to earned leverage, making it anti-inflation: an operator cannot inflate their 10xDEV by spending more tokens, only by using them more efficiently. The top operator's 10xDEV is measured live from the all-time board.",
            },
            {
              question: "How is the top AI operator measured?",
              answer:
                "The top operator is measured live from the all-time SigRank leaderboard. Their token cascade (input, output, cache creation, cache read) is compared against the median and top-100 median operators. The comparison is in log space via 10xDEV, so it reflects efficiency shape rather than raw volume.",
            },
          ]),
        ]}
      />
      <FourDegreesChart variant="full" />
    </TopicPage>
  );
}
