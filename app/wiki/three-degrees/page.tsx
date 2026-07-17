import type { Metadata } from "next";
import { TopicPage } from "@/components/wiki/TopicPage";
import { ThreeDegreesChart } from "@/components/marketing/ThreeDegreesChart";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "The Four Degrees of Leverage",
  description:
    "AA baseline to median operator to top-100 median to the top operator, read as a token cascade. The last three columns measured live from the all-time board. The 10xDEV log anchor and full provenance.",
  path: "/wiki/three-degrees",
});

// ISR: the chart auto-pulls live all-time board medians + the top operator. Daily
// revalidate keeps this page prerendered + refreshes the columns once a day.
export const revalidate = 86400;

export default function ThreeDegreesPage() {
  return (
    <TopicPage>
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Four Degrees of Leverage", path: "/wiki/three-degrees" },
          ]),
          definedTerm(
            "Four Degrees of Leverage",
            "The 10xDEV log anchor: AA baseline → median operator → top-100 median → top operator. The first column is a static modeled reference; the last three are measured live from the all-time board.",
            "/wiki/three-degrees",
          ),
        ]}
      />
      <ThreeDegreesChart variant="full" />
    </TopicPage>
  );
}
