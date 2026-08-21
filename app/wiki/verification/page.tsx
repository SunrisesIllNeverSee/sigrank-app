import type { Metadata } from "next";
import { TopicPage } from "@/components/wiki/TopicPage";
import { VerificationTests } from "@/components/marketing/VerificationTests";
import { withOG } from "@/lib/seo";
import { JsonLd } from "@/components/seo/JsonLd";
import { breadcrumb, definedTerm, faqPage } from "@/lib/jsonld";

export const metadata: Metadata = withOG({
  title: "Verification & Integrity Tests",
  description:
    "How we know the numbers are real: Benford’s Law, the Hermes bot control, telescoping identity lock, content-free verification, and the gaming threat model.",
  path: "/wiki/verification",
});

export default function VerificationPage() {
  return (
    <TopicPage title="Verification & Integrity Tests">
      <JsonLd
        data={[
          breadcrumb([
            { name: "Wiki", path: "/wiki" },
            {
              name: "Verification & Integrity Tests",
              path: "/wiki/verification",
            },
          ]),
          definedTerm(
            "Verification & Integrity Tests",
            "How we know the numbers are real: Benford’s Law, the Hermes bot control, the telescoping identity lock, and the gaming threat model.",
            "/wiki/verification",
          ),
          faqPage([
            {
              question: "How does SigRank verify its data is real?",
              answer:
                "SigRank uses multiple integrity tests: Benford's Law checks that token count distributions follow the expected logarithmic pattern of real data, the Hermes bot control filters automated traffic, the telescoping identity lock prevents metric inflation, and content-free verification ensures no prompts are needed to validate submissions.",
            },
            {
              question: "What is Benford's Law and how does SigRank use it?",
              answer:
                "Benford's Law states that in naturally occurring numerical datasets, leading digits follow a logarithmic distribution (1 appears most often, 9 least). SigRank applies Benford's Law to token counts — if the distribution deviates significantly, it flags potential fabricated or manipulated data.",
            },
            {
              question: "Can you game the SigRank leaderboard?",
              answer:
                "SigRank's gaming threat model addresses this. The telescoping identity lock prevents metric inflation by anchoring 10xDEV to log-space leverage. Signed, server-verifiable snapshots prevent self-reporting fraud. The Hermes bot control filters automated traffic. These controls make gaming the leaderboard extremely difficult.",
            },
          ]),
        ]}
      />
      <VerificationTests />
    </TopicPage>
  );
}
