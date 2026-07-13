import type { Metadata } from "next";
import { TopicPage } from "@/components/wiki/TopicPage";
import { ThreeDegreesChart } from "@/components/marketing/ThreeDegreesChart";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "The Three Degrees of Leverage",
  description:
    "Median operator to top-100 median to the top operator, read as a token cascade. All three columns measured live from the all-time board. The 10xDEV log anchor and full provenance.",
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
            { name: "Three Degrees of Leverage", path: "/wiki/three-degrees" },
          ]),
          definedTerm(
            "Three Degrees of Leverage",
            "The 10xDEV log anchor: median operator → top-100 median → top operator, all measured live from the all-time board.",
            "/wiki/three-degrees",
          ),
        ]}
      />
      <ThreeDegreesChart variant="full" />
    </TopicPage>
  );
}
