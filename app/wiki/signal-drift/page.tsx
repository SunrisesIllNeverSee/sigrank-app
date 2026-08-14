import type { Metadata } from "next";
import { TopicPage } from "@/components/wiki/TopicPage";
import { SignatureDrift } from "@/components/marketing/SignalIntegrity";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Signature Drift — the tune meter",
  description:
    "Shape-not-magnitude drift from an operator’s cascade signature, measured in log space. Plus the contamination constraint keeping every SigRank instrument read-only.",
  path: "/wiki/signal-drift",
});

export default function SignalDriftPage() {
  return (
    <TopicPage>
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
          faqPage([
            {
              question: "What is signature drift in AI usage?",
              answer:
                "Signature drift measures how much an operator's token cascade shape has changed from their calibrated baseline, in log space. It tracks shape — not magnitude — so an operator who doubles their output while keeping the same input/cache ratio shows zero drift, while one who shifts from cache-heavy to input-heavy prompting shows high drift.",
            },
            {
              question: "How does SigRank prevent contamination of its measurements?",
              answer:
                "Every SigRank instrument is read-only and content-free. It counts token quantities (input, output, cache creation, cache read) but never reads prompts, code, or file contents. The contamination constraint ensures that measuring your AI usage cannot alter your AI usage — the observer does not affect the observed.",
            },
            {
              question: "Why measure drift in log space?",
              answer:
                "Log space normalizes the scale of token counts so that shape changes are comparable across operators with very different volumes. An operator using 10K tokens and one using 10M tokens can have the same drift score if their cascade proportions shifted by the same ratio. This makes drift a shape metric, not a magnitude metric.",
            },
          ]),
        ]}
      />
      <SignatureDrift />
    </TopicPage>
  );
}
