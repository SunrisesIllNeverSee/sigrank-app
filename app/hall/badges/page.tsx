import type { Metadata } from "next";
import Link from "next/link";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { BadgeDirectory } from "@/components/profile-v2/BadgeDirectory";
import { withOG } from "@/lib/seo";

export const metadata: Metadata = withOG({
  title: "Badge Index · Hall of Signal",
  description: "Pixel badge designs and Achievement award criteria for SigRank operators.",
  path: "/hall/badges",
});

export default function HallBadgeIndexPage() {
  return (
    <WorkspaceShell
      active="hall"
      title="BADGE INDEX"
      leftTitle="HALL OF SIGNAL"
      left={<div className="flex flex-col gap-3">
        <Link href="/hall" className="font-mono text-[10px] uppercase tracking-wider text-text-secondary hover:text-text-primary">← Hall record book</Link>
        <p className="font-mono text-[9px] leading-relaxed text-text-muted">Reference directory for Pixel patterns and Achievement designs.</p>
        <Link href="/me/edit#profile-display" className="font-mono text-[9px] uppercase tracking-wider text-gold hover:text-text-primary">Profile display settings →</Link>
      </div>}
    >
      <BadgeDirectory />
    </WorkspaceShell>
  );
}
