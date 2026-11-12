"use client";

/**
 * UsageCta — the shared call to action on /claude-code-usage and /codex-usage:
 * [Copy `npx sigrank`] [See the board]. Logs `usage_page_viewed` once on mount
 * and `cli_command_copied` (surface "usage_page") on copy.
 */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { liveTrack } from "@/components/live/analytics";

const CMD = "npx sigrank";

export function UsageCta({ tool }: { tool: "claude-code" | "codex" }) {
  const [done, setDone] = useState(false);
  const logged = useRef(false);

  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    liveTrack.usagePageViewed({ tool });
  }, [tool]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(CMD);
      setDone(true);
      setTimeout(() => setDone(false), 1600);
    } catch {
      /* clipboard blocked: the command stays visible to select by hand */
    }
    liveTrack.cliCommandCopied({ command: CMD, surface: "usage_page", tool });
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="inline-flex items-center gap-2 rounded-md border border-bg-border bg-bg-surface px-3 py-2">
        <code className="font-mono text-sm text-gold">{CMD}</code>
        <button
          type="button"
          onClick={copy}
          aria-label={`Copy ${CMD}`}
          className="rounded-sm border border-bg-border px-2 py-0.5 font-mono text-xs text-text-secondary transition-colors hover:text-text-primary"
        >
          {done ? "Copied" : "Copy"}
        </button>
      </span>
      <Link
        href="/board/all"
        className="rounded-md border border-gold/40 px-3 py-2 font-mono text-sm text-gold transition-colors hover:bg-gold/10"
      >
        See the board →
      </Link>
    </div>
  );
}
