"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { ArtworkShareControls } from "@/components/share/ArtworkShareControls";
import { MyWatchlist } from "./MyWatchlist";
import { WatchButton } from "@/components/live/WatchButton";
import { usePhone } from "@/components/board-mobile/usePhone";
import { RailDialog } from "./RailDialog";
import "./profile-workspace.css";

type ProfileSection = "overview" | "stats" | "analysis" | "report" | "lab" | "submissions" | "social" | "badges";
const ProfileWorkspaceContext = createContext<{ section: ProfileSection; codename: string; select: (section: ProfileSection) => void } | null>(null);
export const useProfileWorkspace = () => useContext(ProfileWorkspaceContext);

const sections = ["overview", "stats", "analysis", "submissions", "social", "badges"] as const;

/** owner 2026-10-21: phone-only profile header (hidden above 760px by CSS). */
function PhoneHeader({ name, codename, rank, tier, platform }: { name: string; codename: string; rank: number | null; tier: string; platform: string }) {
  const [note, setNote] = useState("");
  const isPhone = usePhone();
  const noteTimer = useRef<number | undefined>(undefined);
  // owner 2026-10-21: clear the pending note timer on unmount.
  useEffect(() => () => window.clearTimeout(noteTimer.current), []);
  const initials = name.split(/\s+/).filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";
  const share = async () => {
    const url = `${window.location.origin}/s/${encodeURIComponent(codename)}`;
    try {
      if (typeof navigator.share === "function") { await navigator.share({ title: `${name} on SignalAF`, url }); return; }
      await navigator.clipboard.writeText(url);
      setNote("Link copied");
    } catch (e) {
      if ((e as Error)?.name !== "AbortError") setNote("Could not share");
    }
    window.clearTimeout(noteTimer.current);
    noteTimer.current = window.setTimeout(() => setNote(""), 2500);
  };
  return <header className="ws-pm-head" aria-label="Operator">
    <div className="ws-pm-id">
      <span className="ws-pm-av" aria-hidden="true">{initials}</span>
      <div className="ws-pm-names">
        <h1>{name}</h1>
        <span className="ws-pm-handle">@{codename}</span>
      </div>
    </div>
    <div className="ws-pm-pills">
      <span>{rank ? `#${rank}` : "UNRANKED"}</span><span>{tier}</span><span>{platform}</span>
    </div>
    <div className="ws-pm-actions">
      <button type="button" onClick={share}>Share</button>
      <Link href={`/compare?a=${encodeURIComponent(codename)}`}>Compare</Link>
      {/* owner 2026-10-21: mount (and fetch) only on phones; the header is CSS-hidden above 760px. */}
      <span className="ws-pm-watch">{isPhone ? <WatchButton codename={codename} /> : null}</span>
    </div>
    <p className="ws-pm-note" role="status" aria-live="polite">{note}</p>
  </header>;
}

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
          <RailDialog title="OPERATOR PROFILE" subtitle={codename} hint="OPEN ▸"
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
    ><div className="ws-profile-content"><PhoneHeader name={name} codename={codename} rank={rank} tier={tier} platform={platform} />{children}</div></WorkspaceShell>
  </ProfileWorkspaceContext.Provider>;
}
