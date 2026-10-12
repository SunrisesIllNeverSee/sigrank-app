"use client";

import { useRef, useState } from "react";
import { useProfileWorkspace } from "./ProfileWorkspace";

/**
 * components/profile-v2/ProfileTabsV2.tsx — tab bar for the redesigned
 * /user/[codename] profile page.
 *
 * Same pattern as components/profile/ProfileTabs.tsx: every panel is
 * server-rendered upstream and passed in as a node; this client island only
 * toggles which one is mounted, so heavy chart islands in inactive tabs never
 * hydrate.
 *
 * v2 differences:
 *   - 7 tabs (adds "analysis"); "settings" stays out — it's owner-only and the
 *     parent page renders it as its own surface.
 *   - The two owner-gated tabs (report / lab) are ALWAYS in the bar: when the
 *     viewer isn't the owner they render dimmed + non-interactive with a lock
 *     icon, so the gating reads as intentional rather than a missing tab.
 *   - Non-gated optional tabs (overview / analysis) are filtered out entirely
 *     when their content node isn't provided.
 *   - Clicking a tab smooth-scrolls the tab panel to the top of the viewport.
 */
type TabKey =
  | "overview"
  | "stats"
  | "analysis"
  | "report"
  | "lab"
  | "submissions"
  | "social";

const TABS: { key: TabKey; label: string; gated?: boolean }[] = [
  { key: "overview", label: "Overview" },
  { key: "stats", label: "Stats" },
  { key: "analysis", label: "Analysis" },
  { key: "report", label: "Report", gated: true }, // owner-gated
  { key: "lab", label: "Lab", gated: true }, // owner-gated
  { key: "submissions", label: "Submissions" },
  { key: "social", label: "Social" },
];

interface ProfileTabsV2Props {
  overview?: React.ReactNode;
  stats: React.ReactNode;
  analysis?: React.ReactNode;
  report?: React.ReactNode;
  lab?: React.ReactNode;
  submissions: React.ReactNode;
  social: React.ReactNode;
  initial?: TabKey;
}

function LockGlyph() {
  return (
    <svg
      width="9"
      height="9"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <rect x="4.5" y="11" width="15" height="9" rx="1.5" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function ProfileTabsV2({
  overview,
  stats,
  analysis,
  report,
  lab,
  submissions,
  social,
  initial = "overview",
}: ProfileTabsV2Props) {
  const [localTab, setTab] = useState<TabKey>(initial);
  const workspace = useProfileWorkspace();
  const tab = workspace?.section ?? localTab;
  const panelRef = useRef<HTMLDivElement>(null);

  const content: Record<TabKey, React.ReactNode> = {
    overview,
    stats,
    analysis,
    report,
    lab,
    submissions,
    social,
  };

  // Owner-gated tabs stay in the bar even without content (they render as
  // locked affordances); every other tab is filtered out when it has no node.
  const visibleTabs = TABS.filter((t) => t.gated || content[t.key] != null);
  const selectableTabs = visibleTabs.filter((t) => content[t.key] != null);
  const activeTab = selectableTabs.some((t) => t.key === tab)
    ? tab
    : selectableTabs[0].key;

  const select = (key: TabKey) => {
    setTab(key);
    workspace?.select(key);
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label="Profile sections"
        className="flex gap-1 overflow-x-auto border-b border-bg-border"
      >
        {visibleTabs.map((t) => {
          const locked = content[t.key] == null;
          const active = !locked && activeTab === t.key;
          if (locked) {
            return (
              <button
                key={t.key}
                role="tab"
                aria-selected={false}
                aria-disabled="true"
                type="button"
                disabled
                title="Owner only"
                className="relative -mb-px flex cursor-not-allowed items-center gap-1.5 border-b-2 border-transparent px-4 py-2 font-mono text-xs uppercase tracking-[0.06em] text-text-dim opacity-50"
              >
                <LockGlyph />
                {t.label}
              </button>
            );
          }
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => select(t.key)}
              className={`relative -mb-px px-4 py-2 font-mono text-xs uppercase tracking-[0.06em] transition-colors ${
                active
                  ? "border-b-2 border-gold text-text-primary"
                  : "border-b-2 border-transparent text-text-muted hover:text-text-secondary"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div ref={panelRef} role="tabpanel" className="scroll-mt-4">
        {activeTab === "overview" && overview}
        {activeTab === "stats" && stats}
        {activeTab === "analysis" && analysis}
        {activeTab === "report" && report}
        {activeTab === "lab" && lab}
        {activeTab === "submissions" && submissions}
        {activeTab === "social" && social}
      </div>
    </div>
  );
}
