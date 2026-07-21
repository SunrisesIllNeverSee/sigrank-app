import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { SignOutButton } from "@/components/auth/SignOutButton";
import { getSessionOperator } from "@/lib/infra/supabase/auth-server";
import { ConnectDevicePanel } from "@/components/settings/ConnectDevicePanel";
import { DangerZone } from "@/components/settings/DangerZone";
import { withOG } from "@/lib/seo";

/**
 * app/settings/page.tsx — ACCOUNT-LEVEL settings (AUTH_LAUNCH_DIRECTIVES D4).
 *
 * Profile *content* editing lives in the profile workspace (/me/edit, D6) — settings
 * is now account-level only: who you're signed in as, links to your profile, sign out,
 * appearance, and privacy info. force-dynamic so it reads the live session (this is a
 * single authed page in the middleware matcher — the board is never affected).
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = withOG({
  title: "Settings",
  description: "Manage your SigRank operator account and appearance.",
  path: "/settings",
});

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

const rowLink =
  "shrink-0 rounded-md border border-bg-border px-3 py-1.5 font-mono text-[11px] text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ claimed?: string }>;
}) {
  const op = await getSessionOperator();
  const { claimed } = await searchParams;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-mono text-2xl font-bold tracking-wide text-text-primary">
          ◈ Settings
        </h1>
        <p className="font-sans text-sm text-text-secondary">
          {op
            ? "Manage your account and appearance. Edit your public profile from your profile page."
            : "Appearance works now. Account controls unlock when you sign in."}
        </p>
      </header>

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

      <Section title="Appearance" desc="Theme is saved to this browser.">
        <ThemeToggle />
      </Section>

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

      <Section
        title="Privacy"
        desc="SigRank only ever stores token counts — never conversation content."
      >
        <p className="font-sans text-[11px] leading-relaxed text-text-dim">
          The free tier reads token counts, model ids, and content lengths
          locally. No transcripts leave your device. See{" "}
          <Link
            href="/about"
            className="text-text-muted underline hover:text-text-secondary"
          >
            how it works
          </Link>
          .
        </p>
      </Section>

      <Section title="Support" desc="Support the build with a one-time contribution.">
        <Link
          href="/upgrade"
          className="w-fit rounded-md bg-gold px-4 py-2 font-semibold text-bg-base transition-colors hover:bg-gold/90"
        >
          Support the build →
        </Link>
      </Section>

      {op && <DangerZone codename={op.codename} />}
    </div>
  );
}
