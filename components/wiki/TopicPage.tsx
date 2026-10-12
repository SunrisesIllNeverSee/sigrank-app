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
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { FieldFamilyNav } from "@/components/field/FieldWorkspaceFrame";

export function TopicPage({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <WorkspaceShell
      active="wiki"
      editorialStage
      leftTitle="ENTRY"
      topic="wiki"
      left={<FieldFamilyNav current="wiki" pageContents={
        <nav className="ws-nav" aria-label="Sections on this page">
          <a href="#ws-wiki-topic-content">{title ?? "Topic content"}</a>
        </nav>
      } />}
      leftWidth={280}
      status={<>SIGNALAF WIKI · TOPIC PROOF · MO§ES™</>}
    >
      <div className="ws-doc" id="ws-wiki-topic-content">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 py-2">
          {children}
        </div>
      </div>
    </WorkspaceShell>
  );
}
