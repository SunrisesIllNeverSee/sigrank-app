import type { Metadata } from "next";
import Link from "next/link";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { FourDegreesShareCard } from "@/components/share/FourDegreesShareCard";

export const metadata: Metadata = { title: "Four Degrees · Share Card | SignalAF", description: "A pixel-styled Four Degrees of Leverage card, using the same reference data as the SigRank chart." };

export default function FourDegreesSharePage() {
  return <WorkspaceShell active="field" title="FOUR DEGREES / SHARE CARD" leftTitle="SHARE STUDIO"
    left={<div className="flex flex-col gap-4"><p className="font-mono text-xs text-text-secondary">Four reference points. One token cascade.</p><Link href="/sigrank#ws-page-four-degrees">View the original chart →</Link><Link href="/wiki/four-degrees">Definitions & sources →</Link></div>}
    rightTitle="READY FOR A POST" right={<div className="flex flex-col gap-4 text-xs text-text-secondary"><p>Download PNG, then attach it to your post. Share uses your device’s share sheet when supported.</p><p>The exported image includes all seven metrics and the source notes. Its artwork stays consistent across site themes.</p></div>}>
    <FourDegreesShareCard />
  </WorkspaceShell>;
}
