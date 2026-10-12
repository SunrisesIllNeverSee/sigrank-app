/**
 * components/live/session.ts — 2C logged-in/claimed state for the workspace
 * account chrome (the reference's ACCT placeholder identity, D-A01/D-A02).
 *
 * Same production pattern as components/profile/ProfileAuthGate and the nav
 * AccountMenu: GET /api/auth/session resolves client-side so the board route
 * stays statically renderable (no server cookie read just to paint a chip).
 * The endpoint returns ONLY public display fields (codename, displayName,
 * avatarUrl) — never PII.
 *
 * One fetch per browser session: the promise is module-cached so every
 * consumer (account chip today, anything else later) shares it. Rank for a
 * linked operator resolves through enrich.ts's fetchOperatorProfile, which is
 * itself session-cached — signing in never adds a redundant request when the
 * viewer's own row was already drilled into.
 *
 * States mirror the gate's contract:
 *   loading          → neutral placeholder, no fabricated identity
 *   signed out       → SIGN IN affordance → /login
 *   signed in, no op → UNLINKED → claim affordances (/me)
 *   signed in + op   → display name + live rank chip
 */
"use client";

import { useEffect, useState } from "react";
import { fetchOperatorProfile } from "./enrich";
import { badgeForPct, type PixelBadgeName } from "./PixelBadge";

export interface BoardSession {
  loaded: boolean;
  signedIn: boolean;
  /** Linked operator's public codename (null when unlinked/signed out). */
  codename: string | null;
  displayName: string | null;
  /** current_rank.global for the linked operator — null until/unless resolved. */
  rank: number | null;
  pixelBadge: PixelBadgeName | null;
}

const INITIAL: BoardSession = {
  loaded: false,
  signedIn: false,
  codename: null,
  displayName: null,
  rank: null,
  pixelBadge: null,
};

let cached: Promise<BoardSession> | null = null;

export function invalidateBoardSession() {
  cached = null;
  window.dispatchEvent(new Event("workspace-session-changed"));
}

/** The single session fetch — deduped module-wide, never refetches. */
export function fetchBoardSession(): Promise<BoardSession> {
  if (cached) return cached;
  cached = fetch("/api/auth/session", { cache: "no-store" })
    .then(async (r) => {
      const base: BoardSession = { ...INITIAL, loaded: true };
      if (!r.ok) return base;
      const d = (await r.json()) as {
        signedIn?: boolean;
        operator?: { codename?: string; displayName?: string | null } | null;
      };
      const codename = d?.operator?.codename ?? null;
      const displayName = d?.operator?.displayName ?? null;
      const sess: BoardSession = {
        loaded: true,
        signedIn: !!d?.signedIn,
        codename,
        displayName,
        rank: null,
        pixelBadge: null,
      };
      /* Linked operator → resolve live rank through the shared profile cache
         (same endpoint the drill enrichment hits; deduped per session). */
      if (codename) {
        const p = await fetchOperatorProfile(codename);
        const g = p?.current_rank?.global;
        if (typeof g === "number" && Number.isFinite(g)) sess.rank = g;
        if (sess.signedIn) sess.pixelBadge = badgeForPct(p?.current_rank?.percentile);
      }
      return sess;
    })
    .catch(() => ({ ...INITIAL, loaded: true }));
  return cached;
}

/**
 * useBoardSession — resolves once on mount. `enabled=false` skips the fetch
 * entirely (the explicit `account` prop is a demo/QA override that must stay
 * standalone-deterministic).
 */
export function useBoardSession(enabled = true): BoardSession {
  const [sess, setSess] = useState<BoardSession>(INITIAL);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let revision = 0;
    const refresh = () => {
      const current = ++revision;
      fetchBoardSession().then((s) => {
        if (alive && current === revision) setSess(s);
      });
    };
    refresh();
    window.addEventListener("workspace-session-changed", refresh);
    return () => {
      alive = false;
      window.removeEventListener("workspace-session-changed", refresh);
    };
  }, [enabled]);
  return sess;
}
