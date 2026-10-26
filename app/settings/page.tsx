import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { RemovalRequest } from "@/components/settings/RemovalRequest";
import { SettingsAccount } from "@/components/settings/SettingsAccount";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { withOG } from "@/lib/seo";

/**
 * app/settings/page.tsx — ACCOUNT-LEVEL settings (AUTH_LAUNCH_DIRECTIVES D4).
 *
 * Fully static shell for Lighthouse performance. The auth-dependent sections
 * (Account, Connect device, Privacy & Data, Danger Zone) and the ?claimed=1
 * banner are rendered by the SettingsAccount client island, which fetches
 * GET /api/v1/profile and reads window.location.search for the claimed flag.
 */
export const revalidate = 3600;

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

export default function SettingsPage() {
  return (
    <WorkspaceShell
      active="profile"
      title="SETTINGS"
      leftTitle="ACCOUNT"
      left={
        <>
          <div className="mod">
            <div className="mini-h"><span className="sq" />YOUR PROFILE</div>
            <nav className="ws-nav">
              <Link href="/me">My profile</Link>
              <Link href="/me/edit">Edit profile</Link>
              <Link href="/me/sharables">Sharables</Link>
            </nav>
          </div>
          <div className="mod">
            <div className="mini-h"><span className="sq" />BOARD</div>
            <nav className="ws-nav">
              <Link href="/">Leaderboard</Link>
              <Link href="/hall">Hall of Signal</Link>
              <Link href="/faq">FAQ</Link>
            </nav>
          </div>
        </>
      }
      rightTitle="DATA"
      right={
        <>
          <div className="mod">
            <div className="mini-h"><span className="sq" />PRIVACY</div>
            <p className="ws-note">
              SigRank only ever stores token counts — never conversation
              content. Transcripts and prompts never leave your device.
            </p>
          </div>
          <div className="mod">
            <div className="mini-h"><span className="sq" />LEGAL</div>
            <nav className="ws-nav">
              <Link href="/privacy">Privacy policy</Link>
              <Link href="/terms">Terms of service</Link>
              <Link href="/eula">EULA</Link>
            </nav>
          </div>
        </>
      }
      leftWidth={228}
      rightWidth={252}
      status={<>SETTINGS · ACCOUNT · SIGNALAF × SIGRANK</>}
    >
      <div className="mx-auto flex max-w-2xl flex-col gap-6 py-6">
        {/* Auth-dependent sections + claimed banner (client island) */}
        <SettingsAccount />

        <Section title="Appearance" desc="Theme is saved to this browser.">
          <ThemeToggle />
        </Section>

        <Section
          title="Remove your data"
          desc="On the board but don't have an account? Request removal here."
        >
          <RemovalRequest />
        </Section>

        <Section
          title="Privacy"
          desc="SigRank only ever stores token counts — never conversation content."
        >
          <p className="font-sans text-[11px] leading-relaxed text-text-dim">
            The free tier reads token counts, model ids, and content lengths
            locally. No transcripts leave your device. You can pause collection
            or delete your data anytime from this page. See our{" "}
            <Link
              href="/privacy"
              className="text-text-muted underline hover:text-text-secondary"
            >
              Privacy Policy
            </Link>{" "}
            for details on data retention and your rights.
          </p>
        </Section>
      </div>
    </WorkspaceShell>
  );
}
