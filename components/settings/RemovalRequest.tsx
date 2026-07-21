"use client";

/**
 * components/settings/RemovalRequest.tsx — public removal request form.
 *
 * For seeded operators who don't have an account. Two paths:
 *   1. GitHub verify — sign in with GitHub; if your handle matches an operator
 *      on the board, claim your profile then delete from Settings.
 *   2. Form submission — enter your handle + email; we send a removal request
 *      to the team and return a reference number.
 *
 * Visible to everyone (not gated behind sign-in).
 */

import { useState } from "react";
import Link from "next/link";

const btnGold =
  "shrink-0 rounded-md bg-gold px-4 py-2 font-mono text-xs font-semibold text-bg-base transition-colors hover:bg-gold/90";
const btnGhost =
  "shrink-0 rounded-md border border-bg-border px-3 py-1.5 font-mono text-[11px] text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary";
const inputCls =
  "rounded-md border border-bg-border bg-bg-surface px-3 py-1.5 font-mono text-xs text-text-primary outline-none focus:border-gold/60";

export function RemovalRequest() {
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [ref, setRef] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!handle.trim() || !email.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    setRef(null);
    try {
      const r = await fetch("/api/v1/account/removal-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle: handle.trim(), email: email.trim() }),
      });
      const j = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        reference?: string;
        error?: string;
      };
      if (!r.ok || !j.ok) {
        setError(j.error ?? "Could not submit request.");
        setSubmitting(false);
        return;
      }
      setRef(j.reference ?? null);
      setHandle("");
      setEmail("");
    } catch {
      setError("Network error — try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* GitHub verify path */}
      <div className="flex items-start justify-between gap-4 rounded-md border border-bg-border bg-bg-base/40 p-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-mono text-xs text-text-primary">
            Verify with GitHub
          </span>
          <span className="font-sans text-[11px] text-text-dim">
            If your GitHub handle matches your board handle, sign in to claim
            your profile — then delete from Settings.
          </span>
        </div>
        <Link href="/login?next=/settings" className={btnGhost}>
          Sign in →
        </Link>
      </div>

      {/* Form submission path */}
      {ref ? (
        <div className="flex flex-col gap-2 rounded-md border border-gold/40 bg-gold/5 p-4">
          <div className="flex items-center gap-2">
            <span className="text-base">✓</span>
            <span className="font-mono text-xs font-semibold text-gold">
              Request received
            </span>
          </div>
          <p className="font-sans text-[11px] leading-relaxed text-text-secondary">
            Your reference number is{" "}
            <code className="rounded bg-bg-elevated px-1.5 py-0.5 font-mono text-xs text-gold">
              {ref}
            </code>
            . Save it — we&apos;ll include it in all correspondence about this
            request. You&apos;ll hear from us at the email you provided within
            72 hours.
          </p>
          <button
            type="button"
            onClick={() => setRef(null)}
            className="w-fit font-mono text-[11px] text-text-muted underline hover:text-text-secondary"
          >
            Submit another request
          </button>
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="flex flex-col gap-3 rounded-md border border-bg-border bg-bg-base/40 p-4"
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-xs text-text-primary">
              Submit a removal request
            </span>
            <span className="font-sans text-[11px] text-text-dim">
              No GitHub? Enter your board handle and email — we&apos;ll process
              your request and send confirmation.
            </span>
          </div>
          <div className="flex flex-col gap-2">
            <label className="flex flex-col gap-1 font-mono text-[11px] text-text-secondary">
              Board handle
              <input
                type="text"
                value={handle}
                onChange={(e) => setHandle(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                required
                className={inputCls}
                placeholder="e.g. your-handle"
              />
            </label>
            <label className="flex flex-col gap-1 font-mono text-[11px] text-text-secondary">
              Email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                required
                className={inputCls}
                placeholder="you@example.com"
              />
            </label>
          </div>
          {error && (
            <p className="font-mono text-[11px] text-red-400">{error}</p>
          )}
          <button
            type="submit"
            disabled={!handle.trim() || !email.trim() || submitting}
            className="w-fit rounded-md border border-bg-border px-4 py-2 font-mono text-xs text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit request"}
          </button>
        </form>
      )}
    </div>
  );
}
