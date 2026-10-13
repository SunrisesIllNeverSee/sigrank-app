"use client";

import Link from "next/link";
import { claimMailto } from "@/lib/identity/claim-contact";

interface Props {
  codename: string;
  isSignedIn: boolean;
  hasOperator: boolean;
}

export function ClaimTab({ codename, isSignedIn, hasOperator }: Props) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-5">
      <h2 className="font-mono text-sm font-bold tracking-wide text-text-primary">
        Seeded profile ownership
      </h2>
      <p className="max-w-lg font-sans text-xs leading-relaxed text-text-secondary">
        This profile was imported for the original SigRank board. If it&apos;s yours,
        email us and we&apos;ll verify ownership personally. Reply from the account we
        reached you on if we contacted you.
      </p>
      <a href={claimMailto(codename)} className="font-mono text-xs text-gold hover:underline">
        Email hello@signalaf.com to claim →
      </a>
      <p className="font-sans text-[11px] text-text-dim">
        New here?{" "}
        <Link
          href={isSignedIn && hasOperator ? "/me" : "/login"}
          className="text-gold hover:underline"
        >
          {isSignedIn && hasOperator ? "Open your profile" : "Sign up to get on the board"}
        </Link>
        .
      </p>
    </section>
  );
}
