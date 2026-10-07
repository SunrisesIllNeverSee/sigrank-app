import type { ReactNode } from "react";
import Link from "next/link";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { WaveHero } from "@/components/ui/WaveHero";

/**
 * The Field family's left-rail nav — the space's entries as compact wave
 * banners (per owner: the hub's hero cards become the rail navigation).
 * Field Hub home + Articles stay as plain links under the two banners.
 */
export function FieldFamilyNav() {
  return (
    <>
      <div className="mini-h"><span className="sq" />RESEARCH</div>
      <nav className="flex flex-col gap-2" aria-label="Field research">
        <Link href="/field" className="block">
          <WaveHero
            compact
            headingLevel="h2"
            eyebrow="Field Analysis"
            title="Field Analysis"
            subtitle="The true distribution of token efficiency."
          />
        </Link>
        <Link href="/research" className="block">
          <WaveHero
            compact
            headingLevel="h2"
            eyebrow="SigRank Index"
            title="State of the Index"
            subtitle="The seed dataset · Zenodo DOI."
          />
        </Link>
      </nav>
      <nav className="ws-nav" style={{ marginTop: 6 }}>
        <Link href="/fieldhub">← Field Hub</Link>
        <Link href="/blog">Articles ↗</Link>
      </nav>
    </>
  );
}

interface Props {
  title: string;
  children: ReactNode;
  status?: ReactNode;
  right?: ReactNode;
  rightTitle?: string;
  rightDefaultOpen?: boolean;
}

/**
 * Shared workspace frame for the Field research family.
 *
 * /field keeps its richer analysis-specific rails. This frame handles the
 * Field Hub and State-of-the-Index/data surfaces so the family shares one
 * global shell without flattening their page-specific content.
 */
export function FieldWorkspaceFrame({
  title,
  children,
  status,
  right,
  rightTitle = "RESEARCH",
  rightDefaultOpen = true,
}: Props) {
  return (
    <WorkspaceShell
      active="field"
      title={title}
      leftTitle="FIELD"
      left={
        <>
          <FieldFamilyNav />
          <div className="mod">
            <div className="mini-h"><span className="sq" />SYSTEM</div>
            <nav className="ws-nav">
              <Link href="/wiki">Wiki</Link>
              <Link href="/methodology">Methodology</Link>
              <Link href="/board/all">Live leaderboard</Link>
            </nav>
          </div>
        </>
      }
      rightTitle={rightTitle}
      right={right}
      rightDefaultOpen={rightDefaultOpen}
      leftWidth={210}
      rightWidth={240}
      status={status ?? <>FIELD RESEARCH · SIGNALAF × SIGRANK · MO§ES™</>}
    >
      <div className="ws-doc ws-doc-wide">{children}</div>
    </WorkspaceShell>
  );
}
