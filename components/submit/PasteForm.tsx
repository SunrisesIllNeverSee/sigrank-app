"use client";

/**
 * PasteForm — ccusage / Codex JSON paste submission.
 *
 * The fast path for Claude Code operators: paste the output of
 * `ccusage --json` (or a Codex JSON export) directly. The ingest
 * pipeline extracts the four token pillars, computes Core 5 metrics,
 * and POSTs a SnapshotPayload to /api/v1/ingest-paste.
 *
 * This is the web equivalent of sigrank.py (the local CLI auto-ingest).
 * Confidence is 'medium' — higher than manual (which is 'low') because
 * the parser extracts real token counts, but lower than the signed agent
 * path which carries ed25519 verification.
 *
 * Codex payloads are detected automatically; the UI shows the estimation
 * caveat when estimation was applied.
 */

import React, { useState } from "react";
import { PLATFORM_UI, WINDOW_API_MAP } from "@/lib/constants";

interface SubmitResult {
  status: "received";
  submission_id: string;
  signa_rate: number;
  class_tier: string;
  compression_ratio: number;
  source: string;
  estimated: boolean;
}

type Status =
  | { kind: "idle" }
  | { kind: "parsing" }
  | { kind: "parsed"; preview: ParsePreview }
  | { kind: "submitting" }
  | { kind: "ok"; result: SubmitResult; codename: string }
  | { kind: "error"; detail: string }
  | { kind: "signin_required" };

interface ParsePreview {
  input: number;
  output: number;
  cacheCreate: number;
  cacheRead: number;
  compressionRatio: number;
  source: string;
  estimated: boolean;
  caveat: string | null;
  costUsd: number | null;
}

const EXAMPLE_SNIPPET = `{
  "totals": {
    "inputTokens": 1251211,
    "outputTokens": 11296121,
    "cacheCreationTokens": 128196310,
    "cacheReadTokens": 2555179769,
    "totalCost": 0.527
  }
}`;

const WINDOW_OPTIONS = ["7", "30", "90"] as const;

export function PasteForm() {
  const [paste, setPaste] = useState("");
  const [codename, setCodename] = useState("");
  const [platform, setPlatform] = useState("Claude");
  const [windowLabel, setWindowLabel] = useState("30");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  /** Client-side parse preview — calls /api/v1/ingest-parse (no DB write). */
  async function onParse() {
    if (!paste.trim()) return;
    setStatus({ kind: "parsing" });
    try {
      const res = await fetch("/api/v1/ingest-parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: paste }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => "");
        setStatus({
          kind: "error",
          detail: `Parse failed (${res.status}). ${txt}`.trim(),
        });
        return;
      }
      const data = await res.json();
      setStatus({ kind: "parsed", preview: data });
    } catch {
      setStatus({
        kind: "error",
        detail: "Could not reach the parse endpoint.",
      });
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status.kind !== "parsed") return;
    // Codename optional — paste is a run-numbers calculator, not a board save, so a
    // guest can run without a handle. Default to 'guest' for the audit-inbox row.
    setStatus({ kind: "submitting" });

    const now = new Date();
    const payload = {
      schema_version: "1.0" as const,
      codename: codename.trim() || "guest",
      confidence: "medium" as const,
      window_type:
        WINDOW_API_MAP[windowLabel as keyof typeof WINDOW_API_MAP] ?? "30d",
      window_end: now.toISOString(),
      source: "web_paste",
      raw_paste: paste,
      telemetry: {
        platform: { primary: platform.toLowerCase(), models: [] as string[] },
      },
    };

    try {
      const res = await fetch("/api/v1/ingest-paste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const result = (await res.json()) as SubmitResult;
        setStatus({ kind: "ok", result, codename: codename.trim() });
      } else if (res.status === 401) {
        // Session required — the persisting path needs a login. Show the sign-in CTA.
        setStatus({ kind: "signin_required" });
      } else {
        const text = await res.text().catch(() => "");
        setStatus({
          kind: "error",
          detail: `Submission rejected (${res.status}). ${text}`.trim(),
        });
      }
    } catch {
      setStatus({
        kind: "error",
        detail: "Could not reach the submission endpoint.",
      });
    }
  }

  const preview = status.kind === "parsed" ? status.preview : null;

  // ── Run-numbers reveal card ──────────────────────────────────────────────
  // PASTE = RUN NUMBERS, NOT A BOARD SAVE (owner 2026-06-19). This shows the
  // PROJECTED ("ghost") rank the operator WOULD hold — it is NOT persisted to the
  // leaderboard. Board placement requires an account + review (the MCP / signed
  // path). The copy here must never imply the run was saved.
  if (status.kind === "ok") {
    const { result, codename: submittedCodename } = status;
    const comp = (result.compression_ratio * 100).toFixed(1);

    return (
      <div className="flex flex-col gap-5 rounded-xl border border-gold/30 bg-gold/5 p-6">
        {/* Header — "your numbers", not "received" */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs uppercase tracking-widest text-gold">
            ◈ Your cascade — projected
          </span>
          {result.estimated && (
            <span className="rounded-full border border-gold/20 px-2 py-0.5 font-mono text-[10px] text-text-muted">
              estimated values
            </span>
          )}
        </div>

        {/* Big score reveal — Υ Yield is the headline metric (token-era) */}
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-text-dim">
              Υ Yield
            </span>
            <span className="font-mono text-5xl font-bold leading-none text-gold">
              {result.signa_rate.toFixed(1)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-text-dim">
              Class
            </span>
            <span className="font-mono text-2xl font-bold leading-none text-text-primary">
              {result.class_tier}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[10px] uppercase tracking-widest text-text-dim">
              SNR
            </span>
            <span className="font-mono text-2xl font-bold leading-none text-text-primary">
              {result.compression_ratio.toFixed(3)}
            </span>
          </div>
        </div>

        {/* Explicit NOT-SAVED notice — this is the whole point of the revamp */}
        <div className="rounded-lg border border-text-accent/25 bg-text-accent/5 px-4 py-3">
          <p className="font-mono text-xs font-semibold text-text-accent">
            These are run numbers — not saved to the board.
          </p>
          <p className="mt-1 font-sans text-[12px] leading-snug text-text-secondary">
            Pasting computes your cascade so you can see where you&apos;d land.
            It does
            <strong className="text-text-primary"> not</strong> publish to the
            leaderboard. To claim a real spot, create an account and submit
            through the local agent — board entries are reviewed, so the board
            stays honest.
          </p>
        </div>

        {/* CTA row — claim funnel + run again. NO "view your profile" (no row exists). */}
        <div className="flex flex-wrap items-center gap-3 border-t border-gold/20 pt-4">
          <a
            href="/login?next=/wiki"
            className="rounded-md bg-gold px-5 py-2.5 font-mono text-sm font-bold text-bg-base transition-colors hover:bg-gold/90"
          >
            Claim this rank →
          </a>
          <button
            type="button"
            onClick={() => setStatus({ kind: "idle" })}
            className="rounded-md border border-bg-border px-4 py-2.5 font-mono text-sm text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
          >
            Run another
          </button>
        </div>

        <p className="font-sans text-[11px] leading-snug text-text-muted">
          Compression {comp}% · ran as {submittedCodename || "guest"} · id{" "}
          {result.submission_id}. Account + review (or the local agent) is what
          lands you on the leaderboard.
        </p>
      </div>
    );
  }
  // ── Sign-in required state (Lane 4: ingest-paste now requires a session) ──
  if (status.kind === "signin_required") {
    return (
      <div className="flex flex-col gap-4 rounded-xl border border-text-accent/30 bg-text-accent/5 p-6">
        <p className="font-mono text-sm font-semibold text-text-accent">
          Sign in to save your run
        </p>
        <p className="font-sans text-sm leading-relaxed text-text-secondary">
          The paste preview is free (no account needed). To persist a submission
          to your operator profile, sign in — the persisting path binds the
          submission to your account, not a body-supplied codename.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <a
            href="/login?next=/wiki"
            className="rounded-md bg-gold px-5 py-2.5 font-mono text-sm font-bold text-bg-base transition-colors hover:bg-gold/90"
          >
            Sign in →
          </a>
          <button
            type="button"
            onClick={() => setStatus({ kind: "idle" })}
            className="rounded-md border border-bg-border px-4 py-2.5 font-mono text-sm text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text-primary"
          >
            Just preview
          </button>
        </div>
      </div>
    );
  }
  // ────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4">
      {/* Run-numbers note — paste does NOT save to the board (owner 2026-06-19) */}
      <div className="rounded-lg border border-text-accent/25 bg-text-accent/5 px-4 py-3 text-sm text-text-secondary">
        <strong className="font-semibold text-text-accent">
          Run your numbers:
        </strong>{" "}
        Paste your ccusage export to see your cascade and projected rank
        instantly. Real token counts in — full breakdown out.{" "}
        <strong className="text-text-primary">
          This does not save to the leaderboard
        </strong>{" "}
        — it&apos;s a calculator. To land on the board, run the local agent (it
        reads your tokens automatically) and submit through your account.
      </div>

      {/* Paste area */}
      <label className="flex flex-col gap-1">
        <span className="text-xs font-medium text-text-secondary">
          Paste{" "}
          <code className="font-mono text-text-primary">ccusage --json</code>{" "}
          output
        </span>
        <textarea
          value={paste}
          onChange={(e) => {
            setPaste(e.target.value);
            if (status.kind !== "idle") setStatus({ kind: "idle" });
          }}
          rows={8}
          placeholder={EXAMPLE_SNIPPET}
          // ph-no-capture: NEVER record this textarea's content in PostHog session replay —
          // it holds pasted ccusage token data. This is the moat ("we don't read your content"),
          // enforced explicitly here, not left to PostHog's default masking. (salvaged from PR #16)
          className="ph-no-capture rounded-md border border-bg-border bg-bg-elevated px-3 py-2 font-mono text-xs text-text-primary placeholder:text-text-dim"
          data-attr="ccusage-paste"
          aria-label="ccusage JSON paste"
        />
        <span className="text-[11px] text-text-muted">
          Accepts: full ccusage JSON, partial fragments, Codex exports, or four
          bare numbers.
        </span>
      </label>

      {/* Parse button */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onParse}
          disabled={!paste.trim() || status.kind === "parsing"}
          className="rounded-md border border-bg-border bg-bg-elevated px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:border-text-accent/50 disabled:opacity-50"
        >
          {status.kind === "parsing" ? "Parsing…" : "Parse & preview"}
        </button>
        {status.kind === "error" && (
          <span role="status" className="text-sm text-class-refiner">
            {status.detail}{" "}
            {/* SUB-3: contextual help when a paste won't parse */}
            <a
              href="mailto:hello@signalaf.com?subject=SigRank%20%E2%80%94%20paste%20not%20parsing"
              className="text-text-accent underline underline-offset-2 hover:text-text-primary"
            >
              Paste not parsing? Contact us →
            </a>
          </span>
        )}
      </div>

      {/* Parse preview */}
      {preview && (
        <div className="rounded-lg border border-bg-border bg-bg-surface px-4 py-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-text-muted">
            Parsed preview
          </p>
          {preview.caveat && (
            <p className="mb-2 rounded bg-gold/10 px-3 py-2 font-mono text-xs text-gold">
              {preview.caveat}
            </p>
          )}
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 font-mono text-xs sm:grid-cols-4">
            <span className="text-text-muted">Input</span>
            <span className="text-text-primary">
              {preview.input.toLocaleString()}
            </span>
            <span className="text-text-muted">Output</span>
            <span className="text-text-primary">
              {preview.output.toLocaleString()}
            </span>
            <span className="text-text-muted">Cache write</span>
            <span className="text-text-primary">
              {preview.cacheCreate.toLocaleString()}
            </span>
            <span className="text-text-muted">Cache read</span>
            <span className="text-text-primary">
              {preview.cacheRead.toLocaleString()}
            </span>
            <span className="text-text-muted">Compression</span>
            <span className="text-gold font-bold">
              {preview.compressionRatio.toFixed(3)}
            </span>
            <span className="text-text-muted">Source</span>
            <span className="text-text-primary">{preview.source}</span>
            {preview.costUsd != null && (
              <>
                <span className="text-text-muted">Cost (window)</span>
                <span className="text-text-primary">
                  ${preview.costUsd.toFixed(3)}
                </span>
              </>
            )}
          </div>

          {/* Submit form */}
          <form
            onSubmit={onSubmit}
            className="mt-4 flex flex-wrap items-end gap-4"
          >
            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">
                Codename <span className="text-text-dim">(optional)</span>
              </span>
              <input
                type="text"
                value={codename}
                onChange={(e) => setCodename(e.target.value)}
                placeholder="label this run (e.g. guest)"
                className="rounded-md border border-bg-border bg-bg-elevated px-3 py-2 text-sm text-text-primary placeholder:text-text-dim"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">
                Platform
              </span>
              <select
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
                className="rounded-md border border-bg-border bg-bg-elevated px-3 py-2 text-sm text-text-primary"
              >
                {PLATFORM_UI.filter((p) => p !== "All").map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-xs font-medium text-text-secondary">
                Window (days)
              </span>
              <select
                value={windowLabel}
                onChange={(e) => setWindowLabel(e.target.value)}
                className="rounded-md border border-bg-border bg-bg-elevated px-3 py-2 text-sm text-text-primary"
              >
                {WINDOW_OPTIONS.map((w) => (
                  <option key={w} value={w}>
                    {w}d
                  </option>
                ))}
              </select>
            </label>

            <button
              type="submit"
              disabled={status.kind === "submitting"}
              className="rounded-md bg-gold px-5 py-2.5 text-sm font-semibold text-bg-base transition-colors hover:bg-gold/90 disabled:opacity-60"
            >
              {status.kind === "submitting" ? "Running…" : "Run my numbers"}
            </button>

            <span role="status" aria-live="polite">
              {status.kind === "error" && (
                <span className="text-sm text-class-refiner">
                  {status.detail}
                </span>
              )}
            </span>
          </form>
        </div>
      )}
    </div>
  );
}
