"use client";

import { FormEvent, useState } from "react";
import { track } from "@vercel/analytics";

type DiagnosticCheck = {
  key: string;
  label: string;
  passed: boolean;
  points: number;
  maxPoints: number;
  detail: string;
};

type DiagnosticResult = {
  url: string;
  score: number;
  maxScore: number;
  checks: DiagnosticCheck[];
  boundary: string;
};

export const VERCEL_DEPLOY_URL =
  "https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FSunrisesIllNeverSee%2Fsigrank-mcp%2Ftree%2Fmain%2Fexamples%2Fvercel-remote-mcp&project-name=sigrank-mcp&repository-name=sigrank-mcp-vercel";

export function VercelDeployButton() {
  return (
    <a
      href={VERCEL_DEPLOY_URL}
      target="_blank"
      rel="noreferrer"
      onClick={() => track("vercel_deploy_click", { source: "signalaf_vercel" })}
      className="inline-flex items-center justify-center rounded-md bg-text-primary px-5 py-3 font-mono text-sm font-bold text-bg-base transition-opacity hover:opacity-85"
    >
      Deploy SigRank MCP on Vercel
    </a>
  );
}

export function VercelMcpCopyButton() {
  const endpoint = "https://signalaf.com/api/mcp";
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(endpoint);
    setCopied(true);
    track("vercel_mcp_copy", { source: "signalaf_vercel" });
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className="rounded-md border border-bg-border px-4 py-2 font-mono text-xs font-bold text-text-primary transition-colors hover:border-gold/60"
    >
      {copied ? "Copied" : "Copy MCP endpoint"}
    </button>
  );
}

export function VercelDiagnostic() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    track("vercel_diagnostic_run", { source: "signalaf_vercel" });

    try {
      const response = await fetch("/api/vercel-diagnostic", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error ?? "Diagnostic failed.");

      setResult(data);
      track("vercel_diagnostic_complete", {
        source: "signalaf_vercel",
        score_band: data.score >= 80 ? "80-100" : data.score >= 60 ? "60-79" : "0-59",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Diagnostic failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-bg-border bg-bg-surface p-5 sm:p-6">
      <form onSubmit={submit}>
        <label htmlFor="vercel-url" className="font-mono text-sm font-bold text-text-primary">
          Scan a public Vercel deployment
        </label>
        <p className="mt-2 font-sans text-sm leading-relaxed text-text-secondary">
          Enter an HTTPS <code className="font-mono">*.vercel.app</code> URL. The scanner checks the public acquisition and agent-discovery surface only.
        </p>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <input
            id="vercel-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="your-project.vercel.app"
            inputMode="url"
            autoCapitalize="none"
            autoCorrect="off"
            className="min-w-0 flex-1 rounded-md border border-bg-border bg-bg-base px-3 py-2.5 font-mono text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-gold/70"
          />
          <button
            type="submit"
            disabled={loading || !url.trim()}
            className="rounded-md bg-gold px-5 py-2.5 font-mono text-sm font-bold text-bg-base transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? "Scanning…" : "Run diagnostic"}
          </button>
        </div>
      </form>

      {error ? (
        <p className="mt-4 rounded-md border border-red-500/30 bg-red-500/5 p-3 font-sans text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-6 border-t border-bg-border pt-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.16em] text-text-muted">Distribution readiness</p>
              <p className="mt-1 font-mono text-4xl font-bold text-text-primary">
                {result.score}<span className="text-lg text-text-muted">/{result.maxScore}</span>
              </p>
            </div>
            <code className="max-w-full truncate font-mono text-xs text-text-secondary">{result.url}</code>
          </div>

          <div className="mt-5 grid gap-2">
            {result.checks.map((check) => (
              <div key={check.key} className="rounded-md border border-bg-border/70 bg-bg-base/50 p-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-sm font-bold text-text-primary">
                    {check.passed ? "✓" : "×"} {check.label}
                  </span>
                  <span className="font-mono text-xs text-text-muted">{check.points}/{check.maxPoints}</span>
                </div>
                <p className="mt-1 font-sans text-xs leading-relaxed text-text-secondary">{check.detail}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 font-sans text-xs leading-relaxed text-text-muted">{result.boundary}</p>
        </div>
      ) : null}
    </div>
  );
}
