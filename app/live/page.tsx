import type { Metadata } from "next";
import fieldAnalysis from "@/public/data/field-analysis.json";
import { withOG } from "@/lib/seo";
import { SignalLiveDemo } from "@/components/live/SignalLiveDemo";

export const metadata: Metadata = withOG({
  title: "SignalAF Live — Human × Context × Model",
  description:
    "A live instrument for the human, context, and model system. Watch token-cascade telemetry resolve into Yield, Leverage, Velocity, SNR, and an operator signature.",
  path: "/live",
});

export default function LivePage() {
  const fieldYields = fieldAnalysis.operators
    .map((operator) => operator.sigrank_yield)
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  return <SignalLiveDemo fieldYields={fieldYields} />;
}
