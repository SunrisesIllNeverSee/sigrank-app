"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { ArtworkShareControls } from "@/components/share/ArtworkShareControls";
import { MyWatchlist } from "./MyWatchlist";
import { RailDialog } from "./RailDialog";
import "./profile-workspace.css";

type ProfileSection = "overview" | "stats" | "analysis" | "report" | "lab" | "submissions" | "social" | "badges";
const ProfileWorkspaceContext = createContext<{ section: ProfileSection; codename: string; select: (section: ProfileSection) => void } | null>(null);
export const useProfileWorkspace = () => useContext(ProfileWorkspaceContext);

const sections = ["overview", "stats", "analysis", "submissions", "social", "badges"] as const;

export function ProfileWorkspace({ name, codename, rank, tier, platform, yieldLabel, children, actions, panels }: {
  name: string; codename: string; rank: number | null; tier: string; platform: string;
  yieldLabel: string; children: ReactNode; actions: ReactNode;
  /** Server-rendered rail panels (rank contexts / activity / records) —
   *  injected between OPERATOR PROFILE and ACTIONS by the page (Phase 3). */
  panels?: ReactNode;
}) {
  const searchParams = useSearchParams();
  const requested = searchParams.get("tab");
  const validSections: ProfileSection[] = ["overview", "stats", "analysis", "report", "lab", "submissions", "social", "badges"];
  const [section, setSection] = useState<ProfileSection>(validSections.includes(requested as ProfileSection) ? requested as ProfileSection : "overview");
  const select = (next: ProfileSection) => {
    setSection(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url.toString());
  };
  return <ProfileWorkspaceContext.Provider value={{ section, codename, select }}>
    <WorkspaceShell active="profile" title={`PROFILE / ${name}`} leftTitle="PROFILE · DRILL"
      leftWidth={220} rightWidth={280}
      left={<>
        {section === "badges" ? <div id="profile-badge-left" /> : <nav className="ws-profile-nav" aria-label="Profile views">
          {sections.map((key) => <button key={key} type="button" aria-current={section === key ? "page" : undefined}
            onClick={() => select(key)}>{section === key ? "◆" : "◇"} {key}</button>)}
        </nav>}
        {section !== "badges" && <>
        <Link className="ws-profile-back" href="/hall/badges">BADGE GALLERY →</Link>
        <div className="mod"><h3><span className="sq" />SCREEN CAPTURE</h3>
          <ArtworkShareControls target="main.stage" title="profile view" filename={`signalaf-profile-${codename}-${section}`} href={`/user/${encodeURIComponent(codename)}?tab=${section}`} />
        </div>
        <Link className="ws-profile-back" href="/board/all">← BACK TO BOARD</Link>
        {/* owner 2026-10-21: compact box — name and rank here, the rest in a popup. */}
        <div className="mod"><h3><span className="sq" />OPERATOR</h3>
          <RailDialog title="OPERATOR" subtitle={codename} hint="OPEN ▸"
            trigger={<span className="prl-sum">
              <strong>{name}</strong>
              <span className="ws-note">{rank ? `#${rank}` : "UNRANKED"} · {tier}</span>
            </span>}>
            <strong>{name}</strong><p className="ws-note">{codename}</p>
            <div className="ws-profile-kv"><span>CLASS</span><b>{tier}</b></div>
            <div className="ws-profile-kv"><span>RANK</span><b>{rank ? `#${rank}` : "UNRANKED"}</b></div>
            <div className="ws-profile-kv"><span>Υ YIELD</span><b>{yieldLabel}</b></div>
            <div className="ws-profile-kv"><span>PLATFORM</span><b>{platform}</b></div>
          </RailDialog>
        </div>
        </>}
      </>}
      rightTitle="OPERATOR"
      right={<>
        <div className="mod"><h3><span className="sq" />OPERATOR PROFILE</h3>
          <strong>{name}</strong><p className="ws-note">{codename}</p>
          <div className="ws-profile-kv"><span>CLASS</span><b>{tier}</b></div>
          <div className="ws-profile-kv"><span>RANK</span><b>{rank ? `#${rank}` : "UNRANKED"}</b></div>
          <div className="ws-profile-kv"><span>Υ YIELD</span><b>{yieldLabel}</b></div>
          <div className="ws-profile-kv"><span>PLATFORM</span><b>{platform}</b></div>
        </div>
        {section === "badges" ? <div id="profile-badge-right" /> : <>
        {panels}
        <MyWatchlist codename={codename} />
        <div className="mod ws-profile-actions"><h3><span className="sq" />ACTIONS</h3>{actions}</div>
        <div className="mod"><h3><span className="sq" />CONTEXT</h3>
          <p className="ws-note">Public operator telemetry. Report and Lab remain owner-only.</p>
          <Link href="/methodology">Methodology →</Link>
        </div>
        </>}
      </>}
      status={<>{name} · PROFILE · SIGNALAF × SIGRANK</>}
    ><div className="ws-profile-content">{children}</div></WorkspaceShell>
  </ProfileWorkspaceContext.Provider>;
}
