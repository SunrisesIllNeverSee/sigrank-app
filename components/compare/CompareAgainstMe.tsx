"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

/**
 * CompareAgainstMe — a client-side banner that offers "compare yourself" when
 * the user is signed in. Calls /api/auth/session (public display fields only)
 * and, if the user has a linked operator, renders a button that navigates to
 * /compare?a=<their-codename>.
 *
 * This replaces the server-side getSessionOperator() call that forced the
 * entire /compare page into dynamic rendering. The page is now ISR; auth state
 * resolves client-side without de-opting the cache.
 */
export function CompareAgainstMe() {
  const sp = useSearchParams();
  const router = useRouter();
  const [codename, setCodename] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { operator: null }))
      .then((d) => {
        if (!alive) return;
        setCodename(d?.operator?.codename ?? null);
        setLoaded(true);
      })
      .catch(() => {
        if (alive) setLoaded(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Don't show "compare yourself" if the user is already on a comparison
  // with their own codename as side A.
  const currentA = sp.get("a");
  if (loaded && codename && currentA !== codename) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-bg-border bg-bg-surface px-4 py-2.5">
        <span className="font-sans text-sm text-text-secondary">
          Compare yourself →
        </span>
        <button
          type="button"
          onClick={() => router.push(`/compare?a=${encodeURIComponent(codename)}`)}
          className="rounded-md px-3 py-1.5 font-sans text-sm font-semibold transition-colors"
          style={{ background: "rgb(var(--accent))", color: "rgb(var(--bg-base))" }}
        >
          {codename} vs The Field
        </button>
      </div>
    );
  }

  // If signed in but no operator linked, prompt to claim.
  if (loaded && !codename) {
    return null;
  }

  return null;
}
