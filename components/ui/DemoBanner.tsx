"use client";

import React, { useState } from "react";
import Link from "next/link";

/**
 * Dismissible demo-data banner. Client component (local dismiss state).
 */
export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  return (
    <div className="flex w-full items-center justify-center gap-3 border-b border-bg-border bg-bg-elevated px-4 py-2 text-center">
      <span className="text-xs text-text-secondary">
        Live scores come from operators&rsquo; own token counts. They&rsquo;re
        measured against the Field Archive: 1,642 operators from public token
        data, frozen July 31, 2026.{" "}
        <Link href="/board/history" className="text-accent underline">
          See the archive →
        </Link>
      </span>
      <button
        type="button"
        aria-label="Dismiss banner"
        onClick={() => setDismissed(true)}
        className="ml-2 rounded-sm border border-bg-border px-2 py-0.5 text-xs text-text-muted transition-colors hover:text-text-primary"
      >
        ✕
      </button>
    </div>
  );
}
