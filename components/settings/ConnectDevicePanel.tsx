"use client";

/**
 * components/settings/ConnectDevicePanel.tsx — "Connect a device" island (D7 §4.4).
 *
 * Client component rendered inside the Settings "Connect a device" section (signed-in
 * only). Two paths:
 *   - "Generate connect code" — the original single-use code (no auto-revoke).
 *   - "New key" (FIX O, 2026-06-26) — 2FA-style re-key: auto-revokes ALL prior trusted
 *     devices, mints a fresh code, shows it ONCE. The key IS the code — paste into the
 *     agent's Connect tab to re-bind. Kills the revoke cycle (lose key → New key → paste).
 *
 * Shows the code big + monospace with a copy button and a live 10:00 countdown that
 * greys out on expiry, and lists the operator's enrolled devices (GET /api/v1/devices)
 * each with a Revoke kill-switch (POST /api/v1/devices/revoke). The actual enrollment
 * happens in the TUI: `npx sigrank` → Connect tab (key 6) → paste the code → Enter.
 */

import { useCallback, useEffect, useState } from "react";

interface DeviceRow {
  device_id: string;
  device_label: string | null;
  agent_version: string | null;
  last_seen: string | null;
  trust_status: string;
  created_at: string;
}

interface MintResponse {
  code: string;
  expires_at: string;
  expires_in_seconds: number;
  revoked_prior?: boolean;
}

const btnPrimary =
  "rounded-md bg-gold px-4 py-2 font-mono text-sm font-semibold text-bg-base transition-colors hover:bg-gold/90 disabled:opacity-50";
const btnGhost =
  "shrink-0 rounded-md border border-bg-border px-3 py-1.5 font-mono text-[11px] text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary";

function mmss(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function ConnectDevicePanel() {
  const [devices, setDevices] = useState<DeviceRow[]>([]);
  const [code, setCode] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [minting, setMinting] = useState(false);
  const [newKeying, setNewKeying] = useState(false); // FIX O: New key button state
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [newKeyNotice, setNewKeyNotice] = useState<string | null>(null); // FIX O: "prior keys retired" message

  const loadDevices = useCallback(async () => {
    try {
      const r = await fetch("/api/v1/devices", { cache: "no-store" });
      const j = (await r.json()) as { devices?: DeviceRow[] };
      setDevices(Array.isArray(j.devices) ? j.devices : []);
    } catch {
      /* leave the list as-is on a transient error */
    }
  }, []);

  useEffect(() => {
    void loadDevices();
  }, [loadDevices]);

  // Live countdown; clears the code on expiry.
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => {
      const left = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        setCode(null);
        setExpiresAt(null);
      }
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [expiresAt]);

  const mint = useCallback(async () => {
    setMinting(true);
    setError(null);
    setCopied(false);
    try {
      const r = await fetch("/api/v1/devices/mint-code", { method: "POST" });
      const j = (await r.json()) as Partial<MintResponse> & {
        reason?: string;
        error?: string;
      };
      if (!r.ok) {
        setError(
          j.reason === "code_already_live"
            ? "You already have a live code — wait for it to expire, then generate again."
            : j.error || "Could not generate a code. Try again.",
        );
        return;
      }
      if (j.code && j.expires_at) {
        setCode(j.code);
        setExpiresAt(Date.parse(j.expires_at));
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setMinting(false);
    }
  }, []);

  // FIX O: New key — 2FA-style re-key. Auto-revokes ALL prior trusted devices +
  // mints a fresh code in one call. The old key dies; the new code is shown ONCE.
  const newKey = useCallback(async () => {
    setNewKeying(true);
    setError(null);
    setCopied(false);
    setNewKeyNotice(null);
    try {
      const r = await fetch("/api/v1/devices/new-key", { method: "POST" });
      const j = (await r.json()) as Partial<MintResponse> & {
        reason?: string;
        error?: string;
      };
      if (!r.ok) {
        setError(j.error || "Could not generate a new key. Try again.");
        return;
      }
      if (j.code && j.expires_at) {
        setCode(j.code);
        setExpiresAt(Date.parse(j.expires_at));
        if (j.revoked_prior) {
          setNewKeyNotice(
            "Prior keys retired. Paste this new key into the agent to re-bind.",
          );
        }
        void loadDevices(); // refresh the device list (old devices now show revoked)
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setNewKeying(false);
    }
  }, [loadDevices]);

  const copy = useCallback(async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked — the code is visible to copy manually */
    }
  }, [code]);

  const revoke = useCallback(
    async (deviceId: string) => {
      try {
        const r = await fetch("/api/v1/devices/revoke", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ device_id: deviceId }),
        });
        if (r.ok) void loadDevices();
      } catch {
        /* ignore; the list reload will reflect reality next time */
      }
    },
    [loadDevices],
  );

  const expired = remaining <= 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Active code or the generate button */}
      {code && !expired ? (
        <div className="flex flex-col gap-2 rounded-md border border-gold/40 bg-bg-base/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <span className="select-all break-all font-mono text-lg font-bold tracking-wide text-gold">
              {code}
            </span>
            <button type="button" onClick={copy} className={btnGhost}>
              {copied ? "Copied ✓" : "Copy"}
            </button>
          </div>
          <span className="font-mono text-[11px] text-text-dim">
            Expires in {mmss(remaining)} · single-use
          </span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={mint}
            disabled={minting}
            className={`w-fit ${btnPrimary}`}
          >
            {minting ? "Generating…" : "Generate connect code"}
          </button>
          {/* FIX O: New key — 2FA-style re-key. Auto-revokes prior devices + mints fresh. */}
          <button
            type="button"
            onClick={newKey}
            disabled={newKeying}
            className="w-fit rounded-md border border-gold/60 px-4 py-2 font-mono text-sm font-semibold text-gold transition-colors hover:bg-gold/10 disabled:opacity-50"
          >
            {newKeying ? "Issuing new key…" : "New key"}
          </button>
        </div>
      )}

      {newKeyNotice && (
        <p className="font-mono text-[11px] text-gold/80">{newKeyNotice}</p>
      )}

      {error && <p className="font-mono text-[11px] text-red-400">{error}</p>}

      <ol className="flex flex-col gap-1 font-sans text-[11px] text-text-dim">
        <li>
          1. Run{" "}
          <code className="rounded bg-bg-elevated px-1 py-0.5 font-mono text-text-secondary">
            npx sigrank
          </code>{" "}
          on the machine you want to rank.
        </li>
        <li>
          2. Open the <span className="text-text-secondary">Connect</span> tab
          (key 6), paste the code above, press Enter. Your runs then cascade to
          the board.
        </li>
      </ol>

      {/* Enrolled devices */}
      {devices.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="font-mono text-[11px] uppercase tracking-wide text-text-muted">
            Enrolled devices
          </span>
          {devices.map((d) => (
            <div
              key={d.device_id}
              className="flex items-center justify-between gap-3 rounded-md border border-bg-border bg-bg-base/40 px-3 py-2"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate font-mono text-[11px] text-text-primary">
                  {d.device_label || d.device_id.slice(0, 8)}
                  {d.trust_status !== "trusted" && (
                    <span className="ml-2 text-text-dim">
                      · {d.trust_status}
                    </span>
                  )}
                </span>
                <span className="font-mono text-[10px] text-text-dim">
                  {d.agent_version || "sigrank-mcp"}
                  {d.last_seen
                    ? ` · last seen ${new Date(d.last_seen).toLocaleDateString()}`
                    : ""}
                </span>
              </div>
              {d.trust_status === "trusted" && (
                <button
                  type="button"
                  onClick={() => revoke(d.device_id)}
                  className={btnGhost}
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
