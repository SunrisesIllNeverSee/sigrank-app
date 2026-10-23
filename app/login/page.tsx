import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginContent } from "@/components/auth/LoginContent";
import { WorkspaceShell } from "@/components/live/WorkspaceShell";
import { withOG } from "@/lib/seo";

/**
 * app/login/page.tsx — sign-in page.
 *
 * UI shell around the LoginButtons client island (GitHub OAuth + X/Twitter OAuth +
 * email magic-link). Honors a same-origin `?next=` hop (e.g. /login?next=/me) so the
 * post-login callback returns the user where they started. The leaderboard stays free
 * to browse without an account.
 *
 * PERF (2026-07-31): searchParams reading moved to a client component (LoginContent)
 * so this page can be statically rendered + ISR-cached. Previously, reading
 * searchParams in the server component forced force-dynamic (no caching), which
 * gave Vercel a "Needs Improvement" score (59). Now the page is static; the
 * ?next= and ?error= params are read on the client via useSearchParams().
 */

export const revalidate = 3600;

export const metadata: Metadata = {
  ...withOG({
    title: "Sign in",
    description: "Sign up or sign in to get on the board and back the build.",
    path: "/login",
  }),
  // Auth surface — not a search landing page.
  robots: { index: false, follow: true },
};

export default function LoginPage() {
  return (
    <WorkspaceShell active="profile" title="ACCOUNT ACCESS" leftTitle="SIGN IN"
      left={<div className="mod"><h3><span className="sq" />YOUR ACCOUNT</h3><p className="ws-note">Sign in to access your operator profile, saved badges and watchlist.</p></div>}
      rightTitle="PRIVACY" right={<div className="mod"><h3><span className="sq" />TOKEN COUNTS ONLY</h3><p className="ws-note">Never prompts or conversation content. Your public profile and owner settings remain separate.</p></div>}
      leftWidth={228} rightWidth={252}>
    <Suspense
      fallback={
        <div className="account-access-content mx-auto flex max-w-md flex-col gap-6 py-12">
          <header className="flex flex-col items-center gap-2 text-center">
            <span className="font-mono text-3xl font-bold tracking-[0.1em] text-gold">
              SIGRANK
            </span>
            <h1 className="font-mono text-lg font-bold tracking-wide text-text-primary">
              Sign in
            </h1>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Sign up to create your operator profile, set your handle, and back the build.
              The leaderboard is free to browse without an account.
            </p>
          </header>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
    </WorkspaceShell>
  );
}
