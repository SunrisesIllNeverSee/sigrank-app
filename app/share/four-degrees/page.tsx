import type { Metadata } from "next";
import Link from "next/link";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { FourDegreesShareCard } from "@/components/share/FourDegreesShareCard";

export const metadata: Metadata = { title: "AI comparison · LinkedIn Card | SignalAF", description: "Compare the modeled world-user baseline, our field, power users, and OITL/Auto metric highs." };

export default function FourDegreesSharePage() {
  return <WorkspaceShell active="field" title="FOUR DEGREES / SHARE CARD" leftTitle="SHARE STUDIO"
    left={<div className="flex flex-col gap-4"><p className="font-mono text-xs text-text-secondary">A comparison chart designed for a LinkedIn post.</p><Link href="/sigrank#ws-page-four-degrees">View the original chart →</Link><Link href="/wiki/four-degrees">Definitions & sources →</Link></div>}
    rightTitle="READY FOR A POST" right={<div className="flex flex-col gap-4 text-xs text-text-secondary"><p>Download PNG, then attach it to your LinkedIn post. Share uses your device’s share sheet when supported.</p><p>Six comparison columns: world reference, field, your rank, power users, and SignalAF OITL/Auto highs. The source notes travel with the image.</p></div>}>
    <FourDegreesShareCard />
  </WorkspaceShell>;
}
