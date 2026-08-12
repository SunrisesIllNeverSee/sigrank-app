"use client";

import { useEffect, useState } from "react";

/**
 * CompareAgainstMe — the "Compare against me" button on operator profiles.
 *
 * Shows when a signed-in operator is viewing someone else's profile. Links to
 * /compare with the viewer as A and the profile operator as B. Hidden when
 * viewing your own profile or when not signed in.
 *
 * Auth resolved client-side via /api/auth/session so the page stays ISR-cached.
 */
export function CompareAgainstMe({ codename }: { codename: string }) {
  const [viewerCodename, setViewerCodename] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { operator: null }))
      .then((d) => {
        if (!alive) return;
        setViewerCodename(d?.operator?.codename ?? null);
        setLoaded(true);
      })
      .catch(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  if (!loaded || !viewerCodename || viewerCodename === codename) return null;

  return (
    <a
      href={`/compare?a=${encodeURIComponent(viewerCodename)}&b=${encodeURIComponent(codename)}`}
      className="rounded-md border border-text-accent/40 bg-text-accent/10 px-3 py-1.5 font-mono text-xs text-text-accent transition-colors hover:bg-text-accent/20"
    >
      ⚔ Compare against me
    </a>
  );
}
