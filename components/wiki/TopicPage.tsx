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

export function TopicPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 py-2">
      <Link
        href="/wiki"
        className="w-fit font-mono text-xs uppercase tracking-wide text-text-muted transition-colors hover:text-text-primary"
      >
        ← Wiki
      </Link>
      {children}
      <div className="mt-4 border-t border-bg-border-subtle pt-4">
        <Link
          href="/wiki"
          className="font-mono text-xs text-text-accent underline-offset-2 hover:underline"
        >
          ← Back to the Wiki
        </Link>
      </div>
    </div>
  );
}
