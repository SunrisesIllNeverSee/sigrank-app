import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginContent } from "@/components/auth/LoginContent";
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

export const metadata: Metadata = withOG({
  title: "Sign in",
  description: "Sign in to claim your operator profile and back the build.",
  path: "/login",
});

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex max-w-md flex-col gap-6 py-12">
          <header className="flex flex-col items-center gap-2 text-center">
            <span className="font-mono text-3xl font-bold tracking-[0.1em] text-gold">
              SIGRANK
            </span>
            <h1 className="font-mono text-lg font-bold tracking-wide text-text-primary">
              Sign in
            </h1>
            <p className="font-sans text-sm leading-relaxed text-text-secondary">
              Claim your operator profile, set your handle, and back the build.
              The leaderboard is free to browse without an account.
            </p>
          </header>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
