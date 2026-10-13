"use client";

import Link from "next/link";

interface Props {
  codename: string;
  isSignedIn: boolean;
  hasOperator: boolean;
}

export function ClaimTab({ isSignedIn, hasOperator }: Props) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-5">
      <h2 className="font-mono text-sm font-bold tracking-wide text-text-primary">
        Seeded profile ownership
      </h2>
      <p className="max-w-lg font-sans text-xs leading-relaxed text-text-secondary">
        This profile was imported from public data. Claiming is temporarily unavailable
        while secure ownership verification is added. Public token counts cannot prove ownership.
        Existing accounts and submissions continue to work.
      </p>
      <Link
        href={isSignedIn && hasOperator ? "/me" : "/login"}
        className="font-mono text-xs text-gold hover:underline"
      >
        {isSignedIn && hasOperator ? "Open your profile →" : "Sign in to your own account →"}
      </Link>
    </section>
  );
}
