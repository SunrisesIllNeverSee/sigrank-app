import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";

/**
 * app/privacy/page.tsx — standalone Privacy Policy page (owner 2026-07-16:
 * "lets make sure we have terms privacy etc that cover data").
 *
 * The /about page retains anchored copies (#privacy, #terms) for backwards-
 * compatible footer links, but these standalone pages are the canonical URLs
 * going forward — cleaner for SEO, direct linking, and legal compliance.
 */
export const metadata: Metadata = withOG({
  title: "Privacy Policy",
  description:
    "How SigRank collects, uses, and protects your data. Token counts only — never prompt content. Your sessions stay on your machine.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-mono text-2xl font-bold tracking-wide text-text-primary">
          Privacy Policy
        </h1>
        <p className="font-mono text-[11px] text-text-dim">
          Last updated 2026-07-16
        </p>
      </header>

      <div className="flex flex-col gap-4 font-sans text-sm leading-relaxed text-text-secondary">
        <p>
          SigRank (&ldquo;we&rdquo;, operated under MO§ES™ / Ello Cello LLC)
          is built privacy-first. This policy explains what we collect, what
          we never collect, and how your data is used.
        </p>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-semibold text-text-primary">
            What we collect
          </h2>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>
              <span className="text-text-primary">Token telemetry</span> —
              token counts, content lengths, and model identifiers measured by
              the local agent. These produce your numeric scores.
            </li>
            <li>
              <span className="text-text-primary">Account identity</span> —
              when you sign in with GitHub, X, or an email magic link, we
              receive an identifier and email from that provider to create
              your account.
            </li>
            <li>
              <span className="text-text-primary">
                Profile details you choose to add
              </span>{" "}
              — display name, optional handle, bio, location, links, and an
              avatar image.
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-semibold text-text-primary">
            What we never collect
          </h2>
          <p>
            The content of your prompts or AI conversations. The local agent
            reads only token counts and lengths — never the words. Transcripts
            never leave your device, and we have no way to read them.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-semibold text-text-primary">
            Public vs. private
          </h2>
          <p>
            <span className="text-text-primary">Public by default:</span> your
            codename, display name, handle, avatar, bio, location, links, and
            your scores and rank — the leaderboard is a public, self-promotion
            surface.
          </p>
          <p>
            <span className="text-text-primary">Profile visibility toggle:</span>{" "}
            you can set your profile to <strong>Private</strong> from your
            profile editor. When private, only your codename and computed
            metrics (rank, Υ Yield, class) are visible to other users. Your
            display name, handle, avatar, bio, location, and links are hidden.
            You still appear on the leaderboard.
          </p>
          <p>
            <span className="text-text-primary">Always private:</span> your
            sign-in email and any payment identifiers. These are never shown
            on your profile, the board, or the public API.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-semibold text-text-primary">
            Codename changes
          </h2>
          <p>
            You can change your codename from your profile editor. Your
            codename is your public identity and URL key
            (<code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">signalaf.com/user/&lt;codename&gt;</code>).
            Changing it updates your profile URL. Previous URLs will not
            redirect — bookmark the new one.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-semibold text-text-primary">
            Service providers
          </h2>
          <p>
            We use Supabase (authentication, database, and avatar storage),
            Vercel (hosting), your chosen sign-in provider (GitHub, X, or
            email), and — only if you choose to support the build — Stripe for
            payments. Stripe handles card data directly; we never see or store
            it.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-semibold text-text-primary">Cookies</h2>
          <p>
            We use a single authentication cookie to keep you signed in. We do
            not use advertising or third-party tracking cookies.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-semibold text-text-primary">
            Data retention &amp; deletion
          </h2>
          <p>
            Your token telemetry snapshots are retained as long as your
            account is active — they are the historical record that powers
            your rank trajectory and cascade analysis. You can delete your
            account at any time from{" "}
            <Link
              href="/settings"
              className="text-text-muted underline hover:text-text-secondary"
            >
              Settings
            </Link>
            . Account deletion anonymizes your board row (kept as aggregate
            data), removes your name, email, and device keys, and cancels any
            active billing. This is permanent and cannot be undone.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-semibold text-text-primary">Your choices</h2>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>
              Edit or clear your profile fields anytime from{" "}
              <Link
                href="/me/edit"
                className="text-text-muted underline hover:text-text-secondary"
              >
                your profile editor
              </Link>
              .
            </li>
            <li>
              Toggle your profile visibility between Public and Private.
            </li>
            <li>
              Change your codename (updates your profile URL).
            </li>
            <li>
              Delete your account permanently from{" "}
              <Link
                href="/settings"
                className="text-text-muted underline hover:text-text-secondary"
              >
                Settings
              </Link>
              .
            </li>
          </ul>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-semibold text-text-primary">
            Changes &amp; contact
          </h2>
          <p>
            We may update this policy; material changes will be reflected by
            the date above. Questions:{" "}
            <a
              href="mailto:hello@signalaf.com"
              className="text-text-muted underline hover:text-text-secondary"
            >
              hello@signalaf.com
            </a>
            .
          </p>
        </section>
      </div>

      <div className="border-t border-bg-border pt-4">
        <Link
          href="/terms"
          className="font-mono text-xs text-text-muted transition-colors hover:text-text-secondary"
        >
          Terms of Service →
        </Link>
      </div>
    </div>
  );
}
