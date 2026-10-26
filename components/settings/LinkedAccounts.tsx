"use client";

import { useEffect, useState } from "react";
import {
  getLinkedProviderIds,
  linkOAuthIdentity,
  LINKABLE_PROVIDERS,
  type LinkableProvider,
} from "@/lib/infra/supabase/auth";

/**
 * components/settings/LinkedAccounts.tsx — "Connected accounts" panel.
 *
 * Lists the auth identities on the signed-in user and offers link buttons for
 * any OAuth provider not yet attached (GitHub, X, LinkedIn OIDC). Linking runs
 * the standard Supabase linkIdentity redirect: provider → /auth/callback →
 * back here. A provider that is not enabled in Supabase Auth surfaces its real
 * error inline — the UI never fakes a link.
 */

const PROVIDER_LABEL: Record<LinkableProvider, string> = {
  github: "GitHub",
  twitter: "X",
  linkedin_oidc: "LinkedIn",
};

export function LinkedAccounts() {
  const [linked, setLinked] = useState<string[] | undefined>(undefined);
  const [busy, setBusy] = useState<LinkableProvider | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    getLinkedProviderIds()
      .then((ids) => {
        if (alive) setLinked(ids);
      })
      .catch(() => {
        if (alive) setLinked([]);
      });
    return () => {
      alive = false;
    };
  }, []);

  async function link(provider: LinkableProvider) {
    setBusy(provider);
    setError(null);
    const { error } = await linkOAuthIdentity(provider, "/settings");
    // On success the browser is already navigating to the provider — only
    // reset state when the redirect never fired.
    if (error) {
      setBusy(null);
      setError(error);
    }
  }

  if (linked === undefined) {
    return (
      <div className="h-16 animate-pulse rounded-md border border-bg-border bg-bg-base/40" />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {LINKABLE_PROVIDERS.map((provider) => {
        const connected = linked.includes(provider);
        return (
          <div
            key={provider}
            className="flex items-center justify-between gap-4 rounded-md border border-bg-border bg-bg-base/40 px-3 py-2.5"
          >
            <span className="font-mono text-xs text-text-primary">
              {PROVIDER_LABEL[provider]}
            </span>
            {connected ? (
              <span className="font-mono text-[11px] text-text-dim">
                Connected
              </span>
            ) : (
              <button
                type="button"
                onClick={() => link(provider)}
                disabled={busy !== null}
                className="shrink-0 rounded-md border border-bg-border px-3 py-1.5 font-mono text-[11px] text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary disabled:opacity-50"
              >
                {busy === provider ? "Connecting…" : "Connect"}
              </button>
            )}
          </div>
        );
      })}
      {linked.includes("email") && (
        <p className="font-sans text-[11px] text-text-dim">
          Email sign-in is enabled on this account.
        </p>
      )}
      {error && <p className="font-sans text-[11px] text-red-400">{error}</p>}
    </div>
  );
}
