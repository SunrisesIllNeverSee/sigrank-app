import type { ReactNode } from "react";
import Link from "next/link";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";

interface Props {
  children: ReactNode;
  status?: ReactNode;
}

/**
 * Shared workspace frame for long-form Blog routes.
 *
 * The article remains the primary object: right rail is closed by default,
 * the left rail is deliberately small, and collapsing the left panel gives
 * a clean reader surface without creating a second article renderer.
 */
export function BlogWorkspaceFrame({ children, status }: Props) {
  return (
    <WorkspaceShell
      active="blog"
      title="BLOG"
      leftTitle="PUBLISHING"
      left={
        <>
          <div className="mod">
            <div className="mini-h"><span className="sq" />READ</div>
            <nav className="ws-nav">
              <Link href="/blog">All articles</Link>
              <Link href="/field">Field analysis</Link>
              <Link href="/research">State of the Index</Link>
              <Link href="/wiki">Wiki</Link>
            </nav>
          </div>
          <div className="mod">
            <div className="mini-h"><span className="sq" />REFERENCE</div>
            <nav className="ws-nav">
              <Link href="/methodology">Methodology</Link>
              <Link href="/board/all">Live leaderboard</Link>
              <Link href="/hall">Hall of Signal</Link>
            </nav>
          </div>
        </>
      }
      rightTitle="READER"
      rightDefaultOpen={false}
      right={
        <div className="mod">
          <div className="mini-h"><span className="sq" />READING MODE</div>
          <p className="ws-note">
            Collapse either side panel from the rail to widen the article.
            The article body, citations, media, tables, and structured data stay
            unchanged.
          </p>
        </div>
      }
      leftWidth={210}
      rightWidth={220}
      status={status ?? <>ANALYSIS &amp; RESEARCH · SIGNALAF × SIGRANK · MO§ES™</>}
    >
      <div className="ws-doc ws-article">{children}</div>
    </WorkspaceShell>
  );
}
