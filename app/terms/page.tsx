import type { Metadata } from "next";
import Link from "next/link";
import { withOG } from "@/lib/seo";

/**
 * app/terms/page.tsx — standalone Terms of Service page (owner 2026-07-16:
 * "lets make sure we have terms privacy etc that cover data").
 *
 * The /about page retains anchored copies (#privacy, #terms) for backwards-
 * compatible footer links, but these standalone pages are the canonical URLs
 * going forward.
 */
export const metadata: Metadata = withOG({
  title: "Terms of Service",
  description:
    "The terms governing your use of SigRank — the public AI operator leaderboard. Account responsibilities, acceptable use, content ownership, and disclaimers.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-8">
      <header className="flex flex-col gap-1">
        <h1 className="font-mono text-2xl font-bold tracking-wide text-text-primary">
          Terms of Service
        </h1>
        <p className="font-mono text-[11px] text-text-dim">
          Last updated 2026-07-16
        </p>
      </header>

      <div className="flex flex-col gap-4 font-sans text-sm leading-relaxed text-text-secondary">
        <p>
          By using SigRank (operated under MO§ES™ / Ello Cello LLC) you agree
          to these terms.
        </p>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-semibold text-text-primary">
            What SigRank is
          </h2>
          <p>
            SigRank is a public leaderboard that scores AI operators on
            token-telemetry metrics. Rankings are provided as-is for
            informational and comparative purposes.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-semibold text-text-primary">Your account</h2>
          <p>
            Accounts are free and created by signing in with a supported
            provider. You are responsible for activity on your account and for
            the accuracy of the profile details you publish.
          </p>
          <p>
            You may change your codename and handle at any time. Your codename
            is your public identity and URL key. Changing it updates your
            profile URL; previous URLs will not redirect.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-semibold text-text-primary">
            Profile visibility
          </h2>
          <p>
            You can set your profile to Public or Private. When Private, only
            your codename and computed metrics (rank, Υ Yield, class) are
            visible to other users. Your display name, handle, avatar, bio,
            location, and links are hidden. You still appear on the
            leaderboard with your codename and metrics regardless of
            visibility setting.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-semibold text-text-primary">
            Acceptable use
          </h2>
          <ul className="flex list-disc flex-col gap-1 pl-5">
            <li>Do not falsify, inflate, or game telemetry or scores.</li>
            <li>
              Do not impersonate another person or operator, or publish
              unlawful, infringing, or abusive content.
            </li>
            <li>
              Do not scrape, overload, or attempt to disrupt the service or
              its API.
            </li>
            <li>
              Do not use automated tools to mass-collect operator profile data
              for purposes unrelated to SigRank&apos;s intended use.
            </li>
          </ul>
          <p>
            We may adjust or remove scores, profiles, or accounts that violate
            these terms or compromise leaderboard integrity.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-semibold text-text-primary">Your content</h2>
          <p>
            You retain ownership of the profile details you provide. By
            publishing them you grant us a license to display them on your
            public profile and the leaderboard. When your profile is set to
            Private, we display only your codename and computed metrics.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-semibold text-text-primary">
            Data &amp; telemetry
          </h2>
          <p>
            SigRank collects token counts, content lengths, and model
            identifiers — never prompt content, code, or conversation text.
            Your telemetry is processed locally by the SigRank agent and only
            the aggregate counts are submitted to the server. See our{" "}
            <Link
              href="/privacy"
              className="text-text-muted underline hover:text-text-secondary"
            >
              Privacy Policy
            </Link>{" "}
            for full details.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-semibold text-text-primary">
            Support &amp; donations
          </h2>
          <p>
            Any optional payment is a voluntary contribution to support the
            build — not a purchase of a service tier or a guarantee.
            Contributions are non-refundable.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-semibold text-text-primary">Disclaimer</h2>
          <p>
            SigRank is provided &ldquo;as is&rdquo;, without warranties of any
            kind. To the maximum extent permitted by law, we are not liable
            for any damages arising from your use of the service.
          </p>
        </section>

        <section className="flex flex-col gap-1.5">
          <h2 className="font-semibold text-text-primary">
            Changes &amp; contact
          </h2>
          <p>
            We may update these terms; material changes will be reflected by
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
          href="/privacy"
          className="font-mono text-xs text-text-muted transition-colors hover:text-text-secondary"
        >
          Privacy Policy →
        </Link>
      </div>
    </div>
  );
}
