"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useBoardSession } from "@/components/live/session";
import { WatchButton } from "@/components/live/WatchButton";
import { RailDialog } from "./RailDialog";

type WatchEntry = { codename: string; name: string; watchedAt: string };
const WATCH_COMPACT = 3;
type WatchState = "loading" | "ready" | "unavailable";

export function MyWatchlist({ codename }: { codename: string }) {
  const session = useBoardSession();
  const isOwnProfile = session.loaded && session.signedIn && session.codename?.toLowerCase() === codename.toLowerCase();
  const [state, setState] = useState<WatchState>("loading");
  const [watches, setWatches] = useState<WatchEntry[]>([]);

  const refresh = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/v1/me/watches", { cache: "no-store", signal });
      if (!res.ok) throw new Error("watchlist unavailable");
      const data: { watches?: WatchEntry[] } = await res.json();
      if (signal?.aborted) return;
      setWatches(Array.isArray(data.watches) ? data.watches : []);
      setState("ready");
    } catch {
      if (!signal?.aborted) setState("unavailable");
    }
  }, []);

  useEffect(() => {
    if (!isOwnProfile) return;
    const controller = new AbortController();
    void refresh(controller.signal);
    const update = () => { void refresh(controller.signal); };
    window.addEventListener("operator-watch-changed", update);
    return () => {
      controller.abort();
      window.removeEventListener("operator-watch-changed", update);
    };
  }, [isOwnProfile, refresh]);

  // A public operator profile never displays the viewer's private watches.
  if (!isOwnProfile) return null;
  return (
    <section className="mod ws-my-watchlist" aria-label="My Watchlist">
      <h3><span className="sq" />MY WATCHLIST</h3>
      {state === "loading" && <p className="ws-note" role="status">LOADING WATCHES…</p>}
      {state === "unavailable" && <p className="ws-note" role="status">WATCHLIST UNAVAILABLE. TRY RELOADING.</p>}
      {state === "ready" && !watches.length && <p className="ws-note">NO WATCHED OPERATORS YET. CHOOSE WATCH ON THE LEADERBOARD.</p>}
      {state === "ready" && watches.length > 0 && <>
        {/* owner 2026-10-21: compact — the leading entries keep their
            unwatch controls in the rail; a longer list opens in a popup. */}
        <ul className="ws-watch-entries">
          {watches.slice(0, WATCH_COMPACT).map((w) => (
            <li key={w.codename} className="ws-watch-entry">
              <Link href={`/user/${encodeURIComponent(w.codename)}`}>{w.name}</Link>
              <WatchButton codename={w.codename} />
            </li>
          ))}
        </ul>
        {watches.length > WATCH_COMPACT && (
          <RailDialog title="MY WATCHLIST" subtitle={`${watches.length} WATCHED`} hint="OPEN ▸" lazy
            trigger={<span className="ws-note">+{watches.length - WATCH_COMPACT} MORE WATCHED</span>}>
            <ul className="ws-watch-entries">
              {watches.map((w) => (
                <li key={w.codename} className="ws-watch-entry">
                  <Link href={`/user/${encodeURIComponent(w.codename)}`}>{w.name}</Link>
                  <WatchButton codename={w.codename} />
                </li>
              ))}
            </ul>
          </RailDialog>
        )}
      </>}
    </section>
  );
}
