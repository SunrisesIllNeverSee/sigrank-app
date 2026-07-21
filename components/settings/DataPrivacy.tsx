"use client";

/**
 * components/settings/DataPrivacy.tsx — Data & Privacy controls (D1 2026-07-21).
 *
 * Allows a signed-in operator to:
 *   - Pause/resume data collection (sets operators.data_opt_out)
 *   - Delete historical telemetry (clear_operator_data RPC) while keeping the account
 *   - Navigate to the existing account deletion flow
 *
 * The server passes the initial data_opt_out state; client state stays in sync
 * after each successful toggle.
 */

import { useState, useCallback } from "react";
import Link from "next/link";

interface DataPrivacyProps {
  codename: string;
  initialOptOut: boolean;
}

const btnPrimary =
  "rounded-md bg-gold px-4 py-2 font-mono text-sm font-semibold text-bg-base transition-colors hover:bg-gold/90 disabled:opacity-50";
const btnGhost =
  "shrink-0 rounded-md border border-bg-border px-3 py-1.5 font-mono text-[11px] text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary";
const btnDanger =
  "shrink-0 rounded-md border border-red-500/50 px-3 py-1.5 font-mono text-[11px] text-red-400 transition-colors hover:bg-red-500/10";

export function DataPrivacy({ codename, initialOptOut }: DataPrivacyProps) {
  const [optOut, setOptOut] = useState(initialOptOut);
  const [toggling, setToggling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTyped, setDeleteTyped] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleOptOut = useCallback(async () => {
    setToggling(true);
    setError(null);
    setMessage(null);
    try {
      const next = !optOut;
      const r = await fetch("/api/v1/account/data-opt-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ opt_out: next }),
      });
      const j = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!r.ok || !j.ok) {
        setError(j.error ?? "Could not update preference.");
        return;
      }
      setOptOut(next);
      setMessage(
        next
          ? "Data collection paused. Future submissions will be rejected."
          : "Data collection resumed. You can re-connect a device to submit.",
      );
    } catch {
      setError("Network error — try again.");
    } finally {
      setToggling(false);
    }
  }, [optOut]);

  const deleteData = useCallback(async () => {
    if (deleteTyped !== codename || deleting) return;
    setDeleting(true);
    setError(null);
    setMessage(null);
    try {
      const r = await fetch("/api/v1/account/delete-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: codename }),
      });
      const j = (await r.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      if (!r.ok || !j.ok) {
        setError(j.error ?? "Could not delete data.");
        setDeleting(false);
        return;
      }
      setOptOut(true);
      setShowDeleteConfirm(false);
      setDeleteTyped("");
      setMessage(
        "Historical data deleted and devices revoked. Data collection remains paused.",
      );
    } catch {
      setError("Network error — try again.");
      setDeleting(false);
    }
  }, [codename, deleteTyped, deleting]);

  return (
    <div className="flex flex-col gap-4">
      {/* Pause data collection */}
      <div className="flex items-start justify-between gap-4 rounded-md border border-bg-border bg-bg-base/40 p-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-mono text-xs text-text-primary">
            Pause data collection
          </span>
          <span className="font-sans text-[11px] text-text-dim">
            Stop accepting new snapshots from your enrolled devices. Existing data
            stays on the board until you delete it.
          </span>
        </div>
        <button
          type="button"
          onClick={toggleOptOut}
          disabled={toggling}
          className={btnGhost}
        >
          {toggling ? "Saving…" : optOut ? "Resume" : "Pause"}
        </button>
      </div>

      {/* Delete historical data */}
      {!showDeleteConfirm ? (
        <div className="flex items-start justify-between gap-4 rounded-md border border-bg-border bg-bg-base/40 p-3">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-mono text-xs text-text-primary">
              Delete historical data
            </span>
            <span className="font-sans text-[11px] text-text-dim">
              Erase your snapshots, metrics, ranks, devices, and enrollment codes.
              Your account, profile, and billing stay intact.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowDeleteConfirm(true);
              setError(null);
              setMessage(null);
            }}
            className={btnDanger}
          >
            Delete data
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-md border border-red-500/30 bg-bg-base/40 p-4">
          <ul className="flex flex-col gap-1 font-sans text-[11px] leading-relaxed text-text-secondary">
            <li>· Deletes all snapshot submissions and scored metrics.</li>
            <li>· Revokes every enrolled device and clears connect codes.</li>
            <li>· Keeps your account, profile, and any active support tier.</li>
            <li>· Automatically pauses data collection.</li>
          </ul>
          <label className="flex flex-col gap-1 font-mono text-[11px] text-text-secondary">
            Type your codename{" "}
            <span className="text-text-primary">{codename}</span> to confirm:
            <input
              type="text"
              value={deleteTyped}
              onChange={(e) => setDeleteTyped(e.target.value)}
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
              onClick={deleteData}
              disabled={deleteTyped !== codename || deleting}
              className="rounded-md bg-red-500/90 px-4 py-2 font-mono text-xs font-semibold text-white transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:bg-red-500/30 disabled:text-white/60"
            >
              {deleting ? "Deleting…" : "Delete my data"}
            </button>
            <button
              type="button"
              onClick={() => {
                setShowDeleteConfirm(false);
                setDeleteTyped("");
                setError(null);
              }}
              disabled={deleting}
              className="rounded-md border border-bg-border px-4 py-2 font-mono text-xs text-text-secondary transition-colors hover:bg-bg-elevated disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {message && (
        <p className="font-mono text-[11px] text-gold/80">{message}</p>
      )}

      <p className="font-sans text-[11px] leading-relaxed text-text-dim">
        To permanently delete your account (including your profile and login), use{" "}
        <Link
          href="#danger-zone"
          className="text-text-muted underline hover:text-text-secondary"
        >
          Danger zone
        </Link>{" "}
        below. See{" "}
        <Link
          href="/privacy"
          className="text-text-muted underline hover:text-text-secondary"
        >
          Privacy Policy
        </Link>{" "}
        for details on data retention and your rights.
      </p>
    </div>
  );
}
