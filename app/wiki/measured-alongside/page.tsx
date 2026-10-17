import type { Metadata } from "next";
import { TopicPage } from "@/components/wiki/TopicPage";
import { Credits } from "@/components/marketing/SignalIntegrity";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm, faqPage } from "@/lib/jsonld";
import { FaqSection } from "@/components/seo/FaqSection";
import { MEASURED_ALONGSIDE_FAQS } from "@/lib/seo/page-faqs";

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
          faqPage(MEASURED_ALONGSIDE_FAQS),
        ]}
      />
      <Credits />
      <FaqSection faqs={MEASURED_ALONGSIDE_FAQS} />
    </TopicPage>
  );
}
