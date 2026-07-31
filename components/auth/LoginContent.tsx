"use client";

import { useSearchParams } from "next/navigation";
import { LoginButtons } from "@/components/auth/LoginButtons";
import Link from "next/link";

/**
 * LoginContent — client component that reads searchParams via useSearchParams().
 *
 * This lets the /login page be statically rendered (ISR-cached) instead of
 * force-dynamic. The searchParams (?next=, ?error=) are read on the client,
 * which is fine — they're for display only (error message + post-login redirect).
 */
export function LoginContent() {
  const searchParams = useSearchParams();
  const next = searchParams.get("next");
  const error = searchParams.get("error");

  const safeNext =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : undefined;
  const errorMsg =
    error === "auth"
      ? "Sign-in didn’t complete — please try again, or use a different provider below."
      : error
        ? "Something went wrong signing in. Please try again."
        : null;

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 py-12">
      <header className="flex flex-col items-center gap-2 text-center">
        <span className="font-mono text-3xl font-bold tracking-[0.1em] text-gold">
          SIGRANK
        </span>
        <h1 className="font-mono text-lg font-bold tracking-wide text-text-primary">
          Sign in
        </h1>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          Claim your operator profile, set your handle, and back the build. The
          leaderboard is free to browse without an account.
        </p>
      </header>

      {errorMsg && (
        <p className="rounded-md border border-bg-border bg-bg-base/50 px-3 py-2.5 text-center font-sans text-xs text-text-secondary">
          {errorMsg}
        </p>
      )}

      <LoginButtons next={safeNext} />

      <p className="text-center font-sans text-[11px] leading-relaxed text-text-dim">
        SigRank stores token counts only — never conversation content. By
        signing in you agree to the{" "}
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
