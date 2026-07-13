"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * ClaimTab — the "Claim this profile" section shown on unclaimed seeded operator
 * profiles.
 *
 * Two states:
 *   1. Not signed in → "Sign in with GitHub" button (redirects to /login?next=/user/<codename>)
 *   2. Signed in but not linked → token-count verification form
 *
 * The verification: the user enters their exact tokscale lifetime input token
 * count. The server checks it against the DB. Only the real operator knows this
 * number.
 *
 * On success: the page refreshes (the profile is now claimed, the ClaimTab
 * disappears, edit controls appear).
 */

interface Props {
  /** The operator's codename (URL key). */
  codename: string;
  /** Whether the viewer is signed in (resolved server-side). */
  isSignedIn: boolean;
  /** Whether the viewer already has a linked operator (can't claim another). */
  hasOperator: boolean;
}

export function ClaimTab({ codename, isSignedIn, hasOperator }: Props) {
  const router = useRouter();
  const [inputTokens, setInputTokens] = useState("");
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleClaim(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMsg("");

    try {
      const res = await fetch("/api/v1/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codename,
          input_tokens: inputTokens.replace(/[,\s]/g, ""),
        }),
      });
      const data = await res.json();

      if (res.ok && data.status === "claimed") {
        setStatus("success");
        // Refresh the page — the profile is now claimed, ClaimTab will disappear.
        setTimeout(() => router.refresh(), 1500);
      } else {
        setStatus("error");
        setErrorMsg(data.error || "Claim failed. Please try again.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  // State 1: not signed in → GitHub login prompt.
  if (!isSignedIn) {
    return (
      <section className="flex flex-col gap-3 rounded-lg border border-gold/30 bg-bg-surface p-5">
        <div className="flex items-center gap-2">
          <span className="text-base">🔑</span>
          <h2 className="font-mono text-sm font-bold tracking-wide text-text-primary">
            Is this your profile?
          </h2>
        </div>
        <p className="max-w-lg font-sans text-xs leading-relaxed text-text-secondary">
          This operator profile was seeded from public tokscale data — a static
          snapshot. If that&apos;s you, claim it to take ownership: edit your
          bio, set your handle, link your GitHub, and start submitting{" "}
          <span className="font-mono text-text-primary">live readings</span>{" "}
          via{" "}
          <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">
            sigrank submit
          </code>
          .
        </p>
        <div className="mt-1">
          <Link
            href={`/login?next=/user/${codename}`}
            className="inline-flex items-center gap-2 rounded-md border border-bg-border bg-bg-elevated px-4 py-2 font-mono text-xs font-semibold text-text-primary transition-colors hover:border-gold hover:text-gold"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2c-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.79 1.2 1.79 1.2 1.04 1.79 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.55-.29-5.23-1.28-5.23-5.7 0-1.26.45-2.29 1.2-3.1-.12-.29-.52-1.46.11-3.05 0 0 .98-.31 3.2 1.18a11.1 11.1 0 0 1 2.92-.39c.99 0 1.99.13 2.92.39 2.22-1.49 3.2-1.18 3.2-1.18.63 1.59.23 2.76.11 3.05.75.81 1.2 1.84 1.2 3.1 0 4.43-2.69 5.41-5.25 5.69.41.36.78 1.05.78 2.12v3.14c0 .31.21.68.8.56C20.21 21.39 23.5 17.08 23.5 12 23.5 5.65 18.35.5 12 .5Z" />
            </svg>
            Sign in with GitHub to claim
          </Link>
        </div>
        <p className="font-sans text-[11px] text-text-dim">
          Claiming is free. You&apos;ll verify ownership by entering your exact
          tokscale lifetime input token count.
        </p>
      </section>
    );
  }

  // State 2: signed in but already has an operator — can't claim another.
  if (hasOperator) {
    return (
      <section className="flex flex-col gap-3 rounded-lg border border-bg-border bg-bg-surface p-5">
        <div className="flex items-center gap-2">
          <span className="text-base">🔑</span>
          <h2 className="font-mono text-sm font-bold tracking-wide text-text-primary">
            Is this your profile?
          </h2>
        </div>
        <p className="max-w-lg font-sans text-xs leading-relaxed text-text-secondary">
          You&apos;re signed in, but you already have a linked operator profile.
          Each GitHub account can claim one profile. If this is actually you,
          sign out and sign back in with a different GitHub account.
        </p>
      </section>
    );
  }

  // State 3: signed in, no operator — show the verification form.
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-gold/30 bg-bg-surface p-5">
      <div className="flex items-center gap-2">
        <span className="text-base">🔑</span>
        <h2 className="font-mono text-sm font-bold tracking-wide text-text-primary">
          Claim this profile
        </h2>
      </div>
      <p className="max-w-lg font-sans text-xs leading-relaxed text-text-secondary">
        Verify you&apos;re the real operator by entering your exact tokscale
        lifetime <span className="font-mono text-text-primary">input</span> token
        count. Only the real operator knows this number — find it on your
        tokscale profile. Once claimed, you can enroll a device and submit live
        readings via{" "}
        <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-[11px] text-text-primary">
          sigrank submit
        </code>
        .
      </p>

      {status === "success" ? (
        <div className="rounded-md border border-accent/40 bg-accent/10 px-3 py-2.5">
          <p className="font-mono text-xs text-accent">
            ✓ Profile claimed! You can now enroll a device and submit live
            readings. Redirecting...
          </p>
        </div>
      ) : (
        <form onSubmit={handleClaim} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="input-tokens"
              className="font-mono text-[11px] uppercase tracking-wide text-text-dim"
            >
              Lifetime input tokens
            </label>
            <input
              id="input-tokens"
              type="text"
              value={inputTokens}
              onChange={(e) => setInputTokens(e.target.value)}
              placeholder="e.g. 20500000000"
              required
              autoComplete="off"
              spellCheck={false}
              className="rounded-md border border-bg-border bg-bg-elevated px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-dim focus:border-gold focus:outline-none"
            />
            <p className="font-sans text-[11px] text-text-dim">
              The exact integer from tokscale — no commas, no rounding.
            </p>
          </div>

          {status === "error" && errorMsg && (
            <div className="rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2">
              <p className="font-sans text-xs text-red-400">{errorMsg}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={status === "submitting" || !inputTokens.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-md border border-gold/40 bg-gold/10 px-4 py-2 font-mono text-xs font-semibold text-gold transition-colors hover:bg-gold/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "submitting" ? "Verifying..." : "Claim this profile"}
          </button>
        </form>
      )}
    </section>
  );
}
