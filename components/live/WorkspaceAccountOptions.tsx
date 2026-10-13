"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { THEMES, persistLbwTheme, type ThemeName } from "./utils";
import { liveTrack } from "./analytics";
import { invalidateBoardSession } from "./session";
import { ICON_SETS, type IconSetName } from "./PixelIcon";
import "./account-menu.css";

export function WorkspaceAccountOptions({ mode, name, theme, setTheme, iconSet, setIconSet, close }: {
  mode: "loading" | "out" | "in" | "nolink" | "override";
  name: string;
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  iconSet: IconSetName;
  setIconSet: (iconSet: IconSetName) => void;
  close: () => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  closeRef.current = close;
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const trigger = root.current?.closest(".sacct")?.querySelector<HTMLButtonElement>(".avatar");
    root.current?.querySelector<HTMLElement>("a, button")?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      closeRef.current();
      trigger?.focus();
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, []);

  const signOut = async () => {
    setBusy(true);
    setError(null);
    try {
      const { createBrowserClient } = await import("@/lib/infra/supabase/auth");
      const client = createBrowserClient();
      if (!client) throw new Error("Sign-out is unavailable. Please try again.");
      const result = await client.auth.signOut();
      if (result.error) throw result.error;
      invalidateBoardSession();
      close();
      router.refresh();
    } catch {
      setError("Could not sign out. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={root} className="account-options" role="dialog" aria-label="Account options"
      onBlur={(event) => {
        if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) close();
      }}>
      <div className="ap-label">{mode === "override" ? "PREVIEW ACCOUNT" : "ACCOUNT"}</div>
      {mode === "loading" ? <span className="ap-item" role="status">LOADING ACCOUNT…</span>
        : mode === "out" ? <a className="ap-item" href="/login">SIGN IN →</a>
        : <>
          <div className="ap-item account-identity">{name}</div>
          <a className="ap-item" href={mode === "nolink" ? "/me/edit" : "/me"}>
            {mode === "nolink" ? "FINISH PROFILE SETUP" : "MY PROFILE"}
          </a>
          {mode !== "nolink" && <a className="ap-item" href="/me/edit#profile-display">PROFILE DISPLAY · BADGES & MARKS</a>}
          {mode !== "nolink" && <a className="ap-item" href="/me/edit">EDIT PROFILE</a>}
          <a className="ap-item" href="/settings">ACCOUNT SETTINGS</a>
          <a className="ap-item" href="/settings#connect-device">DEVICES & KEYS</a>
          <a className="ap-item" href="/settings#privacy-data">PRIVACY & DATA</a>
        </>}
      <div className="ap-label">APPEARANCE</div>
      <div className="ap-appearance">
        <label>Icons<select aria-label="Icon style" value={iconSet}
          onChange={(event) => setIconSet(event.target.value as IconSetName)}>
          {ICON_SETS.map(item => <option key={item} value={item}>{item}</option>)}
        </select></label>
        <label>Theme<select aria-label="Theme" value={theme} onChange={(event) => {
          const next = event.target.value as ThemeName;
          setTheme(next); persistLbwTheme(next); liveTrack.themeChanged(next);
        }}>
          {THEMES.map(item => <option key={item} value={item}>{item}</option>)}
        </select></label>
      </div>
      <a className="ap-item" href="/privacy">PRIVACY POLICY</a>
      {(mode === "in" || mode === "nolink") && <button className="ap-item mut" type="button"
        disabled={busy} onClick={() => void signOut()}>{busy ? "SIGNING OUT…" : "SIGN OUT"}</button>}
      {error && <div className="ap-item" role="alert">{error}</div>}
    </div>
  );
}
