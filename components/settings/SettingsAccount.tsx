"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { ConnectDevicePanel } from "@/components/settings/ConnectDevicePanel";
import { DangerZone } from "@/components/settings/DangerZone";
import { DataPrivacy } from "@/components/settings/DataPrivacy";

/**
 * components/settings/SettingsAccount.tsx — client-side auth-dependent sections.
 *
 * The settings page shell (header, appearance, privacy info) is static for
 * Lighthouse performance. This client island fetches GET /api/v1/profile and
 * renders the auth-gated sections: Account, Connect device, Privacy & Data,
 * Danger Zone. Shows a loading skeleton while fetching.
 */

interface SessionOperator {
  codename: string;
  display_name: string | null;
  email?: string;
  data_opt_out?: boolean;
}

const rowLink =
  "shrink-0 rounded-md border border-bg-border px-3 py-1.5 font-mono text-[11px] text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary";

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wide text-text-primary">
          {title}
        </h2>
        {desc && <p className="font-sans text-xs text-text-muted">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

export function SettingsAccount() {
  const [op, setOp] = useState<SessionOperator | null | undefined>(undefined);
  const [claimed, setClaimed] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Read ?claimed=1 from the URL (was previously a server-side searchParam)
    const params = new URLSearchParams(window.location.search);
    setClaimed(params.get("claimed") ?? undefined);

    let alive = true;
    fetch("/api/v1/profile", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { operator: null }))
      .then((d) => {
        if (alive) setOp((d?.operator as SessionOperator | null) ?? null);
      })
      .catch(() => {
        if (alive) setOp(null);
      });
    return () => {
      alive = false;
    };
  }, []);

  // Loading state — minimal skeleton
  if (op === undefined) {
    return (
      <Section title="Account" desc="Your operator identity and profile.">
        <div className="h-16 animate-pulse rounded-md border border-bg-border bg-bg-base/40" />
      </Section>
    );
  }

  return (
    <>
      {claimed === "1" && op && (
        <div className="flex flex-col gap-2 rounded-lg border border-gold/40 bg-gold/5 p-4">
          <div className="flex items-center gap-2">
            <span className="text-base">✓</span>
            <h2 className="font-mono text-sm font-bold tracking-wide text-gold">
              Profile claimed!
            </h2>
          </div>
          <p className="font-sans text-xs leading-relaxed text-text-secondary">
            Your operator profile is now linked to your account. Next step:
            connect your agent so your live token runs cascade to the
            leaderboard. Generate a connect code below and paste it into{" "}
            <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">
              npx sigrank
            </code>{" "}
            → Connect tab.
          </p>
        </div>
      )}

      <Section title="Account" desc="Your operator identity and profile.">
        {op ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4 rounded-md border border-bg-border bg-bg-base/40 px-3 py-2.5">
              <div className="flex min-w-0 flex-col">
                <span className="font-mono text-xs text-text-secondary">
                  Signed in
                </span>
                {op.email && (
                  <span
                    className="truncate font-mono text-[11px] text-text-primary"
                    title={op.email}
                  >
                    {op.email} <span className="text-text-dim">· private</span>
                  </span>
                )}
                <span className="font-mono text-[11px] text-text-dim">
                  {op.codename}
                </span>
              </div>
              <div className="flex gap-2">
                <Link href="/me/edit" className={rowLink}>
                  Edit profile
                </Link>
                <Link
                  href={`/user/${encodeURIComponent(op.codename)}`}
                  className={rowLink}
                >
                  View profile
                </Link>
              </div>
            </div>
            <SignOutButton />
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 rounded-md border border-dashed border-bg-border bg-bg-base/40 px-3 py-2.5">
            <div className="flex flex-col">
              <span className="font-mono text-xs text-text-secondary">
                Sign in to manage your account
              </span>
              <span className="font-sans text-[11px] text-text-dim">
                Claim your profile, set your handle, and edit your details.
              </span>
            </div>
            <Link
              href="/login?next=/settings"
              className="shrink-0 rounded-md border border-gold/40 px-3 py-1 font-mono text-[11px] text-gold transition-colors hover:bg-gold/10"
            >
              Log in
            </Link>
          </div>
        )}
      </Section>

      {op && (
        <Section
          title="Connect a device"
          desc="Link your local agent so your token runs cascade to the leaderboard."
        >
          <ConnectDevicePanel />
        </Section>
      )}

      {op && (
        <Section
          title="Privacy & Data"
          desc="Manage what we collect, pause collection, or delete your data."
        >
          <DataPrivacy codename={op.codename} initialOptOut={op.data_opt_out ?? false} />
        </Section>
      )}

      {op && (
        <div id="danger-zone">
          <DangerZone codename={op.codename} />
        </div>
      )}
    </>
  );
}
