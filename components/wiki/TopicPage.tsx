/**
 * components/wiki/TopicPage.tsx — shared chrome for the per-topic wiki Proof routes
 * (owner 2026-06-23: long-form PER TOPIC, not one mega-page; this wiki is a temporary
 * showcase, DeepWiki is the long-term home).
 *
 * Each /wiki/<topic> route renders ONE existing marketing component (single source —
 * no content forks) inside this wrapper: a back-link to the /wiki hub + a constrained
 * reading column. The route file owns the page <title>/meta so the content is
 * deep-linkable + indexable (the fix for WIKI_ASSESSMENT P1 — proof was buried in the
 * TopicConsole tab-switcher behind one shared URL/title). Server component.
 */

import React from "react";
import Link from "next/link";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";

export function TopicPage({ children }: { children: React.ReactNode; title?: string }) {
  return (
    <WorkspaceShell
      active="wiki"
      leftTitle="ENTRY"
      left={
        <div className="mod">
          <div className="mini-h"><span className="sq"></span>INDEX</div>
          <nav className="ws-nav">
            <Link href="/wiki">← Wiki</Link>
            <Link href="/wiki/verification">Verification &amp; integrity</Link>
            <Link href="/wiki/four-degrees">Four degrees of leverage</Link>
          </nav>
        </div>
      }
      leftWidth={220}
      status={<>SIGNALAF WIKI · TOPIC PROOF · MO§ES™</>}
    >
      <div className="ws-doc">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 py-2">
          {children}
        </div>
      </div>
    </WorkspaceShell>
  );
}
