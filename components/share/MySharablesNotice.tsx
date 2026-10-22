"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface Viewer {
  signedIn: boolean;
  operator: { codename: string; displayName: string | null } | null;
}

/** The share route is cached publicly, so identity MUST resolve client-side.
 * This banner never changes the operator identified by the URL. */
export function MySharablesNotice({ viewingCodename, viewingName }: {
  viewingCodename: string;
  viewingName: string;
}) {
  const [viewer, setViewer] = useState<Viewer | null>(null);
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();
    fetch("/api/auth/session", {
      cache: "no-store",
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) return null;
        const data = await response.json() as {
          signedIn?: boolean;
          operator?: { codename?: string; displayName?: string | null } | null;
        };
        return {
          signedIn: !!data.signedIn,
          operator: data.operator?.codename
            ? { codename: data.operator.codename, displayName: data.operator.displayName ?? null }
            : null,
        } satisfies Viewer;
      })
      .then(data => { if (alive) setViewer(data); })
      .catch(() => { /* Site and share page remain fully functional if auth check fails. */ });
    return () => { alive = false; controller.abort(); };
  }, []);

  if (!viewer?.signedIn) return null;
  const mine = viewer.operator;
  if (!mine) {
    return (
      <aside className="mb-4 rounded-lg border border-gold/30 bg-bg-surface px-4 py-3 font-mono text-xs text-text-secondary">
        <strong className="text-text-primary">SIGNED IN · OPERATOR NOT LINKED</strong>
        <p className="mt-1">You are viewing {viewingName}'s public card. Your account does not yet have a linked operator.</p>
        <Link href="/me/sharables" className="mt-2 inline-block text-gold underline">Connect my operator to see my cards →</Link>
      </aside>
    );
  }

  const isOwnCard = mine.codename === viewingCodename;
  if (isOwnCard) {
    return <p className="mb-4 font-mono text-xs font-semibold tracking-wider text-gold">
      YOUR SHARABLES · {mine.displayName ?? mine.codename}
    </p>;
  }
  return (
    <aside className="mb-4 rounded-lg border border-gold/30 bg-bg-surface px-4 py-3 font-mono text-xs text-text-secondary">
      <strong className="text-text-primary">VIEWING {viewingName.toUpperCase()}'S CARDS</strong>
      <p className="mt-1">Signed in as {mine.displayName ?? mine.codename}. This URL belongs to another operator.</p>
      <Link href="/me/sharables" className="mt-2 inline-block font-semibold text-gold underline">
        VIEW MY SHARABLES →
      </Link>
    </aside>
  );
}
