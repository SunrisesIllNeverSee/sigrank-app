"use client";

import { createContext, useContext, useEffect, useState } from "react";

/**
 * ProfileAuthGate — resolves the viewer's auth state CLIENT-SIDE so the profile
 * page can stay ISR-cached (edge-cached via s-maxage=21600).
 *
 * The server renders with isOwner=false, isSignedIn=false, hasOperator=false.
 * This gate fetches /api/auth/session on mount and provides the resolved auth
 * state to descendant client components via React Context.
 *
 * Three states:
 *   1. Not signed in           → signedIn=false, hasOperator=false, isOwner=false
 *   2. Signed in, not linked    → signedIn=true,  hasOperator=false, isOwner=false
 *   3. Signed in, linked        → signedIn=true,  hasOperator=true,  isOwner=(codename match)
 *
 * The "loading" state (before the fetch resolves) returns the server-rendered
 * defaults (all false). This means:
 *   - ClaimTab: shows nothing until auth resolves (the "Sign in" button appears
 *     after a brief delay for signed-out visitors — acceptable since ClaimTab
 *     is only shown on unclaimed seed profiles)
 *   - ReportTab: shows without the owner privacy toggle until auth resolves
 *   - LabTab: shows read-only until auth resolves
 */

export interface ProfileAuthState {
  isOwner: boolean;
  isSignedIn: boolean;
  hasOperator: boolean;
  loaded: boolean;
}

const ProfileAuthContext = createContext<ProfileAuthState>({
  isOwner: false,
  isSignedIn: false,
  hasOperator: false,
  loaded: false,
});

export function useProfileAuth(): ProfileAuthState {
  return useContext(ProfileAuthContext);
}

export function ProfileAuthGate({
  codename,
  children,
}: {
  codename: string;
  children: React.ReactNode;
}) {
  const [auth, setAuth] = useState<ProfileAuthState>({
    isOwner: false,
    isSignedIn: false,
    hasOperator: false,
    loaded: false,
  });

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { operator: null, signedIn: false }))
      .then((d) => {
        if (!alive) return;
        const operator = d?.operator;
        const isOwner = !!operator && operator.codename === codename;
        setAuth({
          isOwner,
          isSignedIn: !!d?.signedIn,
          hasOperator: !!operator,
          loaded: true,
        });
      })
      .catch(() => {
        if (alive) setAuth((a) => ({ ...a, loaded: true }));
      });
    return () => {
      alive = false;
    };
  }, [codename]);

  return (
    <ProfileAuthContext.Provider value={auth}>
      {children}
    </ProfileAuthContext.Provider>
  );
}
