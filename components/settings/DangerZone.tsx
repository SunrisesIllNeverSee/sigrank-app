"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/infra/supabase/auth";

/**
 * components/settings/DangerZone.tsx — permanent account deletion (owner 2026-06-27).
 * Spec: docs/superpowers/specs/2026-06-27-account-deletion-design.md.
 *
 * Type-to-confirm guard: "Delete account" reveals an inline confirm panel; the final
 * red button stays disabled until the operator types their EXACT codename. On success
 * the route has already anonymized the row + cancelled billing + removed the auth user;
 * we sign out client-side (same path as SignOutButton) and redirect home with ?deleted=1.
 *
 * Only rendered when signed in (the /settings Account section already gates this).
 */
export function DangerZone({ codename }: { codename: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const armed = typed === codename;

  async function onDelete() {
    if (!armed || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/account/delete", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: typed }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Deletion failed. Please try again.");
        setBusy(false);
        return;
      }
      // Account is gone — clear the local session and leave.
      await signOut();
      router.push("/?deleted=1");
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded-lg border border-red-500/40 bg-red-500/[0.03] p-5">
      <div className="flex flex-col gap-0.5">
        <h2 className="font-mono text-sm font-semibold uppercase tracking-wide text-red-400">
          Danger zone
        </h2>
        <p className="font-sans text-xs text-text-muted">
          Permanently delete your account. This cannot be undone.
        </p>
      </div>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-fit rounded-md border border-red-500/50 px-4 py-2 font-mono text-xs text-red-400 transition-colors hover:bg-red-500/10"
        >
          Delete account
        </button>
      ) : (
        <div className="flex flex-col gap-3 rounded-md border border-red-500/30 bg-bg-base/40 p-4">
          <ul className="flex flex-col gap-1 font-sans text-[11px] leading-relaxed text-text-secondary">
            <li>
              · All your telemetry, metrics, device data, and board history
              are permanently deleted.
            </li>
            <li>
              · Your active support subscription (if any) is cancelled
              immediately.
            </li>
            <li>· Your name, email, and device keys are removed.</li>
            <li>· You are signed out. This is permanent — there is no undo.</li>
          </ul>
          <label className="flex flex-col gap-1 font-mono text-[11px] text-text-secondary">
            Type your codename{" "}
            <span className="text-text-primary">{codename}</span> to confirm:
            <input
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              className="rounded-md border border-bg-border bg-bg-surface px-3 py-1.5 font-mono text-xs text-text-primary outline-none focus:border-red-500/60"
              placeholder={codename}
            />
          </label>
          {error && (
            <p className="font-mono text-[11px] text-red-400">{error}</p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onDelete}
              disabled={!armed || busy}
              className="rounded-md bg-red-500/90 px-4 py-2 font-mono text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-500/30 disabled:text-white/60"
            >
              {busy ? "Deleting…" : "Permanently delete"}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setTyped("");
                setError(null);
              }}
              disabled={busy}
              className="rounded-md border border-bg-border px-4 py-2 font-mono text-xs text-text-secondary transition-colors hover:bg-bg-elevated disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
