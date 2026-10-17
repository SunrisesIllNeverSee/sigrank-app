import type { Metadata } from "next";
import { TopicPage } from "@/components/wiki/TopicPage";
import { SignatureDrift } from "@/components/marketing/SignalIntegrity";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm, faqPage } from "@/lib/jsonld";
import { FaqSection } from "@/components/seo/FaqSection";
import { SIGNAL_DRIFT_FAQS } from "@/lib/seo/page-faqs";

export const metadata: Metadata = withOG({
  title: "Signature Drift — the tune meter",
  description:
    "Shape-not-magnitude drift from an operator’s cascade signature, measured in log space. Plus the contamination constraint keeping every SigRank instrument read-only.",
  path: "/wiki/signal-drift",
});

export default function SignalDriftPage() {
  return (
    <TopicPage title="Signature Drift">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            { name: "Signature Drift", path: "/wiki/signal-drift" },
          ]),
          definedTerm(
            "Signature Drift",
            "Shape-not-magnitude drift from an operator’s calibrated cascade signature, measured in log space.",
            "/wiki/signal-drift",
          ),
          faqPage(SIGNAL_DRIFT_FAQS),
        ]}
      />
      <SignatureDrift />
      <FaqSection faqs={SIGNAL_DRIFT_FAQS} />
    </TopicPage>
  );
}
