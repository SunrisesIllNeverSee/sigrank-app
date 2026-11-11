"use client";

import { useSearchParams } from "next/navigation";
import { LoginButtons } from "@/components/auth/LoginButtons";
import Link from "next/link";
import { safeNext as validateNext } from "@/lib/infra/safe-next";

/**
 * LoginContent — client component that reads searchParams via useSearchParams().
 *
 * This lets the /login page be statically rendered (ISR-cached) instead of
 * force-dynamic. The searchParams (?next=, ?error=) are read on the client,
 * which is fine — they're for display only (error message + post-login redirect).
 */
type Mode = "signin" | "signup";

const COPY: Record<Mode, { title: string; lede: string; agree: string }> = {
  signin: {
    title: "Sign in",
    lede: "Welcome back. Sign in to your operator profile, saved badges and watchlist. The leaderboard is free to browse without an account.",
    agree: "By signing in you agree to the",
  },
  signup: {
    title: "Create your operator profile",
    lede: "Claim a handle, put your token stats on the board, and see where you rank. The first 1,000 operators get permanent free access.",
    agree: "By creating a profile you agree to the",
  },
};

export function LoginContent({ mode = "signin" }: { mode?: Mode } = {}) {
  const copy = COPY[mode];
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const error = searchParams.get("error");

  const safeNext = validateNext(next) ?? undefined;
  const errorMsg =
    error === "auth"
      ? "Sign-in didn’t complete — please try again, or use a different provider below."
      : error
        ? "Something went wrong signing in. Please try again."
        : null;

  return (
    <div className="account-access-content mx-auto flex max-w-md flex-col gap-6 py-12">
      <header className="flex flex-col items-center gap-2 text-center">
        <span className="font-mono text-3xl font-bold tracking-[0.1em] text-gold">
          SIGRANK
        </span>
        <h1 className="font-mono text-lg font-bold tracking-wide text-text-primary">
          {copy.title}
        </h1>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          {copy.lede}
        </p>
      </header>

      {errorMsg && (
        <p className="rounded-md border border-bg-border bg-bg-base/50 px-3 py-2.5 text-center font-sans text-xs text-text-secondary">
          {errorMsg}
        </p>
      )}

      <LoginButtons next={safeNext} />

      <p className="text-center font-sans text-xs text-text-secondary">
        {mode === "signup" ? (
          <>Already on the board?{" "}<Link href="/login" className="text-gold underline">Sign in</Link></>
        ) : (
          <>New to SigRank?{" "}<Link href="/signup" className="text-gold underline">Create your operator profile</Link></>
        )}
      </p>

      <p className="text-center font-sans text-[11px] leading-relaxed text-text-dim">
        SigRank stores token counts only — never conversation content.{" "}
        {copy.agree}{" "}
        <Link
          href="/about"
          className="text-text-muted underline hover:text-text-secondary"
        >
          terms &amp; privacy
        </Link>
        .
      </p>
    </div>
  );
}
