import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { RemovalRequest } from "@/components/settings/RemovalRequest";
import { SettingsAccount } from "@/components/settings/SettingsAccount";
import { withOG } from "@/lib/seo";

/**
 * app/settings/page.tsx — ACCOUNT-LEVEL settings (AUTH_LAUNCH_DIRECTIVES D4).
 *
 * Static shell for Lighthouse performance. The auth-dependent sections
 * (Account, Connect device, Privacy & Data, Danger Zone) are rendered by
 * the SettingsAccount client island, which fetches GET /api/v1/profile.
 * The shell (header, appearance, privacy info, removal request) is static.
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

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ claimed?: string }>;
}) {
  const { claimed } = await searchParams;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-mono text-2xl font-bold tracking-wide text-text-primary">
          ◈ Settings
        </h1>
        <p className="font-sans text-sm text-text-secondary">
          Manage your account and appearance. Edit your public profile from
          your profile page.
        </p>
      </header>

      {/* Auth-dependent sections (client island) */}
      <SettingsAccount claimed={claimed} />

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
  );
}
