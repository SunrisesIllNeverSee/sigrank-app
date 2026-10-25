"use client";

import React, { useState } from "react";
import {
  signInWithGitHub,
  signInWithTwitter,
  signInWithLinkedIn,
  signInWithEmail,
} from "@/lib/infra/supabase/auth";

/**
 * components/auth/LoginButtons.tsx — the sign-in providers
 * (AUTH_LAUNCH_DIRECTIVES D1/D3 + LinkedIn OIDC): GitHub OAuth, X/Twitter OAuth,
 * LinkedIn OIDC, and email magic-link.
 *
 * The OAuth buttons hand off to the provider — the page unloads, so only an error
 * surfaces here. The magic-link form calls signInWithOtp and shows a "check your email"
 * confirmation. If auth is unconfigured the helpers return an honest error and never
 * fake a session. A same-origin `next` hop is threaded through to the callback.
 */
export function LoginButtons({ next }: { next?: string }) {
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState<
    null | "github" | "twitter" | "linkedin" | "email"
  >(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  async function oauth(provider: "github" | "twitter" | "linkedin") {
    setBusy(provider);
    setNote(null);
    const { error } =
      provider === "github"
        ? await signInWithGitHub(next)
        : provider === "twitter"
          ? await signInWithTwitter(next)
          : await signInWithLinkedIn(next);
    if (error) {
      setNote(error);
      setBusy(null);
    }
    // success → the page unloads into the provider's OAuth screen
  }

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    const addr = email.trim();
    if (!addr) return;
    setBusy("email");
    setNote(null);
    const { error } = await signInWithEmail(addr, next);
    setBusy(null);
    if (error) setNote(error);
    else setSent(true);
  }

  if (sent) {
    return (
      <div className="rounded-md border border-bg-border bg-bg-elevated px-4 py-5 text-center">
        <span className="font-mono text-xl text-gold">✉</span>
        <p className="mt-2 font-mono text-sm font-semibold text-text-primary">
          Check your email
        </p>
        <p className="mt-1.5 font-sans text-xs leading-relaxed text-text-secondary">
          We sent a magic sign-in link to{" "}
          <span className="text-text-primary">{email.trim()}</span>. Open it on
          this device to finish signing in.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setEmail("");
          }}
          className="mt-3 font-sans text-xs text-text-muted underline hover:text-text-secondary"
        >
          Use a different method
        </button>
      </div>
    );
  }

  const oauthBtn =
    "flex w-full items-center justify-center gap-2.5 rounded-md border border-bg-border bg-bg-elevated px-4 py-2.5 font-sans text-sm font-medium text-text-primary transition-colors hover:bg-bg-hover disabled:cursor-not-allowed disabled:opacity-60";

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => oauth("github")}
        disabled={busy !== null}
        className={oauthBtn}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden
        >
          <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
        </svg>
        {busy === "github" ? "Connecting…" : "Continue with GitHub"}
      </button>

      <button
        type="button"
        onClick={() => oauth("twitter")}
        disabled={busy !== null}
        className={oauthBtn}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden
        >
          <path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.6.75Zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633Z" />
        </svg>
        {busy === "twitter" ? "Connecting…" : "Continue with X"}
      </button>

      <button
        type="button"
        onClick={() => oauth("linkedin")}
        disabled={busy !== null}
        className={oauthBtn}
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="currentColor"
          aria-hidden
        >
          <path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.359 1.248zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.432.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.274 0-1.845.7-2.165 1.193v.025h-.016a5.54 5.54 0 0 1 .016-.025V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z" />
        </svg>
        {busy === "linkedin" ? "Connecting…" : "Continue with LinkedIn"}
      </button>

      <div className="flex items-center gap-3 py-0.5">
        <span className="h-px flex-1 bg-bg-border" />
        <span className="font-mono text-[11px] uppercase tracking-wide text-text-muted">
          or
        </span>
        <span className="h-px flex-1 bg-bg-border" />
      </div>

      <form onSubmit={onEmail} className="flex flex-col gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          autoComplete="email"
          disabled={busy !== null}
          className="w-full rounded-md border border-bg-border bg-bg-base px-3 py-2.5 font-sans text-sm text-text-primary placeholder:text-text-dim focus:border-gold focus:outline-none disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={busy !== null}
          className="w-full rounded-md bg-gold px-4 py-2.5 font-sans text-sm font-semibold text-bg-base transition-colors hover:bg-gold/90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy === "email" ? "Sending…" : "Email me a magic link"}
        </button>
      </form>

      {note && (
        <p className="rounded-md border border-bg-border bg-bg-base/50 px-3 py-2 text-center font-sans text-xs text-text-secondary">
          {note}
        </p>
      )}
    </div>
  );
}
