"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { MyWatchlist } from "./MyWatchlist";
import "./profile-workspace.css";

type ProfileSection = "overview" | "stats" | "analysis" | "report" | "lab" | "submissions" | "social" | "badges";
const ProfileWorkspaceContext = createContext<{ section: ProfileSection; select: (section: ProfileSection) => void } | null>(null);
export const useProfileWorkspace = () => useContext(ProfileWorkspaceContext);

const sections = ["overview", "stats", "analysis", "submissions", "social", "badges"] as const;

export function ProfileWorkspace({ name, codename, rank, tier, platform, yieldLabel, children, actions }: {
  name: string; codename: string; rank: number | null; tier: string; platform: string;
  yieldLabel: string; children: ReactNode; actions: ReactNode;
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
  return <ProfileWorkspaceContext.Provider value={{ section, select }}>
    <WorkspaceShell active="profile" title={`PROFILE / ${name}`} leftTitle="PROFILE · DRILL"
      leftWidth={220} rightWidth={280}
      left={<>
        <nav className="ws-profile-nav" aria-label="Profile views">
          {sections.map((key) => <button key={key} type="button" aria-current={section === key ? "page" : undefined}
            onClick={() => select(key)}>{section === key ? "◆" : "◇"} {key}</button>)}
        </nav>
        <Link className="ws-profile-back" href="/board/all">← BACK TO BOARD</Link>
        <div className="mod"><h3><span className="sq" />OPERATOR</h3>
          <strong>{name}</strong><p className="ws-note">{codename}</p>
          <div className="ws-profile-kv"><span>CLASS</span><b>{tier}</b></div>
          <div className="ws-profile-kv"><span>RANK</span><b>{rank ? `#${rank}` : "UNRANKED"}</b></div>
        </div>
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
        <MyWatchlist codename={codename} />
        <div className="mod ws-profile-actions"><h3><span className="sq" />ACTIONS</h3>{actions}</div>
        <div className="mod"><h3><span className="sq" />CONTEXT</h3>
          <p className="ws-note">Public operator telemetry. Report and Lab remain owner-only.</p>
          <Link href="/methodology">Methodology →</Link>
        </div>
      </>}
      status={<>{name} · PROFILE · SIGNALAF × SIGRANK</>}
    ><div className="ws-profile-content">{children}</div></WorkspaceShell>
  </ProfileWorkspaceContext.Provider>;
}
