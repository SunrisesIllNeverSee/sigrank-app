"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useProfileWorkspace } from "./ProfileWorkspace";
import { useProfileAuth } from "@/components/profile/ProfileAuthGate";

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
 *   - Seven profile tabs with a separate owner-only Settings link.
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
  | "social"
  | "badges";

const TABS: { key: TabKey; label: string; gated?: boolean }[] = [
  { key: "overview", label: "Overview" },
  { key: "stats", label: "Stats" },
  { key: "analysis", label: "Analysis" },
  { key: "report", label: "Report", gated: true }, // owner-gated
  { key: "lab", label: "Lab", gated: true }, // owner-gated
  { key: "submissions", label: "Submissions" },
  { key: "social", label: "Social" },
  { key: "badges", label: "Badges" },
];

interface ProfileTabsV2Props {
  overview?: React.ReactNode;
  stats: React.ReactNode;
  analysis?: React.ReactNode;
  report?: React.ReactNode;
  lab?: React.ReactNode;
  submissions: React.ReactNode;
  social: React.ReactNode;
  badges?: React.ReactNode;
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
  badges,
  initial = "overview",
}: ProfileTabsV2Props) {
  const searchParams = useSearchParams();
  const urlTab = searchParams.get("tab") as TabKey | null;
  const [localTab, setTab] = useState<TabKey>(urlTab && TABS.some((t) => t.key === urlTab) ? urlTab : initial);
  const workspace = useProfileWorkspace();
  const { isOwner } = useProfileAuth();
  const tab = workspace?.section ?? localTab;
  const panelRef = useRef<HTMLDivElement>(null);
  const stripRef = useRef<HTMLDivElement>(null);

  const content: Record<TabKey, React.ReactNode> = {
    overview,
    stats,
    analysis,
    report,
    lab,
    submissions,
    social,
    badges,
  };

  // Owner-gated tabs stay in the bar even without content (they render as
  // locked affordances); every other tab is filtered out when it has no node.
  const visibleTabs = TABS.filter((t) => t.gated || content[t.key] != null);
  const selectableTabs = visibleTabs.filter((t) => content[t.key] != null);
  const activeTab = selectableTabs.some((t) => t.key === tab)
    ? tab
    : selectableTabs[0].key;

  // owner 2026-10-21: phone tab strip scrolls horizontally — keep the active
  // tab in view (scrolls the strip only, never the page).
  useEffect(() => {
    const strip = stripRef.current;
    const el = strip?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]');
    if (!strip || !el) return;
    const left = el.offsetLeft - (strip.clientWidth - el.offsetWidth) / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: "auto" });
  }, [activeTab]);

  const select = (key: TabKey) => {
    setTab(key);
    workspace?.select(key);
    if (!workspace) {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", key);
      window.history.replaceState(null, "", url.toString());
    }
    panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // APG tablist: roving tabindex + arrow/Home/End navigation with automatic
  // activation. Locked (disabled) affordances are skipped entirely.
  const tabRefs = useRef<Map<TabKey, HTMLButtonElement>>(new Map());
  const onTabKeyDown = (e: React.KeyboardEvent, idx: number) => {
    const n = selectableTabs.length;
    const next =
      e.key === "ArrowRight"
        ? (idx + 1) % n
        : e.key === "ArrowLeft"
          ? (idx - 1 + n) % n
          : e.key === "Home"
            ? 0
            : e.key === "End"
              ? n - 1
              : -1;
    if (next < 0) return;
    e.preventDefault();
    const key = selectableTabs[next].key;
    select(key);
    tabRefs.current.get(key)?.focus();
  };

  return (
    <div className="flex flex-col gap-4">
      <div ref={stripRef} className="profile-title-nav flex min-w-0 items-center gap-2 border-b border-bg-border">
      <div
        role="tablist"
        aria-label="Profile sections"
        className="flex min-w-0 gap-1 overflow-x-auto"
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
          const order = selectableTabs.indexOf(t);
          return (
            <button
              key={t.key}
              ref={(el) => {
                if (el) tabRefs.current.set(t.key, el);
                else tabRefs.current.delete(t.key);
              }}
              id={`pv2-tab-${t.key}`}
              role="tab"
              aria-selected={active}
              aria-controls="pv2-tabpanel"
              tabIndex={active ? 0 : -1}
              type="button"
              onClick={() => select(t.key)}
              onKeyDown={(e) => onTabKeyDown(e, order)}
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
      {workspace?.codename && <Link className="profile-share-gallery" href={`/s/${encodeURIComponent(workspace.codename)}`}>Share Gallery</Link>}
      {isOwner && (
        <Link
          href="/me/edit#profile-display"
          className="profile-share-gallery"
          aria-label="Profile settings: badges and marks"
        >
          Settings
        </Link>
      )}
      </div>

      <div
        ref={panelRef}
        id="pv2-tabpanel"
        role="tabpanel"
        aria-labelledby={`pv2-tab-${activeTab}`}
        className="scroll-mt-4"
      >
        {activeTab === "overview" && overview}
        {activeTab === "stats" && stats}
        {activeTab === "analysis" && analysis}
        {activeTab === "report" && report}
        {activeTab === "lab" && lab}
        {activeTab === "submissions" && submissions}
        {activeTab === "social" && social}
        {activeTab === "badges" && badges}
      </div>
    </div>
  );
}
