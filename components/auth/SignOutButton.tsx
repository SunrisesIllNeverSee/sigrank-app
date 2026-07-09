"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/supabase/auth";

/**
 * components/auth/SignOutButton.tsx — clears the Supabase session cookie and returns
 * to the homepage. Used in /settings (the account-level surface). Server-rendered
 * auth state elsewhere re-resolves on router.refresh().
 */
export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    await signOut();
    router.refresh();
    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className="w-fit rounded-md border border-bg-border px-4 py-2 font-mono text-xs text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-60"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
