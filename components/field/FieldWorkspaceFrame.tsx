import type { ReactNode } from "react";
import Link from "next/link";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";

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
          <div className="mod">
            <div className="mini-h"><span className="sq" />RESEARCH</div>
            <nav className="ws-nav">
              <Link href="/fieldhub">Field Hub</Link>
              <Link href="/field">Field Analysis</Link>
              <Link href="/research">State of the Index</Link>
              <Link href="/blog">Articles</Link>
            </nav>
          </div>
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
